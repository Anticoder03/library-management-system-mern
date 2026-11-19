import crypto from 'crypto';
import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { sendPasswordResetEmail } from '../services/mailService.js';
import { logActivity } from '../services/activityService.js';
import { isProduction } from '../config/env.js';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || '',
  studentId: user.studentId || '',
  address: user.address || '',
  avatar: user.avatar || '',
  membershipDate: user.membershipDate,
  membershipStatus: user.membershipStatus,
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, studentId, address } = req.body;

  if (await User.exists({ email: email.toLowerCase() })) {
    throw ApiError.conflict('An account with this email already exists');
  }
  if (studentId && (await User.exists({ studentId }))) {
    throw ApiError.conflict('This student ID is already registered');
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'librarian' ? 'librarian' : 'member',
    phone,
    studentId,
    address,
  });

  const token = signToken(user);
  await logActivity(req, {
    action: 'REGISTER',
    entity: 'User',
    entityId: user._id,
    description: `${user.name} registered as ${user.role}`,
  });

  sendSuccess(res, {
    status: 201,
    message: 'Account created successfully',
    data: { user: sanitizeUser(user), token },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }
  if (user.membershipStatus !== 'active') {
    throw ApiError.forbidden('Your account is not active. Please contact the librarian.');
  }

  const token = signToken(user);
  await logActivity(req, {
    action: 'LOGIN',
    entity: 'User',
    entityId: user._id,
    description: `${user.name} signed in`,
  });

  sendSuccess(res, {
    message: 'Logged in successfully',
    data: { user: sanitizeUser(user), token },
  });
});

export const getMe = asyncHandler(async (req, res) => {
  sendSuccess(res, { data: { user: sanitizeUser(req.user) } });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });

  if (user) {
    const token = user.createResetToken();
    await user.save({ validateBeforeSave: false });
    const result = await sendPasswordResetEmail(user.email, token);

    await logActivity(req, {
      action: 'PASSWORD_RESET_REQUEST',
      entity: 'User',
      entityId: user._id,
      description: `Password reset requested for ${user.email}`,
    });

    return sendSuccess(res, {
      message: result.delivered
        ? 'Password reset link sent to your email'
        : 'Password reset token generated (email delivery is not configured)',
      data: !result.delivered && !isProduction ? { resetToken: result.resetToken } : undefined,
    });
  }

  // Do not reveal whether the email exists.
  sendSuccess(res, { message: 'If the email exists, a reset link has been sent' });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.body.token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  }).select('+resetPasswordToken +resetPasswordExpires');

  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired');

  user.password = req.body.password;
  user.clearResetToken();
  await user.save();

  await logActivity(req, {
    action: 'PASSWORD_RESET',
    entity: 'User',
    entityId: user._id,
    description: 'Password was reset',
  });

  sendSuccess(res, {
    message: 'Password reset successfully. You can now log in.',
    data: { token: signToken(user) },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'address', 'avatar'];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  sendSuccess(res, { message: 'Profile updated', data: { user: sanitizeUser(user) } });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect');
  }
  user.password = req.body.newPassword;
  await user.save();
  sendSuccess(res, { message: 'Password changed successfully' });
});
