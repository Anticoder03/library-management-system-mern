import { Router } from 'express';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/categoryController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { categoryValidator } from '../validators/miscValidator.js';
import { param } from 'express-validator';

const router = Router();
const staff = [protect, authorize('admin', 'librarian')];

router.get('/', protect, getCategories);
router.post('/', ...staff, categoryValidator, validate, createCategory);
router.put(
  '/:id',
  ...staff,
  [param('id').isMongoId(), categoryValidator[0].optional(), categoryValidator[1].optional()],
  validate,
  updateCategory
);
router.delete('/:id', ...staff, [param('id').isMongoId()], validate, deleteCategory);

export default router;
