// Utility functions for AI energy prediction

/**
 * Calculate a specific quantile from an array of values
 * @param {number[]} values - Array of numeric values
 * @param {number} q - Quantile to calculate (0-1)
 * @return {number} The calculated quantile value
 */
function calculateQuantile(values, q) {
    const sorted = [...values].sort((a, b) => a - b);
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  }
  
  /**
   * Preprocess energy readings data for prediction
   * @param {Array} readings - Raw energy readings from database
   * @return {Array} Processed data ready for prediction
   */
  function preprocessEnergyData(readings) {
    // Handle empty or invalid input
    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return [];
    }
    
    // Remove outliers using IQR method
    const values = readings.map(r => r.WattageReading);
    const q1 = calculateQuantile(values, 0.25);
    const q3 = calculateQuantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
   
    // Filter outliers and normalize time
    return readings
      .filter(r => r.WattageReading >= lowerBound && r.WattageReading <= upperBound)
      .map(r => ({
        hour: new Date(r.Timestamp).getHours(),
        dayOfWeek: new Date(r.Timestamp).getDay(),
        wattage: r.WattageReading
      }));
  }
  
  /**
   * Predict energy usage based on historical patterns
   * @param {Array} historicalData - Preprocessed historical energy data
   * @param {number} targetHour - Hour of day to predict for (0-23)
   * @param {number} targetDay - Day of week to predict for (0-6, 0 is Sunday)
   * @return {number} Predicted energy usage in watts
   */
  function predictEnergyUsage(historicalData, targetHour, targetDay) {
    // Find similar temporal patterns
    let similarPatterns = historicalData.filter(data =>
      data.hour === targetHour && data.dayOfWeek === targetDay
    );
   
    if (similarPatterns.length === 0) {
      // Fall back to same hour, any day
      similarPatterns = historicalData.filter(data => data.hour === targetHour);
    }
   
    if (similarPatterns.length === 0) {
      return null; // Insufficient data for prediction
    }
   
    // Calculate weighted average based on recency
    const totalWeight = similarPatterns.reduce((sum, _, i) => sum + (similarPatterns.length - i), 0);
    const weightedSum = similarPatterns.reduce((sum, pattern, i) =>
      sum + pattern.wattage * (similarPatterns.length - i), 0
    );
   
    return weightedSum / totalWeight;
  }
  
  /**
   * Calculate confidence level for a prediction
   * @param {Array} historicalData - Preprocessed historical energy data
   * @param {number} targetHour - Hour of day the prediction is for
   * @param {number} targetDay - Day of week the prediction is for
   * @return {number} Confidence level between 0-1
   */
  function calculatePredictionConfidence(historicalData, targetHour, targetDay) {
    const similarPatterns = historicalData.filter(data =>
      data.hour === targetHour && data.dayOfWeek === targetDay
    );
   
    // Base confidence on data quantity and consistency
    const patternCount = similarPatterns.length;
    if (patternCount === 0) return 0.3; // Low confidence
    if (patternCount < 3) return 0.5; // Moderate confidence
   
    // Calculate variance to assess consistency
    const values = similarPatterns.map(p => p.wattage);
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
   
    // High consistency (low CV) = high confidence
    if (coefficientOfVariation < 0.1) return 0.9;
    if (coefficientOfVariation < 0.2) return 0.8;
    if (coefficientOfVariation < 0.3) return 0.7;
    return 0.6; // Default moderate confidence
  }
  
  /**
   * Generate hourly predictions for the next 24 hours
   * @param {Array} readings - Raw energy readings from database
   * @return {Array} Hourly predictions with confidence levels
   */
  function generateHourlyPredictions(readings) {
    // Process the data
    const processedData = preprocessEnergyData(readings);
    
    if (processedData.length === 0) {
      return [];
    }
    
    const predictions = [];
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    // Generate predictions for next 24 hours
    for (let i = 0; i < 24; i++) {
      const targetHour = (currentHour + i) % 24;
      const daysForward = Math.floor((currentHour + i) / 24);
      const targetDay = (currentDay + daysForward) % 7;
      
      const predictedWattage = predictEnergyUsage(processedData, targetHour, targetDay);
      const confidence = calculatePredictionConfidence(processedData, targetHour, targetDay);
      
      if (predictedWattage !== null) {
        const predictionTime = new Date(now);
        predictionTime.setHours(now.getHours() + i, 0, 0, 0);
        
        predictions.push({
          time: predictionTime,
          hour: targetHour,
          dayOfWeek: targetDay,
          predictedWattage: Math.round(predictedWattage * 10) / 10, // Round to 1 decimal
          confidence
        });
      }
    }
    
    return predictions;
  }
  
  /**
   * Calculate daily energy prediction
   * @param {Array} hourlyPredictions - Array of hourly predictions
   * @return {Object} Total kWh and peak predictions
   */
  function calculateDailyPrediction(hourlyPredictions) {
    if (!hourlyPredictions || hourlyPredictions.length === 0) {
      return { totalKWh: 0, peakWattage: 0, averageConfidence: 0 };
    }
    
    // Calculate total kWh (assuming each prediction represents a full hour)
    const totalWattHours = hourlyPredictions.reduce((sum, pred) => sum + pred.predictedWattage, 0);
    const totalKWh = totalWattHours / 1000;
    
    // Find peak wattage
    const peakWattage = Math.max(...hourlyPredictions.map(pred => pred.predictedWattage));
    
    // Average confidence
    const avgConfidence = hourlyPredictions.reduce((sum, pred) => sum + pred.confidence, 0) / 
                        hourlyPredictions.length;
    
    return {
      totalKWh: Math.round(totalKWh * 100) / 100, // Round to 2 decimals
      peakWattage: Math.round(peakWattage),
      averageConfidence: Math.round(avgConfidence * 100) / 100
    };
  }
  
  export {
    preprocessEnergyData,
    predictEnergyUsage,
    calculatePredictionConfidence,
    generateHourlyPredictions,
    calculateDailyPrediction
  };