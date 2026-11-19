import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.split(' ')[1] : null;

  if (!token) throw ApiError.unauthorized('No token provided. Please log in.');

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw ApiError.unauthorized('Invalid or expired token. Please log in again.');
  }

  const user = await User.findById(decoded.id).select('+password');
  if (!user) throw ApiError.unauthorized('User belonging to this token no longer exists');
  if (user.membershipStatus !== 'active') {
    throw ApiError.forbidden('Your account is not active. Please contact the librarian.');
  }

  req.user = user;
  req.token = token;
  next();
});

export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    throw ApiError.forbidden('You do not have permission to perform this action');
  }
  next();
};

export const staffOnly = authorize('admin', 'librarian');

export const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  });
