import { Router } from 'express';
import { z } from 'zod';
import twilio from 'twilio';

const router = Router();

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Initialize Twilio client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, {
  code: string;
  expires: Date;
  attempts?: number;
  createdAt?: Date;
}>();

// Generate a random 6-digit code
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Send verification code endpoint
router.post('/send-verification', async (req, res) => {
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Content-Type', 'application/json');

  try {
    const { phoneNumber, countryCode = '+1' } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Format phone number properly
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode}${phoneNumber}`;

    console.log(`📱 Sending SMS to: ${formattedNumber}`);

    // Generate verification code
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store the code with attempt tracking
    verificationCodes.set(formattedNumber, {
      code,
      expires,
      attempts: 0,
      createdAt: new Date()
    });

    // Basic rate limiting for sending codes
    const existingCode = verificationCodes.get(formattedNumber);
    if (existingCode && new Date() < new Date(existingCode.expires.getTime() - 8 * 60 * 1000)) {
      return res.status(429).json({
        success: false,
        error: 'Please wait before requesting another code',
        remainingTime: Math.ceil((existingCode.expires.getTime() - 8 * 60 * 1000 - Date.now()) / 1000)
      });
    }


    let smsSuccess = false;
    let smsError = null;

    // Send SMS using Twilio
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const message = await twilioClient.messages.create({
          body: `Your CS Sport verification code is: ${code}. Valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedNumber
        });
        console.log(`✅ SMS sent successfully to ${formattedNumber} (SID: ${message.sid})`);
        smsSuccess = true;
      } catch (twilioError) {
        console.error('❌ Twilio SMS error:', twilioError);
        smsError = twilioError.message;
        // In development, still allow the process to continue
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] Verification code for ${formattedNumber}: ${code}`);
          smsSuccess = true; // Allow development to continue
        }
      }
    } else {
      // Development fallback - log to console
      console.log(`[DEV] Verification code for ${formattedNumber}: ${code}`);
      console.log('⚠️ Twilio not configured - using console logging');
      smsSuccess = process.env.NODE_ENV === 'development';
    }

    if (smsSuccess) {
      res.json({
        success: true,
        message: 'Verification code sent successfully',
        phoneNumber: formattedNumber.replace(/(\+\d{1,3})\d+(\d{4})/, '$1****$2') // Mask phone number
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'SMS service unavailable. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? smsError : undefined
      });
    }
  } catch (error) {
    console.error('Error sending verification code:', error);
    // Ensure we always return JSON, never HTML
    if (res.headersSent) {
      return;
    }
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Test Twilio endpoint
router.get('/test-twilio', async (req, res) => {
  try {
    // Set proper JSON content type and CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');</old_str>

    // Test endpoint - no phone number required, just check configuration

    // Check if Twilio is configured
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      return res.status(500).json({
        error: 'Twilio not configured properly',
        details: {
          hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
          hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
          hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER
        }
      });
    }

    // Just check if Twilio is configured - don't send actual SMS
    console.log('Twilio configuration test - credentials are properly configured');

    res.json({
      success: true,
      message: 'Twilio is properly configured and ready to send SMS',
      configured: true,
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER
    });
  } catch (error) {
    console.error('Twilio test error:', error);
    res.status(500).json({
      error: 'Failed to send test SMS',
      details: error.message || 'Unknown Twilio error',
      message: 'Failed to send test message'
    });
  }
});

// Verify code endpoint
router.post('/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;

    if (!phoneNumber || !code) {
      return res.status(400).json({
        success: false,
        error: 'Phone number and code are required'
      });
    }

    const storedData = verificationCodes.get(phoneNumber);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        error: 'No verification code found. Please request a new code.'
      });
    }

    if (new Date() > storedData.expires) {
      verificationCodes.delete(phoneNumber);
      return res.status(400).json({
        success: false,
        error: 'Verification code has expired. Please request a new code.'
      });
    }

    // Track verification attempts (prevent brute force)
    storedData.attempts = (storedData.attempts || 0) + 1;
    if (storedData.attempts > 5) {
      verificationCodes.delete(phoneNumber);
      return res.status(429).json({
        success: false,
        error: 'Too many failed attempts. Please request a new code.'
      });
    }

    if (storedData.code !== code.toString()) {
      verificationCodes.set(phoneNumber, storedData); // Update attempts count
      return res.status(400).json({
        success: false,
        error: 'Invalid verification code',
        attemptsRemaining: 5 - storedData.attempts
      });
    }

    // Clean up the used code
    verificationCodes.delete(phoneNumber);
    console.log(`✅ Phone number ${phoneNumber} verified successfully`);

    res.json({
      success: true,
      message: 'Phone number verified successfully',
      verifiedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify code',
      details: error.message || 'Unknown error occurred'
    });
  }
});

// Simple test endpoint for manual Twilio testing
router.post('/simple-test', async (req, res) => {
  try {
    if (!twilioClient || !process.env.TWILIO_PHONE_NUMBER) {
      return res.status(500).json({
        error: 'Twilio not configured',
        needsConfig: {
          accountSid: !process.env.TWILIO_ACCOUNT_SID,
          authToken: !process.env.TWILIO_AUTH_TOKEN,
          phoneNumber: !process.env.TWILIO_PHONE_NUMBER
        }
      });
    }

    const { phoneNumber, message } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const messageBody = message || 'Test message from CS Sport - Twilio is working!';

    const twilioMessage = await twilioClient.messages.create({
      body: messageBody,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`Simple test SMS sent successfully. SID: ${twilioMessage.sid}`);

    res.json({
      success: true,
      messageSid: twilioMessage.sid,
      message: 'Test SMS sent successfully',
      body: messageBody,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER
    });

  } catch (error) {
    console.error('Simple Twilio test error:', error);
    res.status(500).json({
      error: 'Failed to send test SMS',
      details: error.message
    });
  }
});

export default router;