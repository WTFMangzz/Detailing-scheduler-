import React, { useState } from 'react';
import { Box, Container, Tab, Tabs, Typography, TextField, Button, Alert, MenuItem, Select, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, AppBar, Toolbar, IconButton } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import AccountCircle from '@mui/icons-material/AccountCircle';

// Create a theme with the dark background color
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#25313A', // Updated dark blue-gray color
      paper: '#25313A',
    },
    primary: {
      main: '#90CAF9', // Light blue accent color
    },
  },
});

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

// Add this function at the top of your App component
function isWithinBusinessHours(time: string, isWeekend: boolean): boolean {
  const hour = parseInt(time.split(':')[0]);
  if (isWeekend) {
    return hour >= 9 && hour < 19; // 9 AM - 7 PM for weekends
  }
  return hour >= 15 && hour < 19; // 3 PM - 7 PM for weekdays
}

// Replace all instances of 'http://localhost:3000' with your Vercel backend URL
const API_URL = 'https://your-backend-url.vercel.app';

function App() {
  const [tabValue, setTabValue] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [appointmentDate, setAppointmentDate] = useState<Date | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [timeError, setTimeError] = useState<string>('');

  const serviceTypes = [
    { value: 'full', label: 'Interior & Exterior Detail', duration: 3 },
    { value: 'exterior', label: 'Exterior Detail', duration: 1.5 },
    { value: 'interior', label: 'Interior Detail', duration: 1.5 }
  ];

  const handleAdminLogin = () => {
    if (adminCredentials.username === 'admin' && adminCredentials.password === 'admin123') {
      setIsAdmin(true);
      setAdminLoginOpen(false);
      setAdminCredentials({ username: '', password: '' });
    } else {
      setTimeError('Invalid admin credentials');
    }
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    if (newValue === 1 && !isAuthenticated) {
      const enteredPassword = prompt('Please enter the password to view appointments:');
      if (enteredPassword === 'admin123') {
        setIsAuthenticated(true);
        setTabValue(newValue);
      } else {
        alert('Incorrect password');
        return;
      }
    } else if (newValue === 2 && !isAdmin) {
      setAdminLoginOpen(true);
      return;
    } else {
      setTabValue(newValue);
    }
  };

  const handleGoogleCalendarConnect = () => {
    window.open('http://localhost:3000/auth/google', '_blank');
  };

  // Function to fetch available time slots
  const fetchAvailableSlots = async (date: string) => {
    try {
      const response = await fetch(`${API_URL}/api/calendar/available-slots?date=${date}`);
      const data = await response.json();
      if (response.ok) {
        // setAvailableSlots(data.availableSlots);
      } else {
        setTimeError(data.error || 'Failed to fetch available slots');
      }
    } catch (error) {
      setTimeError('Failed to fetch available slots');
    }
  };

  // Function to get minimum allowed date (24 hours from now)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString().split('T')[0];
  };

  // Update handleDateChange
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const date = event.target.value;
    const minDate = getMinDate();
    
    if (date < minDate) {
      setTimeError('Please select a date at least 24 hours in advance');
      return;
    }
    
    setSelectedDate(date);
    setTimeError('');
    fetchAvailableSlots(date);
  };

  // Update handleTimeChange
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const time = event.target.value;
    if (!selectedDate) {
      setTimeError('Please select a date first');
      return;
    }
    
    const selected = new Date(selectedDate);
    const isWeekend = selected.getDay() === 0 || selected.getDay() === 6;
    
    if (!isWithinBusinessHours(time, isWeekend)) {
      setTimeError(isWeekend 
        ? 'Weekend hours are 9 AM - 7 PM' 
        : 'Weekday hours are 3 PM - 7 PM'
      );
      setSelectedTime('');
    } else {
      setTimeError('');
      setSelectedTime(time);
      setAppointmentDate(new Date(`${selectedDate}T${time}`));
    }
  };

  // Update handleSubmit
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!appointmentDate) {
      setAppointmentStatus({
        success: false,
        message: 'Please select a date and time'
      });
      return;
    }

    const selectedService = serviceTypes.find(service => service.value === serviceType);
    const duration = selectedService ? selectedService.duration : 2;

    try {
      const response = await fetch(`${API_URL}/api/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          date: selectedDate,
          startTime: selectedTime,
          endTime: new Date(appointmentDate.getTime() + duration * 60 * 60 * 1000).toISOString().split('T')[1],
          service: serviceType,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAppointmentStatus({
          success: true,
          message: 'Appointment scheduled successfully!'
        });
        // Reset form
        setCustomerName('');
        setCustomerPhone('');
        setCustomerEmail('');
        setSelectedDate('');
        setServiceType('');
        // setAvailableSlots([]);
      } else {
        setAppointmentStatus({
          success: false,
          message: data.error || 'Failed to schedule appointment'
        });
      }
    } catch (error) {
      setAppointmentStatus({
        success: false,
        message: 'Failed to schedule appointment'
      });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        color: 'text.primary',
        pt: 4 
      }}>
        <AppBar position="static" sx={{ bgcolor: 'background.paper' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              EJ's Auto Detail
            </Typography>
            {!isAdmin ? (
              <IconButton
                color="inherit"
                onClick={() => setAdminLoginOpen(true)}
              >
                <AccountCircle />
              </IconButton>
            ) : (
              <Button 
                color="inherit" 
                onClick={() => {
                  setIsAdmin(false);
                  setIsAuthenticated(true);
                }}
              >
                Logout
              </Button>
            )}
          </Toolbar>
        </AppBar>

        <Container maxWidth="md">
          <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box 
              component="img"
              src="/logo.png"
              alt="EJ's Auto Detail"
              sx={{ 
                width: '300px',
                height: 'auto',
                mb: 4,
                filter: 'brightness(1.1)'
              }}
            />

            <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: 1 }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                centered
                sx={{
                  '& .MuiTab-root': {
                    color: 'text.secondary',
                  },
                  '& .Mui-selected': {
                    color: 'primary.main',
                  },
                }}
              >
                <Tab label="Schedule Appointment" />
                <Tab label="View Appointments" />
              </Tabs>
            </Box>

            <Box sx={{ width: '100%', mt: 3, bgcolor: 'background.paper', borderRadius: 1, p: 2 }}>
              <TabPanel value={tabValue} index={0}>
                <Typography variant="h6" gutterBottom>
                  Schedule an Appointment
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Your Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Phone Number"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    fullWidth
                    required
                  />
                  <FormControl fullWidth required>
                    <InputLabel id="service-type-label">Service Type</InputLabel>
                    <Select
                      labelId="service-type-label"
                      value={serviceType}
                      label="Service Type"
                      onChange={(e) => setServiceType(e.target.value)}
                    >
                      {serviceTypes.map((service) => (
                        <MenuItem key={service.value} value={service.value}>
                          {service.label} - {service.duration} hours
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Date"
                    type="date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    inputProps={{ 
                      min: getMinDate(),
                    }}
                    helperText="Appointments must be scheduled at least 24 hours in advance"
                  />
                  <TextField
                    label="Time"
                    type="time"
                    value={selectedTime}
                    onChange={handleTimeChange}
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    helperText={timeError || (selectedDate 
                      ? new Date(selectedDate).getDay() === 0 || new Date(selectedDate).getDay() === 6 
                        ? 'Weekend hours: 9 AM - 7 PM'
                        : 'Weekday hours: 3 PM - 7 PM'
                      : 'Please select a date first'
                    )}
                    error={!!timeError}
                  />
                  <Button 
                    variant="contained" 
                    color="primary" 
                    onClick={handleSubmit}
                    fullWidth
                  >
                    Schedule Appointment
                  </Button>
                  {appointmentStatus && (
                    <Alert severity={appointmentStatus.success ? 'success' : 'error'}>
                      {appointmentStatus.message}
                    </Alert>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  Appointments
                </Typography>
                {isAdmin && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={handleGoogleCalendarConnect}
                      fullWidth
                    >
                      Connect Google Calendar
                    </Button>
                  </Box>
                )}
              </TabPanel>
            </Box>
          </Box>
        </Container>

        {/* Admin Login Dialog */}
        <Dialog open={adminLoginOpen} onClose={() => setAdminLoginOpen(false)}>
          <DialogTitle>Admin Login</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Username"
                value={adminCredentials.username}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, username: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Password"
                type="password"
                value={adminCredentials.password}
                onChange={(e) => setAdminCredentials({ ...adminCredentials, password: e.target.value })}
                fullWidth
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAdminLoginOpen(false)}>Cancel</Button>
            <Button onClick={handleAdminLogin} variant="contained" color="primary">
              Login
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

export default App; 