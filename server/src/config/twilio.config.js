import dotenv from 'dotenv';
import twilio from 'twilio';

dotenv.config();

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Twilio configuration object
export const twilioConfig = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  client: client
};

// ==================== SMS Functions ====================

/**
 * Send SMS to a single recipient
 * @param {string} to - Recipient phone number (E.164 format: +1234567890)
 * @param {string} message - Message body
 * @returns {Promise<object>} - Twilio message object
 */
export const sendSMS = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioConfig.phoneNumber,
      to: to
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send SMS to multiple recipients
 * @param {Array<string>} recipients - Array of phone numbers
 * @param {string} message - Message body
 * @returns {Promise<object>} - Results array
 */
export const sendBulkSMS = async (recipients, message) => {
  try {
    const promises = recipients.map(to => 
      client.messages.create({
        body: message,
        from: twilioConfig.phoneNumber,
        to: to
      })
    );
    const results = await Promise.allSettled(promises);
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== Voice Call Functions ====================

/**
 * Make a voice call
 * @param {string} to - Recipient phone number
 * @param {string} twimlUrl - TwiML URL for call instructions
 * @returns {Promise<object>} - Twilio call object
 */
export const makeCall = async (to, twimlUrl) => {
  try {
    const result = await client.calls.create({
      url: twimlUrl,
      to: to,
      from: twilioConfig.phoneNumber
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Make a voice call with text-to-speech
 * @param {string} to - Recipient phone number
 * @param {string} message - Message to speak
 * @returns {Promise<object>} - Twilio call object
 */
export const makeCallWithMessage = async (to, message) => {
  try {
    const twiml = `<Response><Say>${message}</Say></Response>`;
    const result = await client.calls.create({
      twiml: twiml,
      to: to,
      from: twilioConfig.phoneNumber
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== Verification Functions ====================

/**
 * Send OTP verification code
 * @param {string} to - Phone number to verify
 * @param {string} channel - 'sms' or 'call'
 * @returns {Promise<object>} - Verification result
 */
export const sendVerificationCode = async (to, channel = 'sms') => {
  try {
    const verification = await client.verify.v2
      .services(twilioConfig.verifyServiceSid)
      .verifications.create({ to: to, channel: channel });
    return { success: true, data: verification };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Verify OTP code
 * @param {string} to - Phone number being verified
 * @param {string} code - OTP code entered by user
 * @returns {Promise<object>} - Verification check result
 */
export const verifyCode = async (to, code) => {
  try {
    const verificationCheck = await client.verify.v2
      .services(twilioConfig.verifyServiceSid)
      .verificationChecks.create({ to: to, code: code });
    return { 
      success: true, 
      verified: verificationCheck.status === 'approved',
      data: verificationCheck 
    };
  } catch (error) {
    return { success: false, verified: false, error: error.message };
  }
};

// ==================== WhatsApp Functions ====================

/**
 * Send WhatsApp message
 * @param {string} to - Recipient WhatsApp number (whatsapp:+1234567890)
 * @param {string} message - Message body
 * @returns {Promise<object>} - Twilio message object
 */
export const sendWhatsApp = async (to, message) => {
  try {
    // Ensure number has whatsapp: prefix
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const whatsappFrom = `whatsapp:${twilioConfig.phoneNumber}`;
    
    const result = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Send WhatsApp message with media
 * @param {string} to - Recipient WhatsApp number
 * @param {string} message - Message body
 * @param {string} mediaUrl - URL of media file
 * @returns {Promise<object>} - Twilio message object
 */
export const sendWhatsAppWithMedia = async (to, message, mediaUrl) => {
  try {
    const whatsappTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const whatsappFrom = `whatsapp:${twilioConfig.phoneNumber}`;
    
    const result = await client.messages.create({
      body: message,
      from: whatsappFrom,
      to: whatsappTo,
      mediaUrl: [mediaUrl]
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==================== Utility Functions ====================

/**
 * Get message status
 * @param {string} messageSid - Message SID
 * @returns {Promise<object>} - Message status
 */
export const getMessageStatus = async (messageSid) => {
  try {
    const message = await client.messages(messageSid).fetch();
    return { success: true, data: message };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Get call status
 * @param {string} callSid - Call SID
 * @returns {Promise<object>} - Call status
 */
export const getCallStatus = async (callSid) => {
  try {
    const call = await client.calls(callSid).fetch();
    return { success: true, data: call };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
export const isValidPhoneNumber = (phoneNumber) => {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phoneNumber);
};