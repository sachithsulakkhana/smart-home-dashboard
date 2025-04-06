// src/components/common/StatCard.js
import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  Tooltip,
  IconButton 
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

/**
 * A reusable card component for displaying statistics and metrics
 * 
 * @param {Object} props Component props
 * @param {string} props.title Title of the stat
 * @param {string|number} props.value Main value to display
 * @param {string} props.subtitle Optional subtitle text
 * @param {React.ReactNode} props.icon Optional icon
 * @param {string} props.iconColor Color for the icon
 * @param {string} props.color Background color for card
 * @param {Object} props.trend Optional trend data {value: number, direction: 'up'|'down'|'flat', label: string}
 * @param {boolean} props.loading Whether data is loading
 * @param {string} props.tooltipText Optional tooltip text
 * @param {Object} props.sx Additional styles
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  iconColor = 'primary.main',
  color = 'background.paper',
  trend,
  loading = false,
  tooltipText,
  sx = {}
}) => {
  // Render the trend icon based on direction
  const renderTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return <TrendingUpIcon fontSize="small" color="success" />;
      case 'down':
        return <TrendingDownIcon fontSize="small" color="error" />;
      case 'flat':
      default:
        return <TrendingFlatIcon fontSize="small" color="action" />;
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        bgcolor: color,
        ...sx 
      }}
      elevation={1}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            {title}
            
            {tooltipText && (
              <Tooltip title={tooltipText} arrow placement="top">
                <IconButton size="small" sx={{ ml: 0.5, p: 0 }}>
                  <InfoOutlinedIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
            )}
          </Typography>
          
          {icon && (
            <Box sx={{ color: iconColor }}>
              {icon}
            </Box>
          )}
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 2 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        ) : (
          <Typography variant="h4" component="div" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
            {value}
          </Typography>
        )}
        
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
        
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            {renderTrendIcon(trend.direction)}
            <Typography 
              variant="caption" 
              sx={{ 
                ml: 0.5,
                color: trend.direction === 'up' ? 'success.main' : 
                       trend.direction === 'down' ? 'error.main' : 'text.secondary'
              }}
            >
              {trend.value} {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;