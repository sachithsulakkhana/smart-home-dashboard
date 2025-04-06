// src/features/automation/automationSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock automation rules
const mockRules = [
  {
    id: '1',
    name: 'Evening Lighting',
    description: 'Turn on living room lights at sunset',
    active: true,
    trigger: {
      type: 'time',
      value: 'sunset',
    },
    conditions: [
      {
        type: 'presence',
        value: 'home',
      }
    ],
    actions: [
      {
        type: 'device',
        deviceId: '1',
        command: 'turnOn',
        value: 80,
      }
    ],
    lastTriggered: '2023-04-02T19:30:00Z',
  },
  {
    id: '2',
    name: 'Morning Routine',
    description: 'Turn on kitchen lights and start coffee maker at 7 AM',
    active: true,
    trigger: {
      type: 'time',
      value: '07:00',
    },
    conditions: [
      {
        type: 'day',
        value: 'weekday',
      }
    ],
    actions: [
      {
        type: 'device',
        deviceId: '2',
        command: 'turnOn',
        value: 100,
      }
    ],
    lastTriggered: '2023-04-03T07:00:00Z',
  },
  {
    id: '3',
    name: 'Away Mode',
    description: 'Turn off all devices when everyone leaves home',
    active: false,
    trigger: {
      type: 'presence',
      value: 'away',
    },
    conditions: [],
    actions: [
      {
        type: 'scene',
        sceneId: 'allOff',
      }
    ],
    lastTriggered: null,
  }
];

// Async thunks
export const fetchAutomationRules = createAsyncThunk(
  'automation/fetchRules',
  async () => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockRules);
      }, 500);
    });
  }
);

export const toggleRuleStatus = createAsyncThunk(
  'automation/toggleRuleStatus',
  async ({ id, active }) => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ id, active });
      }, 300);
    });
  }
);

export const createAutomationRule = createAsyncThunk(
  'automation/createRule',
  async (rule) => {
    // In a real app, this would be an API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          ...rule,
          id: Math.random().toString(36).substr(2, 9),
          lastTriggered: null,
        });
      }, 500);
    });
  }
);

// Slice
const automationSlice = createSlice({
  name: 'automation',
  initialState: {
    rules: [],
    status: 'idle', // idle, loading, succeeded, failed
    error: null,
  },
  reducers: {
    updateRule: (state, action) => {
      const index = state.rules.findIndex(rule => rule.id === action.payload.id);
      if (index !== -1) {
        state.rules[index] = action.payload;
      }
    },
    deleteRule: (state, action) => {
      state.rules = state.rules.filter(rule => rule.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAutomationRules.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAutomationRules.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.rules = action.payload;
      })
      .addCase(fetchAutomationRules.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message;
      })
      .addCase(toggleRuleStatus.fulfilled, (state, action) => {
        const index = state.rules.findIndex(rule => rule.id === action.payload.id);
        if (index !== -1) {
          state.rules[index].active = action.payload.active;
        }
      })
      .addCase(createAutomationRule.fulfilled, (state, action) => {
        state.rules.push(action.payload);
      });
  },
});

// Export actions and reducer
export const { updateRule, deleteRule } = automationSlice.actions;
export default automationSlice.reducer;

// Selectors
export const selectAllRules = (state) => state.automation.rules;
export const selectActiveRules = (state) => state.automation.rules.filter(rule => rule.active);
export const selectRuleById = (state, ruleId) => 
  state.automation.rules.find(rule => rule.id === ruleId);
export const selectAutomationStatus = (state) => state.automation.status;
export const selectAutomationError = (state) => state.automation.error;