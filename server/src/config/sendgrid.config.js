import dotenv from 'dotenv';
import sgMail from '@sendgrid/mail';

dotenv.config();

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// SendGrid configuration object
export const sendGridConfig = {
  apiKey: process.env.SENDGRID_API_KEY,
  fromEmail: process.env.SENDGRID_FROM_EMAIL,
  client: sgMail
};

// ==================== Basic Email Functions ====================

/**
 * Send a simple email
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<object>} - SendGrid response
 */
export const sendEmail = async (to, subject, text, html = null) => {
  try {
    const msg = {
      to: to,
      from: sendGridConfig.fromEmail,
      subject: subject,
      text: text,
      ...(html && { html: html })
    };
    
    const result = await sgMail.send(msg);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body 
    };
  }
};

/**
 * Send email to multiple recipients
 * @param {Array<string>} to - Array of recipient email addresses
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content (optional)
 * @returns {Promise<object>} - SendGrid response
 */
export const sendBulkEmail = async (to, subject, text, html = null) => {
  try {
    const msg = {
      to: to,
      from: sendGridConfig.fromEmail,
      subject: subject,
      text: text,
      ...(html && { html: html })
    };
    
    const result = await sgMail.sendMultiple(msg);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body 
    };
  }
};

// ==================== Template Email Functions ====================

/**
 * Send email using SendGrid dynamic template
 * @param {string} to - Recipient email address
 * @param {string} templateId - SendGrid template ID
 * @param {object} dynamicData - Template variables
 * @returns {Promise<object>} - SendGrid response
 */
export const sendTemplateEmail = async (to, templateId, dynamicData = {}) => {
  try {
    const msg = {
      to: to,
      from: sendGridConfig.fromEmail,
      templateId: templateId,
      dynamicTemplateData: dynamicData
    };
    
    const result = await sgMail.send(msg);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body 
    };
  }
};

/**
 * Send template email to multiple recipients
 * @param {Array<string>} to - Array of recipient email addresses
 * @param {string} templateId - SendGrid template ID
 * @param {object} dynamicData - Template variables
 * @returns {Promise<object>} - SendGrid response
 */
export const sendBulkTemplateEmail = async (to, templateId, dynamicData = {}) => {
  try {
    const msg = {
      to: to,
      from: sendGridConfig.fromEmail,
      templateId: templateId,
      dynamicTemplateData: dynamicData
    };
    
    const result = await sgMail.sendMultiple(msg);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body 
    };
  }
};

// ==================== Attachment Functions ====================

/**
 * Send email with attachments
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 * @param {Array<object>} attachments - Array of attachment objects
 * @returns {Promise<object>} - SendGrid response
 */
export const sendEmailWithAttachments = async (to, subject, text, html, attachments) => {
  try {
    const msg = {
      to: to,
      from: sendGridConfig.fromEmail,
      subject: subject,
      text: text,
      html: html,
      attachments: attachments
    };
    
    const result = await sgMail.send(msg);
    return { success: true, data: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body 
    };
  }
};

// ==================== Verification/OTP Email Functions ====================

/**
 * Send OTP verification email
 * @param {string} to - Recipient email address
 * @param {string} otp - OTP code
 * @param {number} expiryMinutes - OTP expiry time in minutes
 * @returns {Promise<object>} - SendGrid response
 */
export const sendOTPEmail = async (to, otp, expiryMinutes = 10) => {
  const subject = 'Your Verification Code';
  const text = `Your verification code is: ${otp}. This code will expire in ${expiryMinutes} minutes.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Verification Code</h2>
      <p style="font-size: 16px; color: #666;">Your verification code is:</p>
      <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
        <h1 style="color: #4CAF50; letter-spacing: 5px; margin: 0;">${otp}</h1>
      </div>
      <p style="font-size: 14px; color: #999;">This code will expire in ${expiryMinutes} minutes.</p>
      <p style="font-size: 14px; color: #999;">If you didn't request this code, please ignore this email.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html);
};

/**
 * Send email verification link
 * @param {string} to - Recipient email address
 * @param {string} verificationUrl - Verification link URL
 * @returns {Promise<object>} - SendGrid response
 */
export const sendVerificationEmail = async (to, verificationUrl) => {
  const subject = 'Verify Your Email Address';
  const text = `Please verify your email address by clicking this link: ${verificationUrl}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Email Verification</h2>
      <p style="font-size: 16px; color: #666;">Thank you for signing up! Please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #4CAF50; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 14px; color: #999;">Or copy and paste this link in your browser:</p>
      <p style="font-size: 14px; color: #666; word-break: break-all;">${verificationUrl}</p>
      <p style="font-size: 14px; color: #999;">If you didn't create an account, please ignore this email.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html);
};

// ==================== Password Reset Functions ====================

/**
 * Send password reset email
 * @param {string} to - Recipient email address
 * @param {string} resetUrl - Password reset link URL
 * @returns {Promise<object>} - SendGrid response
 */
export const sendPasswordResetEmail = async (to, resetUrl) => {
  const subject = 'Reset Your Password';
  const text = `Reset your password by clicking this link: ${resetUrl}. This link will expire in 1 hour.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Password Reset Request</h2>
      <p style="font-size: 16px; color: #666;">We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #FF5722; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
          Reset Password
        </a>
      </div>
      <p style="font-size: 14px; color: #999;">Or copy and paste this link in your browser:</p>
      <p style="font-size: 14px; color: #666; word-break: break-all;">${resetUrl}</p>
      <p style="font-size: 14px; color: #999;">This link will expire in 1 hour.</p>
      <p style="font-size: 14px; color: #999;">If you didn't request a password reset, please ignore this email.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html);
};

// ==================== Welcome Email Functions ====================

/**
 * Send welcome email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's name
 * @returns {Promise<object>} - SendGrid response
 */
export const sendWelcomeEmail = async (to, userName = 'User') => {
  const subject = 'Welcome to Our Platform!';
  const text = `Welcome ${userName}! We're excited to have you on board.`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Welcome, ${userName}!</h2>
      <p style="font-size: 16px; color: #666;">We're excited to have you on board. Your account has been successfully created.</p>
      <p style="font-size: 16px; color: #666;">Get started by exploring our features and let us know if you need any help!</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" 
           style="background-color: #2196F3; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px;">
          Get Started
        </a>
      </div>
      <p style="font-size: 14px; color: #999;">If you have any questions, feel free to reach out to our support team.</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html);
};

// ==================== Notification Functions ====================

/**
 * Send notification email
 * @param {string} to - Recipient email address
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @returns {Promise<object>} - SendGrid response
 */
export const sendNotificationEmail = async (to, title, message) => {
  const subject = title;
  const text = message;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">${title}</h2>
      <p style="font-size: 16px; color: #666;">${message}</p>
    </div>
  `;
  
  return await sendEmail(to, subject, text, html);
};

// ==================== Utility Functions ====================

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - True if valid email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Create attachment object for SendGrid
 * @param {string} content - Base64 encoded content
 * @param {string} filename - File name
 * @param {string} type - MIME type
 * @param {string} disposition - 'attachment' or 'inline'
 * @returns {object} - Attachment object
 */
export const createAttachment = (content, filename, type, disposition = 'attachment') => {
  return {
    content: content,
    filename: filename,
    type: type,
    disposition: disposition
  };
};