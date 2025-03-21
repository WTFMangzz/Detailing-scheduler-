import React, { useState } from 'react';
import {
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Typography,
  Box,
} from '@mui/material';

interface Appointment {
  id: string;
  service: string;
  date: string;
  time: string;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
}

const services = [
  { name: 'Exterior Detail', duration: 1.5 },
  { name: 'Interior and Exterior Detail', duration: 3 },
];

const BookingForm: React.FC = () => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !customerName || !customerPhone || !customerEmail) {
      alert('Please fill in all fields');
      return;
    }

    const appointment: Appointment = {
      id: Date.now().toString(),
      service: selectedService,
      date: selectedDate,
      time: selectedTime,
      customer: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
      },
    };

    const savedAppointments = localStorage.getItem('appointments');
    const appointments = savedAppointments ? JSON.parse(savedAppointments) : [];
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));

    // Reset form
    setSelectedService('');
    setSelectedDate('');
    setSelectedTime('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');

    alert('Appointment booked successfully!');
  };

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Generate time slots based on service duration
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const selectedServiceObj = services.find(s => s.name === selectedService);
    
    if (!selectedServiceObj) return [];

    for (let hour = startHour; hour <= endHour - selectedServiceObj.duration; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
    }

    return slots;
  };

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Book an Appointment
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Service</InputLabel>
              <Select
                value={selectedService}
                label="Service"
                onChange={(e) => setSelectedService(e.target.value)}
                required
              >
                {services.map((service) => (
                  <MenuItem key={service.name} value={service.name}>
                    {service.name} ({service.duration} hours)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              type="date"
              label="Date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: today }}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Time</InputLabel>
              <Select
                value={selectedTime}
                label="Time"
                onChange={(e) => setSelectedTime(e.target.value)}
                required
                disabled={!selectedService || !selectedDate}
              >
                {generateTimeSlots().map((time) => (
                  <MenuItem key={time} value={time}>
                    {time}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone Number"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end">
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!selectedService || !selectedDate || !selectedTime || !customerName || !customerPhone || !customerEmail}
              >
                Book Appointment
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default BookingForm; 