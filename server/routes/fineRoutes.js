import { Router } from 'express';
import { getFines, createFine, payFine, waiveFine } from '../controllers/fineController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { fineValidator, fineIdValidator } from '../validators/miscValidator.js';

const router = Router();
router.use(protect);

router.get('/', getFines);
router.post('/', authorize('admin', 'librarian'), fineValidator, validate, createFine);
router.put('/:id/pay', authorize('admin', 'librarian'), fineIdValidator, validate, payFine);
router.put('/:id/waive', authorize('admin'), fineIdValidator, validate, waiveFine);

export default router;
