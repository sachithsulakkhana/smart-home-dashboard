// Improved utility functions for AI energy prediction

/**
 * Calculate a specific quantile from an array of values
 * @param {number[]} values - Array of numeric values
 * @param {number} q - Quantile to calculate (0-1)
 * @return {number} The calculated quantile value
 */
function calculateQuantile(values, q) {
  if (!values || values.length === 0) return 0;
  
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
    return generatePlaceholderData();
  }
  
  // Normalize the data structure if needed
  const normalizedReadings = readings.map(r => {
    // Handle different possible data formats
    const timestamp = r.Timestamp || r.timestamp || r.time || new Date();
    const wattage = r.WattageReading || r.watts || r.value || 0;
    
    return {
      hour: new Date(timestamp).getHours(),
      dayOfWeek: new Date(timestamp).getDay(),
      wattage: wattage
    };
  });
  
  // Only apply outlier filtering if we have enough data points
  if (normalizedReadings.length > 5) {
    // Remove outliers using IQR method
    const values = normalizedReadings.map(r => r.wattage);
    const q1 = calculateQuantile(values, 0.25);
    const q3 = calculateQuantile(values, 0.75);
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;
    
    return normalizedReadings.filter(r => r.wattage >= lowerBound && r.wattage <= upperBound);
  }
  
  return normalizedReadings;
}

/**
 * Generate placeholder data when real data is insufficient
 * @return {Array} Generated pattern data
 */
function generatePlaceholderData() {
  // Create a realistic daily pattern when no data is available
  const data = [];
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  
  // Get range of hours to simulate a full day
  for (let h = 0; h < 24; h++) {
    // Create a realistic usage pattern:
    // - Low usage at night (11pm - 5am)
    // - Morning peak (6am - 9am)
    // - Medium during day (10am - 4pm)
    // - Evening peak (5pm - 10pm)
    let wattage;
    
    if (h >= 23 || h < 5) {
      // Night: low usage
      wattage = 300 + Math.random() * 200;
    } else if (h >= 5 && h < 9) {
      // Morning peak
      wattage = 1200 + Math.random() * 600;
    } else if (h >= 9 && h < 17) {
      // Daytime
      wattage = 800 + Math.random() * 300;
    } else {
      // Evening peak
      wattage = 1500 + Math.random() * 700;
    }
    
    // Add some weekend vs weekday variation
    if (currentDay === 0 || currentDay === 6) { // Weekend
      if (h >= 9 && h < 22) {
        wattage *= 1.2; // Higher usage during daytime on weekends
      }
    }
    
    data.push({
      hour: h,
      dayOfWeek: currentDay,
      wattage: wattage
    });
  }
  
  return data;
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
    // If still no patterns, use a default value based on time of day
    return generateDefaultValue(targetHour);
  }
 
  // Calculate weighted average based on recency
  const totalWeight = similarPatterns.reduce((sum, _, i) => sum + (similarPatterns.length - i), 0);
  const weightedSum = similarPatterns.reduce((sum, pattern, i) =>
    sum + pattern.wattage * (similarPatterns.length - i), 0
  );
 
  return weightedSum / totalWeight;
}

/**
 * Generate a default value based on typical home usage patterns
 * @param {number} hour - Hour of day (0-23)
 * @return {number} Default wattage value
 */
function generateDefaultValue(hour) {
  // Default values based on typical home usage patterns
  if (hour >= 23 || hour < 5) {
    // Night hours: low usage
    return 300 + Math.random() * 100;
  } else if (hour >= 5 && hour < 9) {
    // Morning hours: medium-high usage
    return 1200 + Math.random() * 300;
  } else if (hour >= 9 && hour < 17) {
    // Day hours: medium usage
    return 800 + Math.random() * 200;
  } else {
    // Evening hours: highest usage
    return 1500 + Math.random() * 300;
  }
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
  if (patternCount === 0) return 0.6; // Moderate confidence for generated data
  if (patternCount < 3) return 0.65; // Slightly better than generated
 
  // Calculate variance to assess consistency
  const values = similarPatterns.map(p => p.wattage);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
 
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
  // Ensure we always produce predictions even with limited data
  const processedData = preprocessEnergyData(readings);
  
  if (!processedData || processedData.length === 0) {
    return []; // Should never happen with our improved preprocessing
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
  
  return predictions;
}

/**
 * Calculate daily energy prediction
 * @param {Array} hourlyPredictions - Array of hourly predictions
 * @return {Object} Total kWh and peak predictions
 */
function calculateDailyPrediction(hourlyPredictions) {
  if (!hourlyPredictions || hourlyPredictions.length === 0) {
    // Generate a default prediction if needed
    const defaultHourlyUsage = 0.8; // kWh
    return { 
      totalKWh: defaultHourlyUsage * 24, 
      peakWattage: 1800, 
      averageConfidence: 0.6 
    };
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

/**
 * Generate a complete AI energy prediction analysis
 * @param {Array} historicalData - Raw energy readings from database
 * @return {Object} Complete prediction analysis
 */
function generateEnergyPredictionAnalysis(historicalData) {
  // Always generate predictions, falling back to synthetic data if needed
  const hourlyPredictions = generateHourlyPredictions(historicalData);
  const dailyPrediction = calculateDailyPrediction(hourlyPredictions);
  
  // Format for display in UI
  const formattedPredictions = hourlyPredictions.map(pred => ({
    time: pred.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    fullTime: pred.time,
    predictedWatts: pred.predictedWattage,
    confidence: pred.confidence,
    confidenceInterval: [
      pred.predictedWattage * (1 - (1 - pred.confidence)),  // Lower bound
      pred.predictedWattage * (1 + (1 - pred.confidence))   // Upper bound
    ]
  }));
  
  return {
    hourlyPredictions: formattedPredictions,
    dailySummary: dailyPrediction,
    isBasedOnRealData: historicalData && historicalData.length > 5,
    dataPoints: historicalData ? historicalData.length : 0
  };
}

export {
  preprocessEnergyData,
  predictEnergyUsage,
  calculatePredictionConfidence,
  generateHourlyPredictions,
  calculateDailyPrediction,
  generateEnergyPredictionAnalysis
};