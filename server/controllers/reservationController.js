import { Reservation } from '../models/Reservation.js';
import { Book } from '../models/Book.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, getPagination, sendSuccess } from '../utils/response.js';
import { notify } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

const POPULATE = [
  { path: 'book', select: 'title author isbn coverImage availableCopies' },
  { path: 'member', select: 'name email studentId' },
];

const withQueuePosition = async (reservations) =>
  Promise.all(
    reservations.map(async (reservation) => {
      const object = reservation.toObject?.() || reservation;
      const position = await Reservation.countDocuments({
        book: object.book?._id || object.book,
        status: { $in: ['pending', 'notified'] },
        reservedAt: { $lte: object.reservedAt },
      });
      return { ...object, queuePosition: position };
    })
  );

export const createReservation = asyncHandler(async (req, res) => {
  const { book: bookId, notes } = req.body;
  const book = await Book.findById(bookId);
  if (!book || book.isActive === false) throw ApiError.notFound('Book not found');
  if (book.availableCopies > 0) {
    throw ApiError.badRequest('This book is available now — you can borrow it directly');
  }

  const existing = await Reservation.findOne({
    book: bookId,
    member: req.user._id,
    status: { $in: ['pending', 'notified'] },
  });
  if (existing) throw ApiError.conflict('You already have an active reservation for this book');

  const activeCount = await Reservation.countDocuments({
    member: req.user._id,
    status: { $in: ['pending', 'notified'] },
  });
  if (activeCount >= env.rules.maxReservations) {
    throw ApiError.badRequest(`You can reserve up to ${env.rules.maxReservations} books at a time`);
  }

  const reservation = await Reservation.create({ book: bookId, member: req.user._id, notes });
  await notify({
    recipient: req.user._id,
    type: 'general',
    title: 'Reservation placed',
    message: `You are in the queue for "${book.title}". We will notify you when it is available.`,
    relatedBook: book._id,
    link: '/reservations',
  });
  await logActivity(req, {
    action: 'RESERVATION_CREATED',
    entity: 'Reservation',
    entityId: reservation._id,
    description: `Reservation placed for "${book.title}"`,
  });

  sendSuccess(res, {
    status: 201,
    message: 'Book reserved successfully',
    data: (await withQueuePosition([await reservation.populate(POPULATE)]))[0],
  });
});

export const getReservations = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role === 'member') filter.member = req.user._id;
  else if (req.query.member) filter.member = req.query.member;
  if (req.query.book) filter.book = req.query.book;
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [reservations, total] = await Promise.all([
    Reservation.find(filter).populate(POPULATE).sort({ reservedAt: -1 }).skip(skip).limit(limit),
    Reservation.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: await withQueuePosition(reservations),
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

export const updateReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate('book', 'title');
  if (!reservation) throw ApiError.notFound('Reservation not found');

  const { status, notes } = req.body;
  if (status) {
    if (!['pending', 'notified', 'fulfilled', 'cancelled', 'expired'].includes(status)) {
      throw ApiError.badRequest('Invalid reservation status');
    }
    if (status === 'fulfilled') reservation.fulfilledAt = new Date();
    if (status === 'notified') {
      reservation.notifiedAt = new Date();
      reservation.expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    }
    reservation.status = status;
    reservation.handledBy = req.user._id;
  }
  if (notes !== undefined) reservation.notes = notes;
  await reservation.save();

  if (status) {
    await notify({
      recipient: reservation.member,
      type: status === 'cancelled' ? 'general' : 'reservation_available',
      title: `Reservation ${status}`,
      message: `Your reservation for "${reservation.book?.title}" is now ${status}.`,
      relatedBook: reservation.book?._id,
      link: '/reservations',
    });
  }

  await logActivity(req, {
    action: 'RESERVATION_UPDATED',
    entity: 'Reservation',
    entityId: reservation._id,
    description: `Reservation marked as ${status || 'updated'}`,
  });

  sendSuccess(res, { message: 'Reservation updated', data: reservation });
});

export const deleteReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw ApiError.notFound('Reservation not found');
  if (req.user.role === 'member' && String(reservation.member) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only cancel your own reservations');
  }
  await reservation.deleteOne();
  sendSuccess(res, { message: 'Reservation cancelled' });
});

export const expireStaleReservations = asyncHandler(async (_req, res) => {
  const result = await Reservation.updateMany(
    { status: 'notified', expiresAt: { $lt: new Date() } },
    { status: 'expired' }
  );
  sendSuccess(res, { message: `${result.modifiedCount} stale reservations expired` });
});
