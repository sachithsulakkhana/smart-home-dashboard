import React from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Grid, 
  Chip, 
  Button,
  Card,
  CardContent
} from '@mui/material';
import { 
  PowerSettingsNew as PowerIcon,
  LocationOn as LocationIcon,
  DevicesOther as DeviceTypeIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const DeviceCard = ({ device, history, formatWatts }) => {
  if (!device) return null;

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Device Details
        </Typography>
        <Chip 
          label={device.IsActive ? 'Active' : 'Inactive'} 
          color={device.IsActive ? 'success' : 'error'}
          size="small"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Device Info */}
        <Grid item xs={12} md={4}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h5" component="h3" gutterBottom>
                {device.DeviceName}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                <DeviceTypeIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">{device.DeviceType}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">{device.Location}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.secondary' }}>
                <SpeedIcon fontSize="small" sx={{ mr: 1 }} />
                <Typography variant="body2">Rating: {formatWatts(device.WattageRating)}</Typography>
              </Box>

              <Box sx={{ mt: 3 }}>
                <Typography variant="h4" component="div" color={device.IsActive ? 'primary.main' : 'text.disabled'}>
                  {device.IsActive ? formatWatts(device.CurrentWattage) : 'Off'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Current Power Usage
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Energy History Chart */}
        <Grid item xs={12} md={8}>
          <Card variant="outlined" sx={{ height: '100%', p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Power Usage History
            </Typography>
            
            {history && history.length > 0 ? (
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={history}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time', position: 'insideBottomRight', offset: -10 }}
                    />
                    <YAxis 
                      label={{ value: 'Watts', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [formatWatts(value), 'Power']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="watts" 
                      stroke="#8884d8" 
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ 
                height: 250, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'text.secondary',
                bgcolor: 'background.default',
                borderRadius: 1
              }}>
                <Typography>
                  {device.IsActive 
                    ? 'Collecting usage data...' 
                    : 'No usage data available while device is off'}
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default DeviceCard;