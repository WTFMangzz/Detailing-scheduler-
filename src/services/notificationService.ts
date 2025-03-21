const API_URL = 'http://localhost:3000';

export const sendSMS = async (to: string, body: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, body }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: 'Failed to send SMS' };
  }
};

export const sendTestSMS = async (to: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${API_URL}/api/test-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to }),
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending test SMS:', error);
    return { success: false, error: 'Failed to send test SMS' };
  }
}; 