// src/components/devices/DeviceCard.js
import React, { useState } from 'react';
import { 
  Card, CardContent, CardActions, Typography, 
  Switch, Slider, Box, IconButton, Chip
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import SecurityIcon from '@mui/icons-material/Security';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { styled } from '@mui/material/styles';

// Custom styled components
const DeviceContainer = styled(Card)(({ theme }) => ({
  minWidth: 275,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  backgroundColor: status === 'online' ? theme.palette.success.main : theme.palette.error.main,
  color: theme.palette.common.white,
}));

const DeviceCard = ({ device, onToggle, onValueChange }) => {
  const [open, setOpen] = useState(false);
  
  // Determine device icon based on type
  const getDeviceIcon = (type) => {
    switch (type) {
      case 'light':
        return <LightbulbIcon />;
      case 'thermostat':
        return <ThermostatIcon />;
      case 'security':
        return <SecurityIcon />;
      default:
        return <PowerSettingsNewIcon />;
    }
  };
  
  // Render device controls based on type
  const renderDeviceControls = () => {
    switch (device.type) {
      case 'light':
        return (
          <>
            <Typography variant="body2" gutterBottom>Brightness</Typography>
            <Slider
              value={device.brightness || 100}
              onChange={(_, newValue) => onValueChange(device.id, 'brightness', newValue)}
              aria-labelledby="brightness-slider"
              valueLabelDisplay="auto"
              step={1}
              min={1}
              max={100}
            />
            {device.color && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" gutterBottom>Color</Typography>
                {/* Color picker would go here */}
              </Box>
            )}
          </>
        );
      case 'thermostat':
        return (
          <>
            <Typography variant="body2" gutterBottom>Temperature</Typography>
            <Slider
              value={device.temperature || 70}
              onChange={(_, newValue) => onValueChange(device.id, 'temperature', newValue)}
              aria-labelledby="temperature-slider"
              valueLabelDisplay="auto"
              step={1}
              min={60}
              max={85}
              marks={[
                { value: 60, label: '60°F' },
                { value: 72, label: '72°F' },
                { value: 85, label: '85°F' },
              ]}
            />
          </>
        );
      case 'security':
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>Arm System</Typography>
            <Switch
              checked={device.armed || false}
              onChange={(e) => onValueChange(device.id, 'armed', e.target.checked)}
              color="primary"
            />
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <DeviceContainer>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ mr: 1, color: device.isOn ? 'primary.main' : 'text.disabled' }}>
              {getDeviceIcon(device.type)}
            </Box>
            <Typography variant="h6" component="div">
              {device.name}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <StatusChip
              label={device.status}
              status={device.status}
              size="small"
              sx={{ mr: 1 }}
            />
            <IconButton size="small">
              <MoreVertIcon />
            </IconButton>
          </Box>
        </Box>
        
        <Typography color="text.secondary" gutterBottom>
          {device.location}
        </Typography>
        
        {device.isOn && renderDeviceControls()}
      </CardContent>
      
      <CardActions sx={{ marginTop: 'auto' }}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {device.isOn ? 'ON' : 'OFF'}
          </Typography>
          <Switch
            checked={device.isOn}
            onChange={() => onToggle(device.id)}
            color="primary"
          />
        </Box>
      </CardActions>
    </DeviceContainer>
  );
};

export default DeviceCard;