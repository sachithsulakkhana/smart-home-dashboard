// src/components/automation/RuleCard.js
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  Typography, 
  Box, 
  Chip, 
  Switch, 
  IconButton, 
  Divider,
  Button,
  Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DevicesIcon from '@mui/icons-material/Devices';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useDispatch } from 'react-redux';
import { toggleRuleStatus } from '../../features/automation/automationSlice';
import { formatTimeAgo } from '../../utils/dateUtils';

/**
 * Component to display an automation rule card
 * 
 * @param {Object} props Component props
 * @param {Object} props.rule The automation rule data
 * @param {Function} props.onEdit Function to call when edit button is clicked
 * @param {Function} props.onDelete Function to call when delete button is clicked
 * @param {Function} props.onDuplicate Function to call when duplicate button is clicked
 * @param {Function} props.onView Function to call when view details button is clicked
 */
const RuleCard = ({
  rule,
  onEdit,
  onDelete,
  onDuplicate,
  onView
}) => {
  const dispatch = useDispatch();
  
  // Handle toggle active status
  const handleToggleActive = () => {
    dispatch(toggleRuleStatus({ id: rule.id, active: !rule.active }));
  };
  
  // Get trigger description text
  const getTriggerText = () => {
    if (!rule.trigger) return 'No trigger defined';
    
    switch (rule.trigger.type) {
      case 'time':
        return rule.trigger.value === 'sunset' || rule.trigger.value === 'sunrise' 
          ? `At ${rule.trigger.value}` 
          : `At ${rule.trigger.value}`;
      case 'presence':
        return `When ${rule.trigger.value === 'home' ? 'someone arrives home' : 'everyone leaves'}`;
      case 'device':
        return `When ${rule.trigger.deviceName || 'a device'} ${rule.trigger.state || 'changes state'}`;
      default:
        return 'Custom trigger';
    }
  };
  
  // Get conditions text
  const getConditionsText = () => {
    if (!rule.conditions || rule.conditions.length === 0) {
      return 'Always execute';
    }
    
    return rule.conditions.map(condition => {
      switch (condition.type) {
        case 'presence':
          return `When ${condition.value === 'home' ? 'someone is home' : 'no one is home'}`;
        case 'day':
          return `On ${condition.value === 'weekday' ? 'weekdays' : 'weekends'}`;
        case 'weather':
          return `When weather is ${condition.value}`;
        case 'device':
          return `When ${condition.deviceName || 'a device'} is ${condition.state || 'in state'}`;
        default:
          return 'Custom condition';
      }
    }).join(', ');
  };
  
  // Get actions text
  const getActionsText = () => {
    if (!rule.actions || rule.actions.length === 0) {
      return 'No actions defined';
    }
    
    return rule.actions.map(action => {
      switch (action.type) {
        case 'device':
          return `${action.command || 'Control'} ${action.deviceName || 'a device'}`;
        case 'scene':
          return `Activate scene '${action.sceneName || action.sceneId}'`;
        case 'notification':
          return 'Send notification';
        default:
          return 'Custom action';
      }
    }).join(', ');
  };
  
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" component="div">
              {rule.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {rule.description}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
              {rule.active ? 'Active' : 'Inactive'}
            </Typography>
            <Switch
              checked={rule.active}
              onChange={handleToggleActive}
              size="small"
              color="primary"
            />
          </Box>
        </Box>
        
        <Divider sx={{ my: 1.5 }} />
        
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom>
            Trigger:
          </Typography>
          <Chip 
            icon={<AccessTimeIcon />} 
            label={getTriggerText()} 
            size="small" 
            variant="outlined"
            sx={{ mb: 1 }}
          />
        </Box>
        
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="subtitle2" gutterBottom>
            Conditions:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {getConditionsText()}
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Actions:
          </Typography>
          <Chip 
            icon={<DevicesIcon />} 
            label={getActionsText()} 
            size="small" 
            color="primary"
            variant="outlined"
          />
        </Box>
        
        {rule.lastTriggered && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Last triggered: {formatTimeAgo(rule.lastTriggered)}
            </Typography>
          </Box>
        )}
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Box>
          <Tooltip title="Edit rule">
            <IconButton size="small" onClick={() => onEdit(rule)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Duplicate rule">
            <IconButton size="small" onClick={() => onDuplicate(rule)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete rule">
            <IconButton size="small" onClick={() => onDelete(rule)} color="error">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => onView(rule)}
        >
          Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default RuleCard;