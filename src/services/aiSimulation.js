// src/services/aiSimulation.js
import * as tf from '@tensorflow/tfjs';

class SmartHomeSimulation {
  constructor() {
    this.devices = {};
    this.environmentFactors = {
      timeOfDay: 0,  // 0-23 hours
      dayOfWeek: 1,  // 1-7 (Monday-Sunday)
      outsideTemperature: 72,
      occupancy: 2,  // Number of people home
      weather: 'clear'
    };
    
    this.initializeDevices();
    this.loadModels();
    
    // Update simulation every minute
    setInterval(() => this.updateSimulation(), 60000);
  }
  
  async loadModels() {
    try {
      // Load pre-trained models or create simple ones
      this.models = {
        energyUsage: await this.createEnergyModel(),
        userBehavior: await this.createBehaviorModel()
      };
      console.log('AI models initialized successfully');
    } catch (error) {
      console.error('Error loading AI models:', error);
    }
  }
  
  async createEnergyModel() {
    // Simple model to predict energy usage based on device state and environment
    const model = tf.sequential();
    model.add(tf.layers.dense({inputShape: [7], units: 12, activation: 'relu'}));
    model.add(tf.layers.dense({units: 1, activation: 'linear'}));
    model.compile({optimizer: 'adam', loss: 'meanSquaredError'});
    
    // We would train this with real data, but for simulation we'll use random weights
    return model;
  }
  
  async createBehaviorModel() {
    // Model to predict user behavior/device usage patterns
    const model = tf.sequential();
    model.add(tf.layers.dense({inputShape: [5], units: 10, activation: 'relu'}));
    model.add(tf.layers.dense({units: 3, activation: 'softmax'}));
    model.compile({optimizer: 'adam', loss: 'categoricalCrossentropy'});
    
    return model;
  }
  
  initializeDevices() {
    // Create virtual devices with realistic properties
    this.devices = {
      'light_living_room': {
        id: 'light_living_room',
        name: 'Living Room Light',
        type: 'light',
        room: 'Living Room',
        status: 'off',
        level: 0,
        connected: true,
        powerConsumption: 15, // watts
        usagePattern: [
          {hour: 7, probability: 0.3},
          {hour: 18, probability: 0.8},
          {hour: 19, probability: 0.9},
          {hour: 22, probability: 0.6}
        ],
        lastUpdated: new Date().toISOString()
      },
      'light_kitchen': {
        id: 'light_kitchen',
        name: 'Kitchen Light',
        type: 'light',
        room: 'Kitchen',
        status: 'off',
        level: 0,
        connected: true,
        powerConsumption: 20, // watts
        usagePattern: [
          {hour: 7, probability: 0.7},
          {hour: 12, probability: 0.5},
          {hour: 18, probability: 0.9},
          {hour: 19, probability: 0.7}
        ],
        lastUpdated: new Date().toISOString()
      },
      'thermostat_bedroom': {
        id: 'thermostat_bedroom',
        name: 'Bedroom Thermostat',
        type: 'thermostat',
        room: 'Bedroom',
        status: 'on',
        temperature: 72,
        targetTemperature: 70,
        mode: 'cool',
        connected: true,
        powerConsumption: 1000, // watts when active
        usagePattern: [
          {hour: 22, probability: 0.9},
          {hour: 6, probability: 0.7}
        ],
        lastUpdated: new Date().toISOString()
      },
      'lock_front_door': {
        id: 'lock_front_door',
        name: 'Front Door Lock',
        type: 'lock',
        room: 'Entrance',
        status: 'locked',
        batteryLevel: 85,
        connected: true,
        powerConsumption: 0.5, // watts
        usagePattern: [
          {hour: 8, probability: 0.7}, // Unlock in morning
          {hour: 18, probability: 0.6}  // Lock/unlock in evening
        ],
        lastUpdated: new Date().toISOString()
      },
      'tv_living_room': {
        id: 'tv_living_room',
        name: 'Living Room TV',
        type: 'tv',
        room: 'Living Room',
        status: 'off',
        input: 'hdmi1',
        volume: 30,
        connected: true,
        powerConsumption: 120, // watts
        usagePattern: [
          {hour: 18, probability: 0.5},
          {hour: 19, probability: 0.8},
          {hour: 20, probability: 0.7},
          {hour: 21, probability: 0.6}
        ],
        lastUpdated: new Date().toISOString()
      },
      'speaker_bedroom': {
        id: 'speaker_bedroom',
        name: 'Bedroom Speaker',
        type: 'speaker',
        room: 'Bedroom',
        status: 'off',
        volume: 40,
        connected: true,
        powerConsumption: 15, // watts
        usagePattern: [
          {hour: 7, probability: 0.6},
          {hour: 22, probability: 0.4}
        ],
        lastUpdated: new Date().toISOString()
      }
    };
  }
  
  updateEnvironment() {
    // Update time of day
    const date = new Date();
    this.environmentFactors.timeOfDay = date.getHours();
    this.environmentFactors.dayOfWeek = date.getDay() === 0 ? 7 : date.getDay(); // 1-7 (Monday-Sunday)
    
    // Simulate temperature changes
    const baseTemp = 65;
    const hourFactor = Math.sin((this.environmentFactors.timeOfDay - 14) * Math.PI / 12);
    this.environmentFactors.outsideTemperature = Math.round(baseTemp + 15 * hourFactor);
    
    // Simulate occupancy based on time
    if (this.environmentFactors.timeOfDay >= 9 && this.environmentFactors.timeOfDay <= 17 
        && this.environmentFactors.dayOfWeek <= 5) { // Weekdays during work hours
      this.environmentFactors.occupancy = Math.floor(Math.random() * 2); // 0-1 people
    } else {
      this.environmentFactors.occupancy = Math.floor(Math.random() * 3) + 1; // 1-3 people otherwise
    }
    
    // Update weather occasionally
    if (Math.random() < 0.1) { // 10% chance to change weather
      const weatherTypes = ['clear', 'cloudy', 'rainy', 'stormy'];
      this.environmentFactors.weather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];
    }
  }
  
  updateDeviceStates() {
    Object.values(this.devices).forEach(device => {
      // Check if device should change state based on usage patterns
      const hourPattern = device.usagePattern.find(p => p.hour === this.environmentFactors.timeOfDay);
      
      if (hourPattern && Math.random() < hourPattern.probability) {
        // Activate the device based on its type
        switch (device.type) {
          case 'light':
            device.status = 'on';
            device.level = Math.floor(Math.random() * 30) + 70; // 70-100%
            break;
          case 'thermostat':
            device.status = 'on';
            // Adjust target temperature based on outside temp
            if (this.environmentFactors.outsideTemperature > 80) {
              device.targetTemperature = Math.floor(Math.random() * 4) + 68; // 68-72
            } else if (this.environmentFactors.outsideTemperature < 60) {
              device.targetTemperature = Math.floor(Math.random() * 4) + 70; // 70-74
            }
            // Update current temperature to move toward target
            if (device.temperature < device.targetTemperature) {
              device.temperature += 0.5;
            } else if (device.temperature > device.targetTemperature) {
              device.temperature -= 0.5;
            }
            break;
          case 'tv':
            device.status = 'on';
            device.volume = Math.floor(Math.random() * 20) + 20; // 20-40
            break;
          case 'speaker':
            device.status = 'on';
            device.volume = Math.floor(Math.random() * 30) + 30; // 30-60
            break;
          case 'lock':
            // Unlock during morning/evening patterns
            if (this.environmentFactors.timeOfDay >= 7 && this.environmentFactors.timeOfDay <= 9 ||
                this.environmentFactors.timeOfDay >= 17 && this.environmentFactors.timeOfDay <= 19) {
              device.status = Math.random() < 0.5 ? 'locked' : 'unlocked';
            } else {
              device.status = 'locked'; // Usually locked
            }
            break;
        }
      } else if (Math.random() < 0.2) { // Random chance to turn off
        if (device.type === 'light' || device.type === 'tv' || device.type === 'speaker') {
          device.status = 'off';
          if (device.type === 'light') device.level = 0;
        }
        // Keep thermostat on but adjust
      }
      
      // Update timestamps
      device.lastUpdated = new Date().toISOString();
    });
  }
  
  calculateEnergyUsage() {
    let totalUsage = 0;
    
    Object.values(this.devices).forEach(device => {
      let deviceUsage = 0;
      
      if (device.status === 'on' || device.status === 'locked') {
        switch (device.type) {
          case 'light':
            deviceUsage = (device.powerConsumption * device.level / 100) / 1000; // kWh for one hour
            break;
          case 'thermostat':
            // Calculate based on difference between current and target
            const tempDiff = Math.abs(device.temperature - device.targetTemperature);
            const activeFactor = tempDiff > 2 ? 0.8 : 0.3; // More active if bigger difference
            deviceUsage = (device.powerConsumption * activeFactor) / 1000; // kWh for one hour
            break;
          case 'tv':
          case 'speaker':
            deviceUsage = device.powerConsumption / 1000; // kWh for one hour
            break;
          case 'lock':
            deviceUsage = device.powerConsumption / 1000; // Very low power
            break;
        }
      }
      
      device.currentUsage = deviceUsage;
      totalUsage += deviceUsage;
    });
    
    return totalUsage;
  }
  
  generateEnergyData(hours = 24) {
    const data = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    for (let i = 0; i < hours; i++) {
      const hour = (currentHour - (hours - 1) + i + 24) % 24;
      
      // Base consumption varies by hour of day
      let consumption = 1 + Math.sin(hour * Math.PI / 12) * 0.5;
      
      // Add randomness
      consumption += (Math.random() * 0.5);
      
      // Higher usage in evening
      if (hour >= 17 && hour <= 22) {
        consumption += 1 + Math.random();
      }
      
      // Add weekend factor
      const isWeekend = [0, 6].includes(now.getDay());
      if (isWeekend && hour >= 10 && hour <= 18) {
        consumption += 0.8;
      }
      
      const hourStr = hour.toString().padStart(2, '0');
      data.push({
        time: `${hourStr}:00`,
        date: new Date(now.getTime() - (hours - i) * 3600000).toISOString(),
        consumption: parseFloat(consumption.toFixed(2))
      });
    }
    
    return data;
  }
  
  predictFutureUsage(hours = 12) {
    const data = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    for (let i = 1; i <= hours; i++) {
      const hour = (currentHour + i) % 24;
      
      // Similar logic to generateEnergyData but with slight modifications to represent predictions
      let consumption = 1.2 + Math.sin(hour * Math.PI / 12) * 0.6;
      
      if (hour >= 17 && hour <= 22) {
        consumption += 1.5 + Math.random() * 0.5;
      }
      
      const hourStr = hour.toString().padStart(2, '0');
      data.push({
        time: `${hourStr}:00`,
        date: new Date(now.getTime() + i * 3600000).toISOString(),
        predictedConsumption: parseFloat(consumption.toFixed(2))
      });
    }
    
    return data;
  }
  
  getDeviceUsageBreakdown() {
    const categories = {
      lighting: 0,
      climate: 0,
      security: 0,
      entertainment: 0,
      other: 0
    };
    
    // First calculate total for percentage computation
    let total = 0;
    Object.values(this.devices).forEach(device => {
      if (device.currentUsage) {
        total += device.currentUsage;
      }
    });
    
    // Now calculate by category
    Object.values(this.devices).forEach(device => {
      if (device.currentUsage) {
        switch (device.type) {
          case 'light':
            categories.lighting += device.currentUsage;
            break;
          case 'thermostat':
          case 'ac':
            categories.climate += device.currentUsage;
            break;
          case 'camera':
          case 'lock':
            categories.security += device.currentUsage;
            break;
          case 'tv':
          case 'speaker':
            categories.entertainment += device.currentUsage;
            break;
          default:
            categories.other += device.currentUsage;
        }
      }
    });
    
    // Convert to array and calculate percentages
    return Object.entries(categories).map(([category, value]) => ({
      category,
      value: parseFloat(value.toFixed(2)),
      percentage: total > 0 ? parseFloat((value / total * 100).toFixed(1)) : 0
    })).filter(item => item.value > 0);
  }
  
  updateSimulation() {
    console.log('Updating smart home simulation...');
    this.updateEnvironment();
    this.updateDeviceStates();
    this.calculateEnergyUsage();
    
    // Generate anomalies occasionally
    if (Math.random() < 0.05) {
      const anomaly = this.generateAnomaly();
      console.log('Generated anomaly:', anomaly);
    }
  }
  
  generateAnomaly() {
    // Randomly select a device to generate an anomaly
    const devices = Object.values(this.devices);
    const device = devices[Math.floor(Math.random() * devices.length)];
    
    const anomalyTypes = [
      {type: 'power_surge', message: `Unusual power consumption detected for ${device.name}`},
      {type: 'connection_lost', message: `Connection lost with ${device.name}`},
      {type: 'unauthorized_access', message: `Unauthorized access attempt detected on ${device.name}`}
    ];
    
    const anomaly = anomalyTypes[Math.floor(Math.random() * anomalyTypes.length)];
    
    // Apply the anomaly effect
    if (anomaly.type === 'connection_lost') {
      device.connected = false;
      
      // Schedule reconnection after a while
      setTimeout(() => {
        device.connected = true;
        device.lastUpdated = new Date().toISOString();
      }, Math.random() * 300000); // Reconnect within 5 minutes
      
    } else if (anomaly.type === 'power_surge') {
      device.currentUsage = device.currentUsage * (3 + Math.random() * 2); // 3-5x normal usage
      
      // Return to normal after a while
      setTimeout(() => {
        this.calculateEnergyUsage(); // Recalculate normal usage
        device.lastUpdated = new Date().toISOString();
      }, Math.random() * 180000); // Within 3 minutes
    }
    
    // Return the anomaly for notification
    return {
      deviceId: device.id,
      ...anomaly,
      timestamp: new Date().toISOString(),
      resolved: false
    };
  }
  
  // API to interact with the simulation
  getAllDevices() {
    return Object.values(this.devices);
  }
  
  getDevice(id) {
    return this.devices[id];
  }
  
  controlDevice(id, command, value) {
    const device = this.devices[id];
    if (!device) return null;
    
    switch (command) {
      case 'turnOn':
        device.status = 'on';
        if (device.type === 'light' && device.level === 0) {
          device.level = 80; // Default brightness when turning on
        }
        break;
      case 'turnOff':
        device.status = 'off';
        if (device.type === 'light') {
          device.level = 0;
        }
        break;
      case 'setLevel':
        device.level = value;
        if (device.type === 'light') {
          device.status = value > 0 ? 'on' : 'off';
        }
        break;
      case 'setTemperature':
        device.targetTemperature = value;
        break;
      case 'lock':
        if (device.type === 'lock') {
          device.status = 'locked';
        }
        break;
      case 'unlock':
        if (device.type === 'lock') {
          device.status = 'unlocked';
        }
        break;
      // Handle other commands
    }
    
    device.lastUpdated = new Date().toISOString();
    this.calculateEnergyUsage(); // Update energy usage after state change
    return device;
  }
  
  getEnergyData() {
    return {
      historical: this.generateEnergyData(24),
      predicted: this.predictFutureUsage(12),
      breakdown: this.getDeviceUsageBreakdown(),
      current: {
        totalUsage: parseFloat(this.calculateEnergyUsage().toFixed(2)),
        timestamp: new Date().toISOString()
      }
    };
  }
  
  // Get the current environment state
  getEnvironment() {
    return { ...this.environmentFactors };
  }
  
  // Get system alerts including anomalies and device issues
  getSystemAlerts() {
    const alerts = [];
    
    // Check for offline devices
    Object.values(this.devices).forEach(device => {
      if (!device.connected) {
        alerts.push({
          type: 'device_offline',
          deviceId: device.id,
          message: `${device.name} is offline`,
          timestamp: device.lastUpdated,
          severity: 'warning'
        });
      }
      
      // For battery-powered devices, check levels
      if (device.batteryLevel !== undefined && device.batteryLevel < 20) {
        alerts.push({
          type: 'low_battery',
          deviceId: device.id,
          message: `${device.name} has low battery (${device.batteryLevel}%)`,
          timestamp: new Date().toISOString(),
          severity: 'info'
        });
      }
    });
    
    // Add some security alerts occasionally
    if (Math.random() < 0.2) { // 20% chance when checking
      const securityEvents = [
        {
          type: 'motion_detected',
          message: 'Motion detected in Living Room',
          timestamp: new Date().toISOString(),
          severity: 'info'
        },
        {
          type: 'door_open',
          message: 'Front door opened',
          timestamp: new Date().toISOString(),
          severity: 'info'
        }
      ];
      
      if (Math.random() < 0.3) { // 30% of security events are more severe
        alerts.push({
          type: 'security_breach',
          message: 'Unusual activity detected near front door',
          timestamp: new Date().toISOString(),
          severity: 'high'
        });
      } else {
        alerts.push(securityEvents[Math.floor(Math.random() * securityEvents.length)]);
      }
    }
    
    return alerts;
  }
  
  // Smart recommendations based on current state
  getRecommendations() {
    const recommendations = [];
    
    // Energy saving recommendations
    const lightsOn = Object.values(this.devices).filter(d => 
      d.type === 'light' && d.status === 'on'
    );
    
    if (lightsOn.length > 0 && this.environmentFactors.occupancy === 0) {
      recommendations.push({
        type: 'energy_saving',
        message: 'Lights are on but no one seems to be home. Consider turning them off.',
        devices: lightsOn.map(d => d.id),
        potentialSavings: '5-10%',
        priority: 'medium'
      });
    }
    
    // Temperature optimization
    const thermostats = Object.values(this.devices).filter(d => d.type === 'thermostat');
    thermostats.forEach(thermostat => {
      if (thermostat.targetTemperature < 68 && this.environmentFactors.outsideTemperature < 60) {
        recommendations.push({
          type: 'comfort',
          message: 'Bedroom temperature is set low for the current weather. Consider increasing for comfort.',
          devices: [thermostat.id],
          priority: 'low'
        });
      } else if (thermostat.targetTemperature < 74 && this.environmentFactors.outsideTemperature > 85) {
        recommendations.push({
          type: 'energy_saving',
          message: 'Consider raising the target temperature to save energy during hot weather.',
          devices: [thermostat.id],
          potentialSavings: '8-15%',
          priority: 'medium'
        });
      }
    });
    
    // Security recommendations
    const locks = Object.values(this.devices).filter(d => d.type === 'lock');
    const unlockedDoors = locks.filter(l => l.status === 'unlocked');
    
    if (unlockedDoors.length > 0 && 
        (this.environmentFactors.timeOfDay >= 22 || this.environmentFactors.timeOfDay <= 6)) {
      recommendations.push({
        type: 'security',
        message: 'Front door is unlocked during nighttime. Consider locking it.',
        devices: unlockedDoors.map(d => d.id),
        priority: 'high'
      });
    }
    
    return recommendations;
  }
}

// Create singleton instance
const smartHomeSimulation = new SmartHomeSimulation();
export default smartHomeSimulation;