import { Router } from 'express';
import {
  issueBook,
  returnBook,
  getBorrows,
  getMemberBorrows,
  getOverdueBorrows,
  renewBorrow,
} from '../controllers/borrowController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  issueValidator,
  returnValidator,
  borrowIdValidator,
  memberParamValidator,
} from '../validators/miscValidator.js';
import { param } from 'express-validator';

const router = Router();
const staff = [protect, authorize('admin', 'librarian')];

router.get('/overdue', ...staff, getOverdueBorrows);
router.get('/me', protect, getMemberBorrows);
router.get('/member/:memberId', ...staff, memberParamValidator, validate, getMemberBorrows);
router.get('/', ...staff, getBorrows);
router.post('/issue', ...staff, issueValidator, validate, issueBook);
router.post('/return', ...staff, returnValidator, validate, returnBook);
router.put(
  '/renew/:id',
  ...staff,
  [param('id').isMongoId()],
  validate,
  renewBorrow
);

export default router;
