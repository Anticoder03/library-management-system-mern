import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { User } from '../models/User.js';
import { Reservation } from '../models/Reservation.js';
import { Fine } from '../models/Fine.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { Category } from '../models/Category.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const POPULATE_BORROW = [
  { path: 'book', select: 'title author coverImage' },
  { path: 'member', select: 'name email avatar' },
];

export const getStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    bookStats,
    issuedBooks,
    totalMembers,
    newMembersThisMonth,
    overdueBooks,
    pendingReservations,
    paidFines,
    unpaidFines,
    issuedThisMonth,
  ] = await Promise.all([
    Book.aggregate([
      {
        $group: {
          _id: null,
          titles: { $sum: 1 },
          totalCopies: { $sum: '$totalCopies' },
          availableCopies: { $sum: '$availableCopies' },
        },
      },
    ]),
    Borrow.countDocuments({ status: 'issued' }),
    User.countDocuments({ role: 'member' }),
    User.countDocuments({ role: 'member', createdAt: { $gte: startOfMonth } }),
    Borrow.countDocuments({ status: 'issued', dueDate: { $lt: now } }),
    Reservation.countDocuments({ status: { $in: ['pending', 'notified'] } }),
    Fine.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Fine.aggregate([
      { $match: { status: 'unpaid' } },
      { $group: { _id: null, amount: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Borrow.countDocuments({ issueDate: { $gte: startOfMonth } }),
  ]);

  const books = bookStats[0] || { titles: 0, totalCopies: 0, availableCopies: 0 };

  return {
    totalBooks: books.totalCopies,
    totalTitles: books.titles,
    availableBooks: books.availableCopies,
    issuedBooks,
    totalMembers,
    newMembersThisMonth,
    overdueBooks,
    pendingReservations,
    totalFineCollection: paidFines[0]?.amount || 0,
    unpaidFineAmount: unpaidFines[0]?.amount || 0,
    issuedThisMonth,
  };
};

export const getAnalytics = async () => {
  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

  const [monthlyBorrowing, mostBorrowed, availability, recentIssued, recentMembers, activities] =
    await Promise.all([
      Borrow.aggregate([
        { $match: { issueDate: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$issueDate' },
              month: { $month: '$issueDate' },
            },
            count: { $sum: 1 },
            returned: { $sum: { $cond: [{ $eq: ['$status', 'returned'] }, 1, 0] } },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Borrow.aggregate([
        { $group: { _id: '$book', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: '_id',
            as: 'book',
          },
        },
        { $unwind: '$book' },
        { $project: { _id: 0, count: 1, title: '$book.title', coverImage: '$book.coverImage' } },
      ]),
      Category.aggregate([
        {
          $lookup: {
            from: 'books',
            localField: '_id',
            foreignField: 'category',
            as: 'books',
          },
        },
        {
          $project: {
            _id: 0,
            name: 1,
            color: 1,
            total: { $sum: '$books.totalCopies' },
            available: { $sum: '$books.availableCopies' },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 8 },
      ]),
      Borrow.find({ status: 'issued' })
        .populate(POPULATE_BORROW)
        .sort({ issueDate: -1 })
        .limit(6),
      User.find({ role: 'member' })
        .select('name email avatar membershipDate')
        .sort({ createdAt: -1 })
        .limit(6),
      ActivityLog.find().populate('actor', 'name role').sort({ createdAt: -1 }).limit(8),
    ]);

  const monthLabels = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const monthlyMap = new Map(
    monthlyBorrowing.map((item) => [`${item._id.year}-${item._id.month}`, item])
  );
  const monthlyTrend = [];
  for (let i = 11; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const entry = monthlyMap.get(key);
    monthlyTrend.push({
      month: monthLabels[date.getMonth()],
      year: date.getFullYear(),
      borrowed: entry?.count || 0,
      returned: entry?.returned || 0,
    });
  }

  return {
    monthlyTrend,
    mostBorrowed,
    availability,
    recentIssued,
    recentMembers,
    activities,
  };
};

export const getDashboard = asyncHandler(async (_req, res) => {
  const [stats, analytics] = await Promise.all([getStats(), getAnalytics()]);
  sendSuccess(res, { data: { stats, analytics } });
});

export const getDashboardStats = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await getStats() });
});

export const getDashboardAnalytics = asyncHandler(async (_req, res) => {
  sendSuccess(res, { data: await getAnalytics() });
});
