import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import {
  BatteryChargingFull as EnergyIcon,
  Devices as DevicesIcon,
  Power as PowerIcon,
  Security as SecurityIcon,
  AcUnit as TemperatureIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, subtitle, icon, color = '#1976d2' }) => {
  // Choose the appropriate icon based on the icon prop
  const getIcon = () => {
    switch (icon) {
      case 'energy':
        return <EnergyIcon sx={{ fontSize: 40, color }} />;
      case 'devices':
        return <DevicesIcon sx={{ fontSize: 40, color }} />;
      case 'power':
        return <PowerIcon sx={{ fontSize: 40, color }} />;
      case 'security':
        return <SecurityIcon sx={{ fontSize: 40, color }} />;
      case 'temperature':
        return <TemperatureIcon sx={{ fontSize: 40, color }} />;
      default:
        return <EnergyIcon sx={{ fontSize: 40, color }} />;
    }
  };

  return (
    <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {getIcon()}
        <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" component="p" sx={{ color }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 'auto' }}>
        {subtitle}
      </Typography>
    </Paper>
  );
};

export default StatCard;