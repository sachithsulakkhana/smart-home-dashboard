// src/services/ai.js
import * as tf from '@tensorflow/tfjs';

class SmartHomeAI {
  constructor() {
    this.models = {
      energyPrediction: null,
      userBehavior: null,
      anomalyDetection: null
    };
    this.initialized = false;
  }

  /**
   * Initialize all AI models
   */
  async initialize() {
    try {
      // In a real application, you would load pre-trained models from your server
      // For this example, we'll create simple models
      await this.initEnergyPredictionModel();
      await this.initUserBehaviorModel();
      await this.initAnomalyDetectionModel();
      
      this.initialized = true;
      console.log('AI models initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize AI models:', error);
      return false;
    }
  }

  /**
   * Initialize energy prediction model
   */
  async initEnergyPredictionModel() {
    // Create a simple sequential model for energy prediction
    const model = tf.sequential();
    
    // Simple model with one hidden layer
    model.add(tf.layers.dense({
      inputShape: [7], // Time of day, day of week, temperature, humidity, previous usage, etc.
      units: 12,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'linear' // Energy consumption prediction
    }));
    
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });
    
    this.models.energyPrediction = model;
  }

  /**
   * Initialize user behavior prediction model
   */
  async initUserBehaviorModel() {
    // Create a simple sequential model for user behavior prediction
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      inputShape: [10], // Time, day, previous actions, device states, etc.
      units: 16,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 8,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 5, // Different types of actions a user might take
      activation: 'softmax' // Probability distribution over possible actions
    }));
    
    model.compile({
      optimizer: 'adam',
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    });
    
    this.models.userBehavior = model;
  }

  /**
   * Initialize anomaly detection model
   */
  async initAnomalyDetectionModel() {
    // Create an autoencoder for anomaly detection
    // Encoder
    const input = tf.input({shape: [12]}); // Sensor readings, device states, etc.
    const encoded = tf.layers.dense({units: 6, activation: 'relu'}).apply(input);
    const bottleneck = tf.layers.dense({units: 3, activation: 'relu'}).apply(encoded);
    
    // Decoder
    const decoded = tf.layers.dense({units: 6, activation: 'relu'}).apply(bottleneck);
    const output = tf.layers.dense({units: 12, activation: 'sigmoid'}).apply(decoded);
    
    const model = tf.model({inputs: input, outputs: output});
    
    model.compile({
      optimizer: 'adam',
      loss: 'meanSquaredError'
    });
    
    this.models.anomalyDetection = model;
  }

  /**
   * Predict energy consumption for the next hours
   * @param {Object} data - Current state data including time, temperature, etc.
   * @returns {Promise<Array>} - Predicted energy consumption for each hour
   */
  async predictEnergyConsumption(data) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Prepare input data
      const input = this.preprocessEnergyData(data);
      
      // Make prediction
      const prediction = await this.models.energyPrediction.predict(input).dataSync();
      
      // Return processed prediction
      return Array.from(prediction);
    } catch (error) {
      console.error('Energy prediction failed:', error);
      return null;
    }
  }

  /**
   * Predict user behavior based on current context
   * @param {Object} context - Current context including time, device states, etc.
   * @returns {Promise<Object>} - Predicted user actions with probabilities
   */
  async predictUserBehavior(context) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Prepare input data
      const input = this.preprocessBehaviorData(context);
      
      // Make prediction
      const prediction = await this.models.userBehavior.predict(input).dataSync();
      
      // Get action probabilities
      const actions = ['turnOnLights', 'adjustTemperature', 'playMusic', 'watchTV', 'securityCheck'];
      const result = {};
      
      actions.forEach((action, index) => {
        result[action] = prediction[index];
      });
      
      return result;
    } catch (error) {
      console.error('User behavior prediction failed:', error);
      return null;
    }
  }

  /**
   * Detect anomalies in device behavior or sensor readings
   * @param {Object} readings - Current sensor readings and device states
   * @returns {Promise<Object>} - Anomaly detection results
   */
  async detectAnomalies(readings) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Prepare input data
      const input = this.preprocessAnomalyData(readings);
      
      // Run through autoencoder
      const output = await this.models.anomalyDetection.predict(input).dataSync();
      
      // Calculate reconstruction error
      const inputArray = Array.from(input.dataSync());
      const outputArray = Array.from(output);
      
      // Calculate mean squared error
      let mse = 0;
      for (let i = 0; i < inputArray.length; i++) {
        mse += Math.pow(inputArray[i] - outputArray[i], 2);
      }
      mse /= inputArray.length;
      
      // Determine if anomaly based on threshold
      const isAnomaly = mse > 0.1; // Threshold would be determined during training
      
      return {
        isAnomaly,
        score: mse,
        details: this.getAnomalyDetails(inputArray, outputArray)
      };
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return {
        isAnomaly: false,
        error: error.message
      };
    }
  }

  /**
   * Get recommendations for energy optimization
   * @param {Object} currentState - Current device states and energy usage
   * @returns {Promise<Array>} - List of energy optimization recommendations
   */
  async getEnergyOptimizationRecommendations(currentState) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const recommendations = [];
    
    // Example logic for recommendations
    // In a real application, this would be based on AI model predictions
    if (currentState.lights.some(light => light.isOn && !light.isOccupied)) {
      recommendations.push({
        type: 'light',
        action: 'turnOff',
        reason: 'Lights are on in unoccupied rooms',
        potentialSavings: '5-10%'
      });
    }
    
    if (currentState.temperature < 68 && currentState.heating.isOn) {
      recommendations.push({
        type: 'thermostat',
        action: 'adjustTemperature',
        target: 68,
        reason: 'Heating is set too high for energy efficiency',
        potentialSavings: '8-12%'
      });
    }
    
    // Add more recommendation logic
    
    return recommendations;
  }

  /**
   * Helper method to preprocess energy data
   * @private
   */
  preprocessEnergyData(data) {
    // Convert object data to tensor
    const { time, dayOfWeek, temperature, humidity, previousUsage, occupancy, deviceCount } = data;
    
    // Normalize values
    const normalizedTime = time / 24;
    const normalizedDay = dayOfWeek / 7;
    const normalizedTemp = (temperature - 50) / 50; 
    const normalizedHumidity = humidity / 100;
    const normalizedPrevUsage = previousUsage / 1000; // Assuming max usage of 1000
    const normalizedOccupancy = occupancy / 10; // Assuming max occupancy of 10
    const normalizedDeviceCount = deviceCount / 50; // Assuming max of 50 devices
    
    // Create and return tensor
    return tf.tensor2d([
      [normalizedTime, normalizedDay, normalizedTemp, normalizedHumidity, 
        normalizedPrevUsage, normalizedOccupancy, normalizedDeviceCount]
    ]);
  }

  /**
   * Helper method to preprocess behavior data
   * @private
   */
  preprocessBehaviorData(context) {
    // In a real application, you would extract and normalize features from the context
    // For this example, we'll create a simple tensor with dummy values
    return tf.tensor2d([
      [0.5, 0.3, 0.7, 0.2, 0.1, 0.8, 0.4, 0.6, 0.9, 0.5]
    ]);
  }

  /**
   * Helper method to preprocess anomaly detection data
   * @private
   */
  preprocessAnomalyData(readings) {
    // In a real application, you would extract and normalize features from the readings
    // For this example, we'll create a simple tensor with dummy values
    return tf.tensor2d([
      [0.5, 0.3, 0.7, 0.2, 0.1, 0.8, 0.4, 0.6, 0.9, 0.5, 0.2, 0.7]
    ]);
  }

  /**
   * Helper method to get details about detected anomalies
   * @private
   */
  getAnomalyDetails(input, output) {
    // Calculate difference for each feature
    const differences = input.map((value, index) => {
      return {
        feature: `feature${index}`,
        difference: Math.abs(value - output[index])
      };
    });
    
    // Sort by largest difference
    differences.sort((a, b) => b.difference - a.difference);
    
    // Return top 3 features with largest difference
    return differences.slice(0, 3);
  }
}

// Export singleton instance
const aiService = new SmartHomeAI();
export default aiService;