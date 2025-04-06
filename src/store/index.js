// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import devicesReducer from '../features/devices/devicesSlice';
import automationReducer from '../features/automation/automationSlice';
import analyticsReducer from '../features/analytics/analyticsSlice';
import securityReducer from '../features/security/securitySlice';

export const store = configureStore({
  reducer: {
    devices: devicesReducer,
    automation: automationReducer,
    analytics: analyticsReducer,
    security: securityReducer,
  },
});