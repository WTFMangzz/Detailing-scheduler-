import React, { useState } from 'react';
import { Box, Container, Typography, Tabs, Tab, Paper } from '@mui/material';
import BookingForm from './components/BookingForm';
import AppointmentsList from './components/AppointmentsList';
import TestSMS from './components/TestSMS';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleTabChange = (_: unknown, newValue: number) => {
    if (newValue === 1 && !isAuthenticated) {
      const password = prompt('Please enter the admin password:');
      if (password === 'admin123') {
        setIsAuthenticated(true);
        setTabValue(newValue);
      } else {
        alert('Invalid password');
      }
    } else {
      setTabValue(newValue);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          EJ's Auto Detailing
        </Typography>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Book Appointment" />
            <Tab label="View Appointments" />
            <Tab label="Test SMS" />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <BookingForm />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {isAuthenticated ? (
            <AppointmentsList />
          ) : (
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography align="center">
                Please enter the admin password to view appointments.
              </Typography>
            </Paper>
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <TestSMS />
        </TabPanel>
      </Box>
    </Container>
  );
}

export default App; 