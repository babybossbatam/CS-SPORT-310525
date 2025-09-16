
import { Router } from 'express';
import { z } from 'zod';
import twilio from 'twilio';

const router = Router();

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expires: Date }>();

// Generate a random 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code endpoint
router.post('/send-verification', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the code
    verificationCodes.set(phoneNumber, { code, expires });

    // Send SMS using Twilio
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: `Your CS Sport verification code is: ${code}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phoneNumber
        });
        console.log(`SMS sent successfully to ${phoneNumber}`);
      } catch (twilioError) {
        console.error('Twilio SMS error:', twilioError);
        // Fall back to console logging if SMS fails
        console.log(`Verification code for ${phoneNumber}: ${code}`);
      }
    } else {
      // Development fallback - log to console
      console.log(`[DEV] Verification code for ${phoneNumber}: ${code}`);
      console.log('Twilio not configured - using console logging');
    }

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
});

// Verify code endpoint
router.post('/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ error: 'Phone number and code are required' });
    }

    const storedData = verificationCodes.get(phoneNumber);
    
    if (!storedData) {
      return res.status(400).json({ error: 'No verification code found for this phone number' });
    }

    if (new Date() > storedData.expires) {
      verificationCodes.delete(phoneNumber);
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    if (storedData.code !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Clean up the used code
    verificationCodes.delete(phoneNumber);
    
    res.json({ success: true, message: 'Phone number verified successfully' });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ error: 'Failed to verify code' });
  }
});

export default router;
