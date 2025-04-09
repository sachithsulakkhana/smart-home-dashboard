import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  CardHeader,
  Box,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Button,
  ButtonGroup,
  Tabs,
  Tab
} from '@mui/material';
import {
  Lightbulb as LightIcon,
  Tv as TvIcon,
  Kitchen as KitchenIcon,
  Computer as ComputerIcon,
  AcUnit as HvacIcon,
  Air as FanIcon,
  Settings as DefaultIcon,
  Home as HomeIcon,
  Security as SecurityIcon,
  Battery90 as EnergyIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area } from 'recharts';

// API URL - should be set in your environment config
const API_URL = 'https://localhost:44355/api'; // Adjust to your API endpoint

// Device icon mapping
const DeviceIcons = {
  'Light': LightIcon,
  'TV': TvIcon,
  'Appliance': KitchenIcon,
  'Computer': ComputerIcon,
  'HVAC': HvacIcon,
  'Fan': FanIcon
};

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const SmartHomeDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [devices, setDevices] = useState([]);
  const [energyHistory, setEnergyHistory] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [timeRange, setTimeRange] = useState('day');
  const [activeTab, setActiveTab] = useState(0);
  
  // Initial data load
  useEffect(() => {
    fetchDashboardData();
    
    // Set up automatic refresh every 5 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5000);
    
    setRefreshInterval(interval);
    
    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, []);
  
  // When a device is selected, fetch its history
  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceHistory(selectedDevice.DeviceID);
    }
  }, [selectedDevice, timeRange]);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // In a real app, this would be an API call
      // For now, simulate the data
      const simulatedData = {
        TotalDailyEnergy_kWh: 34.2,
        ActiveDevicesCount: 8,
        TotalDevicesCount: 12,
        SecurityStatus: 'Secure',
        Temperature: 72
      };
      
      setDashboardData(simulatedData);
      
      // Fetch devices list (simulated)
      const simulatedDevices = [
        { DeviceID: 1, DeviceName: 'Living Room Light', DeviceType: 'Light', Location: 'Living Room', IsActive: true, CurrentWattage: 10 },
        { DeviceID: 2, DeviceName: 'Kitchen Light', DeviceType: 'Light', Location: 'Kitchen', IsActive: false, CurrentWattage: 0 },
        { DeviceID: 3, DeviceName: 'Bedroom Light', DeviceType: 'Light', Location: 'Bedroom', IsActive: false, CurrentWattage: 0 },
        { DeviceID: 4, DeviceName: 'Living Room TV', DeviceType: 'TV', Location: 'Living Room', IsActive: true, CurrentWattage: 120 },
        { DeviceID: 5, DeviceName: 'Refrigerator', DeviceType: 'Appliance', Location: 'Kitchen', IsActive: true, CurrentWattage: 150 },
        { DeviceID: 6, DeviceName: 'Space Heater', DeviceType: 'HVAC', Location: 'Office', IsActive: false, CurrentWattage: 0 },
        { DeviceID: 7, DeviceName: 'AC Unit', DeviceType: 'HVAC', Location: 'Living Room', IsActive: true, CurrentWattage: 1000 },
        { DeviceID: 8, DeviceName: 'Desktop Computer', DeviceType: 'Computer', Location: 'Office', IsActive: true, CurrentWattage: 100 },
        { DeviceID: 9, DeviceName: 'Ceiling Fan', DeviceType: 'Fan', Location: 'Bedroom', IsActive: false, CurrentWattage: 0 },
        { DeviceID: 10, DeviceName: 'Microwave', DeviceType: 'Appliance', Location: 'Kitchen', IsActive: false, CurrentWattage: 0 }
      ];
      
      setDevices(simulatedDevices);
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };
  
  const fetchDeviceHistory = async (deviceId) => {
    try {
      // Simulate device history data
      const hours = timeRange === 'day' ? 24 : timeRange === 'week' ? 7*24 : 30*24;
      const interval = timeRange === 'day' ? 1 : timeRange === 'week' ? 3 : 24;
      
      const chartData = [];
      const now = new Date();
      
      for (let i = hours; i >= 0; i -= interval) {
        const time = new Date(now.getTime() - i * 60 * 60 * 1000);
        const device = devices.find(d => d.DeviceID === deviceId);
        
        // Create some realistic variations
        const baseWattage = device?.DeviceType === 'Light' ? 10 : 
                           device?.DeviceType === 'TV' ? 120 :
                           device?.DeviceType === 'Appliance' ? 150 :
                           device?.DeviceType === 'HVAC' ? 1000 :
                           device?.DeviceType === 'Computer' ? 100 : 70;
        
        // Create a realistic pattern based on time of day
        const hour = time.getHours();
        const isActive = (hour >= 7 && hour <= 9) || // Morning
                        (hour >= 12 && hour <= 13) || // Lunch
                        (hour >= 17 && hour <= 23); // Evening
        
        const watts = isActive ? baseWattage * (0.8 + Math.random() * 0.4) : 0;
        
        chartData.push({
          time: time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
          date: time.toLocaleDateString(),
          watts: watts,
          status: watts > 0 ? 'On' : 'Off'
        });
      }
      
      setEnergyHistory(chartData);
    } catch (error) {
      console.error(`Error fetching history for device ${deviceId}:`, error);
    }
  };
  
  const toggleDevice = async (deviceId) => {
    try {
      // In a real app, this would be an API call
      // For now, update the local state
      setDevices(devices.map(device => {
        if (device.DeviceID === deviceId) {
          const newStatus = !device.IsActive;
          return {
            ...device,
            IsActive: newStatus,
            CurrentWattage: newStatus ? (device.DeviceType === 'Light' ? 10 : 
                                       device.DeviceType === 'TV' ? 120 :
                                       device.DeviceType === 'Appliance' ? 150 :
                                       device.DeviceType === 'HVAC' ? 1000 :
                                       device.DeviceType === 'Computer' ? 100 : 70) : 0
          };
        }
        return device;
      }));
      
      // If the toggled device is currently selected, update its history
      if (selectedDevice && selectedDevice.DeviceID === deviceId) {
        setSelectedDevice(devices.find(d => d.DeviceID === deviceId));
        fetchDeviceHistory(deviceId);
      }
    } catch (error) {
      console.error(`Error toggling device ${deviceId}:`, error);
    }
  };
  
  const formatWatts = (watts) => {
    if (watts >= 1000) {
      return `${(watts / 1000).toFixed(1)} kW`;
    }
    return `${Math.round(watts)} W`;
  };
  
  // Prepare data for device type distribution chart
  const prepareDeviceTypeData = () => {
    if (!devices.length) return [];
    
    const deviceTypes = {};
    devices.forEach(device => {
      if (!deviceTypes[device.DeviceType]) {
        deviceTypes[device.DeviceType] = 0;
      }
      deviceTypes[device.DeviceType] += device.IsActive ? device.CurrentWattage : 0;
    });
    
    return Object.keys(deviceTypes).map((type, index) => ({
      name: type,
      value: deviceTypes[type],
      color: COLORS[index % COLORS.length]
    }));
  };

  // Prepare location-based energy data
  const prepareLocationData = () => {
    if (!devices.length) return [];
    
    const locations = {};
    devices.forEach(device => {
      if (!locations[device.Location]) {
        locations[device.Location] = 0;
      }
      locations[device.Location] += device.IsActive ? device.CurrentWattage : 0;
    });
    
    return Object.keys(locations).map(location => ({
      name: location,
      value: locations[location]
    }));
  };
  
  // Generate simulated hourly energy data
  const generateHourlyEnergyData = () => {
    const data = [];
    for (let i = 0; i < 24; i++) {
      // Create a realistic pattern
      let baseLoad = 500; // Base load (fridge, standby devices)
      
      // Add time-based patterns
      if (i >= 6 && i <= 9) baseLoad += 1000; // Morning peak
      if (i >= 17 && i <= 22) baseLoad += 1500; // Evening peak
      
      // Add some randomness
      const actualLoad = baseLoad * (0.9 + Math.random() * 0.2);
      
      data.push({
        hour: `${i}:00`,
        energy: actualLoad,
        predicted: actualLoad * (0.95 + Math.random() * 0.1)
      });
    }
    return data;
  };
  
  // Render appropriate icon for device type
  const renderDeviceIcon = (deviceType) => {
    const IconComponent = DeviceIcons[deviceType] || DefaultIcon;
    return <IconComponent />;
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  if (loading && !dashboardData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#1e1e1e', color: 'white' }}>
      {/* Sidebar */}
      <Box sx={{ width: 240, flexShrink: 0, bgcolor: '#252525', p: 2 }}>
        <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <HomeIcon sx={{ mr: 1 }} /> Smart Home
        </Typography>
        
        <List component="nav">
          <ListItem button selected={activeTab === 0} onClick={() => setActiveTab(0)}>
            <ListItemIcon sx={{ color: 'white' }}>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
          
          <ListItem button selected={activeTab === 1} onClick={() => setActiveTab(1)}>
            <ListItemIcon sx={{ color: 'white' }}>
              <LightIcon />
            </ListItemIcon>
            <ListItemText primary="Lighting" />
          </ListItem>
          
          <ListItem button selected={activeTab === 2} onClick={() => setActiveTab(2)}>
            <ListItemIcon sx={{ color: 'white' }}>
              <HvacIcon />
            </ListItemIcon>
            <ListItemText primary="Climate" />
          </ListItem>
          
          <ListItem button selected={activeTab === 3} onClick={() => setActiveTab(3)}>
            <ListItemIcon sx={{ color: 'white' }}>
              <SecurityIcon />
            </ListItemIcon>
            <ListItemText primary="Security" />
          </ListItem>
          
          <ListItem button selected={activeTab === 4} onClick={() => setActiveTab(4)}>
            <ListItemIcon sx={{ color: 'white' }}>
              <EnergyIcon />
            </ListItemIcon>
            <ListItemText primary="Energy" />
          </ListItem>
        </List>
      </Box>
      
      {/* Main content */}
      <Box sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Typography variant="h4" sx={{ mb: 4 }}>
          Dashboard Overview
        </Typography>
        
        {/* Overview Cards */}
        <Grid container spacing={3}>
          {/* Total Energy Usage */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                bgcolor: '#303030',
                color: 'white',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <EnergyIcon sx={{ color: '#FFBB28', mr: 1 }} />
                <Typography component="h2" variant="h6" color="inherit">
                  Energy Usage
                </Typography>
              </Box>
              <Typography component="p" variant="h3" sx={{ color: '#FFBB28' }}>
                {dashboardData?.TotalDailyEnergy_kWh?.toFixed(1) || '0.0'} kWh
              </Typography>
              <Typography sx={{ color: '#aaa', mt: 1 }}>
                Today's consumption
              </Typography>
            </Paper>
          </Grid>
          
          {/* Active Devices */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                bgcolor: '#303030',
                color: 'white',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DeviceIcons.Light sx={{ color: '#00C49F', mr: 1 }} />
                <Typography component="h2" variant="h6" color="inherit">
                  Active Devices
                </Typography>
              </Box>
              <Typography component="p" variant="h3" sx={{ color: '#00C49F' }}>
                {dashboardData?.ActiveDevicesCount || 0}/{dashboardData?.TotalDevicesCount || 0}
              </Typography>
              <Typography sx={{ color: '#aaa', mt: 1 }}>
                Devices currently running
              </Typography>
            </Paper>
          </Grid>
          
          {/* Temperature */}
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                bgcolor: '#303030',
                color: 'white',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <DeviceIcons.HVAC sx={{ color: '#0088FE', mr: 1 }} />
                <Typography component="h2" variant="h6" color="inherit">
                  Avg. Temperature
                </Typography>
              </Box>
              <Typography component="p" variant="h3" sx={{ color: '#0088FE' }}>
                {dashboardData?.Temperature || 72}°F
              </Typography>
              <Typography sx={{ color: '#aaa', mt: 1 }}>
                Home average
              </Typography>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Security Status */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                bgcolor: '#303030',
                color: 'white',
                borderRadius: 2
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SecurityIcon sx={{ color: '#8884d8', mr: 1 }} />
                <Typography component="h2" variant="h6" color="inherit">
                  Security Status
                </Typography>
              </Box>
              <Typography component="p" variant="h3" sx={{ color: '#8884d8' }}>
                {dashboardData?.SecurityStatus || 'Secure'}
              </Typography>
              <Typography sx={{ color: '#aaa', mt: 1 }}>
                All systems normal
              </Typography>
            </Paper>
          </Grid>
          
          {/* Charts Row */}
          <Grid item xs={12} md={8}>
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: '#303030',
                color: 'white',
                borderRadius: 2,
                height: 140
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Energy Consumption (24 hours)</Typography>
              </Box>
              <Box sx={{ height: 80 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateHourlyEnergyData()} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFBB28" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#FFBB28" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="energy" stroke="#FFBB28" fillOpacity={1} fill="url(#colorEnergy)" />
                    <Area type="monotone" dataKey="predicted" stroke="#8884d8" strokeDasharray="5 5" fill="none" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Charts and Device List */}
        <Grid container spacing={3} sx={{ mt: 1 }}>
          {/* Device List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: 500, overflow: 'auto', bgcolor: '#303030', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Connected Devices
              </Typography>
              <List>
                {devices.map(device => (
                  <React.Fragment key={device.DeviceID}>
                    <ListItem
                      button
                      onClick={() => setSelectedDevice(device)}
                      selected={selectedDevice?.DeviceID === device.DeviceID}
                      sx={{ 
                        '&.Mui-selected': { 
                          bgcolor: 'rgba(255, 255, 255, 0.08)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.12)'
                          }
                        },
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.04)'
                        }
                      }}
                    >
                      <ListItemIcon sx={{ color: device.IsActive ? '#00C49F' : 'white' }}>
                        {renderDeviceIcon(device.DeviceType)}
                      </ListItemIcon>
                      <ListItemText
                        primary={device.DeviceName}
                        secondary={`${device.Location} • ${device.IsActive ? formatWatts(device.CurrentWattage) : 'Off'}`}
                        primaryTypographyProps={{ style: { color: 'white' } }}
                        secondaryTypographyProps={{ style: { color: '#aaa' } }}
                      />
                      <Switch
                        checked={device.IsActive}
                        onChange={() => toggleDevice(device.DeviceID)}
                        color="success"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </ListItem>
                    <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.12)' }} />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>
          
          {/* Energy Distribution Chart */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: 500, bgcolor: '#303030', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Device Usage Breakdown
              </Typography>
              <Box sx={{ mb: 2 }}>
                <ButtonGroup variant="outlined" sx={{ '& .MuiButton-root': { color: 'white', borderColor: 'rgba(255, 255, 255, 0.23)' } }}>
                  <Button 
                    variant={timeRange === 'day' ? 'contained' : 'outlined'} 
                    onClick={() => handleTimeRangeChange('day')}
                    sx={{ bgcolor: timeRange === 'day' ? 'primary.main' : 'transparent' }}
                  >
                    Day
                  </Button>
                  <Button 
                    variant={timeRange === 'week' ? 'contained' : 'outlined'} 
                    onClick={() => handleTimeRangeChange('week')}
                    sx={{ bgcolor: timeRange === 'week' ? 'primary.main' : 'transparent' }}
                  >
                    Week
                  </Button>
                  <Button 
                    variant={timeRange === 'month' ? 'contained' : 'outlined'} 
                    onClick={() => handleTimeRangeChange('month')}
                    sx={{ bgcolor: timeRange === 'month' ? 'primary.main' : 'transparent' }}
                  >
                    Month
                  </Button>
                </ButtonGroup>
              </Box>
              
              <Grid container spacing={2} sx={{ height: '90%' }}>
                {/* Pie Chart */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Distribution by Device Type
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareDeviceTypeData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {prepareDeviceTypeData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatWatts(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Bar Chart */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Energy by Location
                    </Typography>
                    <Box sx={{ flexGrow: 1 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareLocationData()}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis dataKey="name" type="category" />
                          <Tooltip formatter={(value) => formatWatts(value)} />
                          <Bar dataKey="value" fill="#0088FE" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Device Energy History */}
          {selectedDevice && (
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: '#303030', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Energy History: {selectedDevice.DeviceName}
                </Typography>
                <Typography variant="body2" sx={{ color: '#aaa', mb: 2 }}>
                  Location: {selectedDevice.Location} • Type: {selectedDevice.DeviceType} • Status: {selectedDevice.IsActive ? 'Active' : 'Inactive'}
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={energyHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value) => formatWatts(value)} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="watts" 
                        stroke="#00C49F" 
                        name="Power Usage" 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};

export default SmartHomeDashboard;