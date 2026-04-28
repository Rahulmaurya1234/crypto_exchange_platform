// src/utils/email.util.js
import nodemailer from "nodemailer";

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_USER,
  SMTP_PASS,
  EMAIL_FROM,
  ADMIN_KYC_EMAIL,
} = process.env;

let transporter = null;

if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465, // true for 465, false for others
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
} else {
  console.warn(
    "[email.util] SMTP not configured. Emails will be logged to console only."
  );
}

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!to) {
    console.warn("[email.util] No 'to' address provided.");
    return;
  }

  if (!transporter) {
    console.log("[email.util] Mock email:", { to, subject, text, html });
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject,
    text,
    html,
  });
};

// handy getter so you don’t hardcode admin emails
export const getKycAdminEmail = () => {
  return ADMIN_KYC_EMAIL || EMAIL_FROM || SMTP_USER;
};
