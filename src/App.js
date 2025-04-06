// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Snackbar, Alert } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';

// Components
import DashboardLayout from './components/dashboard/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';

// Features
import { fetchDevices } from './features/devices/devicesSlice';

// Services
import iotService from './services/iot.js';

// Styles
import './App.css';

// Create a theme instance
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
        },
      },
    },
  },
});

function App() {
  const dispatch = useDispatch();
  const [notification, setNotification] = React.useState({
    open: false,
    message: '',
    severity: 'info',
  });

  // Initialize IoT service and fetch initial data
  useEffect(() => {
    console.log('Initializing application...');
    
    // Initialize IoT service
    iotService.initialize()
      .then(() => {
        console.log('IoT Service initialized successfully');
        // Fetch devices after IoT service is initialized
        dispatch(fetchDevices());
      })
      .catch(error => {
        console.error('Failed to initialize IoT service:', error);
        showNotification('Failed to connect to IoT service. Some features may not work.', 'error');
      });

    // Subscribe to security alerts
    const unsubscribeAlerts = iotService.onMessage('security_alert', (alert) => {
      showNotification(`${alert.message}`, 'warning');
    });

    // Subscribe to anomaly detections
    const unsubscribeAnomalies = iotService.onMessage('anomaly_detected', (anomaly) => {
      showNotification(`${anomaly.message}`, 'error');
    });

    // Subscribe to rule triggers
    const unsubscribeRules = iotService.onMessage('rule_triggered', (data) => {
      showNotification(`Automation rule triggered`, 'info');
    });

    // Clean up on unmount
    return () => {
      console.log('Cleaning up application...');
      iotService.disconnect();
      unsubscribeAlerts();
      unsubscribeAnomalies();
      unsubscribeRules();
    };
  }, [dispatch]);

  // Function to show notifications
  const showNotification = (message, severity = 'info') => {
    setNotification({
      open: true,
      message,
      severity,
    });
  };

  // Handle notification close
  const handleNotificationClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setNotification(prev => ({ ...prev, open: false }));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            {/* Add more routes as you develop other sections */}
            <Route path="*" element={<DashboardHome />} />
          </Routes>
        </DashboardLayout>
      </Router>
      
      {/* Global notification system */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleNotificationClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleNotificationClose} 
          severity={notification.severity} 
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;