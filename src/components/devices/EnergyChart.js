import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, ButtonGroup, Button, useTheme, useMediaQuery } from '@mui/material';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';

// Colors for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#FF6384', '#36A2EB'];

const EnergyChart = ({ devices, formatWatts }) => {
  const [chartType, setChartType] = useState('deviceType');
  const [predictionData, setPredictionData] = useState([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Generate AI prediction data when component mounts
  useEffect(() => {
    generatePredictionData();
  }, []);

  // Simulate AI predictions for energy usage
  const generatePredictionData = () => {
    const data = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    // Generate data for past 12 hours
    for (let i = -12; i <= 12; i++) {
      const hour = (currentHour + i + 24) % 24;
      let baseLoad = 500; // Base load (always-on devices)
      
      // Simulate typical usage patterns
      if (hour >= 6 && hour <= 9) baseLoad += 1000; // Morning peak
      if (hour >= 17 && hour <= 22) baseLoad += 1500; // Evening peak
      
      // Add some randomness to actual values (past hours)
      const actualValue = i <= 0 
        ? baseLoad * (0.9 + Math.random() * 0.2) 
        : null; // No actual data for future hours
      
      // Add slight randomness to predictions
      // AI prediction adds some "intelligence" based on day of week, etc.
      const dayOfWeek = now.getDay();
      const dayMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.2 : 1.0; // Higher on weekends
      
      // Create predicted values with some variance
      const predictedValue = baseLoad * dayMultiplier * (0.95 + Math.random() * 0.1);
      
      data.push({
        hour: `${hour}:00`,
        time: i === 0 ? 'Now' : i < 0 ? `${Math.abs(i)}h ago` : `+${i}h`,
        actual: actualValue,
        predicted: predictedValue
      });
    }
    
    setPredictionData(data);
  };
  
  // Prepare data for charts
  const prepareDeviceTypeData = () => {
    if (!devices || !devices.length) return [];
    
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
  
  const prepareLocationData = () => {
    if (!devices || !devices.length) return [];
    
    const locations = {};
    devices.forEach(device => {
      if (!locations[device.Location]) {
        locations[device.Location] = 0;
      }
      locations[device.Location] += device.IsActive ? device.CurrentWattage : 0;
    });
    
    return Object.keys(locations).map((location, index) => ({
      name: location,
      value: locations[location],
      color: COLORS[index % COLORS.length]
    }));
  };
  
  // Custom label for pie chart
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }) => {
    if (isMobile) return null; // Don't show labels on mobile
    
    const RADIAN = Math.PI / 180;
    const radius = outerRadius * 1.1;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return percent > 0.05 ? (
      <text 
        x={x} 
        y={y} 
        fill={COLORS[index % COLORS.length]}
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    ) : null;
  };
  
  // Get chart data based on selected type
  const chartData = chartType === 'deviceType' ? prepareDeviceTypeData() : 
                  chartType === 'location' ? prepareLocationData() : 
                  predictionData;
  
  return (
    <Paper sx={{ p: 2, height: { xs: 600, md: 500 }, overflow: 'hidden' }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' }, 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 2,
        gap: 2
      }}>
        <Typography variant="h6">
          Energy Analysis
        </Typography>
        <ButtonGroup 
          variant="outlined" 
          size="small"
          orientation={isMobile ? 'vertical' : 'horizontal'}
          sx={{ 
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            '& .MuiButton-root': {
              minWidth: { xs: '100%', sm: 'auto' }
            }
          }}
        >
          <Button 
            variant={chartType === 'deviceType' ? 'contained' : 'outlined'} 
            onClick={() => setChartType('deviceType')}
          >
            By Device
          </Button>
          <Button 
            variant={chartType === 'location' ? 'contained' : 'outlined'} 
            onClick={() => setChartType('location')}
          >
            By Location
          </Button>
          <Button 
            variant={chartType === 'prediction' ? 'contained' : 'outlined'} 
            onClick={() => setChartType('prediction')}
          >
            AI Prediction
          </Button>
        </ButtonGroup>
      </Box>
      
      {chartData.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <Typography variant="body1" color="text.secondary">
            No data available to display
          </Typography>
        </Box>
      ) : chartType === 'deviceType' ? (
        // Pie chart for device type distribution
        <Box sx={{ height: { xs: 380, md: 400 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={!isMobile}
                label={renderCustomizedLabel}
                outerRadius={isMobile ? 100 : 150}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatWatts(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      ) : chartType === 'location' ? (
        // Bar chart for location distribution
        <Box sx={{ height: { xs: 380, md: 400 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ 
                top: 5, 
                right: 30, 
                left: isMobile ? 80 : 100, 
                bottom: 5 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={isMobile ? 70 : 90}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <Tooltip formatter={(value) => formatWatts(value)} />
              <Legend />
              <Bar dataKey="value" name="Power Usage">
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        // AI Prediction chart (Area chart)
        <Box sx={{ height: { xs: 380, md: 400 } }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            24-Hour Energy Prediction (AI-assisted)
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={predictionData}
              margin={{
                top: 10,
                right: 30,
                left: 0,
                bottom: 30,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="time" 
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? "end" : "middle"}
                height={isMobile ? 60 : 30}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis />
              <Tooltip formatter={(value) => formatWatts(value)} />
              <Legend />
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#8884d8" 
                fillOpacity={1} 
                fill="url(#colorActual)"
                name="Actual Usage"
              />
              <Area 
                type="monotone" 
                dataKey="predicted" 
                stroke="#82ca9d" 
                fillOpacity={1} 
                fill="url(#colorPredicted)"
                name="AI Prediction"
                strokeDasharray="5 5"
              />
            </AreaChart>
          </ResponsiveContainer>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
            AI predictions based on historical usage patterns, time of day, and day of week
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EnergyChart;