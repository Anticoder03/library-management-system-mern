import { Router } from 'express';
import { getActivities } from '../controllers/activityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin', 'librarian'));
router.get('/', getActivities);

export default router;
