import { Router } from 'express';
import {
  createReservation,
  getReservations,
  updateReservation,
  deleteReservation,
  expireStaleReservations,
} from '../controllers/reservationController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  reservationValidator,
  reservationIdValidator,
} from '../validators/miscValidator.js';
import { body } from 'express-validator';

const router = Router();
router.use(protect);

router.post('/', reservationValidator, validate, createReservation);
router.get('/', getReservations);
router.post('/expire', authorize('admin', 'librarian'), expireStaleReservations);
router.put(
  '/:id',
  authorize('admin', 'librarian'),
  [
    reservationIdValidator[0],
    body('status')
      .optional()
      .isIn(['pending', 'notified', 'fulfilled', 'cancelled', 'expired']),
  ],
  validate,
  updateReservation
);
router.delete('/:id', reservationIdValidator, validate, deleteReservation);

export default router;
