/*  */const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const { createCalendarEvent, getCalendarEvents, oauth2Client } = require('./googleCalendar');
const { sendAppointmentConfirmation } = require('./emailService');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Initialize Google Calendar API
let calendar;

// Function to initialize calendar
const initializeCalendar = async () => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: 'credentials.json',
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    
    const client = await auth.getClient();
    calendar = google.calendar({ version: 'v3', auth: client });
  } catch (error) {
    console.error('Error initializing calendar:', error);
  }
};

// Initialize calendar when server starts
initializeCalendar();

// Google Calendar OAuth endpoints
app.get('/auth/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar']
  });
  res.redirect(authUrl);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Store tokens in memory (you might want to store these in a database in production)
    global.googleTokens = tokens;
    
    // Redirect back to the frontend with success parameter using port 5174
    res.redirect('http://localhost:5174?calendar=connected');
  } catch (error) {
    console.error('Error getting tokens:', error);
    // Redirect back to frontend with error parameter using port 5174
    res.redirect('http://localhost:5174?calendar=error');
  }
});

// Business hours configuration
const BUSINESS_HOURS = {
  weekday: {
    start: 15, // 3 PM
    end: 19    // 7 PM
  },
  weekend: {
    start: 9,  // 9 AM
    end: 19    // 7 PM
  }
};

// Function to check if a time slot is available
async function isTimeSlotAvailable(date, startTime, endTime) {
  const events = await calendar.events.list({
    calendarId: 'primary',
    timeMin: date.toISOString(),
    timeMax: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  });

  const newStart = new Date(`${date.toISOString().split('T')[0]}T${startTime}`);
  const newEnd = new Date(`${date.toISOString().split('T')[0]}T${endTime}`);

  return !events.data.some(event => {
    const eventStart = new Date(event.start.dateTime || event.start.date);
    const eventEnd = new Date(event.end.dateTime || event.end.date);
    return (newStart >= eventStart && newStart < eventEnd) ||
           (newEnd > eventStart && newEnd <= eventEnd) ||
           (newStart <= eventStart && newEnd >= eventEnd);
  });
}

// Function to validate business hours
function validateBusinessHours(date, startTime, endTime) {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const hours = isWeekend ? BUSINESS_HOURS.weekend : BUSINESS_HOURS.weekday;
  
  const startHour = parseInt(startTime.split(':')[0]);
  const endHour = parseInt(endTime.split(':')[0]);

  return startHour >= hours.start && endHour <= hours.end;
}

// Add endpoint to get available time slots
app.get('/api/calendar/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hours = isWeekend ? BUSINESS_HOURS.weekend : BUSINESS_HOURS.weekday;

    // Get existing events for the day
    const events = await calendar.events.list({
      calendarId: 'primary',
      timeMin: selectedDate.toISOString(),
      timeMax: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      singleEvents: true,
      orderBy: 'startTime'
    });

    // Generate available time slots
    const availableSlots = [];
    for (let hour = hours.start; hour < hours.end; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      const isAvailable = await isTimeSlotAvailable(selectedDate, startTime, endTime);
      if (isAvailable) {
        availableSlots.push({ startTime, endTime });
      }
    }

    res.json({ availableSlots });
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ error: 'Failed to get available slots' });
  }
});

// Update the POST /api/calendar/events endpoint
app.post('/api/calendar/events', async (req, res) => {
  try {
    const { name, phone, email, date, startTime, endTime, service } = req.body;
    
    // Validate business hours
    if (!validateBusinessHours(new Date(date), startTime, endTime)) {
      return res.status(400).json({ 
        error: 'Appointment time is outside of business hours' 
      });
    }

    // Check for double booking
    const isAvailable = await isTimeSlotAvailable(new Date(date), startTime, endTime);
    if (!isAvailable) {
      return res.status(400).json({ 
        error: 'This time slot is already booked' 
      });
    }

    // Create calendar event
    const event = {
      summary: `Car Wash Appointment - ${name}`,
      description: `Service: ${service}\nPhone: ${phone}\nEmail: ${email}`,
      start: {
        dateTime: `${date}T${startTime}`,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: `${date}T${endTime}`,
        timeZone: 'America/New_York',
      },
    };

    const createdEvent = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    // Send confirmation email
    try {
      await sendConfirmationEmail(email, name, date, startTime, endTime, service);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue even if email fails
    }

    res.json({ 
      message: 'Appointment created successfully',
      event: createdEvent.data
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Get calendar events
app.get('/api/calendar/events', async (req, res) => {
  try {
    const { timeMin, timeMax } = req.query;
    const events = await getCalendarEvents(timeMin, timeMax);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch calendar events' });
  }
});

// Existing Twilio SMS endpoint
app.post('/api/sms/test', async (req, res) => {
  const { to, message } = req.body;
  try {
    await twilioClient.messages.create({
      body: message,
      to: to,
      from: process.env.TWILIO_PHONE_NUMBER
    });
    res.json({ success: true, message: 'Test SMS sent successfully' });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: 'Failed to send test SMS' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 