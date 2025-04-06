// src/hooks/useDeviceStatus.js
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectDeviceById, updateDevice } from '../features/devices/devicesSlice';
import iotService from '../services/iot.js';

/**
 * Custom hook for subscribing to and controlling a device's status
 * @param {string} deviceId - The ID of the device to monitor and control
 * @returns {Object} - Device status and control functions
 */
const useDeviceStatus = (deviceId) => {
  const dispatch = useDispatch();
  const device = useSelector(state => selectDeviceById(state, deviceId));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(device?.lastUpdated || null);

  // Subscribe to device status updates
  useEffect(() => {
    if (!deviceId) return;

    // Initialize connection to IoT service if not already connected
    if (!iotService.isConnected) {
      iotService.initialize().catch(err => {
        console.error('Failed to initialize IoT service:', err);
        setError('Failed to connect to IoT service. Device updates may not work.');
      });
    }

    // Subscribe to device status updates
    const unsubscribe = iotService.onDeviceStatusChange(deviceId, (status) => {
      // Update the Redux store with new device status
      dispatch(updateDevice({
        id: deviceId,
        ...status,
        lastUpdated: new Date().toISOString()
      }));
      
      setLastUpdated(new Date().toISOString());
    });

    // Get initial device status if it doesn't exist in Redux store
    if (!device) {
      setIsLoading(true);
      iotService.getDeviceStatus(deviceId)
        .then(status => {
          dispatch(updateDevice({
            id: deviceId,
            ...status,
            lastUpdated: new Date().toISOString()
          }));
          setLastUpdated(new Date().toISOString());
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Failed to get device status:', err);
          setError('Failed to get device status');
          setIsLoading(false);
        });
    }

    // Clean up subscription on unmount
    return () => {
      unsubscribe();
    };
  }, [deviceId, dispatch, device]);

  /**
   * Toggle the device on/off status
   * @returns {Promise} - Resolves when the command is sent
   */
  const togglePower = async () => {
    if (!device) {
      setError('Device not found');
      return Promise.reject(new Error('Device not found'));
    }

    setIsLoading(true);
    setError(null);

    try {
      const newStatus = device.status === 'on' ? 'off' : 'on';
      const command = newStatus === 'on' ? 'turnOn' : 'turnOff';
      
      await iotService.controlDevice(deviceId, command);
      
      // Update local state optimistically
      dispatch(updateDevice({
        id: deviceId,
        status: newStatus,
        lastUpdated: new Date().toISOString()
      }));
      
      setLastUpdated(new Date().toISOString());
      setIsLoading(false);
      return Promise.resolve({ success: true });
    } catch (err) {
      console.error('Failed to toggle device power:', err);
      setError('Failed to control device');
      setIsLoading(false);
      return Promise.reject(err);
    }
  };

  /**
   * Set the device level (brightness, volume, etc.)
   * @param {number} level - The level to set (0-100)
   * @returns {Promise} - Resolves when the command is sent
   */
  const setLevel = async (level) => {
    if (!device) {
      setError('Device not found');
      return Promise.reject(new Error('Device not found'));
    }

    setIsLoading(true);
    setError(null);

    try {
      // For devices like lights, turn on if setting level > 0 and currently off
      if (level > 0 && device.status === 'off') {
        await iotService.controlDevice(deviceId, 'turnOn');
      } else if (level === 0 && device.status === 'on') {
        // Turn off if setting level to 0
        await iotService.controlDevice(deviceId, 'turnOff');
      }
      
      // Set the level
      await iotService.controlDevice(deviceId, 'setLevel', level);
      
      // Update local state optimistically
      dispatch(updateDevice({
        id: deviceId,
        level,
        status: level > 0 ? 'on' : 'off',
        lastUpdated: new Date().toISOString()
      }));
      
      setLastUpdated(new Date().toISOString());
      setIsLoading(false);
      return Promise.resolve({ success: true });
    } catch (err) {
      console.error('Failed to set device level:', err);
      setError('Failed to set device level');
      setIsLoading(false);
      return Promise.reject(err);
    }
  };

  /**
   * Set the device temperature (for thermostats)
   * @param {number} temperature - The temperature to set
   * @returns {Promise} - Resolves when the command is sent
   */
  const setTemperature = async (temperature) => {
    if (!device || device.type !== 'thermostat') {
      setError('Not a thermostat device');
      return Promise.reject(new Error('Not a thermostat device'));
    }

    setIsLoading(true);
    setError(null);

    try {
      await iotService.controlDevice(deviceId, 'setTemperature', temperature);
      
      // Update local state optimistically
      dispatch(updateDevice({
        id: deviceId,
        targetTemperature: temperature,
        lastUpdated: new Date().toISOString()
      }));
      
      setLastUpdated(new Date().toISOString());
      setIsLoading(false);
      return Promise.resolve({ success: true });
    } catch (err) {
      console.error('Failed to set temperature:', err);
      setError('Failed to set temperature');
      setIsLoading(false);
      return Promise.reject(err);
    }
  };

  /**
   * Lock or unlock a smart lock
   * @param {boolean} lock - True to lock, false to unlock
   * @returns {Promise} - Resolves when the command is sent
   */
  const setLockStatus = async (lock) => {
    if (!device || device.type !== 'lock') {
      setError('Not a lock device');
      return Promise.reject(new Error('Not a lock device'));
    }

    setIsLoading(true);
    setError(null);

    try {
      const command = lock ? 'lock' : 'unlock';
      await iotService.controlDevice(deviceId, command);
      
      // Update local state optimistically
      dispatch(updateDevice({
        id: deviceId,
        status: lock ? 'locked' : 'unlocked',
        lastUpdated: new Date().toISOString()
      }));
      
      setLastUpdated(new Date().toISOString());
      setIsLoading(false);
      return Promise.resolve({ success: true });
    } catch (err) {
      console.error('Failed to control lock:', err);
      setError('Failed to control lock');
      setIsLoading(false);
      return Promise.reject(err);
    }
  };

  return {
    device,
    isLoading,
    error,
    lastUpdated,
    togglePower,
    setLevel,
    setTemperature,
    setLockStatus,
  };
};

export default useDeviceStatus;