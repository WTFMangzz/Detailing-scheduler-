const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

const formatDate = (date) => {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const sendAppointmentConfirmation = async (appointmentDetails) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    startTime,
    serviceName
  } = appointmentDetails;

  const emailContent = `
    <h2>Appointment Confirmation</h2>
    <p>Dear ${customerName},</p>
    <p>Your appointment has been successfully scheduled at EJ's Auto Detail.</p>
    
    <h3>Appointment Details:</h3>
    <ul>
      <li><strong>Service:</strong> ${serviceName}</li>
      <li><strong>Date & Time:</strong> ${formatDate(startTime)}</li>
      <li><strong>Phone:</strong> ${customerPhone}</li>
    </ul>
    
    <p>If you need to reschedule or cancel your appointment, please contact us at least 24 hours in advance.</p>
    
    <p>Thank you for choosing EJ's Auto Detail!</p>
    
    <p style="color: #666; font-size: 0.9em;">
      This is an automated message. Please do not reply to this email.
    </p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: customerEmail,
    subject: 'Appointment Confirmation - EJ\'s Auto Detail',
    html: emailContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation email sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending confirmation email:', error);
    return false;
  }
};

module.exports = {
  sendAppointmentConfirmation
}; 