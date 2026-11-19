import { Router } from 'express';
import {
  getNotifications,
  markNotificationRead,
  markAllRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { param } from 'express-validator';

const router = Router();
router.use(protect);

router.get('/', getNotifications);
router.put('/read-all', markAllRead);
router.put('/:id/read', [param('id').isMongoId()], validate, markNotificationRead);
router.delete('/:id', [param('id').isMongoId()], validate, deleteNotification);

export default router;
