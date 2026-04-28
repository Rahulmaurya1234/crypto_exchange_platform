// src/services/email.service.js
import nodemailer from "nodemailer";
import { logger } from "../utils/logger.js";

/**
 * Create email transporter
 */
const createTransporter = () => {
    // Use environment variables for email configuration
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT || 587,
            secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // Development mode - use ethereal email (fake SMTP)
    // You can also log the email content
    return null;
};

/**
 * Send OTP email for verification
 */
export const sendOTPEmail = async (email, otp, otpType = "email_verification") => {
    try {
        const transporter = createTransporter();

        let subject, htmlContent;

        if (otpType === "email_verification") {
            subject = "Verify Your Email - Cryptians P2P";
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Email Verification</h2>
                    <p>Thank you for registering with Cryptians P2P!</p>
                    <p>Your email verification code is:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire in <strong>5 minutes</strong>.</p>
                    <p>If you didn't request this verification, please ignore this email.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated email. Please do not reply to this message.
                    </p>
                </div>
            `;
        } else if (otpType === "password_reset") {
            subject = "Reset Your Password - Cryptians P2P";
            htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Password Reset Request</h2>
                    <p>We received a request to reset your password.</p>
                    <p>Your password reset code is:</p>
                    <div style="background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>This code will expire in <strong>5 minutes</strong>.</p>
                    <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 12px;">
                        This is an automated email. Please do not reply to this message.
                    </p>
                </div>
            `;
        }

        if (!transporter) {
            // Development mode - just log the OTP
            console.log(`\n📧 Email OTP for ${email}: ${otp} (Type: ${otpType})\n`);
            logger.info("OTP Email (Development)", { email, otp, otpType });
            return true;
        }

        // Send email
        const info = await transporter.sendMail({
            from: `"Cryptians P2P" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: email,
            subject: subject,
            html: htmlContent,
        });

        logger.info("OTP email sent", { email, messageId: info.messageId });
        return true;
    } catch (error) {
        logger.error("Error sending OTP email", { error: error.message, email });

        // In development, still log the OTP even if email fails
        if (process.env.NODE_ENV === "development") {
            console.log(`\n📧 Email OTP for ${email}: ${otp} (Email failed, but OTP logged)\n`);
        }

        // Don't throw error - we still want registration to succeed even if email fails
        return false;
    }
};

/**
 * Send welcome email after successful verification
 */
export const sendWelcomeEmail = async (email, name) => {
    try {
        const transporter = createTransporter();

        if (!transporter) {
            logger.info("Welcome email skipped (Development)", { email });
            return true;
        }

        const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2563eb;">Welcome to Cryptians P2P!</h2>
                <p>Hi ${name || "there"},</p>
                <p>Your email has been successfully verified. You can now access all features of Cryptians P2P platform.</p>
                <p>Get started by:</p>
                <ul>
                    <li>Completing your profile</li>
                    <li>Submitting KYC for verification</li>
                    <li>Browsing available listings</li>
                    <li>Starting your first trade</li>
                </ul>
                <p>If you have any questions, feel free to contact our support team.</p>
                <p>Happy trading!</p>
                <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px;">
                    This is an automated email. Please do not reply to this message.
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: `"Cryptians P2P" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
            to: email,
            subject: "Welcome to Cryptians P2P!",
            html: htmlContent,
        });

        logger.info("Welcome email sent", { email });
        return true;
    } catch (error) {
        logger.error("Error sending welcome email", { error: error.message, email });
        return false;
    }
};

export default {
    sendOTPEmail,
    sendWelcomeEmail,
};
