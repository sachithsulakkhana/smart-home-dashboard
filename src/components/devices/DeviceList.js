import React from 'react';
import { 
  Paper, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  Switch, 
  Divider, 
  Box, 
  Chip
} from '@mui/material';

const DeviceList = ({ devices, onToggleDevice, onSelectDevice, selectedDevice, formatWatts }) => {
  if (!devices || devices.length === 0) {
    return (
      <Paper sx={{ p: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="subtitle1" color="text.secondary">
          No devices found
        </Typography>
      </Paper>
    );
  }

  // Group devices by location
  const devicesByLocation = devices.reduce((acc, device) => {
    if (!acc[device.Location]) {
      acc[device.Location] = [];
    }
    acc[device.Location].push(device);
    return acc;
  }, {});

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Devices ({devices.length})
      </Typography>
      
      <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
        {Object.keys(devicesByLocation).map((location, locationIndex) => (
          <React.Fragment key={location}>
            {locationIndex > 0 && <Divider sx={{ my: 1 }} />}
            
            <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2, mb: 1 }}>
              {location}
            </Typography>
            
            <List disablePadding>
              {devicesByLocation[location].map((device) => (
                <ListItem 
                  key={device.DeviceID}
                  button
                  onClick={() => onSelectDevice(device)}
                  selected={selectedDevice && selectedDevice.DeviceID === device.DeviceID}
                  sx={{ 
                    borderRadius: 1,
                    mb: 0.5,
                    bgcolor: selectedDevice && selectedDevice.DeviceID === device.DeviceID ? 'action.selected' : 'background.paper',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemText 
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {device.DeviceName}
                        <Chip 
                          size="small" 
                          label={device.DeviceType} 
                          sx={{ ml: 1, height: 20, fontSize: '0.7rem' }} 
                        />
                      </Box>
                    }
                    secondary={device.IsActive ? formatWatts(device.CurrentWattage) : 'Off'}
                    primaryTypographyProps={{ fontWeight: device.IsActive ? 'medium' : 'normal' }}
                    secondaryTypographyProps={{ 
                      color: device.IsActive ? 'success.main' : 'text.secondary',
                      fontWeight: device.IsActive ? 'medium' : 'normal'
                    }}
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={device.IsActive}
                      onChange={() => onToggleDevice(device.DeviceID, device.IsActive)}
                      color="primary"
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </React.Fragment>
        ))}
      </Box>
    </Paper>
  );
};

export default DeviceList;