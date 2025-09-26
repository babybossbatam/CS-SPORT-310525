import { Router } from 'express';
import { z } from 'zod';
import twilio from 'twilio';
import fetch from 'node-fetch';

const router = Router();

// Middleware to ensure all responses are JSON
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Handle CORS preflight requests
router.options('*', (req, res) => {
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

  // Basic SMS API (web login credentials)
  user: process.env.ACCESSYOU_USER,
  password: process.env.ACCESSYOU_PASSWORD,

  // OTP API (separate credentials - different from web login)
  otpUser: process.env.ACCESSYOU_OTP_USER,
  otpPassword: process.env.ACCESSYOU_OTP_PASSWORD,

  // Template configuration for OTP API
  templateId: process.env.ACCESSYOU_TEMPLATE_ID, // e.g., "12345"
  templateFormat: process.env.ACCESSYOU_TEMPLATE_FORMAT || '【CS-SPORT】验证码：#a#，请在10分钟内使用',

  senderId: process.env.ACCESSYOU_SENDER_ID || 'CS-SPORT'
};

// Force refresh environment variables if they're missing
if (!accountSid || !authToken || !phoneNumber) {
  console.log('🔄 Attempting to refresh Twilio environment variables...');
  accountSid = process.env.TWILIO_ACCOUNT_SID;
  authToken = process.env.TWILIO_AUTH_TOKEN;
  phoneNumber = process.env.TWILIO_PHONE_NUMBER;
}

// Twilio environment check (removed sensitive logging)

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

// Send SMS via AccessYou OTP API with template support
async function sendAccessYouOTP(phoneNumber: string, verificationCode: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    console.log('🔍 [AccessYou OTP] Starting OTP send process...');
    console.log('🔍 [AccessYou OTP] Config check:', {
      hasOtpUser: !!accessYouConfig.otpUser,
      hasOtpPassword: !!accessYouConfig.otpPassword,
      hasTemplateId: !!accessYouConfig.templateId,
      hasAccountNo: !!accessYouConfig.accountNo,
      hasUser: !!accessYouConfig.user,
      hasPassword: !!accessYouConfig.password
    });

    if (!accessYouConfig.otpUser || !accessYouConfig.otpPassword || !accessYouConfig.templateId) {
      console.log('⚠️ AccessYou OTP API not fully configured, checking for basic API credentials');
      console.log('⚠️ OTP credentials status:', {
        otpUser: !accessYouConfig.otpUser ? 'MISSING' : 'SET',
        otpPassword: !accessYouConfig.otpPassword ? 'MISSING' : 'SET', 
        templateId: !accessYouConfig.templateId ? 'MISSING' : 'SET'
      });
      
      // Check if basic SMS API credentials are available
      if (accessYouConfig.accountNo && accessYouConfig.user && accessYouConfig.password) {
        console.log('🔄 Falling back to AccessYou basic SMS API');
        return await sendAccessYouBasicSMS(phoneNumber, `Your CS Sport verification code is: ${verificationCode}. Valid for 10 minutes.`);
      } else {
        console.error('❌ No AccessYou credentials available at all');
        return { 
          success: false, 
          error: 'SMS service not configured. Please contact support.' 
        };
      }
    }

    // Format phone number (remove + prefix if present, ensure proper formatting)
    let formattedPhone = phoneNumber.replace(/^\+/, '');
    console.log('📱 [AccessYou OTP] Original phone:', phoneNumber, '-> Formatted:', formattedPhone);

    // Ensure phone number starts with country code (add 86 for China if not present)
    if (!formattedPhone.startsWith('86') && !formattedPhone.startsWith('1') && !formattedPhone.startsWith('852')) {
      if (formattedPhone.length === 11 && formattedPhone.startsWith('1')) {
        // Chinese mobile number, add 86 prefix
        formattedPhone = '86' + formattedPhone;
        console.log('🇨🇳 [AccessYou OTP] Added China country code:', formattedPhone);
      }
    }

    // Use AccessYou OTP API with template
    const apiUrl = `${accessYouConfig.baseUrl}/sms/sendsms-template.php?` +
      `user=${encodeURIComponent(accessYouConfig.otpUser)}&` +
      `pwd=${encodeURIComponent(accessYouConfig.otpPassword)}&` +
      `phone=${formattedPhone}&` +
      `template_id=${accessYouConfig.templateId}&` +
      `param1=${verificationCode}` +
      (accessYouConfig.senderId ? `&from=${encodeURIComponent(accessYouConfig.senderId)}` : '');

    console.log('🔐 AccessYou OTP API request:', {
      phone: formattedPhone,
      templateId: accessYouConfig.templateId,
      code: verificationCode,
      senderId: accessYouConfig.senderId,
      user: accessYouConfig.otpUser
    });

    console.log('🌐 [AccessYou OTP] Making API request to:', apiUrl.replace(/pwd=[^&]*/, 'pwd=***'));

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CS-Sport-SMS-Service/1.0'
      }
    });

    console.log('📡 [AccessYou OTP] Response status:', response.status, response.statusText);

    const xmlText = await response.text();
    console.log('📨 [AccessYou OTP] Raw API response:', xmlText);

    // Check for IP authentication errors first
    if (xmlText.includes('IP is forbidden') || xmlText.includes('IP authentication') || response.status === 403) {
      console.error('🚫 [AccessYou OTP] IP Authentication Error - Server IP not whitelisted');
      return { 
        success: false, 
        error: 'SMS service configuration error - IP not whitelisted. Please contact support.' 
      };
    }

    // Check for other authentication errors
    if (xmlText.includes('login failure') || xmlText.includes('authentication failed')) {
      console.error('🔑 [AccessYou OTP] Authentication failed - invalid credentials');
      return { 
        success: false, 
        error: 'SMS service authentication failed. Please try again or contact support.' 
      };
    }

    // Parse XML response for OTP template API
    const statusMatch = xmlText.match(/<msg_status>(\d+)<\/msg_status>/);
    const msgIdMatch = xmlText.match(/<msg_id>([^<]+)<\/msg_id>/);
    const descMatch = xmlText.match(/<msg_status_desc>([^<]+)<\/msg_status_desc>/);

    if (statusMatch) {
      const status = statusMatch[1];
      if (status === '100') {
        const messageId = msgIdMatch ? msgIdMatch[1] : 'template_success';
        console.log('✅ AccessYou OTP template sent successfully:', messageId);
        return { success: true, messageId };
      } else {
        const errorMessage = descMatch ? descMatch[1] : `OTP template API error status: ${status}`;
        console.error('❌ AccessYou OTP template failed:', errorMessage);

        // If template API fails, fallback to basic SMS API
        console.log('🔄 Falling back to AccessYou basic SMS API...');
        return await sendAccessYouBasicSMS(phoneNumber, `Your CS Sport verification code is: ${verificationCode}. Valid for 10 minutes.`);
      }
    } else {
      // Handle non-XML response (might be plain text success)
      const numericResponse = xmlText.trim();
      if (/^\d+$/.test(numericResponse) && numericResponse !== '0') {
        console.log('✅ AccessYou OTP sent (numeric response):', numericResponse);
        return { success: true, messageId: numericResponse };
      } else {
        console.error('❌ AccessYou OTP unexpected response:', xmlText);
        // Fallback to basic SMS API
        console.log('🔄 Falling back to AccessYou basic SMS API...');
        return await sendAccessYouBasicSMS(phoneNumber, `Your CS Sport verification code is: ${verificationCode}. Valid for 10 minutes.`);
      }
    }
  } catch (error) {
    console.error('AccessYou OTP API error:', error);

    // If OTP API fails, try basic SMS API as fallback
    console.log('🔄 OTP API failed, trying basic SMS API fallback...');
    try {
      return await sendAccessYouBasicSMS(phoneNumber, `Your CS Sport verification code is: ${verificationCode}. Valid for 10 minutes.`);
    } catch (fallbackError) {
      console.error('AccessYou fallback also failed:', fallbackError);
      return { success: false, error: error.message || 'All SMS APIs failed' };
    }
  }
}

// Send SMS via AccessYou API using basic verification code endpoint (fallback)
async function sendAccessYouBasicSMS(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
  // Set CORS headers first
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Ensure we always return JSON
  res.setHeader('Content-Type', 'application/json');

  try {
    const { phoneNumber, countryCode = '+852' } = req.body;

    console.log('📱 [SMS Request] Received:', { phoneNumber, countryCode });

    if (!phoneNumber) {
      console.error('❌ [SMS Request] No phone number provided');
      return res.status(400).json({ 
        success: false,
        error: 'Phone number is required' 
      });
    }

    // Format phone number properly
    const formattedNumber = phoneNumber.startsWith('+') ? phoneNumber : `${countryCode}${phoneNumber}`;

    console.log(`📱 [SMS Request] Formatted number: ${formattedNumber}`);

    // Generate verification code
    const code = generateVerificationCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    console.log(`🔐 [SMS Request] Generated code: ${code}`);

    // Check for existing code and rate limiting
    const existingCode = verificationCodes.get(formattedNumber);
    if (existingCode && new Date() < new Date(existingCode.expires.getTime() - 8 * 60 * 1000)) {
      console.warn(`⏰ [SMS Request] Rate limited for ${formattedNumber}`);
      return res.status(429).json({
        success: false,
        error: 'Please wait before requesting another code',
        remainingTime: Math.ceil((existingCode.expires.getTime() - 8 * 60 * 1000 - Date.now()) / 1000)
      });
    }

    // Store the code with attempt tracking
    verificationCodes.set(formattedNumber, {
      code,
      expires,
      attempts: 0,
      createdAt: new Date()
    });

    console.log(`💾 [SMS Request] Code stored for ${formattedNumber}`);

    // Log current AccessYou configuration
    console.log('🔧 [AccessYou Config]:', {
      hasBasicCredentials: !!(accessYouConfig.accountNo && accessYouConfig.user && accessYouConfig.password),
      hasOtpCredentials: !!(accessYouConfig.otpUser && accessYouConfig.otpPassword && accessYouConfig.templateId),
      accountNo: accessYouConfig.accountNo ? 'SET' : 'MISSING',
      otpUser: accessYouConfig.otpUser ? 'SET' : 'MISSING',
      templateId: accessYouConfig.templateId ? 'SET' : 'MISSING'
    });


    let smsSuccess = false;
    let smsError = null;
    let messageProvider = 'none';

    const smsMessage = `Your CS Sport verification code is: ${code}. Valid for 10 minutes.`;

    // Try AccessYou OTP API first (recommended for verification codes)
    if (accessYouConfig.accountNo) {
      try {
        console.log(`📱 Attempting to send OTP via AccessYou to: ${formattedNumber}`);
        const accessYouResult = await sendAccessYouOTP(formattedNumber, code);

        if (accessYouResult.success) {
          console.log(`✅ OTP sent successfully via AccessYou to ${formattedNumber} (ID: ${accessYouResult.messageId})`);
          smsSuccess = true;
          messageProvider = 'AccessYou OTP API';
        } else {
          console.error('❌ AccessYou OTP failed:', accessYouResult.error);
          smsError = accessYouResult.error;
        }
      } catch (accessYouError) {
        console.error('❌ AccessYou OTP error:', accessYouError);
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
      
      // Determine specific error message based on the error
      let userFriendlyError = 'SMS service temporarily unavailable. Please try again later.';
      
      if (smsError && smsError.includes('IP')) {
        userFriendlyError = 'SMS service configuration issue. Please contact support.';
      } else if (smsError && smsError.includes('authentication')) {
        userFriendlyError = 'SMS service authentication failed. Please try again.';
      } else if (smsError && smsError.includes('balance')) {
        userFriendlyError = 'SMS service quota exceeded. Please contact support.';
      }

      res.status(503).json({
        success: false,
        error: userFriendlyError,
        details: process.env.NODE_ENV === 'development' ? smsError : undefined,
        providers: {
          accessYou: {
            configured: !!accessYouConfig.accountNo,
            hasBasicCredentials: !!(accessYouConfig.accountNo && accessYouConfig.user && accessYouConfig.password),
            hasOtpCredentials: !!(accessYouConfig.otpUser && accessYouConfig.otpPassword && accessYouConfig.templateId)
          },
          twilio: !!twilioClient && !!process.env.TWILIO_PHONE_NUMBER
        },
        troubleshooting: {
          checkServerIP: '/api/verification/server-ip',
          testAccessYou: '/api/verification/test-accessyou',
          testTwilio: '/api/verification/test-twilio'
        }
      });
    }
  } catch (error) {
    console.error('Error sending verification code:', error);
    
    // Ensure we always return JSON, never HTML
    if (res.headersSent) {
      return;
    }
    
    // Force JSON content type again in case it was changed
    res.setHeader('Content-Type', 'application/json');
    
    res.status(500).json({
      success: false,
      error: 'SMS service temporarily unavailable. Please try again later.',
      details: process.env.NODE_ENV === 'development' ? (error.message || 'Unknown error occurred') : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// Get server IP for AccessYou whitelisting
router.get('/server-ip', async (req, res) => {
  try {
    console.log('🔍 [IP Check] Checking server IP...');
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    
    res.json({
      serverIP: data.ip,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      message: 'This IP needs to be whitelisted in AccessYou SMS service',
      accessYouConfigured: !!(accessYouConfig.accountNo && accessYouConfig.user && accessYouConfig.password)
    });
  } catch (error) {
    console.error('❌ [IP Check] Failed to get server IP:', error);
    res.status(500).json({
      error: 'Failed to get server IP',
      details: error.message || 'Unknown error'
    });
  }
});

// Test AccessYou endpoint
router.get('/test-accessyou', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    console.log('🔧 Testing AccessYou configuration...');
    console.log('🔧 Environment variables loaded:', {
      ACCESSYOU_OTP_USER: process.env.ACCESSYOU_OTP_USER ? 'SET' : 'MISSING',
      ACCESSYOU_OTP_PASSWORD: process.env.ACCESSYOU_OTP_PASSWORD ? 'SET' : 'MISSING',
      ACCESSYOU_TEMPLATE_ID: process.env.ACCESSYOU_TEMPLATE_ID ? 'SET' : 'MISSING',
      ACCESSYOU_ACCOUNT_NO: process.env.ACCESSYOU_ACCOUNT_NO ? 'SET' : 'MISSING',
      ACCESSYOU_USER: process.env.ACCESSYOU_USER ? 'SET' : 'MISSING',
      ACCESSYOU_PASSWORD: process.env.ACCESSYOU_PASSWORD ? 'SET' : 'MISSING'
    });

    const hasBasicCredentials = accessYouConfig.accountNo && accessYouConfig.user && accessYouConfig.password;
    const hasOtpCredentials = accessYouConfig.otpUser && accessYouConfig.otpPassword && accessYouConfig.templateId;

    console.log('🔧 Credential check:', {
      hasBasicCredentials,
      hasOtpCredentials,
      accountNo: accessYouConfig.accountNo ? `SET (${accessYouConfig.accountNo})` : 'MISSING',
      user: accessYouConfig.user ? `SET (${accessYouConfig.user})` : 'MISSING',
      password: accessYouConfig.password ? 'SET' : 'MISSING',
      otpUser: accessYouConfig.otpUser ? `SET (${accessYouConfig.otpUser})` : 'MISSING',
      otpPassword: accessYouConfig.otpPassword ? 'SET' : 'MISSING',
      templateId: accessYouConfig.templateId ? `SET (${accessYouConfig.templateId})` : 'MISSING'
    });

    if (!hasBasicCredentials && !hasOtpCredentials) {
      return res.status(500).json({
        error: 'AccessYou credentials not configured properly',
        configured: false,
        details: {
          basic: {
            hasAccountNo: !!accessYouConfig.accountNo,
            hasUser: !!accessYouConfig.user,
            hasPassword: !!accessYouConfig.password,
            values: {
              accountNo: accessYouConfig.accountNo || 'NOT SET',
              user: accessYouConfig.user || 'NOT SET'
            }
          },
          otp: {
            hasOtpUser: !!accessYouConfig.otpUser,
            hasOtpPassword: !!accessYouConfig.otpPassword,
            hasTemplateId: !!accessYouConfig.templateId,
            values: {
              otpUser: accessYouConfig.otpUser || 'NOT SET',
              templateId: accessYouConfig.templateId || 'NOT SET'
            }
          },
          recommendation: hasOtpCredentials ? 'Using OTP API (recommended)' : 'Using Basic API (fallback)'
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

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SMS Verification Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Simple deployment IP check
router.get('/deployment-ip', async (req, res) => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();

    res.json({
      deploymentIP: data.ip,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get deployment IP' });
  }
});

// Server IP check endpoint for AccessYou whitelisting
router.get('/server-ip', async (req, res) => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();

    res.json({
      serverIP: data.ip,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      message: 'This IP needs to be whitelisted in AccessYou for SMS API access'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get server IP',
      details: error.message || 'Unknown error'
    });
  }
});

export default router;