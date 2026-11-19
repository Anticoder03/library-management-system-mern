import { Router } from 'express';
import {
  getBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  getFeaturedBooks,
} from '../controllers/bookController.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
import { bookValidator, bookIdValidator, bookUpdateValidator } from '../validators/bookValidator.js';

const router = Router();
const staff = [protect, authorize('admin', 'librarian')];

router.use(protect);
router.get('/featured', getFeaturedBooks);
router.get('/', getBooks);
router.get('/:id', bookIdValidator, validate, getBook);
router.post('/', ...staff, upload.single('coverImage'), bookValidator, validate, createBook);
router.put('/:id', ...staff, upload.single('coverImage'), bookUpdateValidator, validate, updateBook);
router.delete('/:id', ...staff, bookIdValidator, validate, deleteBook);

export default router;
