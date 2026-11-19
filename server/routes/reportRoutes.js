import { Router } from 'express';
import {
  borrowingReport,
  overdueReport,
  finesReport,
  booksReport,
  membersReport,
  popularBooksReport,
} from '../controllers/reportController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin', 'librarian'));

router.get('/borrowing', borrowingReport);
router.get('/overdue', overdueReport);
router.get('/fines', finesReport);
router.get('/books', booksReport);
router.get('/members', membersReport);
router.get('/popular-books', popularBooksReport);

export default router;
