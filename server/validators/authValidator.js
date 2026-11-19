import { body } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\S/)
    .withMessage('Password cannot be blank'),
  body('role')
    .optional()
    .isIn(['member', 'librarian'])
    .withMessage('Invalid role. Admin accounts cannot be self-registered.'),
  body('phone').optional({ nullable: true }).trim(),
  body('studentId').optional({ nullable: true }).trim(),
  body('address').optional({ nullable: true }).trim(),
];

export const loginValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('phone').optional({ nullable: true }).trim(),
  body('address').optional({ nullable: true }).trim(),
  body('avatar').optional({ nullable: true }).trim(),
];
