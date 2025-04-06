// src/services/iot.js
import smartHomeSimulation from './aiSimulation';

class IoTService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.connectionCallbacks = [];
    this.messageCallbacks = {};
    this.deviceStatusCallbacks = {};
    this.errorCallbacks = [];
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    // For simulation: Initialize connection status and set up periodic updates
    this.simulationInterval = null;
  }

  /**
   * Initialize the IoT service and connect to the server
   * In simulation mode, this just sets up event dispatching
   * @returns {Promise} - Resolves when connected, rejects on failure
   */
  initialize() {
    return new Promise((resolve) => {
      console.log('IoT Service: Initializing in simulation mode');
      
      // Simulate a connection delay
      setTimeout(() => {
        this.isConnected = true;
        this.connectionCallbacks.forEach(callback => callback(true));
        
        // Set up simulation interval to emit device updates periodically
        this.setupSimulationUpdates();
        
        resolve(true);
      }, 1000);
    });
  }

  /**
   * Set up periodic device updates for simulation
   */
  setupSimulationUpdates() {
    // Clear any existing interval
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
    }
    
    // Set up periodic device status updates (random timing)
    this.simulationInterval = setInterval(() => {
      // Randomly select a device to update
      const devices = smartHomeSimulation.getAllDevices();
      if (devices.length === 0) return;
      
      const randomDevice = devices[Math.floor(Math.random() * devices.length)];
      
      // Notify subscribers
      if (this.deviceStatusCallbacks[randomDevice.id]) {
        this.deviceStatusCallbacks[randomDevice.id].forEach(callback => 
          callback(randomDevice)
        );
      }
      
      // Notify general device status subscribers
      if (this.messageCallbacks['device_status']) {
        this.messageCallbacks['device_status'].forEach(callback => 
          callback(randomDevice)
        );
      }
    }, 10000); // Update every 10 seconds
    
    // Occasionally emit rule trigger events
    setInterval(() => {
      if (Math.random() < 0.3 && this.messageCallbacks['rule_triggered']) { // 30% chance
        const ruleData = {
          ruleId: ['1', '2', '3'][Math.floor(Math.random() * 3)],
          timestamp: new Date().toISOString(),
          triggeredBy: 'simulation'
        };
        
        this.messageCallbacks['rule_triggered'].forEach(callback => 
          callback(ruleData)
        );
      }
    }, 60000); // Check every minute
    
    // Occasionally emit security alerts
    setInterval(() => {
      if (Math.random() < 0.2 && this.messageCallbacks['security_alert']) { // 20% chance
        const securityAlerts = [
          {
            id: Date.now().toString(),
            type: 'motion',
            device: 'Front Door Camera',
            timestamp: new Date().toISOString(),
            message: 'Motion detected at front door',
            priority: 'medium',
            acknowledged: false,
            image: null,
          },
          {
            id: Date.now().toString(),
            type: 'door',
            device: 'Back Door Sensor',
            timestamp: new Date().toISOString(),
            message: 'Back door opened while away mode active',
            priority: 'high',
            acknowledged: false,
            image: null,
          }
        ];
        
        const alert = securityAlerts[Math.floor(Math.random() * securityAlerts.length)];
        
        this.messageCallbacks['security_alert'].forEach(callback => 
          callback(alert)
        );
      }
    }, 120000); // Check every 2 minutes
    
    // Simulate occasional anomalies
    setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance
        const anomaly = smartHomeSimulation.generateAnomaly();
        
        if (this.messageCallbacks['anomaly_detected']) {
          this.messageCallbacks['anomaly_detected'].forEach(callback => 
            callback(anomaly)
          );
        }
      }
    }, 300000); // Check every 5 minutes
  }

  /**
   * Close the IoT connection
   */
  disconnect() {
    if (this.isConnected) {
      // Clear simulation interval
      if (this.simulationInterval) {
        clearInterval(this.simulationInterval);
        this.simulationInterval = null;
      }
      
      this.isConnected = false;
      this.connectionCallbacks.forEach(callback => callback(false));
      console.log('IoT Service: Disconnected from simulation');
    }
  }

  /**
   * Send a command to control a device
   * @param {string} deviceId - The device ID
   * @param {string} command - The command to send
   * @param {any} value - Optional value for the command
   * @returns {Promise} - Resolves when command is acknowledged
   */
  controlDevice(deviceId, command, value = null) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IoT service'));
        return;
      }
      
      // Small delay to simulate network latency
      setTimeout(() => {
        try {
          // Use simulation to control the device
          const device = smartHomeSimulation.controlDevice(deviceId, command, value);
          
          if (device) {
            // Notify subscribers about the change with a slight delay
            setTimeout(() => {
              if (this.deviceStatusCallbacks[deviceId]) {
                this.deviceStatusCallbacks[deviceId].forEach(callback => 
                  callback(device)
                );
              }
              
              if (this.messageCallbacks['device_status']) {
                this.messageCallbacks['device_status'].forEach(callback => 
                  callback(device)
                );
              }
            }, 300);
            
            resolve({
              success: true,
              deviceId,
              command,
              value,
              timestamp: new Date().toISOString()
            });
          } else {
            reject(new Error(`Device ${deviceId} not found`));
          }
        } catch (error) {
          reject(error);
        }
      }, 200);
    });
  }

  /**
   * Request the current status of a device
   * @param {string} deviceId - The device ID
   * @returns {Promise} - Resolves with device status
   */
  getDeviceStatus(deviceId) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('Not connected to IoT service'));
        return;
      }
      
      setTimeout(() => {
        const device = smartHomeSimulation.getDevice(deviceId);
        
        if (device) {
          resolve(device);
        } else {
          reject(new Error(`Device ${deviceId} not found`));
        }
      }, 100);
    });
  }

  /**
   * Register a callback for connection status changes
   * @param {Function} callback - Function to call with connection status (boolean)
   * @returns {Function} - Function to unregister the callback
   */
  onConnectionChange(callback) {
    this.connectionCallbacks.push(callback);
    
    // Call immediately with current status
    if (this.isConnected) {
      callback(true);
    }
    
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Register a callback for specific message types
   * @param {string} messageType - The type of message to listen for
   * @param {Function} callback - Function to call with the message data
   * @returns {Function} - Function to unregister the callback
   */
  onMessage(messageType, callback) {
    if (!this.messageCallbacks[messageType]) {
      this.messageCallbacks[messageType] = [];
    }
    
    this.messageCallbacks[messageType].push(callback);
    
    return () => {
      this.messageCallbacks[messageType] = this.messageCallbacks[messageType].filter(cb => cb !== callback);
    };
  }

  /**
   * Register a callback for status updates of a specific device
   * @param {string} deviceId - The device ID to listen for
   * @param {Function} callback - Function to call with the status data
   * @returns {Function} - Function to unregister the callback
   */
  onDeviceStatusChange(deviceId, callback) {
    if (!this.deviceStatusCallbacks[deviceId]) {
      this.deviceStatusCallbacks[deviceId] = [];
    }
    
    this.deviceStatusCallbacks[deviceId].push(callback);
    
    // Call immediately with current status
    const device = smartHomeSimulation.getDevice(deviceId);
    if (device) {
      callback(device);
    }
    
    return () => {
      this.deviceStatusCallbacks[deviceId] = this.deviceStatusCallbacks[deviceId].filter(cb => cb !== callback);
    };
  }

  /**
   * Register a callback for error events
   * @param {Function} callback - Function to call with the error
   * @returns {Function} - Function to unregister the callback
   */
  onError(callback) {
    this.errorCallbacks.push(callback);
    
    return () => {
      this.errorCallbacks = this.errorCallbacks.filter(cb => cb !== callback);
    };
  }
  
  /**
   * Trigger a simulation update immediately
   * Useful for testing or forcing state changes
   */
  triggerSimulationUpdate() {
    smartHomeSimulation.updateSimulation();
  }
}

// Create and export a singleton instance
const iotService = new IoTService();
export default iotService;