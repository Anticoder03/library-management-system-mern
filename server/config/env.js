import dotenv from 'dotenv';

dotenv.config();

const number = (key, fallback) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
};

export const env = {
  port: number('PORT', 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/smart_library',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  jwtResetExpire: process.env.JWT_RESET_EXPIRE || '15m',
  // Render exposes RENDER_EXTERNAL_URL automatically for web services. Using it
  // as a fallback keeps same-origin POST/PUT requests (which carry an Origin
  // header) allowed even before CLIENT_URL is configured.
  clientUrls: (process.env.CLIENT_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  mail: {
    host: process.env.SMTP_HOST,
    port: number('SMTP_PORT', 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.MAIL_FROM || 'Smart Library <no-reply@smartlibrary.local>',
  },
  rules: {
    borrowLimit: number('BORROW_LIMIT', 5),
    loanPeriodDays: number('LOAN_PERIOD_DAYS', 14),
    finePerDay: number('FINE_PER_DAY', 5),
    maxReservations: number('MAX_RESERVATIONS', 3),
  },
};

export const isProduction = env.nodeEnv === 'production';
