// Backend Express server for connecting React to SQL Server
const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const path = require('path');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// SQL Server Configuration
const sqlConfig = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'newpassword',
  database: process.env.DB_NAME || 'SmartHomeDB',
  server: process.env.DB_SERVER || 'DESKTOP-H91VBB3',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true, // for azure
    trustServerCertificate: true // change to false for production
  }
};

// Connect to SQL Server
async function connectToDatabase() {
  try {
    await sql.connect(sqlConfig);
    console.log('Connected to SQL Server database');
  } catch (err) {
    console.error('Database connection failed:', err);
    process.exit(1);
  }
}

// API Routes

// Get Dashboard Data
app.get('/api/dashboard', async (req, res) => {
  try {
    const result = await sql.query`SELECT * FROM DashboardData`;
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get All Devices
app.get('/api/devices', async (req, res) => {
  try {
    const result = await sql.query`
      SELECT 
        d.DeviceID, 
        d.DeviceName, 
        d.DeviceType, 
        d.Location, 
        d.IsActive,
        d.WattageRating,
        CASE WHEN d.IsActive = 1 
          THEN (SELECT TOP 1 WattageReading FROM EnergyReadings 
                WHERE DeviceID = d.DeviceID ORDER BY Timestamp DESC) 
          ELSE 0 
        END AS CurrentWattage
      FROM Devices d
      ORDER BY d.Location, d.DeviceName
    `;
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching devices:', err);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get Single Device
app.get('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await sql.query`
      SELECT 
        d.DeviceID, 
        d.DeviceName, 
        d.DeviceType, 
        d.Location, 
        d.IsActive,
        d.WattageRating,
        CASE WHEN d.IsActive = 1 
          THEN (SELECT TOP 1 WattageReading FROM EnergyReadings 
                WHERE DeviceID = d.DeviceID ORDER BY Timestamp DESC) 
          ELSE 0 
        END AS CurrentWattage
      FROM Devices d
      WHERE d.DeviceID = ${id}
    `;
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error(`Error fetching device ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Toggle Device Status
app.put('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    if (isActive === undefined) {
      return res.status(400).json({ error: 'isActive field is required' });
    }
    
    // Begin transaction
    const transaction = new sql.Transaction();
    await transaction.begin();
    
    try {
      // First get device details
      const deviceResult = await new sql.Request(transaction)
        .input('deviceId', sql.Int, id)
        .query('SELECT DeviceID, WattageRating FROM Devices WHERE DeviceID = @deviceId');
      
      if (deviceResult.recordset.length === 0) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const device = deviceResult.recordset[0];
      
      // Update device status
      await new sql.Request(transaction)
        .input('deviceId', sql.Int, id)
        .input('isActive', sql.Bit, isActive)
        .query('UPDATE Devices SET IsActive = @isActive WHERE DeviceID = @deviceId');
      
      // Calculate wattage reading
      const wattageReading = isActive ? device.WattageRating : 0;
      
      // Insert energy reading
      await new sql.Request(transaction)
        .input('deviceId', sql.Int, id)
        .input('wattageReading', sql.Decimal(10, 2), wattageReading)
        .input('isDeviceOn', sql.Bit, isActive)
        .input('readingDuration', sql.Int, 1)
        .query('EXEC InsertEnergyReading @deviceId, @wattageReading, @isDeviceOn, @readingDuration');
      
      // Commit transaction
      await transaction.commit();
      
      res.json({ success: true, message: 'Device status updated' });
    } catch (err) {
      // Rollback on error
      await transaction.rollback();
      throw err;
    }
  } catch (err) {
    console.error(`Error updating device ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to update device' });
  }
});

// Get Device Energy History
app.get('/api/devices/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { timeRange = 'day' } = req.query;
    
    let hoursBack;
    switch (timeRange) {
      case 'week':
        hoursBack = 24 * 7; // 1 week
        break;
      case 'month':
        hoursBack = 24 * 30; // 30 days
        break;
      case 'day':
      default:
        hoursBack = 24; // 1 day
    }
    
    const result = await sql.query`
      SELECT 
        ReadingID,
        DeviceID,
        Timestamp,
        WattageReading,
        IsDeviceOn,
        ReadingDuration_Seconds
      FROM EnergyReadings
      WHERE DeviceID = ${id}
        AND Timestamp >= DATEADD(HOUR, -${hoursBack}, GETDATE())
      ORDER BY Timestamp
    `;
    
    res.json(result.recordset);
  } catch (err) {
    console.error(`Error fetching history for device ${req.params.id}:`, err);
    res.status(500).json({ error: 'Failed to fetch device history' });
  }
});

// Get Energy Summary - FIXED VERSION
app.get('/api/energy/summary', async (req, res) => {
  try {
    const { period = 'daily' } = req.query;
    
    // Create a new request for each query
    const request = new sql.Request();
    
    // Get total energy consumption - fixed SQL query
    let totalQuery = '';
    
    switch (period) {
      case 'weekly':
        totalQuery = `
          SELECT SUM(TotalEnergyUsage_kWh) AS TotalEnergy
          FROM DailyEnergySummary
          WHERE SummaryDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
        `;
        break;
      case 'monthly':
        totalQuery = `
          SELECT SUM(TotalEnergyUsage_kWh) AS TotalEnergy
          FROM DailyEnergySummary
          WHERE SummaryDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
        `;
        break;
      case 'daily':
      default:
        totalQuery = `
          SELECT SUM(TotalEnergyUsage_kWh) AS TotalEnergy
          FROM DailyEnergySummary
          WHERE SummaryDate = CAST(GETDATE() AS DATE)
        `;
    }
    
    const totalResult = await request.query(totalQuery);
    
    // Get breakdown by device type - fixed SQL query
    let deviceTypeQuery = '';
    
    switch (period) {
      case 'weekly':
        deviceTypeQuery = `
          SELECT 
            d.DeviceType, 
            SUM(s.TotalEnergyUsage_kWh) AS TotalEnergy
          FROM DailyEnergySummary s
          JOIN Devices d ON s.DeviceID = d.DeviceID
          WHERE s.SummaryDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
          GROUP BY d.DeviceType
          ORDER BY TotalEnergy DESC
        `;
        break;
      case 'monthly':
        deviceTypeQuery = `
          SELECT 
            d.DeviceType, 
            SUM(s.TotalEnergyUsage_kWh) AS TotalEnergy
          FROM DailyEnergySummary s
          JOIN Devices d ON s.DeviceID = d.DeviceID
          WHERE s.SummaryDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
          GROUP BY d.DeviceType
          ORDER BY TotalEnergy DESC
        `;
        break;
      case 'daily':
      default:
        deviceTypeQuery = `
          SELECT 
            d.DeviceType, 
            SUM(s.TotalEnergyUsage_kWh) AS TotalEnergy
          FROM DailyEnergySummary s
          JOIN Devices d ON s.DeviceID = d.DeviceID
          WHERE s.SummaryDate = CAST(GETDATE() AS DATE)
          GROUP BY d.DeviceType
          ORDER BY TotalEnergy DESC
        `;
    }
    
    const breakdownResult = await new sql.Request().query(deviceTypeQuery);
    
    // Get by location - fixed SQL query
    let locationQuery = '';
    
    switch (period) {
      case 'weekly':
        locationQuery = `
          SELECT 
            d.Location, 
            SUM(s.TotalEnergyUsage_kWh) AS TotalEnergy
          FROM DailyEnergySummary s
          JOIN Devices d ON s.DeviceID = d.DeviceID
          WHERE s.SummaryDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
          GROUP BY d.Location
          ORDER BY TotalEnergy DESC
        `;
        break;
      case 'monthly':
        locationQuery = `
          SELECT 
            d.Location, 
            SUM(s.TotalEnergyUsage_kWh) AS TotalEnergy
          FROM DailyEnergySummary s
          JOIN Devices d ON s.DeviceID = d.DeviceID
          WHERE s.SummaryDate >= DATEADD(DAY, -30, CAST(GETDATE() AS DATE))
          GROUP BY d.Location
          ORDER BY TotalEnergy DESC
        `;
        break;
      case 'daily':
      default:
        locationQuery = `
          SELECT 
            d.Location, 
            SUM(s.TotalEnergyUsage_kWh) AS TotalEnergy
          FROM DailyEnergySummary s
          JOIN Devices d ON s.DeviceID = d.DeviceID
          WHERE s.SummaryDate = CAST(GETDATE() AS DATE)
          GROUP BY d.Location
          ORDER BY TotalEnergy DESC
        `;
    }
    
    const locationResult = await new sql.Request().query(locationQuery);
    
    res.json({
      period,
      total: totalResult.recordset[0]?.TotalEnergy || 0,
      byDeviceType: breakdownResult.recordset,
      byLocation: locationResult.recordset
    });
  } catch (err) {
    console.error('Error fetching energy summary:', err);
    res.status(500).json({ error: 'Failed to fetch energy summary' });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}
// Get Prediction Data
app.get('/api/energy/prediction', async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    // Basic input validation
    let query;
    if (deviceId) {
      // Get historical data for specific device
      query = `
        SELECT 
          ReadingID,
          DeviceID,
          Timestamp,
          WattageReading,
          IsDeviceOn
        FROM EnergyReadings
        WHERE DeviceID = @deviceId
          AND Timestamp >= DATEADD(DAY, -14, GETDATE())
        ORDER BY Timestamp
      `;
      
      const request = new sql.Request();
      request.input('deviceId', sql.Int, deviceId);
      const result = await request.query(query);
      
      res.json({
        success: true,
        deviceId: deviceId,
        predictionSource: 'device-specific',
        readings: result.recordset
      });
    } else {
      // Get aggregated historical data for all devices
      query = `
        SELECT 
          CONVERT(datetime, CONVERT(date, Timestamp)) AS ReadingDate,
          DATEPART(HOUR, Timestamp) AS HourOfDay,
          SUM(WattageReading) AS TotalWattage,
          COUNT(*) AS ReadingCount
        FROM EnergyReadings
        WHERE Timestamp >= DATEADD(DAY, -14, GETDATE())
        GROUP BY CONVERT(date, Timestamp), DATEPART(HOUR, Timestamp)
        ORDER BY ReadingDate, HourOfDay
      `;
      
      const result = await sql.query(query);
      
      res.json({
        success: true,
        predictionSource: 'all-devices',
        aggregatedReadings: result.recordset
      });
    }
  } catch (err) {
    console.error('Error generating prediction data:', err);
    res.status(500).json({ 
      error: 'Failed to generate prediction data',
      details: err.message
    });
  }
});
// Start the server
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start server:', err);
  });