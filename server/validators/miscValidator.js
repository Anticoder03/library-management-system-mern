import { body, param } from 'express-validator';

export const issueValidator = [
  body('book').isMongoId().withMessage('Valid book id is required'),
  body('member').isMongoId().withMessage('Valid member id is required'),
  body('dueDate')
    .optional({ nullable: true })
    .isISO8601()
    .toDate()
    .withMessage('Invalid due date'),
  body('notes').optional({ nullable: true }).trim(),
];

export const returnValidator = [
  body('borrowId').isMongoId().withMessage('Valid borrow id is required'),
  body('condition').optional({ nullable: true }).trim(),
  body('notes').optional({ nullable: true }).trim(),
];

export const borrowIdValidator = [param('id').isMongoId().withMessage('Invalid borrow id')];
export const memberParamValidator = [
  param('memberId').isMongoId().withMessage('Invalid member id'),
];

export const reservationValidator = [
  body('book').isMongoId().withMessage('Valid book id is required'),
  body('notes').optional({ nullable: true }).trim(),
];

export const reservationIdValidator = [param('id').isMongoId().withMessage('Invalid reservation id')];

export const fineValidator = [
  body('member').isMongoId().withMessage('Valid member id is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('reason').optional().isIn(['overdue', 'damage', 'lost', 'other']),
  body('description').optional({ nullable: true }).trim(),
];

export const fineIdValidator = [param('id').isMongoId().withMessage('Invalid fine id')];

export const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required').isLength({ max: 60 }),
  body('description').optional({ nullable: true }).trim(),
  body('color').optional({ nullable: true }).trim(),
  body('icon').optional({ nullable: true }).trim(),
];
