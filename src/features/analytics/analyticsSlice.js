// src/features/analytics/analyticsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Generate mock energy data for the past 30 days
const generateMockEnergyData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate some random but somewhat realistic energy consumption
    const baseConsumption = 3 + Math.random() * 2; // Base between 3-5 kWh
    const dayVariation = Math.sin(i / 7 * Math.PI) * 1.5; // Weekly pattern
    const randomVariation = (Math.random() - 0.5) * 2; // Random ±1 kWh
    
    let consumption = baseConsumption + dayVariation + randomVariation;
    consumption = Math.max(0.5, Math.round(consumption * 10) / 10); // Ensure positive and round to 0.1
    
    data.push({
      date: date.toISOString().split('T')[0],
      consumption,
      cost: consumption * 0.15, // Assume $0.15 per kWh
    });
  }
  
  return data;
};

// Mock device usage data
const generateMockDeviceUsage = () => {
  return [
    { deviceId: '1', name: 'Living Room Light', consumption: 1.2, percentage: 15 },
    { deviceId: '3', name: 'Bedroom Thermostat', consumption: 4.5, percentage: 55 },
    { deviceId: '5', name: 'Living Room TV', consumption: 1.8, percentage: 22 },
    { deviceId: '6', name: 'Bedroom Speaker', consumption: 0.6, percentage: 8 },
  ];
};

// Async thunks
export const fetchEnergyData = createAsyncThunk(
  'analytics/fetchEnergyData',
  async (period = 'month') => {
    // In a real app, this would be an API call with the period parameter
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockEnergyData());
      }, 500);
    });
  }
);

export const fetchDeviceUsage = createAsyncThunk(
  'analytics/fetchDeviceUsage',
  async () => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockDeviceUsage());
      }, 500);
    });
  }
);

export const fetchPredictions = createAsyncThunk(
  'analytics/fetchPredictions',
  async () => {
    // Mock prediction data for next week
    const predictions = [];
    const now = new Date();
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() + i);
      
      // Generate predicted consumption based on past patterns with some randomness
      const baseConsumption = 3.5 + Math.random();
      const dayVariation = Math.sin((i + 1) / 7 * Math.PI) * 1.5;
      
      let consumption = baseConsumption + dayVariation;
      consumption = Math.max(1, Math.round(consumption * 10) / 10);
      
      predictions.push({
        date: date.toISOString().split('T')[0],
        predictedConsumption: consumption,
        predictedCost: consumption * 0.15,
      });
    }
    
    // In a real app, this would come from the AI service
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(predictions);
      }, 700);
    });
  }
);

// Slice
const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    energyData: [],
    deviceUsage: [],
    predictions: [],
    totalConsumption: 0,
    totalCost: 0,
    averageDaily: 0,
    status: 'idle', // idle, loading, succeeded, failed
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Energy data cases
      .addCase(fetchEnergyData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchEnergyData.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.energyData = action.payload;
        
        // Calculate aggregate values
        state.totalConsumption = action.payload.reduce((sum, day) => sum + day.consumption, 0);
        state.totalCost = action.payload.reduce((sum, day) => sum + day.cost, 0);
        state.averageDaily = state.totalConsumption / action.payload.length;
        
        // Round to 2 decimal places
        state.totalConsumption = Math.round(state.totalConsumption * 100) / 100;
        state.totalCost = Math.round(state.totalCost * 100) / 100;
        state.averageDaily = Math.round(state.averageDaily * 100) / 100;
      })
      .addCase(fetchEnergyData.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      
      // Device usage cases
      .addCase(fetchDeviceUsage.fulfilled, (state, action) => {
        state.deviceUsage = action.payload;
      })
      
      // Predictions cases
      .addCase(fetchPredictions.fulfilled, (state, action) => {
        state.predictions = action.payload;
      });
  },
});

// Export reducer
export default analyticsSlice.reducer;

// Selectors
export const selectEnergyData = (state) => state.analytics.energyData;
export const selectDeviceUsage = (state) => state.analytics.deviceUsage;
export const selectPredictions = (state) => state.analytics.predictions;
export const selectTotalConsumption = (state) => state.analytics.totalConsumption;
export const selectTotalCost = (state) => state.analytics.totalCost;
export const selectAverageDaily = (state) => state.analytics.averageDaily;
export const selectAnalyticsStatus = (state) => state.analytics.status;
export const selectAnalyticsError = (state) => state.analytics.error;

// Utility function to get date range for selector
export const selectEnergyDataByDateRange = (state, startDate, endDate) => {
  return state.analytics.energyData.filter(day => {
    const date = new Date(day.date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  });
};