// src/services/SmartHomeService.js
import axios from 'axios';

// Base URL for your API - change this to match your backend API URL
const API_BASE_URL = 'https://localhost:44355/api';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Service class to handle all data fetching
class SmartHomeService {
  // Get dashboard overview data
  async getDashboardData() {
    try {
      const response = await apiClient.get('/dashboard');
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  // Get all devices
  async getAllDevices() {
    try {
      const response = await apiClient.get('/devices');
      return response.data;
    } catch (error) {
      console.error('Error fetching devices:', error);
      throw error;
    }
  }
  
  // Toggle device status (on/off)
  async toggleDevice(deviceId, isActive) {
    try {
      const response = await apiClient.put(`/devices/${deviceId}`, {
        isActive: isActive
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling device ${deviceId}:`, error);
      throw error;
    }
  }
  
  // Get energy history for a specific device
  async getDeviceEnergyHistory(deviceId, timeRange = 'day') {
    try {
      const response = await apiClient.get(`/devices/${deviceId}/history`, {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching history for device ${deviceId}:`, error);
      throw error;
    }
  }
  
  // Get energy summary by time period
  async getEnergySummary(period = 'daily') {
    try {
      const response = await apiClient.get('/energy/summary', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching energy summary:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export default new SmartHomeService();