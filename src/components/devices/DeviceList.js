// src/components/dashboard/DeviceList.js
import React, { useState } from 'react';
import { 
  Grid, 
  Typography, 
  Tabs, 
  Tab, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Divider,
  CircularProgress,
  Paper,
  Button
} from '@mui/material';
import DeviceCard from './DeviceCard';
import useDeviceStatus from '../../hooks/useDeviceStatus';
import AddIcon from '@mui/icons-material/Add';

/**
 * Component to display a grid of device cards with filtering options
 * 
 * @param {Object} props Component props
 * @param {Array} props.devices Array of device objects
 * @param {Array} props.rooms Array of room names
 * @param {boolean} props.loading Whether data is loading
 * @param {Function} props.onAddDevice Function to call when Add Device button is clicked
 */
const DeviceList = ({ 
  devices = [], 
  rooms = [], 
  loading = false, 
  onAddDevice 
}) => {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState('all');
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle room filter change
  const handleRoomChange = (event) => {
    setSelectedRoom(event.target.value);
  };
  
  // Filter devices based on active tab and selected room
  const filteredDevices = devices.filter(device => {
    const typeMatch = activeTab === 'all' || device.type === activeTab;
    const roomMatch = selectedRoom === 'all' || device.room === selectedRoom;
    return typeMatch && roomMatch;
  });
  
  // Sort devices by name
  const sortedDevices = [...filteredDevices].sort((a, b) => a.name.localeCompare(b.name));
  
  // Group devices by room if not filtering by room
  const devicesByRoom = selectedRoom === 'all' 
    ? sortedDevices.reduce((acc, device) => {
        acc[device.room] = acc[device.room] || [];
        acc[device.room].push(device);
        return acc;
      }, {})
    : { [selectedRoom]: sortedDevices };
  
  // Get unique device types for tabs
  const deviceTypes = ['all', ...new Set(devices.map(device => device.type))];
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h2">
          Devices
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<AddIcon />}
          onClick={onAddDevice}
        >
          Add Device
        </Button>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, mb: 3, alignItems: { xs: 'stretch', md: 'center' } }}>
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab label="All Devices" value="all" />
            {deviceTypes.filter(type => type !== 'all').map(type => (
              <Tab 
                key={type} 
                label={type.charAt(0).toUpperCase() + type.slice(1) + 's'} 
                value={type} 
              />
            ))}
          </Tabs>
        </Box>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="room-filter-label">Room</InputLabel>
          <Select
            labelId="room-filter-label"
            id="room-filter"
            value={selectedRoom}
            label="Room"
            onChange={handleRoomChange}
            size="small"
          >
            <MenuItem value="all">All Rooms</MenuItem>
            {rooms.map(room => (
              <MenuItem key={room} value={room}>{room}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : selectedRoom !== 'all' ? (
        <Grid container spacing={3}>
          {sortedDevices.length > 0 ? (
            sortedDevices.map(device => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={device.id}>
                <DeviceWithStatus device={device} />
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">
                  No devices found with the current filters
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        Object.entries(devicesByRoom).map(([room, roomDevices]) => (
          <Box key={room} className="room-section">
            <Typography variant="h6" component="h3" sx={{ mt: 4, mb: 2 }}>
              {room}
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              {roomDevices.map(device => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={device.id}>
                  <DeviceWithStatus device={device} />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      )}
    </Box>
  );
};

/**
 * Wrapper component that connects a device card to the device status hook
 */
const DeviceWithStatus = ({ device }) => {
  const { 
    device: deviceWithStatus, 
    isLoading, 
    togglePower, 
    setLevel,
    setTemperature,
    setLockStatus 
  } = useDeviceStatus(device.id);
  
  // Use the device from the hook if available, otherwise use the passed device
  const deviceData = deviceWithStatus || device;
  
  return (
    <DeviceCard 
      device={deviceData}
      loading={isLoading}
      onToggle={togglePower}
      onLevelChange={setLevel}
      onTemperatureChange={setTemperature}
      onLockToggle={setLockStatus}
    />
  );
};

export default DeviceList;