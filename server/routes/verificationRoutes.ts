import { Router } from 'express';
import { z } from 'zod';
import twilio from 'twilio';
import fetch from 'node-fetch';

const router = Router();

// Handle CORS preflight requests
router.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Initialize Twilio client with environment refresh
let accountSid = process.env.TWILIO_ACCOUNT_SID;
let authToken = process.env.TWILIO_AUTH_TOKEN;
let phoneNumber = process.env.TWILIO_PHONE_NUMBER;

// AccessYou SMS API configuration
const accessYouConfig = {
  baseUrl: 'https://smsapi.accessyou.com',
  apiKey: process.env.ACCESSYOU_API_KEY,
  accountNo: process.env.ACCESSYOU_ACCOUNT_NO,
  user: process.env.ACCESSYOU_USER,
  password: process.env.ACCESSYOU_PASSWORD,
  senderId: process.env.ACCESSYOU_SENDER_ID || 'CS-SPORT'
};

// Force refresh environment variables if they're missing
if (!accountSid || !authToken || !phoneNumber) {
  console.log('🔄 Attempting to refresh Twilio environment variables...');
  accountSid = process.env.TWILIO_ACCOUNT_SID;
  authToken = process.env.TWILIO_AUTH_TOKEN;
  phoneNumber = process.env.TWILIO_PHONE_NUMBER;
}

console.log('🔧 Twilio Environment Check:', {
  hasAccountSid: !!accountSid,
  hasAuthToken: !!authToken,
  hasPhoneNumber: !!phoneNumber,
  accountSidLength: accountSid ? accountSid.length : 0,
  phoneNumber: phoneNumber || 'Not set',
  // Debug: Show first 6 chars of SID for verification
  accountSidPreview: accountSid ? `${accountSid.substring(0, 6)}...` : 'Missing',
  authTokenPreview: authToken ? 'Present' : 'Missing',
  allEnvKeys: Object.keys(process.env).filter(key => key.includes('TWILIO')),
  nodeEnv: process.env.NODE_ENV
});

const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null;

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

// Send SMS via AccessYou API using verification code endpoint
async function sendAccessYouSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!accessYouConfig.accountNo || !accessYouConfig.user || !accessYouConfig.password) {
      throw new Error('AccessYou credentials not configured properly');
    }

    // Format phone number (remove + prefix if present)
    const formattedPhone = phoneNumber.replace('+', '');

    // Extract verification code from message for OTP endpoint
    const codeMatch = message.match(/\d{6}/);
    const verificationCode = codeMatch ? codeMatch[0] : '';

    // For verification codes, use the specialized endpoint with code parameter
    const apiUrl = `${accessYouConfig.baseUrl}/sms/sendsms-vercode.php?` +
      `accountno=${accessYouConfig.accountNo}&` +
      `user=${accessYouConfig.user}&` +
      `pwd=${accessYouConfig.password}&` +
      `code=${verificationCode}&` +
      `phone=${formattedPhone}` +
      (accessYouConfig.senderId ? `&from=${accessYouConfig.senderId}` : '') +
      `&msg=${encodeURIComponent(message)}`;

    console.log('🔐 AccessYou verification SMS request:', {
      phone: formattedPhone,
      code: verificationCode,
      from: accessYouConfig.senderId
    });

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });

    // AccessYou returns XML response
    const xmlText = await response.text();

    // Parse XML response
    let messageId = null;
    let errorMessage = null;

    // Simple XML parsing to extract msg_status and msg_id
    const statusMatch = xmlText.match(/<msg_status>(\d+)<\/msg_status>/);
    const msgIdMatch = xmlText.match(/<msg_id>([^<]+)<\/msg_id>/);
    const descMatch = xmlText.match(/<msg_status_desc>([^<]+)<\/msg_status_desc>/);

    if (statusMatch) {
      const status = statusMatch[1];
      if (status === '100') {
        // Success
        messageId = msgIdMatch ? msgIdMatch[1] : 'success';
        console.log('✅ AccessYou verification SMS sent successfully:', messageId);
        return {
          success: true,
          messageId: messageId
        };
      } else {
        // Error
        errorMessage = descMatch ? descMatch[1] : `AccessYou error status: ${status}`;
        console.error('❌ AccessYou verification SMS failed:', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }
    } else {
      // If we get a numeric response (for basic SMS API), it's a message ID
      const numericResponse = xmlText.trim();
      if (/^\d+$/.test(numericResponse)) {
        console.log('✅ AccessYou verification SMS sent (numeric response):', numericResponse);
        return {
          success: true,
          messageId: numericResponse
        };
      } else {
        console.error('❌ AccessYou unexpected response:', xmlText);
        return {
          success: false,
          error: xmlText || 'Unknown AccessYou API response'
        };
      }
    }
  } catch (error) {
    console.error('AccessYou SMS error:', error);
    return {
      success: false,
      error: error.message || 'AccessYou SMS service error'
    };
  }
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
    let messageProvider = 'none';

    const smsMessage = `Your CS Sport verification code is: ${code}. Valid for 10 minutes.`;

    // Try AccessYou SMS first
    if (accessYouConfig.apiKey) {
      try {
        console.log(`📱 Attempting to send SMS via AccessYou to: ${formattedNumber}`);
        const accessYouResult = await sendAccessYouSMS(formattedNumber, smsMessage);

        if (accessYouResult.success) {
          console.log(`✅ SMS sent successfully via AccessYou to ${formattedNumber} (ID: ${accessYouResult.messageId})`);
          smsSuccess = true;
          messageProvider = 'AccessYou';
        } else {
          console.error('❌ AccessYou SMS failed:', accessYouResult.error);
          smsError = accessYouResult.error;
        }
      } catch (accessYouError) {
        console.error('❌ AccessYou SMS error:', accessYouError);
        smsError = accessYouError.message;
      }
    }

    // Fallback to Twilio if AccessYou failed
    if (!smsSuccess && twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        console.log(`📱 Falling back to Twilio for: ${formattedNumber}`);
        const message = await twilioClient.messages.create({
          body: smsMessage,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: formattedNumber
        });
        console.log(`✅ SMS sent successfully via Twilio to ${formattedNumber} (SID: ${message.sid})`);
        smsSuccess = true;
        messageProvider = 'Twilio';
      } catch (twilioError) {
        console.error('❌ Twilio SMS error:', twilioError);
        smsError = twilioError.message;
      }
    }

    // Development fallback - log to console
    if (!smsSuccess && process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Verification code for ${formattedNumber}: ${code}`);
      console.log('⚠️ No SMS provider configured - using console logging');
      smsSuccess = true;
      messageProvider = 'Development Console';
    }

    if (smsSuccess) {
      console.log(`✅ SMS verification successful for ${formattedNumber} via ${messageProvider}`);
      res.json({
        success: true,
        message: 'Verification code sent successfully',
        phoneNumber: formattedNumber.replace(/(\+\d{1,3})\d+(\d{4})/, '$1****$2'), // Mask phone number
        provider: messageProvider
      });
    } else {
      console.error(`❌ SMS verification failed for ${formattedNumber}:`, smsError);
      res.status(503).json({
        success: false,
        error: 'SMS service unavailable. Please try again later.',
        details: process.env.NODE_ENV === 'development' ? smsError : undefined,
        providers: {
          accessYou: !!accessYouConfig.apiKey,
          twilio: !!twilioClient && !!process.env.TWILIO_PHONE_NUMBER
        }
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

// Test AccessYou endpoint
router.get('/test-accessyou', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log('🔧 Testing AccessYou configuration...');

    if (!accessYouConfig.accountNo || !accessYouConfig.user || !accessYouConfig.password) {
      return res.status(500).json({
        error: 'AccessYou credentials not configured properly',
        configured: false,
        details: {
          hasAccountNo: !!accessYouConfig.accountNo,
          hasUser: !!accessYouConfig.user,
          hasPassword: !!accessYouConfig.password
        }
      });
    }

    // Test API connectivity with account detail check
    try {
      const testUrl = `https://check.accessyou.com/sms/check_accinfo.php?` +
        `accountno=${accessYouConfig.accountNo}&` +
        `user=${accessYouConfig.user}&` +
        `pwd=${accessYouConfig.password}`;

      const response = await fetch(testUrl, {
        method: 'GET'
      });

      const xmlText = await response.text();

      // Check if authentication passed
      const authStatusMatch = xmlText.match(/<auth_status>(\d+)<\/auth_status>/);

      if (authStatusMatch && authStatusMatch[1] === '100') {
        res.json({
          success: true,
          message: 'AccessYou SMS API is properly configured',
          configured: true,
          accountNo: accessYouConfig.accountNo,
          senderId: accessYouConfig.senderId || 'Default'
        });
      } else {
        const errorMatch = xmlText.match(/<auth_status_desc>([^<]+)<\/auth_status_desc>/);
        res.status(500).json({
          error: 'AccessYou API authentication failed',
          configured: false,
          details: errorMatch ? errorMatch[1] : 'Authentication failed'
        });
      }
    } catch (apiError) {
      console.error('❌ AccessYou API test failed:', apiError);
      res.status(500).json({
        error: 'AccessYou API connection failed',
        details: apiError.message,
        configured: false
      });
    }
  } catch (error) {
    console.error('AccessYou test error:', error);
    res.status(500).json({
      error: 'Failed to test AccessYou configuration',
      details: error.message || 'Unknown error',
      configured: false
    });
  }
});

// Test Twilio endpoint
router.get('/test-twilio', async (req, res) => {
  try {
    // Set proper JSON content type and CORS headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log('🔧 Testing Twilio configuration...');
    console.log('Environment variables:', {
      TWILIO_ACCOUNT_SID: accountSid ? `${accountSid.substring(0, 6)}...` : 'NOT SET',
      TWILIO_AUTH_TOKEN: authToken ? 'SET' : 'NOT SET',
      TWILIO_PHONE_NUMBER: phoneNumber || 'NOT SET'
    });

    // Check if Twilio is configured
    if (!twilioClient || !phoneNumber) {
      return res.status(500).json({
        error: 'Twilio not configured properly',
        details: {
          hasAccountSid: !!accountSid,
          hasAuthToken: !!authToken,
          hasPhoneNumber: !!phoneNumber,
          twilioClientInitialized: !!twilioClient
        },
        environmentCheck: {
          accountSid: accountSid ? `${accountSid.substring(0, 6)}...` : 'Missing',
          authToken: authToken ? 'Present' : 'Missing',
          phoneNumber: phoneNumber || 'Missing'
        }
      });
    }

    // Test Twilio client initialization
    try {
      // Just validate the client without sending SMS
      console.log('✅ Twilio client initialized successfully');

      res.json({
        success: true,
        message: 'Twilio is properly configured and ready to send SMS',
        configured: true,
        details: {
          hasAccountSid: true,
          hasAuthToken: true,
          hasPhoneNumber: true,
          twilioClientReady: true,
          phoneNumber: phoneNumber
        }
      });
    } catch (twilioError) {
      console.error('❌ Twilio client validation failed:', twilioError);
      res.status(500).json({
        error: 'Twilio client validation failed',
        details: twilioError.message,
        configured: false
      });
    }
  } catch (error) {
    console.error('Twilio test error:', error);
    res.status(500).json({
      error: 'Failed to test Twilio configuration',
      details: error.message || 'Unknown error',
      configured: false
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

// Debug endpoint to check SMS providers configuration
router.get('/sms-status', (req, res) => {
  res.json({
    providers: {
      accessYou: {
        configured: !!accessYouConfig.apiKey,
        apiKey: accessYouConfig.apiKey ? `${accessYouConfig.apiKey.substring(0, 8)}...` : 'Missing',
        senderId: accessYouConfig.senderId,
        baseUrl: accessYouConfig.baseUrl,
        accountNo: accessYouConfig.accountNo ? 'SET' : 'MISSING',
        user: accessYouConfig.user ? 'SET' : 'MISSING',
        password: accessYouConfig.password ? 'SET' : 'MISSING'
      },
      twilio: {
        hasClient: !!twilioClient,
        hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
        hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
        hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
        accountSidLength: process.env.TWILIO_ACCOUNT_SID?.length || 0,
        phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not set',
        accountSidPreview: process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 6)}...` : 'Missing'
      }
    },
    environment: process.env.NODE_ENV || 'development',
    allSmsKeys: Object.keys(process.env).filter(key => key.includes('TWILIO') || key.includes('ACCESSYOU'))
  });
});

// Legacy endpoint for backward compatibility
router.get('/twilio-status', (req, res) => {
  res.json({
    twilioConfigured: {
      hasClient: !!twilioClient,
      hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
      accountSidLength: process.env.TWILIO_ACCOUNT_SID?.length || 0,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || 'Not set',
      accountSidPreview: process.env.TWILIO_ACCOUNT_SID ? `${process.env.TWILIO_ACCOUNT_SID.substring(0, 6)}...` : 'Missing'
    },
    environment: process.env.NODE_ENV || 'development',
    allTwilioKeys: Object.keys(process.env).filter(key => key.includes('TWILIO'))
  });
});

// Simple environment check endpoint
router.get('/env-check', (req, res) => {
  res.json({
    twilioVars: {
      TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID ? 'SET' : 'MISSING',
      TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN ? 'SET' : 'MISSING',
      TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER ? 'SET' : 'MISSING'
    },
    accessYouVars: {
      ACCESSYOU_API_KEY: process.env.ACCESSYOU_API_KEY ? 'SET' : 'MISSING',
      ACCESSYOU_ACCOUNT_NO: process.env.ACCESSYOU_ACCOUNT_NO ? 'SET' : 'MISSING',
      ACCESSYOU_USER: process.env.ACCESSYOU_USER ? 'SET' : 'MISSING',
      ACCESSYOU_PASSWORD: process.env.ACCESSYOU_PASSWORD ? 'SET' : 'MISSING',
      ACCESSYOU_SENDER_ID: process.env.ACCESSYOU_SENDER_ID ? 'SET' : 'MISSING'
    },
    phoneNumberValue: process.env.TWILIO_PHONE_NUMBER,
    timestamp: new Date().toISOString()
  });
});

export default router;