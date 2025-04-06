// src/components/automation/RuleForm.js
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Divider,
  Chip,
  FormControlLabel,
  Switch,
  Grid,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  Alert,
  useTheme
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllDevices } from '../../features/devices/devicesSlice';
import { createAutomationRule, updateRule } from '../../features/automation/automationSlice';

/**
 * Component for creating or editing automation rules
 * 
 * @param {Object} props Component props
 * @param {Object} props.rule Optional rule object for editing (null for new rule)
 * @param {Function} props.onSave Function to call on successful save
 * @param {Function} props.onCancel Function to call when user cancels
 */
const RuleForm = ({ rule = null, onSave, onCancel }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const devices = useSelector(selectAllDevices);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
    trigger: {
      type: 'time',
      value: '',
    },
    conditions: [],
    actions: []
  });
  
  const [errors, setErrors] = useState({});
  const [showConditionDialog, setShowConditionDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [currentCondition, setCurrentCondition] = useState({ type: 'presence', value: 'home' });
  const [currentAction, setCurrentAction] = useState({ type: 'device', deviceId: '', command: 'turnOn', value: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load rule data if editing
  useEffect(() => {
    if (rule) {
      setFormData({
        id: rule.id,
        name: rule.name || '',
        description: rule.description || '',
        active: rule.active !== undefined ? rule.active : true,
        trigger: rule.trigger || { type: 'time', value: '' },
        conditions: rule.conditions || [],
        actions: rule.actions || []
      });
    }
  }, [rule]);
  
  // Handle basic form field changes
  const handleChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'active') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error for this field if exists
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };
  
  // Handle trigger changes
  const handleTriggerChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        [name]: value
      }
    }));
    
    // Clear error for trigger if exists
    if (errors.trigger) {
      setErrors(prev => ({ ...prev, trigger: null }));
    }
  };
  
  // Condition dialog handlers
  const openConditionDialog = () => {
    setCurrentCondition({ type: 'presence', value: 'home' });
    setShowConditionDialog(true);
  };
  
  const closeConditionDialog = () => {
    setShowConditionDialog(false);
  };
  
  const handleConditionTypeChange = (e) => {
    const type = e.target.value;
    let defaultValue = '';
    
    // Set default values based on condition type
    switch (type) {
      case 'presence':
        defaultValue = 'home';
        break;
      case 'day':
        defaultValue = 'weekday';
        break;
      case 'weather':
        defaultValue = 'sunny';
        break;
      case 'device':
        defaultValue = devices.length > 0 ? { deviceId: devices[0].id, state: 'on' } : { deviceId: '', state: 'on' };
        break;
      default:
        defaultValue = '';
    }
    
    setCurrentCondition({ type, value: defaultValue });
  };
  
  const handleConditionValueChange = (e) => {
    setCurrentCondition(prev => ({
      ...prev,
      value: e.target.value
    }));
  };
  
  const handleAddCondition = () => {
    // Add device name for better display if condition type is device
    let condition = { ...currentCondition };
    if (condition.type === 'device' && condition.value.deviceId) {
      const device = devices.find(d => d.id === condition.value.deviceId);
      if (device) {
        condition.deviceName = device.name;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      conditions: [...prev.conditions, condition]
    }));
    
    closeConditionDialog();
    
    // Clear condition error if exists
    if (errors.conditions) {
      setErrors(prev => ({ ...prev, conditions: null }));
    }
  };
  
  const handleRemoveCondition = (index) => {
    setFormData(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };
  
  // Action dialog handlers
  const openActionDialog = () => {
    setCurrentAction({ 
      type: 'device', 
      deviceId: devices.length > 0 ? devices[0].id : '',
      command: 'turnOn',
      value: null
    });
    setShowActionDialog(true);
  };
  
  const closeActionDialog = () => {
    setShowActionDialog(false);
  };
  
  const handleActionTypeChange = (e) => {
    const type = e.target.value;
    let defaultAction = {};
    
    // Set default values based on action type
    switch (type) {
      case 'device':
        defaultAction = {
          deviceId: devices.length > 0 ? devices[0].id : '',
          command: 'turnOn',
          value: null
        };
        break;
      case 'scene':
        defaultAction = {
          sceneId: 'allOff',
        };
        break;
      case 'notification':
        defaultAction = {
          message: 'Automation rule triggered',
          priority: 'normal'
        };
        break;
      default:
        defaultAction = {};
    }
    
    setCurrentAction({ type, ...defaultAction });
  };
  
  const handleActionValueChange = (e) => {
    const { name, value } = e.target;
    setCurrentAction(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddAction = () => {
    // Add device name for better display if action type is device
    let action = { ...currentAction };
    if (action.type === 'device' && action.deviceId) {
      const device = devices.find(d => d.id === action.deviceId);
      if (device) {
        action.deviceName = device.name;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, action]
    }));
    
    closeActionDialog();
    
    // Clear action error if exists
    if (errors.actions) {
      setErrors(prev => ({ ...prev, actions: null }));
    }
  };
  
  const handleRemoveAction = (index) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }));
  };
  
  // Form validation
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    // Validate trigger
    if (!formData.trigger.type) {
      newErrors.trigger = 'Trigger type is required';
    } else if (!formData.trigger.value) {
      newErrors.trigger = 'Trigger value is required';
    }
    
    // Validate actions
    if (formData.actions.length === 0) {
      newErrors.actions = 'At least one action is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Dispatch create or update action
      if (rule && rule.id) {
        // Update existing rule
        await dispatch(updateRule(formData)).unwrap();
      } else {
        // Create new rule
        await dispatch(createAutomationRule(formData)).unwrap();
      }
      
      onSave();
    } catch (error) {
      console.error('Failed to save rule:', error);
      setErrors(prev => ({ 
        ...prev, 
        submit: 'Failed to save rule. Please try again.' 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {rule ? 'Edit Automation Rule' : 'Create New Automation Rule'}
      </Typography>
      
      <Divider sx={{ my: 2 }} />
      
      {errors.submit && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errors.submit}
        </Alert>
      )}
      
      <Box component="form" onSubmit={handleSubmit} noValidate>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            
            <TextField
              name="name"
              label="Rule Name"
              value={formData.name}
              onChange={handleChange}
              fullWidth
              margin="normal"
              error={!!errors.name}
              helperText={errors.name}
              required
            />
            
            <TextField
              name="description"
              label="Description"
              value={formData.description}
              onChange={handleChange}
              fullWidth
              margin="normal"
              multiline
              rows={2}
            />
            
            <FormControlLabel
              control={
                <Switch
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Active"
              sx={{ mt: 1 }}
            />
          </Grid>
          
          {/* Trigger */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Trigger
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.trigger}>
                  <InputLabel id="trigger-type-label">Trigger Type</InputLabel>
                  <Select
                    labelId="trigger-type-label"
                    name="type"
                    value={formData.trigger.type}
                    onChange={handleTriggerChange}
                    label="Trigger Type"
                  >
                    <MenuItem value="time">Time</MenuItem>
                    <MenuItem value="presence">Presence</MenuItem>
                    <MenuItem value="device">Device State</MenuItem>
                  </Select>
                  {errors.trigger && <FormHelperText>{errors.trigger}</FormHelperText>}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                {formData.trigger.type === 'time' && (
                  <FormControl fullWidth>
                    <InputLabel id="time-value-label">Time</InputLabel>
                    <Select
                      labelId="time-value-label"
                      name="value"
                      value={formData.trigger.value}
                      onChange={handleTriggerChange}
                      label="Time"
                    >
                      <MenuItem value="sunrise">Sunrise</MenuItem>
                      <MenuItem value="sunset">Sunset</MenuItem>
                      <MenuItem value="07:00">7:00 AM</MenuItem>
                      <MenuItem value="08:00">8:00 AM</MenuItem>
                      <MenuItem value="17:00">5:00 PM</MenuItem>
                      <MenuItem value="22:00">10:00 PM</MenuItem>
                    </Select>
                  </FormControl>
                )}
                
                {formData.trigger.type === 'presence' && (
                  <FormControl fullWidth>
                    <InputLabel id="presence-value-label">Status</InputLabel>
                    <Select
                      labelId="presence-value-label"
                      name="value"
                      value={formData.trigger.value}
                      onChange={handleTriggerChange}
                      label="Status"
                    >
                      <MenuItem value="home">Someone arrives home</MenuItem>
                      <MenuItem value="away">Everyone leaves</MenuItem>
                    </Select>
                  </FormControl>
                )}
                
                {formData.trigger.type === 'device' && (
                  <FormControl fullWidth>
                    <InputLabel id="device-value-label">Device</InputLabel>
                    <Select
                      labelId="device-value-label"
                      name="value"
                      value={formData.trigger.value || ''}
                      onChange={handleTriggerChange}
                      label="Device"
                    >
                      {devices.map(device => (
                        <MenuItem key={device.id} value={device.id}>
                          {device.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Grid>
            </Grid>
          </Grid>
          
          {/* Conditions */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Conditions
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={openConditionDialog}
                size="small"
              >
                Add Condition
              </Button>
            </Box>
            
            {errors.conditions && (
              <FormHelperText error sx={{ mt: -1, mb: 2 }}>
                {errors.conditions}
              </FormHelperText>
            )}
            
            {formData.conditions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No conditions added. Rule will always execute when triggered.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {formData.conditions.map((condition, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2">
                            {condition.type.charAt(0).toUpperCase() + condition.type.slice(1)}
                          </Typography>
                          
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveCondition(index)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {condition.type === 'presence' && (
                            condition.value === 'home' ? 'Someone is home' : 'No one is home'
                          )}
                          {condition.type === 'day' && (
                            condition.value === 'weekday' ? 'On weekdays' : 'On weekends'
                          )}
                          {condition.type === 'weather' && (
                            `Weather is ${condition.value}`
                          )}
                          {condition.type === 'device' && condition.deviceName && (
                            `${condition.deviceName} is ${condition.value?.state || 'on'}`
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
          
          {/* Actions */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Actions
              </Typography>
              
              <Button
                variant="outlined"
                startIcon={<AddCircleOutlineIcon />}
                onClick={openActionDialog}
                size="small"
              >
                Add Action
              </Button>
            </Box>
            
            {errors.actions && (
              <FormHelperText error sx={{ mt: -1, mb: 2 }}>
                {errors.actions}
              </FormHelperText>
            )}
            
            {formData.actions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                No actions added. Add at least one action for this rule.
              </Typography>
            ) : (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {formData.actions.map((action, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined" sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="subtitle2">
                            {action.type.charAt(0).toUpperCase() + action.type.slice(1)}
                          </Typography>
                          
                          <IconButton 
                            size="small" 
                            sx={{ color: 'white' }}
                            onClick={() => handleRemoveAction(index)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        
                        <Typography variant="body2" sx={{ mt: 1, color: 'rgba(255, 255, 255, 0.8)' }}>
                          {action.type === 'device' && action.deviceName && (
                            `${action.command === 'turnOn' ? 'Turn on' : 
                              action.command === 'turnOff' ? 'Turn off' : 
                              action.command === 'setLevel' ? `Set level to ${action.value}%` : 
                              action.command} ${action.deviceName}`
                          )}
                          {action.type === 'scene' && (
                            `Activate scene: ${action.sceneName || action.sceneId}`
                          )}
                          {action.type === 'notification' && (
                            `Send notification: ${action.message || 'Rule triggered'}`
                          )}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Grid>
          
          {/* Form Actions */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={onCancel}
                startIcon={<CancelIcon />}
              >
                Cancel
              </Button>
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                disabled={isSubmitting}
              >
                {rule ? 'Update Rule' : 'Create Rule'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
      
      {/* Condition Dialog */}
      <Dialog open={showConditionDialog} onClose={closeConditionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Condition</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="condition-type-label">Condition Type</InputLabel>
                <Select
                  labelId="condition-type-label"
                  value={currentCondition.type}
                  onChange={handleConditionTypeChange}
                  label="Condition Type"
                >
                  <MenuItem value="presence">Presence</MenuItem>
                  <MenuItem value="day">Day of Week</MenuItem>
                  <MenuItem value="weather">Weather</MenuItem>
                  <MenuItem value="device">Device State</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              {currentCondition.type === 'presence' && (
                <FormControl fullWidth>
                  <InputLabel id="presence-condition-label">Status</InputLabel>
                  <Select
                    labelId="presence-condition-label"
                    value={currentCondition.value}
                    onChange={handleConditionValueChange}
                    label="Status"
                  >
                    <MenuItem value="home">Someone is home</MenuItem>
                    <MenuItem value="away">No one is home</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              {currentCondition.type === 'day' && (
                <FormControl fullWidth>
                  <InputLabel id="day-condition-label">Day</InputLabel>
                  <Select
                    labelId="day-condition-label"
                    value={currentCondition.value}
                    onChange={handleConditionValueChange}
                    label="Day"
                  >
                    <MenuItem value="weekday">Weekday</MenuItem>
                    <MenuItem value="weekend">Weekend</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              {currentCondition.type === 'weather' && (
                <FormControl fullWidth>
                  <InputLabel id="weather-condition-label">Weather</InputLabel>
                  <Select
                    labelId="weather-condition-label"
                    value={currentCondition.value}
                    onChange={handleConditionValueChange}
                    label="Weather"
                  >
                    <MenuItem value="sunny">Sunny</MenuItem>
                    <MenuItem value="cloudy">Cloudy</MenuItem>
                    <MenuItem value="rainy">Rainy</MenuItem>
                    <MenuItem value="snowy">Snowy</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              {currentCondition.type === 'device' && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="device-condition-label">Device</InputLabel>
                    <Select
                      labelId="device-condition-label"
                      value={currentCondition.value?.deviceId || ''}
                      onChange={(e) => {
                        setCurrentCondition(prev => ({
                          ...prev,
                          value: { 
                            ...prev.value, 
                            deviceId: e.target.value 
                          }
                        }));
                      }}
                      label="Device"
                    >
                      {devices.map(device => (
                        <MenuItem key={device.id} value={device.id}>
                          {device.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel id="device-state-label">State</InputLabel>
                    <Select
                      labelId="device-state-label"
                      value={currentCondition.value?.state || 'on'}
                      onChange={(e) => {
                        setCurrentCondition(prev => ({
                          ...prev,
                          value: { 
                            ...prev.value, 
                            state: e.target.value 
                          }
                        }));
                      }}
                      label="State"
                    >
                      <MenuItem value="on">On</MenuItem>
                      <MenuItem value="off">Off</MenuItem>
                      <MenuItem value="locked">Locked</MenuItem>
                      <MenuItem value="unlocked">Unlocked</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConditionDialog}>Cancel</Button>
          <Button onClick={handleAddCondition} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Action Dialog */}
      <Dialog open={showActionDialog} onClose={closeActionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Action</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="action-type-label">Action Type</InputLabel>
                <Select
                  labelId="action-type-label"
                  value={currentAction.type}
                  onChange={handleActionTypeChange}
                  label="Action Type"
                >
                  <MenuItem value="device">Control Device</MenuItem>
                  <MenuItem value="scene">Activate Scene</MenuItem>
                  <MenuItem value="notification">Send Notification</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              {currentAction.type === 'device' && (
                <>
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="action-device-label">Device</InputLabel>
                    <Select
                      labelId="action-device-label"
                      name="deviceId"
                      value={currentAction.deviceId || ''}
                      onChange={handleActionValueChange}
                      label="Device"
                    >
                      {devices.map(device => (
                        <MenuItem key={device.id} value={device.id}>
                          {device.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel id="action-command-label">Command</InputLabel>
                    <Select
                      labelId="action-command-label"
                      name="command"
                      value={currentAction.command || 'turnOn'}
                      onChange={handleActionValueChange}
                      label="Command"
                    >
                      <MenuItem value="turnOn">Turn On</MenuItem>
                      <MenuItem value="turnOff">Turn Off</MenuItem>
                      <MenuItem value="toggle">Toggle</MenuItem>
                      <MenuItem value="setLevel">Set Level</MenuItem>
                      <MenuItem value="setTemperature">Set Temperature</MenuItem>
                      <MenuItem value="lock">Lock</MenuItem>
                      <MenuItem value="unlock">Unlock</MenuItem>
                    </Select>
                  </FormControl>
                  
                  {(currentAction.command === 'setLevel' || currentAction.command === 'setTemperature') && (
                    <TextField
                      name="value"
                      label={currentAction.command === 'setLevel' ? 'Level (%)' : 'Temperature (°F)'}
                      type="number"
                      value={currentAction.value || ''}
                      onChange={handleActionValueChange}
                      fullWidth
                      InputProps={{
                        inputProps: { 
                          min: currentAction.command === 'setLevel' ? 0 : 50, 
                          max: currentAction.command === 'setLevel' ? 100 : 90
                        }
                      }}
                    />
                  )}
                </>
              )}
              
              {currentAction.type === 'scene' && (
                <FormControl fullWidth>
                  <InputLabel id="action-scene-label">Scene</InputLabel>
                  <Select
                    labelId="action-scene-label"
                    name="sceneId"
                    value={currentAction.sceneId || 'allOff'}
                    onChange={handleActionValueChange}
                    label="Scene"
                  >
                    <MenuItem value="allOff">All Off</MenuItem>
                    <MenuItem value="movieMode">Movie Mode</MenuItem>
                    <MenuItem value="morningRoutine">Morning Routine</MenuItem>
                    <MenuItem value="eveningMode">Evening Mode</MenuItem>
                    <MenuItem value="vacation">Vacation Mode</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              {currentAction.type === 'notification' && (
                <>
                  <TextField
                    name="message"
                    label="Message"
                    value={currentAction.message || ''}
                    onChange={handleActionValueChange}
                    fullWidth
                    margin="normal"
                  />
                  
                  <FormControl fullWidth sx={{ mt: 2 }}>
                    <InputLabel id="notification-priority-label">Priority</InputLabel>
                    <Select
                      labelId="notification-priority-label"
                      name="priority"
                      value={currentAction.priority || 'normal'}
                      onChange={handleActionValueChange}
                      label="Priority"
                    >
                      <MenuItem value="low">Low</MenuItem>
                      <MenuItem value="normal">Normal</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeActionDialog}>Cancel</Button>
          <Button onClick={handleAddAction} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RuleForm;