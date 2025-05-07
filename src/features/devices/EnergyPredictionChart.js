import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Tooltip,
  CircularProgress
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import { generateHourlyPredictions, calculateDailyPrediction } from './predictionUtils';

const EnergyPredictionChart = ({ energyReadings, formatWatts }) => {
  const [predictionData, setPredictionData] = useState([]);
  const [dailyPrediction, setDailyPrediction] = useState(null);
  const [timeFrame, setTimeFrame] = useState('24h');
  const [loading, setLoading] = useState(true);
  
  // Process the historical data and make predictions when energyReadings changes
  useEffect(() => {
    if (energyReadings && energyReadings.length > 0) {
      setLoading(true);
      
      // Generate predictions using the AI algorithm
      const predictions = generateHourlyPredictions(energyReadings);
      
      // Format data for chart display
      const chartData = predictions.map(pred => ({
        time: new Date(pred.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fullTime: pred.time,
        predictedWatts: pred.predictedWattage,
        confidence: pred.confidence,
        confidenceInterval: [
          pred.predictedWattage * (1 - (1 - pred.confidence)),  // Lower bound
          pred.predictedWattage * (1 + (1 - pred.confidence))   // Upper bound
        ]
      }));
      
      // Calculate daily prediction totals
      const daily = calculateDailyPrediction(predictions);
      
      setPredictionData(chartData);
      setDailyPrediction(daily);
      setLoading(false);
    } else {
      // No data available
      setPredictionData([]);
      setDailyPrediction(null);
      setLoading(false);
    }
  }, [energyReadings]);
  
  // Filter data based on selected time frame
  const getFilteredData = () => {
    if (!predictionData || predictionData.length === 0) {
      return [];
    }
    
    switch(timeFrame) {
      case '6h':
        return predictionData.slice(0, 6);
      case '12h':
        return predictionData.slice(0, 12);
      case '24h':
      default:
        return predictionData;
    }
  };
  
  // Format confidence as percentage
  const formatConfidence = (confidence) => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ 
          backgroundColor: '#fff', 
          padding: '10px', 
          border: '1px solid #ccc',
          borderRadius: '5px',
          boxShadow: '0 2px 5px rgba(0,0,0,0.15)'
        }}>
          <p className="label">{`Time: ${label}`}</p>
          <p className="prediction" style={{ color: '#8884d8' }}>
            {`Predicted: ${formatWatts(payload[0].value)}`}
          </p>
          <p className="confidence" style={{ color: '#82ca9d' }}>
            {`Confidence: ${formatConfidence(payload[1].payload.confidence)}`}
          </p>
          <p className="range" style={{ fontSize: '0.8rem', color: '#666' }}>
            {`Range: ${formatWatts(payload[0].payload.confidenceInterval[0])} - ${formatWatts(payload[0].payload.confidenceInterval[1])}`}
          </p>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2" sx={{ display: 'flex', alignItems: 'center' }}>
          Energy Usage Prediction
          <Tooltip title="AI-powered predictions based on historical usage patterns">
            <InfoIcon fontSize="small" sx={{ ml: 1, color: 'text.secondary' }} />
          </Tooltip>
        </Typography>
        
        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Time Frame</InputLabel>
          <Select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value)}
            label="Time Frame"
          >
            <MenuItem value="6h">Next 6 Hours</MenuItem>
            <MenuItem value="12h">Next 12 Hours</MenuItem>
            <MenuItem value="24h">Next 24 Hours</MenuItem>
          </Select>
        </FormControl>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress />
        </Box>
      ) : predictionData.length === 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: 300,
          color: 'text.secondary' 
        }}>
          <Typography variant="body1">
            Insufficient historical data for predictions
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Predictions will appear as more data is collected
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            mb: 2, 
            flexWrap: 'wrap',
            gap: 2
          }}>
            {dailyPrediction && (
              <>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: 'background.default',
                  minWidth: 120,
                  flexGrow: 1
                }}>
                  <Typography variant="body2" color="text.secondary">Predicted Daily Usage</Typography>
                  <Typography variant="h5" color="primary.main">
                    {dailyPrediction.totalKWh.toFixed(2)} kWh
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: 'background.default',
                  minWidth: 120,
                  flexGrow: 1
                }}>
                  <Typography variant="body2" color="text.secondary">Predicted Peak Power</Typography>
                  <Typography variant="h5" color="primary.main">
                    {formatWatts(dailyPrediction.peakWattage)}
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 1, 
                  bgcolor: 'background.default',
                  minWidth: 120,
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between'
                }}>
                  <Typography variant="body2" color="text.secondary">Prediction Confidence</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Box sx={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: '50%', 
                      bgcolor: dailyPrediction.averageConfidence >= 0.7 ? 'success.main' : 
                              dailyPrediction.averageConfidence >= 0.5 ? 'warning.main' : 'error.main',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 1
                    }}>
                      {Math.round(dailyPrediction.averageConfidence * 100)}%
                    </Box>
                    <Typography variant="body2">
                      {dailyPrediction.averageConfidence >= 0.7 ? 'High' : 
                       dailyPrediction.averageConfidence >= 0.5 ? 'Medium' : 'Low'}
                    </Typography>
                  </Box>
                </Box>
              </>
            )}
          </Box>
          
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={getFilteredData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 25 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  angle={-45}
                  textAnchor="end"
                  height={50}
                  label={{ value: 'Time', position: 'insideBottomRight', offset: 0 }}
                />
                <YAxis
                  label={{ value: 'Power (Watts)', angle: -90, position: 'insideLeft', offset: 10 }}
                />
                <RechartsTooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} />
                
                {/* Confidence interval area */}
                <Area 
                  type="monotone" 
                  dataKey="confidenceInterval" 
                  fill="#8884d820" 
                  stroke="none" 
                  name="Confidence Interval"
                />
                
                {/* Prediction line */}
                <Line 
                  type="monotone" 
                  dataKey="predictedWatts" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                  name="Predicted Usage"
                />
                
                {/* Current time reference line */}
                <ReferenceLine 
                  x={getFilteredData()[0]?.time} 
                  stroke="#666" 
                  strokeDasharray="3 3" 
                  label={{ value: 'Now', position: 'insideTopRight', fill: '#666' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </Box>
        </>
      )}
    </Paper>
  );
};

export default EnergyPredictionChart;