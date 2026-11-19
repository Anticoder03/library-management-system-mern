import { Fine } from '../models/Fine.js';
import { Borrow } from '../models/Borrow.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, getPagination, sendSuccess } from '../utils/response.js';
import { notify } from '../services/notificationService.js';
import { logActivity } from '../services/activityService.js';

const POPULATE = [
  { path: 'member', select: 'name email studentId' },
  { path: 'book', select: 'title author coverImage' },
  { path: 'borrow', select: 'issueDate dueDate returnDate' },
];

export const getFines = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.user.role === 'member') filter.member = req.user._id;
  else if (req.query.member) filter.member = req.query.member;
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.reason && req.query.reason !== 'all') filter.reason = req.query.reason;

  const [fines, total] = await Promise.all([
    Fine.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Fine.countDocuments(filter),
  ]);

  const totals = await Fine.aggregate([
    { $match: filter },
    {
      $group: {
        _id: '$status',
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  sendSuccess(res, {
    data: fines,
    meta: buildPaginationMeta({ page, limit, total }),
    summary: {
      unpaid: totals.find((t) => t._id === 'unpaid') || { amount: 0, count: 0 },
      paid: totals.find((t) => t._id === 'paid') || { amount: 0, count: 0 },
      waived: totals.find((t) => t._id === 'waived') || { amount: 0, count: 0 },
    },
  });
});

export const createFine = asyncHandler(async (req, res) => {
  const { member, amount, reason, description, borrow } = req.body;
  const fine = await Fine.create({
    member,
    amount,
    reason: reason || 'other',
    description,
    borrow: borrow || undefined,
  });

  await notify({
    recipient: member,
    type: 'fine_created',
    title: 'New fine',
    message: `A fine of $${amount} has been recorded: ${reason || 'other'}.`,
    relatedFine: fine._id,
    link: '/fines',
  });
  await logActivity(req, {
    action: 'FINE_CREATED',
    entity: 'Fine',
    entityId: fine._id,
    description: `Fine of $${amount} created`,
  });

  sendSuccess(res, { status: 201, message: 'Fine created', data: fine });
});

export const payFine = asyncHandler(async (req, res) => {
  const fine = await Fine.findById(req.params.id);
  if (!fine) throw ApiError.notFound('Fine not found');
  if (fine.status !== 'unpaid') throw ApiError.badRequest('This fine is already settled');

  fine.status = 'paid';
  fine.paidAt = new Date();
  fine.paidBy = req.user._id;
  fine.paymentMethod = req.body.paymentMethod || 'cash';
  await fine.save();

  if (fine.borrow) {
    await Borrow.findByIdAndUpdate(fine.borrow, { finePaid: true });
  }

  await notify({
    recipient: fine.member,
    type: 'fine_paid',
    title: 'Fine paid',
    message: `Your payment of $${fine.amount} has been recorded. Thank you!`,
    relatedFine: fine._id,
    link: '/fines',
  });
  await logActivity(req, {
    action: 'FINE_PAID',
    entity: 'Fine',
    entityId: fine._id,
    description: `Fine of $${fine.amount} marked as paid`,
  });

  sendSuccess(res, { message: 'Payment recorded successfully', data: fine });
});

export const waiveFine = asyncHandler(async (req, res) => {
  const fine = await Fine.findByIdAndUpdate(
    req.params.id,
    { status: 'waived', paidAt: new Date(), paidBy: req.user._id },
    { new: true }
  );
  if (!fine) throw ApiError.notFound('Fine not found');
  if (fine.borrow) await Borrow.findByIdAndUpdate(fine.borrow, { finePaid: true });
  sendSuccess(res, { message: 'Fine waived', data: fine });
});
