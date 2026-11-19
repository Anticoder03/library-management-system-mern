import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { User } from '../models/User.js';
import { Reservation } from '../models/Reservation.js';
import { Fine } from '../models/Fine.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, buildSort, getPagination, sendSuccess } from '../utils/response.js';
import { addDays, calculateFine, isOverdue, overdueDays } from '../utils/helpers.js';
import { notify } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

const POPULATE = [
  { path: 'book', select: 'title author isbn coverImage category shelfLocation' },
  { path: 'member', select: 'name email studentId phone' },
  { path: 'issuedBy', select: 'name' },
];

const shapeBorrow = (borrow) => ({
  ...borrow.toObject(),
  daysOverdue: isOverdue(borrow) ? overdueDays(borrow) : 0,
});

export const issueBook = asyncHandler(async (req, res) => {
  const { book: bookId, member: memberId, notes } = req.body;

  const [member, book] = await Promise.all([
    User.findById(memberId),
    Book.findById(bookId).populate('category', 'name'),
  ]);

  if (!member || !['member', 'librarian'].includes(member.role)) {
    throw ApiError.notFound('Member not found');
  }
  if (member.membershipStatus !== 'active') throw ApiError.badRequest('Member account is not active');
  if (!book || book.isActive === false) throw ApiError.notFound('Book not found');

  const activeBorrows = await Borrow.countDocuments({ member: member._id, status: 'issued' });
  if (activeBorrows >= env.rules.borrowLimit) {
    throw ApiError.badRequest(`Borrowing limit reached (${env.rules.borrowLimit} books)`);
  }

  // Atomic check-and-decrement prevents oversubscribing the last available copy.
  const updatedBook = await Book.findOneAndUpdate(
    { _id: book._id, availableCopies: { $gt: 0 }, isActive: { $ne: false } },
    { $inc: { availableCopies: -1 } },
    { new: true }
  );
  if (!updatedBook) throw ApiError.conflict('This book is currently unavailable');

  const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : addDays(new Date(), env.rules.loanPeriodDays);
  if (Number.isNaN(dueDate.getTime()) || dueDate <= new Date()) {
    throw ApiError.badRequest('Due date must be in the future');
  }

  let borrow;
  try {
    borrow = await Borrow.create({
      book: book._id,
      member: member._id,
      issuedBy: req.user._id,
      issueDate: new Date(),
      dueDate,
      notes,
    });
  } catch (error) {
    await Book.findByIdAndUpdate(book._id, { $inc: { availableCopies: 1 } });
    throw error;
  }

  // Fulfil an existing reservation for this member, if any.
  await Reservation.findOneAndUpdate(
    { book: book._id, member: member._id, status: { $in: ['pending', 'notified'] } },
    { status: 'fulfilled', fulfilledAt: new Date(), handledBy: req.user._id }
  );

  await notify({
    recipient: member._id,
    type: 'book_issued',
    title: 'Book issued',
    message: `"${book.title}" has been issued to you. Due date: ${dueDate.toLocaleDateString()}.`,
    relatedBook: book._id,
    relatedBorrow: borrow._id,
    link: '/my-borrows',
  });

  await logActivity(req, {
    action: 'BOOK_ISSUED',
    entity: 'Borrow',
    entityId: borrow._id,
    description: `"${book.title}" issued to ${member.name}`,
  });

  const populated = await borrow.populate(POPULATE);
  sendSuccess(res, { status: 201, message: 'Book issued successfully', data: shapeBorrow(populated) });
});

export const returnBook = asyncHandler(async (req, res) => {
  const { borrowId, condition, notes } = req.body;
  const borrow = await Borrow.findById(borrowId);
  if (!borrow) throw ApiError.notFound('Borrow record not found');
  if (borrow.status !== 'issued') throw ApiError.badRequest('This book has already been returned');

  const now = new Date();
  const daysLate = overdueDays(borrow, now);
  const fineAmount = calculateFine(borrow, now);

  borrow.returnDate = now;
  borrow.status = 'returned';
  borrow.fineAmount = fineAmount;
  borrow.finePaid = fineAmount === 0;
  if (condition) borrow.conditionOnReturn = condition;
  if (notes) borrow.notes = notes;
  await borrow.save();

  await Book.findByIdAndUpdate(borrow.book, { $inc: { availableCopies: 1 } });

  if (fineAmount > 0) {
    await Fine.create({
      member: borrow.member,
      borrow: borrow._id,
      book: borrow.book,
      amount: fineAmount,
      reason: 'overdue',
      description: `Late return: ${daysLate} day(s) overdue`,
    });
    await notify({
      recipient: borrow.member,
      type: 'fine_created',
      title: 'Overdue fine',
      message: `A fine of $${fineAmount} was added for returning a book ${daysLate} day(s) late.`,
      relatedBorrow: borrow._id,
      relatedBook: borrow.book,
      link: '/fines',
    });
  }

  // Notify the first member in the reservation queue.
  const nextReservation = await Reservation.findOneAndUpdate(
    { book: borrow.book, status: 'pending' },
    { status: 'notified', notifiedAt: now, expiresAt: addDays(now, 2) },
    { sort: { reservedAt: 1 }, new: true }
  );
  if (nextReservation) {
    const book = await Book.findById(borrow.book).select('title');
    await notify({
      recipient: nextReservation.member,
      type: 'reservation_available',
      title: 'Reserved book is available',
      message: `"${book?.title}" is now available. Please issue it within 48 hours.`,
      relatedBook: borrow.book,
      link: '/reservations',
    });
  }

  await notify({
    recipient: borrow.member,
    type: 'book_returned',
    title: 'Book returned',
    message: 'Your book return has been processed successfully.',
    relatedBorrow: borrow._id,
    link: '/my-borrows',
  });

  await logActivity(req, {
    action: 'BOOK_RETURNED',
    entity: 'Borrow',
    entityId: borrow._id,
    description: `Book returned${fineAmount ? ` with a $${fineAmount} fine` : ''}`,
  });

  const populated = await borrow.populate(POPULATE);
  sendSuccess(res, {
    message: fineAmount ? `Book returned. Overdue fine: $${fineAmount}` : 'Book returned successfully',
    data: shapeBorrow(populated),
  });
});

export const getBorrows = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status === 'overdue') {
    filter.status = 'issued';
    filter.dueDate = { $lt: new Date() };
  } else if (req.query.status && req.query.status !== 'all') {
    filter.status = req.query.status;
  }
  if (req.query.member) filter.member = req.query.member;
  if (req.query.book) filter.book = req.query.book;
  if (req.query.from || req.query.to) {
    filter.issueDate = {};
    if (req.query.from) filter.issueDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.issueDate.$lte = new Date(req.query.to);
  }

  const sort = buildSort(req.query.sort, ['issueDate', 'dueDate', 'returnDate', 'createdAt'], '-issueDate');
  const [borrows, total] = await Promise.all([
    Borrow.find(filter).populate(POPULATE).sort(sort).skip(skip).limit(limit),
    Borrow.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: borrows.map(shapeBorrow),
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

export const getMemberBorrows = asyncHandler(async (req, res) => {
  const targetId = req.params.memberId || req.user._id;
  const { page, limit, skip } = getPagination(req.query);
  const filter = { member: targetId };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [borrows, total] = await Promise.all([
    Borrow.find(filter).populate(POPULATE).sort({ issueDate: -1 }).skip(skip).limit(limit),
    Borrow.countDocuments(filter),
  ]);

  sendSuccess(res, {
    data: borrows.map(shapeBorrow),
    meta: buildPaginationMeta({ page, limit, total }),
  });
});

export const getOverdueBorrows = asyncHandler(async (req, res) => {
  const borrows = await Borrow.find({ status: 'issued', dueDate: { $lt: new Date() } })
    .populate(POPULATE)
    .sort({ dueDate: 1 });
  sendSuccess(res, { data: borrows.map(shapeBorrow) });
});

export const renewBorrow = asyncHandler(async (req, res) => {
  const borrow = await Borrow.findById(req.params.id);
  if (!borrow || borrow.status !== 'issued') throw ApiError.notFound('Active borrow not found');
  if (await Reservation.exists({ book: borrow.book, status: { $in: ['pending', 'notified'] } })) {
    throw ApiError.conflict('Cannot renew: this book has pending reservations');
  }
  if (borrow.renewalCount >= 2) throw ApiError.badRequest('Maximum renewal limit reached');

  borrow.dueDate = addDays(borrow.dueDate, env.rules.loanPeriodDays);
  borrow.renewalCount += 1;
  await borrow.save();

  sendSuccess(res, { message: 'Loan renewed', data: shapeBorrow(await borrow.populate(POPULATE)) });
});
