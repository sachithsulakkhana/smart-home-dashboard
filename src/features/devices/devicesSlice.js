// src/features/devices/devicesSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock API for demo purposes
const mockDevices = [
  {
    id: '1',
    name: 'Living Room Light',
    type: 'light',
    room: 'Living Room',
    status: 'on',
    level: 80,
    connected: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Kitchen Light',
    type: 'light',
    room: 'Kitchen',
    status: 'off',
    level: 0,
    connected: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Bedroom Thermostat',
    type: 'thermostat',
    room: 'Bedroom',
    status: 'on',
    temperature: 72,
    targetTemperature: 70,
    mode: 'cool',
    connected: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Front Door Lock',
    type: 'lock',
    room: 'Entrance',
    status: 'locked',
    batteryLevel: 75,
    connected: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Living Room TV',
    type: 'tv',
    room: 'Living Room',
    status: 'off',
    input: 'hdmi1',
    volume: 30,
    connected: true,
    lastUpdated: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'Bedroom Speaker',
    type: 'speaker',
    room: 'Bedroom',
    status: 'off',
    volume: 40,
    connected: true,
    lastUpdated: new Date().toISOString(),
  },
];

// Async thunks
export const fetchDevices = createAsyncThunk(
  'devices/fetchDevices',
  async () => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockDevices);
      }, 500);
    });
  }
);

export const toggleDeviceStatus = createAsyncThunk(
  'devices/toggleDeviceStatus',
  async ({ id, status }) => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id, status });
      }, 300);
    });
  }
);

export const updateDeviceLevel = createAsyncThunk(
  'devices/updateDeviceLevel',
  async ({ id, level }) => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id, level });
      }, 300);
    });
  }
);

// Slice
const devicesSlice = createSlice({
  name: 'devices',
  initialState: {
    devices: [],
    status: 'idle', // idle, loading, succeeded, failed
    error: null,
    rooms: ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Entrance'],
  },
  reducers: {
    addDevice: (state, action) => {
      state.devices.push(action.payload);
    },
    removeDevice: (state, action) => {
      state.devices = state.devices.filter(device => device.id !== action.payload);
    },
    updateDevice: (state, action) => {
      const index = state.devices.findIndex(device => device.id === action.payload.id);
      if (index !== -1) {
        state.devices[index] = {
          ...state.devices[index],
          ...action.payload,
          lastUpdated: new Date().toISOString(),
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDevices.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchDevices.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.devices = action.payload;
      })
      .addCase(fetchDevices.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(toggleDeviceStatus.fulfilled, (state, action) => {
        const index = state.devices.findIndex(device => device.id === action.payload.id);
        if (index !== -1) {
          state.devices[index].status = action.payload.status;
          state.devices[index].lastUpdated = new Date().toISOString();
        }
      })
      .addCase(updateDeviceLevel.fulfilled, (state, action) => {
        const index = state.devices.findIndex(device => device.id === action.payload.id);
        if (index !== -1) {
          state.devices[index].level = action.payload.level;
          state.devices[index].lastUpdated = new Date().toISOString();
        }
      });
  },
});

// Export actions and reducer
export const { addDevice, removeDevice, updateDevice } = devicesSlice.actions;
export default devicesSlice.reducer;

// Selectors
export const selectAllDevices = (state) => state.devices.devices;
export const selectDevicesByRoom = (state, room) => 
  state.devices.devices.filter(device => device.room === room);
export const selectDeviceById = (state, deviceId) => 
  state.devices.devices.find(device => device.id === deviceId);
export const selectAllRooms = (state) => state.devices.rooms;
export const selectDevicesStatus = (state) => state.devices.status;
export const selectDevicesError = (state) => state.devices.error;