import React, { useState, useEffect } from 'react';
import { Container, Grid, CircularProgress, Box, useMediaQuery, useTheme, Alert, Snackbar } from '@mui/material';
import DashboardLayout from './DashboardLayout';
import StatCard from '../common/StatCard';
import DeviceList from '../devices/DeviceList';
import EnergyChart from '../devices/EnergyChart';
import DeviceCard from '../devices/DeviceCard';
import axios from 'axios';

// API base URL - adjust as needed based on your Express server port
const API_URL = 'http://localhost:5000/api';

const DashboardHome = () => {
  // Theme and media queries for responsive design
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalEnergy: 0,
    activeDevices: 0,
    totalDevices: 0,
    securityStatus: 'Secure'
  });
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceHistory, setDeviceHistory] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [dataUpdated, setDataUpdated] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [energySummary, setEnergySummary] = useState({
    total: 0,
    byDeviceType: [],
    byLocation: []
  });

  // Calculate energy data from device information
  const calculateEnergyFromDevices = (deviceData) => {
    // Calculate total based on active devices and their current wattage
    const totalWattage = deviceData.reduce((sum, device) => 
      sum + (device.IsActive ? device.CurrentWattage : 0), 0
    );
    
    // Convert wattage to kWh (assuming devices running for 1 hour)
    const estimatedKWh = totalWattage / 1000;
    
    return {
      total: estimatedKWh,
      byDeviceType: [],
      byLocation: [],
      calculatedEstimate: true
    };
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 10000);
    
    setRefreshInterval(interval);
    
    // Clean up on component unmount
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, []);
  
  // Fetch device history when a device is selected
  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceHistory(selectedDevice.DeviceID);
    }
  }, [selectedDevice]);

  // Fetch dashboard data from backend
  const fetchDashboardData = async (isAutoRefresh = false) => {
    try {
      if (!isAutoRefresh) {
        setLoading(true);
      }
      
      // Get dashboard overview
      let dashboardResponse;
      try {
        dashboardResponse = await axios.get(`${API_URL}/dashboard`);
        // Format data for dashboard
        setDashboardData({
          totalEnergy: dashboardResponse.data?.TotalDailyEnergy_kWh || 0,
          activeDevices: dashboardResponse.data?.ActiveDevicesCount || 0,
          totalDevices: dashboardResponse.data?.TotalDevicesCount || 0,
          securityStatus: 'Secure' // This might come from your API in the future
        });
      } catch (dashboardErr) {
        console.error('Dashboard overview error:', dashboardErr);
        // Continue with other requests
      }
      
      // Get devices list
      try {
        const devicesResponse = await axios.get(`${API_URL}/devices`);
        const newDevices = devicesResponse.data || [];
        
        // Check if data has changed to show notification
        const hasChanged = devices.length > 0 && JSON.stringify(devices) !== JSON.stringify(newDevices);
        
        setDevices(newDevices);
        
        if (isAutoRefresh && hasChanged) {
          setDataUpdated(true);
          setLastUpdated(new Date().toLocaleTimeString());
          
          // Update selected device if it exists in the new data
          if (selectedDevice) {
            const updatedDevice = newDevices.find(d => d.DeviceID === selectedDevice.DeviceID);
            if (updatedDevice) {
              setSelectedDevice(updatedDevice);
              fetchDeviceHistory(updatedDevice.DeviceID);
            }
          }
        }
        
        // Get energy summary
        try {
          const energyResponse = await axios.get(`${API_URL}/energy/summary`);
          setEnergySummary(energyResponse.data);
        } catch (energyErr) {
          console.error('Energy summary error:', energyErr);
          // Calculate energy data from devices as fallback
          const calculatedEnergy = calculateEnergyFromDevices(newDevices);
          setEnergySummary(calculatedEnergy);
        }
      } catch (devicesErr) {
        console.error('Devices error:', devicesErr);
        setError('Failed to load device data. Please check your connection.');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please check your connection.');
      setLoading(false);
    }
  };
  
  // Fetch device energy history
  const fetchDeviceHistory = async (deviceId) => {
    try {
      const response = await axios.get(`${API_URL}/devices/${deviceId}/history`);
      
      // Format data for chart display
      const chartData = response.data.map(reading => ({
        time: new Date(reading.Timestamp).toLocaleTimeString(),
        watts: reading.WattageReading,
        status: reading.IsDeviceOn ? 'On' : 'Off'
      }));
      
      setDeviceHistory(chartData);
    } catch (err) {
      console.error(`Error fetching device history:`, err);
    }
  };
  
  // Toggle device status
  const handleToggleDevice = async (deviceId, isCurrentlyActive) => {
    try {
      await axios.put(`${API_URL}/devices/${deviceId}`, {
        isActive: !isCurrentlyActive
      });
      
      // Update local state to reflect the change
      setDevices(devices.map(device => {
        if (device.DeviceID === deviceId) {
          return {
            ...device,
            IsActive: !isCurrentlyActive,
            CurrentWattage: !isCurrentlyActive ? device.WattageRating : 0
          };
        }
        return device;
      }));
      
      // If the toggled device is selected, update its data
      if (selectedDevice && selectedDevice.DeviceID === deviceId) {
        setSelectedDevice(prev => ({
          ...prev,
          IsActive: !isCurrentlyActive,
          CurrentWattage: !isCurrentlyActive ? prev.WattageRating : 0
        }));
        fetchDeviceHistory(deviceId);
      }
      
      // Refresh dashboard data
      setTimeout(() => fetchDashboardData(), 1000);
    } catch (err) {
      console.error(`Error toggling device ${deviceId}:`, err);
      setError(`Failed to toggle device. ${err.message}`);
    }
  };

  // Format for displaying wattage
  const formatWatts = (watts) => {
    if (!watts && watts !== 0) return 'N/A';
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(1)} kW`;
    }
    return `${Math.round(watts)} W`;
  };

  // Format for displaying kWh
  const formatKWh = (kwh) => {
    if (kwh === null || kwh === undefined) return '0 kWh';
    return `${kwh.toFixed(2)} kWh`;
  };

  // Show loading indicator
  if (loading && devices.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate current power usage
  const currentPowerUsage = devices.reduce((sum, device) => 
    sum + (device.IsActive ? device.CurrentWattage : 0), 0
  );

  return (
    <DashboardLayout>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {/* Success notification for data updates */}
        <Snackbar
          open={dataUpdated}
          autoHideDuration={3000}
          onClose={() => setDataUpdated(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert severity="info" onClose={() => setDataUpdated(false)}>
            Dashboard data updated at {lastUpdated}
          </Alert>
        </Snackbar>

        {/* Backend status notification */}
        {!error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <div className="flex justify-between items-center w-full">
              <div>
                <p className="font-bold">Real-time data mode</p>
                <p>Dashboard is displaying live device data from the database</p>
              </div>
              <button 
                onClick={fetchDashboardData}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              >
                Refresh Now
              </button>
            </div>
          </Alert>
        )}
      
        {/* Stat Cards - Top Row */}
        <Grid container spacing={isTablet ? 2 : 3}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Energy Usage"
              value={formatKWh(energySummary.total || 0)}
              subtitle={energySummary.calculatedEstimate ? "Estimated from current usage" : "Today's consumption"}
              icon="energy"
              color="#FFBB28"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Active Devices"
              value={`${devices.filter(d => d.IsActive).length}/${devices.length}`}
              subtitle="Devices currently running"
              icon="devices"
              color="#00C49F"
            />
          </Grid>
          <Grid item xs={12} sm={12} md={4}>
            <StatCard 
              title="Current Power"
              value={formatWatts(currentPowerUsage)}
              subtitle="Real-time consumption"
              icon="power"
              color="#0088FE"
            />
          </Grid>
        </Grid>

        {/* Device List and Energy Charts */}
        <Grid container spacing={isTablet ? 2 : 3} sx={{ mt: isMobile ? 1 : 2 }}>
          {/* Device List */}
          <Grid item xs={12} md={4}>
            <DeviceList 
              devices={devices}
              onToggleDevice={handleToggleDevice}
              onSelectDevice={setSelectedDevice}
              selectedDevice={selectedDevice}
              formatWatts={formatWatts}
            />
          </Grid>
          
          {/* Energy Chart */}
          <Grid item xs={12} md={8}>
            <EnergyChart 
              devices={devices}
              formatWatts={formatWatts}
              energySummary={energySummary}
            />
          </Grid>
          
          {/* Device Details (if a device is selected) */}
          {selectedDevice && (
            <Grid item xs={12}>
              <DeviceCard 
                device={selectedDevice}
                history={deviceHistory}
                formatWatts={formatWatts}
              />
            </Grid>
          )}
        </Grid>
      </Container>
    </DashboardLayout>
  );
};

export default DashboardHome;