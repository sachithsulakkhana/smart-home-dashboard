// src/features/security/securitySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock security alerts
const mockAlerts = [
  {
    id: '1',
    type: 'motion',
    device: 'Front Door Camera',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(), // 25 minutes ago
    message: 'Motion detected at front door',
    priority: 'medium',
    acknowledged: false,
    image: null,
  },
  {
    id: '2',
    type: 'door',
    device: 'Back Door Sensor',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(), // 2 hours ago
    message: 'Back door opened while away mode active',
    priority: 'high',
    acknowledged: true,
    image: null,
  },
  {
    id: '3',
    type: 'system',
    device: 'Hub',
    timestamp: new Date(Date.now() - 240 * 60000).toISOString(), // 4 hours ago
    message: 'System update completed',
    priority: 'low',
    acknowledged: true,
    image: null,
  },
];

// Mock security status
const mockSecurityStatus = {
  mode: 'home', // 'home', 'away', 'night', 'vacation', 'disabled'
  locked: {
    front: true,
    back: true,
    garage: true,
  },
  armed: true,
  motionDetection: true,
  cameras: {
    frontDoor: 'online',
    backDoor: 'online',
    garage: 'offline',
  },
  lastChecked: new Date().toISOString(),
};

// Async thunks
export const fetchSecurityAlerts = createAsyncThunk(
  'security/fetchAlerts',
  async () => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockAlerts);
      }, 500);
    });
  }
);

export const fetchSecurityStatus = createAsyncThunk(
  'security/fetchStatus',
  async () => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockSecurityStatus);
      }, 300);
    });
  }
);

export const acknowledgeAlert = createAsyncThunk(
  'security/acknowledgeAlert',
  async (alertId) => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(alertId);
      }, 200);
    });
  }
);

export const setSecurityMode = createAsyncThunk(
  'security/setMode',
  async (mode) => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mode);
      }, 300);
    });
  }
);

export const toggleLock = createAsyncThunk(
  'security/toggleLock',
  async ({ lockId, locked }) => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ lockId, locked });
      }, 300);
    });
  }
);

// Slice
const securitySlice = createSlice({
  name: 'security',
  initialState: {
    alerts: [],
    status: mockSecurityStatus,
    loadingStatus: 'idle', // idle, loading, succeeded, failed
    error: null,
    anomaliesDetected: 0,
  },
  reducers: {
    addAlert: (state, action) => {
      state.alerts.unshift(action.payload);
    },
    clearAlerts: (state) => {
      state.alerts = [];
    },
    markAllAlertsAcknowledged: (state) => {
      state.alerts.forEach(alert => {
        alert.acknowledged = true;
      });
    },
    incrementAnomalies: (state) => {
      state.anomaliesDetected += 1;
    },
    resetAnomalies: (state) => {
      state.anomaliesDetected = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Security alerts cases
      .addCase(fetchSecurityAlerts.pending, (state) => {
        state.loadingStatus = 'loading';
      })
      .addCase(fetchSecurityAlerts.fulfilled, (state, action) => {
        state.loadingStatus = 'succeeded';
        state.alerts = action.payload;
      })
      .addCase(fetchSecurityAlerts.rejected, (state, action) => {
        state.loadingStatus = 'failed';
        state.error = action.error.message;
      })
      
      // Security status cases
      .addCase(fetchSecurityStatus.fulfilled, (state, action) => {
        state.status = action.payload;
      })
      
      // Acknowledge alert case
      .addCase(acknowledgeAlert.fulfilled, (state, action) => {
        const alert = state.alerts.find(a => a.id === action.payload);
        if (alert) {
          alert.acknowledged = true;
        }
      })
      
      // Set security mode case
      .addCase(setSecurityMode.fulfilled, (state, action) => {
        state.status.mode = action.payload;
        state.status.lastChecked = new Date().toISOString();
      })
      
      // Toggle lock case
      .addCase(toggleLock.fulfilled, (state, action) => {
        state.status.locked[action.payload.lockId] = action.payload.locked;
        state.status.lastChecked = new Date().toISOString();
      });
  },
});

// Export actions and reducer
export const { 
  addAlert, 
  clearAlerts, 
  markAllAlertsAcknowledged,
  incrementAnomalies,
  resetAnomalies 
} = securitySlice.actions;
export default securitySlice.reducer;

// Selectors
export const selectAllAlerts = (state) => state.security.alerts;
export const selectUnacknowledgedAlerts = (state) => 
  state.security.alerts.filter(alert => !alert.acknowledged);
export const selectHighPriorityAlerts = (state) => 
  state.security.alerts.filter(alert => alert.priority === 'high');
export const selectSecurityStatus = (state) => state.security.status;
export const selectSecurityMode = (state) => state.security.status.mode;
export const selectLocksStatus = (state) => state.security.status.locked;
export const selectAnomaliesDetected = (state) => state.security.anomaliesDetected;
export const selectLoadingStatus = (state) => state.security.loadingStatus;
export const selectSecurityError = (state) => state.security.error;

// Utility selectors
export const selectAlertsByType = (state, type) => 
  state.security.alerts.filter(alert => alert.type === type);
export const selectAlertsByTimeRange = (state, startTime, endTime) => 
  state.security.alerts.filter(alert => {
    const alertTime = new Date(alert.timestamp);
    return alertTime >= new Date(startTime) && alertTime <= new Date(endTime);
  });