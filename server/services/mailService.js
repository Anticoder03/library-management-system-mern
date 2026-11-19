import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

const getTransporter = () => {
  if (!env.mail.host) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.port === 465,
      auth: env.mail.user ? { user: env.mail.user, pass: env.mail.pass } : undefined,
    });
  }
  return transporter;
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const mailer = getTransporter();
  const resetUrl = `${env.clientUrls[0]}/reset-password?token=${resetToken}`;
  const text = `Use this link to reset your password: ${resetUrl}\nThis link expires in 15 minutes.`;

  if (!mailer) {
    console.warn('SMTP not configured — password reset token returned in API response.');
    return { delivered: false, resetToken, resetUrl };
  }

  await mailer.sendMail({
    from: env.mail.from,
    to: email,
    subject: 'Reset your Smart Library password',
    text,
    html: `<p>Use the link below to reset your password. It expires in 15 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`,
  });
  return { delivered: true };
};
