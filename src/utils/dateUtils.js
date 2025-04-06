// src/utils/dateUtils.js

/**
 * Format a date string based on the specified period
 * @param {string} dateString - ISO date string
 * @param {string} period - 'day', 'week', 'month', or 'year'
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, period = 'day') => {
    const date = new Date(dateString);
    
    switch (period) {
      case 'day':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric' });
      case 'week':
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case 'year':
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  };
  
  /**
   * Get a date range for a specific period
   * @param {string} period - 'day', 'week', 'month', or 'year'
   * @param {Date} endDate - End date of the range (defaults to now)
   * @returns {Object} Object with startDate and endDate as ISO strings
   */
  export const getDateRange = (period, endDate = new Date()) => {
    const end = new Date(endDate);
    const start = new Date(end);
    
    switch (period) {
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        break;
      case 'month':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'year':
        start.setFullYear(end.getFullYear() - 1);
        break;
      default:
        start.setDate(end.getDate() - 30); // Default to 30 days
    }
    
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    };
  };
  
  /**
   * Format a date to a relative time string (e.g., "5 minutes ago")
   * @param {string} dateString - ISO date string
   * @returns {string} Relative time string
   */
  export const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    // Less than a minute
    if (seconds < 60) {
      return seconds === 1 ? '1 second ago' : `${seconds} seconds ago`;
    }
    
    // Less than an hour
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    }
    
    // Less than a day
    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    
    // Less than a week
    const days = Math.floor(hours / 24);
    if (days < 7) {
      return days === 1 ? 'Yesterday' : `${days} days ago`;
    }
    
    // Less than a month
    if (days < 30) {
      const weeks = Math.floor(days / 7);
      return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
    }
    
    // Less than a year
    const months = Math.floor(days / 30);
    if (months < 12) {
      return months === 1 ? '1 month ago' : `${months} months ago`;
    }
    
    // More than a year
    const years = Math.floor(months / 12);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  };
  
  /**
   * Get the current day of the week
   * @returns {string} Day of the week ('Monday', 'Tuesday', etc.)
   */
  export const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };
  
  /**
   * Check if the current day is a weekday (Monday-Friday)
   * @returns {boolean} True if weekday, false if weekend
   */
  export const isWeekday = () => {
    const day = new Date().getDay();
    return day >= 1 && day <= 5;
  };
  
  /**
   * Format a time string (HH:MM) from a Date object
   * @param {Date} date - Date object
   * @returns {string} Formatted time string (e.g., "14:30")
   */
  export const formatTime = (date) => {
    if (!date) return '';
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  };
  
  /**
   * Parse a time string (HH:MM) into a Date object
   * @param {string} timeString - Time string (e.g., "14:30")
   * @returns {Date} Date object with the specified time
   */
  export const parseTime = (timeString) => {
    if (!timeString) return new Date();
    
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    
    date.setHours(hours || 0);
    date.setMinutes(minutes || 0);
    date.setSeconds(0);
    date.setMilliseconds(0);
    
    return date;
  };
  
  /**
   * Get the current date formatted as YYYY-MM-DD
   * @returns {string} Formatted date string
   */
  export const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };
  
  /**
   * Calculate the difference in days between two dates
   * @param {string|Date} date1 - First date
   * @param {string|Date} date2 - Second date (defaults to current date)
   * @returns {number} Number of days difference
   */
  export const daysBetween = (date1, date2 = new Date()) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Reset time portion for accurate day calculation
    d1.setHours(0, 0, 0, 0);
    d2.setHours(0, 0, 0, 0);
    
    // Calculate difference in milliseconds and convert to days
    const diffTime = Math.abs(d2 - d1);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };