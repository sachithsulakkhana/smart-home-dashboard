import React from 'react';
import { Paper, Typography, Box, Chip } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Lightbulb as LightIcon,
  Tv as TvIcon,
  Kitchen as KitchenIcon,
  Computer as ComputerIcon,
  AcUnit as HvacIcon,
  Air as FanIcon,
  Devices as DefaultIcon
} from '@mui/icons-material';

// Device icon mapping
const DeviceIcons = {
  'Light': LightIcon,
  'TV': TvIcon,
  'Appliance': KitchenIcon,
  'Computer': ComputerIcon,
  'HVAC': HvacIcon,
  'Fan': FanIcon
};

const DeviceCard = ({ device, history, formatWatts }) => {
  // Get appropriate icon for device type
  const getDeviceIcon = (deviceType) => {
    const IconComponent = DeviceIcons[deviceType] || DefaultIcon;
    return <IconComponent fontSize="small" />;
  };
  
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="h2" sx={{ mr: 1 }}>
            {device.DeviceName}
          </Typography>
          <Chip 
            icon={getDeviceIcon(device.DeviceType)} 
            label={device.DeviceType} 
            size="small" 
            sx={{ mr: 1 }}
          />
          <Chip 
            label={device.Location} 
            size="small"
            sx={{ mr: 1 }}
          />
          <Chip 
            label={device.IsActive ? 'Active' : 'Inactive'} 
            color={device.IsActive ? 'success' : 'default'} 
            size="small"
          />
        </Box>
        <Typography variant="h6" component="div" color={device.IsActive ? 'success.main' : 'text.secondary'}>
          {device.IsActive ? formatWatts(device.CurrentWattage) : 'Off'}
        </Typography>
      </Box>
      
      <Typography variant="subtitle1" gutterBottom>
        Energy Usage History
      </Typography>
      
      {history && history.length > 0 ? (
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={history}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip formatter={(value) => formatWatts(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="watts"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
                name="Power Usage"
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <Typography variant="body1" color="text.secondary">
            No history data available for this device
          </Typography>
        </Box>
      )}
      
      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
        Device ID: {device.DeviceID} • Rated Power: {formatWatts(device.WattageRating)}
      </Typography>
    </Paper>
  );
};

export default DeviceCard;