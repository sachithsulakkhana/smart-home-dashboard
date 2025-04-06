// src/components/dashboard/EnergyChart.js
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  ToggleButtonGroup, 
  ToggleButton,
  CircularProgress,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  Line, 
  Bar, 
  ComposedChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area
} from 'recharts';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectEnergyData, 
  selectPredictions,
  selectAnalyticsStatus, 
  fetchEnergyData, 
  fetchPredictions 
} from '../../features/analytics/analyticsSlice';
import { formatDate, getDateRange } from '../../utils/dateUtils';
import { formatEnergy, formatCurrency } from '../../utils/formatters';

/**
 * Component to display energy consumption charts
 * 
 * @param {Object} props Component props
 * @param {string} props.title Chart title
 * @param {Object} props.sx Additional styles for the container
 */
const EnergyChart = ({ title = 'Energy Consumption', sx = {} }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Get data from Redux store
  const energyData = useSelector(selectEnergyData);
  const predictions = useSelector(selectPredictions);
  const status = useSelector(selectAnalyticsStatus);
  
  // Component state
  const [chartType, setChartType] = useState('line');
  const [period, setPeriod] = useState('month');
  const [showPredictions, setShowPredictions] = useState(true);
  
  // Fetch data when component mounts or period changes
  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchEnergyData(period));
      dispatch(fetchPredictions());
    } else if (period && status !== 'loading') {
      dispatch(fetchEnergyData(period));
    }
  }, [dispatch, status, period]);
  
  // Handle chart type change
  const handleChartTypeChange = (event, newChartType) => {
    if (newChartType !== null) {
      setChartType(newChartType);
    }
  };
  
  // Handle period change
  const handlePeriodChange = (event) => {
    setPeriod(event.target.value);
  };
  
  // Toggle predictions display
  const handlePredictionToggle = (event, newValue) => {
    if (newValue !== null) {
      setShowPredictions(newValue === 'show');
    }
  };
  
  // Prepare chart data - combine historical data with predictions
  const prepareChartData = () => {
    if (!energyData.length) return [];
    
    // Format historical data
    const formattedData = energyData.map(item => ({
      date: formatDate(item.date, period),
      consumption: item.consumption,
      cost: item.cost,
      type: 'historical'
    }));
    
    // Add predictions if enabled
    if (showPredictions && predictions.length) {
      const predictionData = predictions.map(item => ({
        date: formatDate(item.date, period),
        predictedConsumption: item.predictedConsumption,
        predictedCost: item.predictedCost,
        type: 'prediction'
      }));
      
      return [...formattedData, ...predictionData];
    }
    
    return formattedData;
  };
  
  // Get chart data
  const chartData = prepareChartData();
  
  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPrediction = data.type === 'prediction';
      
      return (
        <Paper sx={{ p: 2, boxShadow: theme.shadows[3] }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            {label}
            {isPrediction && ' (Predicted)'}
          </Typography>
          
          {payload.map((entry, index) => {
            const isConsumption = entry.dataKey === 'consumption' || entry.dataKey === 'predictedConsumption';
            const value = isConsumption
              ? formatEnergy(entry.value)
              : formatCurrency(entry.value);
              
            return (
              <Typography key={`tooltip-${index}`} variant="body2" sx={{ color: entry.color }}>
                {isConsumption ? 'Energy: ' : 'Cost: '}{value}
              </Typography>
            );
          })}
        </Paper>
      );
    }
    
    return null;
  };
  
  // Determine chart colors
  const chartColors = {
    consumption: theme.palette.primary.main,
    cost: theme.palette.secondary.main,
    predictedConsumption: theme.palette.info.main,
    predictedCost: theme.palette.warning.main,
  };
  
  // Render loading state
  if (status === 'loading') {
    return (
      <Paper sx={{ p: 3, height: 400, display: 'flex', justifyContent: 'center', alignItems: 'center', ...sx }}>
        <CircularProgress />
      </Paper>
    );
  }
  
  // Render the chart
  return (
    <Paper sx={{ p: 3, ...sx }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h6">{title}</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="period-select-label">Period</InputLabel>
            <Select
              labelId="period-select-label"
              id="period-select"
              value={period}
              label="Period"
              onChange={handlePeriodChange}
            >
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </Select>
          </FormControl>
          
          <ToggleButtonGroup
            value={chartType}
            exclusive
            onChange={handleChartTypeChange}
            size="small"
          >
            <ToggleButton value="line">Line</ToggleButton>
            <ToggleButton value="bar">Bar</ToggleButton>
            <ToggleButton value="composed">Combined</ToggleButton>
          </ToggleButtonGroup>
          
          <ToggleButtonGroup
            value={showPredictions ? 'show' : 'hide'}
            exclusive
            onChange={handlePredictionToggle}
            size="small"
          >
            <ToggleButton value="show">Show Predictions</ToggleButton>
            <ToggleButton value="hide">Hide Predictions</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
      
      <Box sx={{ height: 400, width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <Line 
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke={chartColors.consumption} />
              <YAxis yAxisId="right" orientation="right" stroke={chartColors.cost} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                yAxisId="left" 
                type="monotone" 
                dataKey="consumption" 
                stroke={chartColors.consumption} 
                activeDot={{ r: 8 }} 
                name="Energy (kWh)"
                strokeWidth={2}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cost" 
                stroke={chartColors.cost} 
                name="Cost ($)"
                strokeWidth={2}
              />
              {showPredictions && (
                <>
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="predictedConsumption" 
                    stroke={chartColors.predictedConsumption} 
                    strokeDasharray="5 5" 
                    name="Predicted Energy (kWh)"
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="predictedCost" 
                    stroke={chartColors.predictedCost} 
                    strokeDasharray="5 5" 
                    name="Predicted Cost ($)"
                  />
                </>
              )}
            </Line>
          ) : chartType === 'bar' ? (
            <Bar 
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke={chartColors.consumption} />
              <YAxis yAxisId="right" orientation="right" stroke={chartColors.cost} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="consumption" 
                fill={chartColors.consumption} 
                name="Energy (kWh)"
              />
              <Bar 
                yAxisId="right" 
                dataKey="cost" 
                fill={chartColors.cost} 
                name="Cost ($)"
              />
              {showPredictions && (
                <>
                  <Bar 
                    yAxisId="left" 
                    dataKey="predictedConsumption" 
                    fill={chartColors.predictedConsumption} 
                    name="Predicted Energy (kWh)"
                    fillOpacity={0.7}
                  />
                  <Bar 
                    yAxisId="right" 
                    dataKey="predictedCost" 
                    fill={chartColors.predictedCost} 
                    name="Predicted Cost ($)"
                    fillOpacity={0.7}
                  />
                </>
              )}
            </Bar>
          ) : (
            <ComposedChart 
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" orientation="left" stroke={chartColors.consumption} />
              <YAxis yAxisId="right" orientation="right" stroke={chartColors.cost} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar 
                yAxisId="left" 
                dataKey="consumption" 
                fill={chartColors.consumption} 
                name="Energy (kWh)"
                barSize={20}
              />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="cost" 
                stroke={chartColors.cost} 
                strokeWidth={2}
                name="Cost ($)"
              />
              {showPredictions && (
                <>
                  <Bar 
                    yAxisId="left" 
                    dataKey="predictedConsumption" 
                    fill={chartColors.predictedConsumption} 
                    name="Predicted Energy (kWh)"
                    fillOpacity={0.7}
                    barSize={20}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="predictedCost" 
                    stroke={chartColors.predictedCost} 
                    strokeDasharray="5 5" 
                    name="Predicted Cost ($)"
                  />
                </>
              )}
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default EnergyChart;