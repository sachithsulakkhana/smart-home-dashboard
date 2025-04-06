// src/components/dashboard/DashboardHome.js
import React, { useEffect, useState } from 'react';
import { 
  Grid, Paper, Typography, Box, Card, CardContent, 
  Divider, CircularProgress, Button
} from '@mui/material';
import { 
  Line, 
  Doughnut 
} from 'react-chartjs-2';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import VideocamIcon from '@mui/icons-material/Videocam';
import PowerIcon from '@mui/icons-material/Power';
import DeviceCard from '../devices/DeviceCard';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Mock data - in real application, this would come from an API
const mockStats = {
  activeDevices: 8,
  totalDevices: 12,
  energyUsage: 34.2, // kWh
  tempAverage: 72, // °F
  securityStatus: 'Secure'
};

const mockDevices = [
  { id: 1, name: 'Living Room Light', type: 'light', location: 'Living Room', isOn: true, brightness: 80, status: 'online' },
  { id: 2, name: 'Kitchen Light', type: 'light', location: 'Kitchen', isOn: false, brightness: 100, status: 'online' },
  { id: 3, name: 'Main Thermostat', type: 'thermostat', location: 'Hallway', isOn: true, temperature: 72, status: 'online' },
  { id: 4, name: 'Front Door Camera', type: 'security', location: 'Front Door', isOn: true, armed: true, status: 'online' }
];

// Mock energy data
const energyData = {
  labels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm'],
  datasets: [
    {
      label: 'Energy Usage (kWh)',
      data: [2.1, 1.8, 1.5, 2.3, 3.2, 3.5, 4.2, 3.8],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.4,
    },
    {
      label: 'Predicted Usage',
      data: [2.1, 1.8, 1.5, 2.3, 3.2, 3.5, 4.8, 5.2],
      borderColor: 'rgba(153, 102, 255, 1)',
      backgroundColor: 'rgba(153, 102, 255, 0.2)',
      borderDash: [5, 5],
      tension: 0.4,
    }
  ],
};

// Mock device usage breakdown
const deviceUsageData = {
  labels: ['Lighting', 'Climate', 'Security', 'Other'],
  datasets: [
    {
      data: [42, 28, 18, 12],
      backgroundColor: [
        'rgba(255, 206, 86, 0.7)',
        'rgba(75, 192, 192, 0.7)',
        'rgba(153, 102, 255, 0.7)',
        'rgba(255, 99, 132, 0.7)',
      ],
      borderColor: [
        'rgba(255, 206, 86, 1)',
        'rgba(75, 192, 192, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 99, 132, 1)',
      ],
      borderWidth: 1,
    },
  ],
};

const StatCard = ({ icon, title, value, color }) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            mr: 2
          }}
        >
          {icon}
        </Box>
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
        {value}
      </Typography>
    </CardContent>
  </Card>
);

function DashboardHome() {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Simulating API calls
  useEffect(() => {
    // In a real app, these would be API calls
    const fetchData = async () => {
      try {
        // Simulate network latency
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setDevices(mockDevices);
        setStats(mockStats);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleDeviceToggle = (deviceId) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === deviceId 
          ? { ...device, isOn: !device.isOn } 
          : device
      )
    );
  };
  
  const handleDeviceValueChange = (deviceId, property, value) => {
    setDevices(prevDevices => 
      prevDevices.map(device => 
        device.id === deviceId 
          ? { ...device, [property]: value } 
          : device
      )
    );
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard Overview
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<PowerIcon sx={{ color: 'warning.main' }} />}
            title="Energy Usage"
            value={`${stats.energyUsage} kWh`}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<LightbulbIcon sx={{ color: 'success.main' }} />}
            title="Active Devices"
            value={`${stats.activeDevices}/${stats.totalDevices}`}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<ThermostatIcon sx={{ color: 'info.main' }} />}
            title="Avg. Temperature"
            value={`${stats.tempAverage}°F`}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard 
            icon={<VideocamIcon sx={{ color: 'primary.main' }} />}
            title="Security Status"
            value={stats.securityStatus}
            color="primary"
          />
        </Grid>
      </Grid>
      
      {/* Energy Charts */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Energy Consumption (24 hours)
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              View and analyze your home's energy usage patterns
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ height: 300 }}>
              <Line 
                data={energyData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      mode: 'index',
                      intersect: false,
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'kWh'
                      }
                    }
                  }
                }}
              />
            </Box>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small">
                View Details
              </Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Device Usage Breakdown
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Distribution of energy consumption by device category
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ height: 250, width: '100%', maxWidth: 250 }}>
                <Doughnut
                  data={deviceUsageData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      }
                    },
                    cutout: '70%'
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Quick Access Devices */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Quick Access Devices
      </Typography>
      <Grid container spacing={3}>
        {devices.map(device => (
          <Grid item xs={12} sm={6} md={3} key={device.id}>
            <DeviceCard 
              device={device} 
              onToggle={handleDeviceToggle}
              onValueChange={handleDeviceValueChange}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default DashboardHome;