import { body, param, query } from 'express-validator';

const field = (name, optional) => {
  const chain = body(name);
  return optional ? chain.optional() : chain;
};

const requiredText = (name, optional, message, max) => {
  const chain = field(name, optional).trim().isLength({ max }).withMessage(message);
  return optional ? chain : chain.notEmpty().withMessage(message);
};

const rulesFor = (optional) => [
  requiredText('title', optional, 'Title is required', 200),
  requiredText('author', optional, 'Author is required', 120),
  field('category', optional).isMongoId().withMessage('Valid category is required'),
  field('isbn', true).trim(),
  field('description', true).trim(),
  field('publisher', true).trim(),
  field('publicationYear', true)
    .isInt({ min: 1000, max: 2100 })
    .withMessage('Invalid publication year'),
  field('totalCopies', true).isInt({ min: 1 }).withMessage('Total copies must be at least 1'),
  field('availableCopies', true).isInt({ min: 0 }),
  field('shelfLocation', true).trim(),
  field('language', true).trim(),
  // JSON clients send an array; multipart forms (image upload) send a
  // comma-separated string that pickBookFields() converts to an array.
  field('tags', true)
    .custom((value) => Array.isArray(value) || typeof value === 'string')
    .withMessage('Tags must be an array or a comma-separated string'),
];

export const bookValidator = rulesFor(false);

// Updates may contain only the fields being changed.
export const bookUpdateValidator = [
  param('id').isMongoId().withMessage('Invalid book id'),
  ...rulesFor(true),
];

export const bookIdValidator = [param('id').isMongoId().withMessage('Invalid book id')];

export const bookQueryValidator = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
];
