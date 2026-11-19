import { body, param } from 'express-validator';

export const memberValidator = [
  body('name').trim().notEmpty().withMessage('Full name is required').isLength({ min: 2, max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').optional({ nullable: true }).trim(),
  body('studentId').optional({ nullable: true }).trim(),
  body('address').optional({ nullable: true }).trim(),
  body('role').optional().isIn(['member', 'librarian']),
  body('membershipStatus').optional().isIn(['active', 'suspended', 'inactive']),
];

export const memberUpdateValidator = [
  param('id').isMongoId().withMessage('Invalid member id'),
  body('name').optional().trim().notEmpty().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional({ nullable: true }).trim(),
  body('studentId').optional({ nullable: true }).trim(),
  body('address').optional({ nullable: true }).trim(),
  body('role').optional().isIn(['member', 'librarian']),
  body('membershipStatus').optional().isIn(['active', 'suspended', 'inactive']),
];

export const memberIdValidator = [param('id').isMongoId().withMessage('Invalid member id')];
