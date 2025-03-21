const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

app.post('/api/send-sms', async (req, res) => {
  try {
    const { to, body } = req.body;
    const message = await client.messages.create({
      body,
      to,
      from: fromNumber,
    });
    console.log('SMS sent successfully:', message.sid);
    res.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/test-sms', async (req, res) => {
  try {
    const { to } = req.body;
    const message = await client.messages.create({
      body: "This is a test message from EJ's Auto Detailing scheduling system.",
      to,
      from: fromNumber,
    });
    console.log('Test SMS sent successfully:', message.sid);
    res.json({ success: true, sid: message.sid });
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 