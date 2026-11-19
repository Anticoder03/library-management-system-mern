import { Router } from 'express';
import {
  getDashboard,
  getDashboardStats,
  getDashboardAnalytics,
} from '../controllers/dashboardController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();
router.use(protect, authorize('admin', 'librarian'));

router.get('/stats', getDashboardStats);
router.get('/analytics', getDashboardAnalytics);
router.get('/', getDashboard);

export default router;
