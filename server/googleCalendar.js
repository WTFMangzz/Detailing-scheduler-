const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
require('dotenv').config();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Function to ensure we have valid tokens
async function ensureValidTokens() {
  if (!global.googleTokens) {
    throw new Error('No Google Calendar tokens available. Please authenticate first.');
  }

  // Set the credentials
  oauth2Client.setCredentials(global.googleTokens);

  // Check if tokens need refresh
  if (oauth2Client.isTokenExpiring()) {
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      global.googleTokens = credentials;
      oauth2Client.setCredentials(credentials);
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh Google Calendar token');
    }
  }
}

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Function to create a calendar event
async function createCalendarEvent(eventDetails) {
  try {
    await ensureValidTokens();
    
    const event = {
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: {
        dateTime: eventDetails.startTime,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: eventDetails.endTime,
        timeZone: 'America/New_York',
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    });

    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

// Function to get calendar events
async function getCalendarEvents(timeMin, timeMax) {
  try {
    await ensureValidTokens();
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

module.exports = {
  createCalendarEvent,
  getCalendarEvents,
  oauth2Client,
}; 