// src/services/api.js
import axios from 'axios';
import smartHomeSimulation from './aiSimulation';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add a request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle API errors centrally
    if (error.response) {
      console.error('API Error Response:', error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401) {
        localStorage.removeItem('auth_token');
      }
    } else if (error.request) {
      console.error('API Error Request:', error.request);
    } else {
      console.error('API Error Message:', error.message);
    }
    return Promise.reject(error);
  }
);

// API Service Functions with AI Simulation Integration
const apiService = {
  // Auth endpoints
  auth: {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    getProfile: () => api.get('/auth/profile'),
  },
  
  // Devices endpoints using simulation
  devices: {
    getAll: () => {
      // Simulate API call with small delay
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: smartHomeSimulation.getAllDevices() });
        }, 300);
      });
    },
    getById: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: smartHomeSimulation.getDevice(id) });
        }, 200);
      });
    },
    create: (deviceData) => {
      // For simulation, just return the device data with an ID
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ 
            data: { 
              ...deviceData, 
              id: 'sim_' + Math.random().toString(36).substr(2, 9),
              connected: true,
              lastUpdated: new Date().toISOString()
            } 
          });
        }, 400);
      });
    },
    update: (id, deviceData) => {
      // For simulation, just return the updated device data
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ 
            data: { 
              ...smartHomeSimulation.getDevice(id),
              ...deviceData,
              lastUpdated: new Date().toISOString()
            } 
          });
        }, 300);
      });
    },
    delete: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: { success: true, id } });
        }, 300);
      });
    },
    control: (id, command) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const updatedDevice = smartHomeSimulation.controlDevice(
            id, 
            command.command, 
            command.value
          );
          resolve({ data: updatedDevice });
        }, 200);
      });
    },
    getStatus: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: smartHomeSimulation.getDevice(id) });
        }, 100);
      });
    },
  },
  
  // Rooms endpoints
  rooms: {
    getAll: () => {
      // Extract unique rooms from devices in simulation
      return new Promise((resolve) => {
        setTimeout(() => {
          const devices = smartHomeSimulation.getAllDevices();
          const uniqueRooms = [...new Set(devices.map(device => device.room))];
          const rooms = uniqueRooms.map(room => ({
            id: room.toLowerCase().replace(/\s+/g, '_'),
            name: room,
            devices: devices.filter(device => device.room === room).length
          }));
          resolve({ data: rooms });
        }, 200);
      });
    },
    getById: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const devices = smartHomeSimulation.getAllDevices();
          const roomName = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const room = {
            id,
            name: roomName,
            devices: devices.filter(device => device.room === roomName).length
          };
          resolve({ data: room });
        }, 200);
      });
    },
    getDevices: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const devices = smartHomeSimulation.getAllDevices();
          const roomName = id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const roomDevices = devices.filter(device => device.room === roomName);
          resolve({ data: roomDevices });
        }, 200);
      });
    }
  },
  
  // Automation endpoints
  automation: {
    getRules: () => {
      // Simulate some automation rules
      return new Promise((resolve) => {
        setTimeout(() => {
          const rules = [
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
                  deviceId: 'light_living_room',
                  deviceName: 'Living Room Light',
                  command: 'turnOn',
                  value: 80,
                }
              ],
              lastTriggered: new Date(Date.now() - 25 * 60000).toISOString(),
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
                  deviceId: 'light_kitchen',
                  deviceName: 'Kitchen Light',
                  command: 'turnOn',
                  value: 100,
                }
              ],
              lastTriggered: new Date(Date.now() - 23 * 3600000).toISOString(),
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
                  sceneName: 'All Off',
                }
              ],
              lastTriggered: null,
            }
          ];
          resolve({ data: rules });
        }, 500);
      });
    },
    getRule: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Just return a single rule matching the id
          const rules = {
            '1': {
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
                  deviceId: 'light_living_room',
                  deviceName: 'Living Room Light',
                  command: 'turnOn',
                  value: 80,
                }
              ],
              lastTriggered: new Date(Date.now() - 25 * 60000).toISOString(),
            },
            '2': {
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
                  deviceId: 'light_kitchen',
                  deviceName: 'Kitchen Light',
                  command: 'turnOn',
                  value: 100,
                }
              ],
              lastTriggered: new Date(Date.now() - 23 * 3600000).toISOString(),
            },
            '3': {
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
                  sceneName: 'All Off',
                }
              ],
              lastTriggered: null,
            }
          };
          resolve({ data: rules[id] || null });
        }, 200);
      });
    },
    createRule: (ruleData) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              ...ruleData,
              id: Math.random().toString(36).substr(2, 9),
              lastTriggered: null,
            }
          });
        }, 500);
      });
    },
    updateRule: (id, ruleData) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            data: {
              ...ruleData,
              id,
            }
          });
        }, 300);
      });
    },
    deleteRule: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: { success: true } });
        }, 300);
      });
    },
    toggleRule: (id, active) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: { id, active } });
        }, 200);
      });
    },
  },
  
  // Analytics endpoints
  analytics: {
    getEnergyData: (period = 'month') => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: smartHomeSimulation.getEnergyData().historical });
        }, 500);
      });
    },
    getDeviceUsage: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: smartHomeSimulation.getEnergyData().breakdown });
        }, 300);
      });
    },
    getPredictions: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: smartHomeSimulation.getEnergyData().predicted });
        }, 700);
      });
    },
  },
  
  // Security endpoints
  security: {
    getAlerts: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Get alerts from simulation
          const simulationAlerts = smartHomeSimulation.getSystemAlerts();
          resolve({ data: simulationAlerts });
        }, 300);
      });
    },
    acknowledgeAlert: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: { id, acknowledged: true } });
        }, 200);
      });
    },
    getSecurityStatus: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const environment = smartHomeSimulation.getEnvironment();
          // Create a security status based on environment and devices
          const securityStatus = {
            mode: environment.occupancy > 0 ? 'home' : 'away',
            locked: {
              front: smartHomeSimulation.getDevice('lock_front_door')?.status === 'locked',
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
          resolve({ data: securityStatus });
        }, 300);
      });
    },
    setSecurityMode: (mode) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: { mode, timestamp: new Date().toISOString() } });
        }, 300);
      });
    },
    toggleLock: (lockId, locked) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Find the lock device and update it
          if (lockId === 'front') {
            smartHomeSimulation.controlDevice('lock_front_door', locked ? 'lock' : 'unlock');
          }
          resolve({ data: { lockId, locked } });
        }, 300);
      });
    },
  },
  
  // AI and recommendations
  ai: {
    getRecommendations: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: smartHomeSimulation.getRecommendations() });
        }, 400);
      });
    },
    getEnvironment: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: smartHomeSimulation.getEnvironment() });
        }, 200);
      });
    },
    getCurrentUsage: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ data: smartHomeSimulation.getEnergyData().current });
        }, 200);
      });
    }
  },
  
  // Scenes
  scenes: {
    getAll: () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          const scenes = [
            {
              id: 'allOff',
              name: 'All Off',
              description: 'Turn off all devices',
              devices: smartHomeSimulation.getAllDevices().map(d => d.id),
              lastActivated: new Date(Date.now() - 35 * 3600000).toISOString()
            },
            {
              id: 'movieMode',
              name: 'Movie Mode',
              description: 'Dim lights, turn on TV and sound system',
              devices: ['light_living_room', 'tv_living_room'],
              lastActivated: new Date(Date.now() - 26 * 3600000).toISOString()
            },
            {
              id: 'goodMorning',
              name: 'Good Morning',
              description: 'Gradually turn on lights, set comfortable temperature',
              devices: ['light_bedroom', 'light_kitchen', 'thermostat_bedroom'],
              lastActivated: new Date(Date.now() - 23 * 3600000).toISOString()
            }
          ];
          resolve({ data: scenes });
        }, 300);
      });
    },
    activate: (id) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          // Simulate activating scene by controlling relevant devices
          if (id === 'allOff') {
            // Turn off all devices
            Object.values(smartHomeSimulation.getAllDevices()).forEach(device => {
              if (device.type === 'light' || device.type === 'tv' || device.type === 'speaker') {
                smartHomeSimulation.controlDevice(device.id, 'turnOff');
              }
            });
          } else if (id === 'movieMode') {
            // Set up movie mode
            smartHomeSimulation.controlDevice('light_living_room', 'setLevel', 30);
            smartHomeSimulation.controlDevice('tv_living_room', 'turnOn');
          }
          resolve({ 
            data: { 
              success: true, 
              sceneId: id, 
              activatedAt: new Date().toISOString() 
            } 
          });
        }, 500);
      });
    }
  },
  
  // Mock API - Use these functions when backend is not available
  mock: {
    // These functions are already mocked using the simulation
    getDevices: () => apiService.devices.getAll(),
    getEnergyData: (period) => apiService.analytics.getEnergyData(period)
  }
};

export default apiService;
