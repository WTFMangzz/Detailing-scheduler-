import React, { useState } from 'react';
import { Box, TextField, Button, Typography, CircularProgress, Alert } from '@mui/material';
import { sendTestSMS } from '../services/notificationService';

const TestSMS: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; error?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const formattedNumber = phoneNumber.startsWith('+1') ? phoneNumber : `+1${phoneNumber}`;
      const response = await sendTestSMS(formattedNumber);
      setResult(response);
    } catch (error) {
      setResult({ success: false, error: 'Failed to send test SMS' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" gutterBottom>
        Test SMS Notification
      </Typography>
      
      <TextField
        fullWidth
        label="Phone Number"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        placeholder="Enter phone number (e.g., 1234567890)"
        margin="normal"
        required
        disabled={loading}
      />

      <Button
        type="submit"
        variant="contained"
        fullWidth
        disabled={loading || !phoneNumber}
        sx={{ mt: 2 }}
      >
        {loading ? <CircularProgress size={24} /> : 'Send Test SMS'}
      </Button>

      {result && (
        <Alert
          severity={result.success ? 'success' : 'error'}
          sx={{ mt: 2 }}
        >
          {result.success
            ? 'Test SMS sent successfully!'
            : `Failed to send SMS: ${result.error}`}
        </Alert>
      )}
    </Box>
  );
};

export default TestSMS; 