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
    
    // If no data found, create a default response
    let dashboardData = result.recordset[0];
    
    if (!dashboardData) {
      // Try to generate data from devices
      try {
        const devicesResult = await sql.query`SELECT COUNT(*) AS TotalCount, 
          SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS ActiveCount
          FROM Devices`;
        
        const totalCount = devicesResult.recordset[0]?.TotalCount || 0;
        const activeCount = devicesResult.recordset[0]?.ActiveCount || 0;
        
        dashboardData = {
          TotalDailyEnergy_kWh: 0,
          ActiveDevicesCount: activeCount,
          TotalDevicesCount: totalCount,
          SecurityStatus: 'Secure'
        };
      } catch (devicesErr) {
        console.error('Error getting device counts:', devicesErr);
        
        // Default data if all else fails
        dashboardData = {
          TotalDailyEnergy_kWh: 0,
          ActiveDevicesCount: 0,
          TotalDevicesCount: 0,
          SecurityStatus: 'Secure'
        };
      }
    }
    
    res.json(dashboardData);
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
    
    // If no readings found, generate synthetic data
    if (result.recordset.length === 0) {
      // Get device info
      const deviceResult = await sql.query`
        SELECT * FROM Devices WHERE DeviceID = ${id}
      `;
      
      if (deviceResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Device not found' });
      }
      
      const device = deviceResult.recordset[0];
      const now = new Date();
      const syntheticReadings = [];
      
      // Generate readings for past hours
      for (let i = hoursBack; i > 0; i--) {
        const readingTime = new Date(now);
        readingTime.setHours(now.getHours() - i);
        
        const hour = readingTime.getHours();
        // More likely to be on during waking hours
        const isActive = (hour >= 6 && hour <= 22) ? 
                        Math.random() > 0.3 : 
                        Math.random() > 0.7;
        
        // Fluctuate the wattage a bit
        const baseWattage = device.WattageRating || 100;
        const wattage = isActive ? 
                      baseWattage * (0.8 + Math.random() * 0.4) : 
                      0;
        
        syntheticReadings.push({
          ReadingID: i,
          DeviceID: device.DeviceID,
          Timestamp: readingTime,
          WattageReading: wattage,
          IsDeviceOn: isActive ? 1 : 0,
          ReadingDuration_Seconds: 60
        });
      }
      
      return res.json(syntheticReadings);
    }
    
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
    
    let totalResult;
    try {
      totalResult = await request.query(totalQuery);
    } catch (totalErr) {
      console.error('Error fetching total energy:', totalErr);
      
      // Default value if query fails
      totalResult = { recordset: [{ TotalEnergy: 0 }] };
    }
    
    // Get breakdown by device type - fixed SQL query
    let deviceTypeQuery = '';
    let breakdownResult;
    
    try {
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
      
      breakdownResult = await new sql.Request().query(deviceTypeQuery);
    } catch (breakdownErr) {
      console.error('Error fetching device type breakdown:', breakdownErr);
      
      // Default value if query fails
      breakdownResult = { recordset: [] };
      
      // Try to get device types from Devices table
      try {
        const deviceTypesQuery = `
          SELECT DeviceType, 
                COUNT(*) AS DeviceCount, 
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS ActiveCount,
                SUM(CASE WHEN IsActive = 1 THEN WattageRating ELSE 0 END) / 1000 AS EstimatedEnergy
          FROM Devices
          GROUP BY DeviceType
        `;
        
        const deviceTypesResult = await new sql.Request().query(deviceTypesQuery);
        
        // Convert to expected format
        breakdownResult = { 
          recordset: deviceTypesResult.recordset.map(dt => ({
            DeviceType: dt.DeviceType,
            TotalEnergy: dt.EstimatedEnergy || 0
          }))
        };
      } catch (deviceTypesErr) {
        console.error('Error fetching device types:', deviceTypesErr);
      }
    }
    
    // Get by location - fixed SQL query
    let locationQuery = '';
    let locationResult;
    
    try {
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
      
      locationResult = await new sql.Request().query(locationQuery);
    } catch (locationErr) {
      console.error('Error fetching location breakdown:', locationErr);
      
      // Default value if query fails
      locationResult = { recordset: [] };
      
      // Try to get locations from Devices table
      try {
        const locationsQuery = `
          SELECT Location, 
                COUNT(*) AS DeviceCount, 
                SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS ActiveCount,
                SUM(CASE WHEN IsActive = 1 THEN WattageRating ELSE 0 END) / 1000 AS EstimatedEnergy
          FROM Devices
          GROUP BY Location
        `;
        
        const locationsResult = await new sql.Request().query(locationsQuery);
        
        // Convert to expected format
        locationResult = { 
          recordset: locationsResult.recordset.map(loc => ({
            Location: loc.Location,
            TotalEnergy: loc.EstimatedEnergy || 0
          }))
        };
      } catch (locationsErr) {
        console.error('Error fetching locations:', locationsErr);
      }
    }
    
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

// Get Prediction Data
app.get('/api/energy/prediction', async (req, res) => {
  try {
    const { deviceId } = req.query;
    
    // Basic input validation
    let query;
    let result;

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
      result = await request.query(query);
      
      // If no data found, try to get device information instead
      if (result.recordset.length === 0) {
        const deviceRequest = new sql.Request();
        deviceRequest.input('deviceId', sql.Int, deviceId);
        
        const deviceResult = await deviceRequest.query(`
          SELECT * FROM Devices WHERE DeviceID = @deviceId
        `);
        
        if (deviceResult.recordset.length > 0) {
          // Create synthetic data based on device information
          const device = deviceResult.recordset[0];
          const now = new Date();
          
          // Generate readings for the past 24 hours
          const syntheticReadings = [];
          for (let i = 24; i > 0; i--) {
            const readingTime = new Date(now);
            readingTime.setHours(now.getHours() - i);
            
            const hour = readingTime.getHours();
            const isActive = (hour >= 6 && hour <= 22) ? 
                          Math.random() > 0.3 : 
                          Math.random() > 0.7;
            
            syntheticReadings.push({
              ReadingID: i,
              DeviceID: device.DeviceID,
              Timestamp: readingTime,
              WattageReading: isActive ? device.WattageRating : 0,
              IsDeviceOn: isActive ? 1 : 0
            });
          }
          
          res.json({
            success: true,
            deviceId: deviceId,
            predictionSource: 'device-synthetic',
            readings: syntheticReadings,
            device: device
          });
          return;
        }
      }
      
      res.json({
        success: true,
        deviceId: deviceId,
        predictionSource: 'device-specific',
        readings: result.recordset
      });
    } else {
      // Get aggregated historical data for all devices
      // First try to get actual readings
      try {
        query = `
          SELECT TOP 100
            ReadingID,
            DeviceID,
            Timestamp,
            WattageReading,
            IsDeviceOn
          FROM EnergyReadings
          ORDER BY Timestamp DESC
        `;
        
        result = await sql.query(query);
        
        if (result.recordset.length > 0) {
          res.json({
            success: true,
            predictionSource: 'all-devices-readings',
            readings: result.recordset
          });
          return;
        }
      } catch (readingsErr) {
        console.error('Could not get energy readings, fallback to DailyEnergySummary:', readingsErr);
      }
      
      // Try getting data from DailyEnergySummary if EnergyReadings is empty
      try {
        query = `
          SELECT 
            SummaryID,
            DeviceID,
            SummaryDate, 
            TotalEnergyUsage_kWh,
            OperationalHours,
            AveragePower_Watts,
            PeakPower_Watts
          FROM DailyEnergySummary
          WHERE SummaryDate >= DATEADD(DAY, -14, GETDATE())
          ORDER BY SummaryDate DESC
        `;
        
        result = await sql.query(query);
        
        if (result.recordset.length > 0) {
          // Convert summary data to a format similar to readings
          const convertedReadings = result.recordset.map(summary => {
            const readingDate = new Date(summary.SummaryDate);
            // Set time to noon for more realistic time placement
            readingDate.setHours(12, 0, 0, 0);
            
            return {
              ReadingID: summary.SummaryID,
              DeviceID: summary.DeviceID,
              Timestamp: readingDate,
              WattageReading: summary.AveragePower_Watts,
              IsDeviceOn: summary.OperationalHours > 0 ? 1 : 0
            };
          });
          
          res.json({
            success: true,
            predictionSource: 'daily-summary',
            readings: convertedReadings,
            summaries: result.recordset
          });
          return;
        }
      } catch (summaryErr) {
        console.error('Could not get energy summaries, fallback to Devices:', summaryErr);
      }
      
      // Last resort - get device information and generate synthetic data
      try {
        const devicesResult = await sql.query(`
          SELECT * FROM Devices
        `);
        
        if (devicesResult.recordset.length > 0) {
          // Create synthetic data based on device information
          const now = new Date();
          const syntheticReadings = [];
          
          // Generate a reading for each device for several time points
          devicesResult.recordset.forEach(device => {
            for (let i = 24; i > 0; i -= 4) { // Create readings every 4 hours
              const readingTime = new Date(now);
              readingTime.setHours(now.getHours() - i);
              
              const hour = readingTime.getHours();
              const isActive = (hour >= 6 && hour <= 22) ? Math.random() > 0.3 : Math.random() > 0.7;
              
              syntheticReadings.push({
                ReadingID: syntheticReadings.length + 1,
                DeviceID: device.DeviceID,
                Timestamp: readingTime,
                WattageReading: isActive ? device.WattageRating : 0,
                IsDeviceOn: isActive ? 1 : 0
              });
            }
          });
          
          res.json({
            success: true,
            predictionSource: 'devices-synthetic',
            readings: syntheticReadings,
            devices: devicesResult.recordset
          });
          return;
        }
      } catch (devicesErr) {
        console.error('Could not get devices information:', devicesErr);
      }
      
      // If we still have no data, return an empty response with success=false
      res.json({
        success: false,
        message: 'No energy data available in the database',
        readings: []
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

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

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