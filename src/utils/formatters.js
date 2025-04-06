// src/utils/formatters.js

/**
 * Format a number as a dollar amount
 * @param {number} value - The value to format
 * @param {boolean} includeSymbol - Whether to include the dollar sign
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, includeSymbol = true) => {
    if (value === undefined || value === null) return '';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: includeSymbol ? 'currency' : 'decimal',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    
    return formatter.format(value);
  };
  
  /**
   * Format a number as an energy value (kWh)
   * @param {number} value - The value to format
   * @param {boolean} includeUnit - Whether to include the unit
   * @returns {string} Formatted energy string
   */
  export const formatEnergy = (value, includeUnit = true) => {
    if (value === undefined || value === null) return '';
    
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
    
    return includeUnit ? `${formatter.format(value)} kWh` : formatter.format(value);
  };
  
  /**
   * Format a number as a percentage
   * @param {number} value - The value to format (0-100)
   * @param {boolean} includeSymbol - Whether to include the percent symbol
   * @returns {string} Formatted percentage string
   */
  export const formatPercentage = (value, includeSymbol = true) => {
    if (value === undefined || value === null) return '';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: includeSymbol ? 'percent' : 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    // Convert to decimal for percentage formatting
    return includeSymbol ? formatter.format(value / 100) : formatter.format(value);
  };
  
  /**
   * Format a temperature value
   * @param {number} value - The temperature value
   * @param {string} unit - The unit ('F' or 'C')
   * @returns {string} Formatted temperature string
   */
  export const formatTemperature = (value, unit = 'F') => {
    if (value === undefined || value === null) return '';
    
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    return `${formatter.format(value)}°${unit}`;
  };
  
  /**
   * Format a file size
   * @param {number} bytes - The file size in bytes
   * @returns {string} Formatted file size string
   */
  export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    if (bytes === undefined || bytes === null) return '';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  /**
   * Truncate a string to a certain length and add ellipsis if necessary
   * @param {string} str - The string to truncate
   * @param {number} length - The maximum length
   * @returns {string} Truncated string
   */
  export const truncateString = (str, length = 50) => {
    if (!str) return '';
    
    if (str.length <= length) return str;
    
    return `${str.substring(0, length)}...`;
  };
  
  /**
   * Format a device name to be more readable
   * @param {string} name - The device name
   * @returns {string} Formatted device name
   */
  export const formatDeviceName = (name) => {
    if (!name) return '';
    
    // Remove underscores and hyphens
    let formattedName = name.replace(/[_-]/g, ' ');
    
    // Capitalize first letter of each word
    formattedName = formattedName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return formattedName;
  };
  
  /**
   * Format a status string to be more readable
   * @param {string} status - The status string
   * @returns {string} Formatted status
   */
  export const formatStatus = (status) => {
    if (!status) return '';
    
    const statusMap = {
      'on': 'On',
      'off': 'Off',
      'online': 'Online',
      'offline': 'Offline',
      'connected': 'Connected',
      'disconnected': 'Disconnected',
      'locked': 'Locked',
      'unlocked': 'Unlocked',
      'open': 'Open',
      'closed': 'Closed',
      'active': 'Active',
      'inactive': 'Inactive',
      'error': 'Error',
      'warning': 'Warning'
    };
    
    return statusMap[status.toLowerCase()] || status;
  };
  
  /**
   * Format a number with commas for thousands
   * @param {number} value - The number to format
   * @returns {string} Formatted number
   */
  export const formatNumber = (value) => {
    if (value === undefined || value === null) return '';
    
    return new Intl.NumberFormat('en-US').format(value);
  };
  
  /**
   * Format a duration in seconds to a readable time string
   * @param {number} seconds - The duration in seconds
   * @returns {string} Formatted duration string
   */
  export const formatDuration = (seconds) => {
    if (seconds === undefined || seconds === null) return '';
    
    if (seconds < 60) {
      return `${seconds} sec`;
    }
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }
    
    return `${hours} hr ${remainingMinutes} min`;
  };
  
  /**
   * Format a boolean value as Yes/No
   * @param {boolean} value - The boolean value
   * @returns {string} 'Yes' or 'No'
   */
  export const formatYesNo = (value) => {
    return value ? 'Yes' : 'No';
  };