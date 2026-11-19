import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

export const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const startOfDay = (date = new Date()) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfDay = (date = new Date()) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const isOverdue = (borrow, now = new Date()) =>
  !borrow.returnDate && new Date(borrow.dueDate) < now;

export const overdueDays = (borrow, now = new Date()) => {
  if (!isOverdue(borrow, now)) return 0;
  return Math.max(1, Math.ceil((now - new Date(borrow.dueDate)) / 86_400_000));
};

export const calculateFine = (borrow, now = new Date(), perDay = env.rules.finePerDay) =>
  overdueDays(borrow, now) * perDay;

export const normalizeString = (value) =>
  value ? String(value).trim().replace(/\s+/g, ' ') : value;

export const assertObjectId = (id, label = 'id') => {
  if (!id || !/^[0-9a-fA-F]{24}$/.test(String(id))) {
    throw ApiError.badRequest(`Invalid ${label}`);
  }
  return String(id);
};

export const escapeCsv = (value) => {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (rows) => {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(',')),
  ].join('\r\n');
};
