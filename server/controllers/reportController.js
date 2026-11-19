import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { User } from '../models/User.js';
import { Fine } from '../models/Fine.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { isOverdue, toCsv, overdueDays } from '../utils/helpers.js';

const sendReport = (res, rows, filename) => {
  if (String(res.req.query.format).toLowerCase() === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(`\uFEFF${toCsv(rows)}`);
  }
  return sendSuccess(res, { data: rows, meta: { count: rows.length } });
};

export const borrowingReport = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.from || req.query.to) {
    filter.issueDate = {};
    if (req.query.from) filter.issueDate.$gte = new Date(req.query.from);
    if (req.query.to) filter.issueDate.$lte = new Date(req.query.to);
  }
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const borrows = await Borrow.find(filter)
    .populate('book', 'title author isbn')
    .populate('member', 'name email studentId')
    .sort({ issueDate: -1 })
    .limit(5000);

  const rows = borrows.map((borrow) => ({
    borrowId: borrow._id,
    bookTitle: borrow.book?.title || 'Deleted book',
    isbn: borrow.book?.isbn || '',
    memberName: borrow.member?.name || 'Deleted member',
    memberEmail: borrow.member?.email || '',
    issueDate: borrow.issueDate.toISOString().slice(0, 10),
    dueDate: borrow.dueDate.toISOString().slice(0, 10),
    returnDate: borrow.returnDate ? borrow.returnDate.toISOString().slice(0, 10) : '',
    status: borrow.status,
    daysLate: isOverdue(borrow) ? overdueDays(borrow) : 0,
  }));
  sendReport(res, rows, 'borrowing-report');
});

export const overdueReport = asyncHandler(async (req, res) => {
  const borrows = await Borrow.find({ status: 'issued', dueDate: { $lt: new Date() } })
    .populate('book', 'title author isbn')
    .populate('member', 'name email studentId phone')
    .sort({ dueDate: 1 })
    .limit(5000);

  const rows = borrows.map((borrow) => ({
    bookTitle: borrow.book?.title || 'Deleted book',
    memberName: borrow.member?.name || 'Deleted member',
    memberEmail: borrow.member?.email || '',
    phone: borrow.member?.phone || '',
    issueDate: borrow.issueDate.toISOString().slice(0, 10),
    dueDate: borrow.dueDate.toISOString().slice(0, 10),
    daysOverdue: overdueDays(borrow),
    estimatedFine: overdueDays(borrow) * env.rules.finePerDay,
  }));
  sendReport(res, rows, 'overdue-report');
});

export const finesReport = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.from || req.query.to) {
    filter.createdAt = {};
    if (req.query.from) filter.createdAt.$gte = new Date(req.query.from);
    if (req.query.to) filter.createdAt.$lte = new Date(req.query.to);
  }

  const fines = await Fine.find(filter)
    .populate('member', 'name email studentId')
    .populate('book', 'title')
    .sort({ createdAt: -1 })
    .limit(5000);

  const rows = fines.map((fine) => ({
    fineId: fine._id,
    memberName: fine.member?.name || 'Deleted member',
    memberEmail: fine.member?.email || '',
    bookTitle: fine.book?.title || '',
    amount: fine.amount,
    reason: fine.reason,
    status: fine.status,
    createdAt: fine.createdAt.toISOString().slice(0, 10),
    paidAt: fine.paidAt ? fine.paidAt.toISOString().slice(0, 10) : '',
  }));
  sendReport(res, rows, 'fines-report');
});

export const booksReport = asyncHandler(async (req, res) => {
  const books = await Book.find()
    .populate('category', 'name')
    .sort({ title: 1 })
    .limit(5000);
  const rows = books.map((book) => ({
    title: book.title,
    author: book.author,
    isbn: book.isbn || '',
    category: book.category?.name || '',
    publisher: book.publisher || '',
    publicationYear: book.publicationYear || '',
    totalCopies: book.totalCopies,
    availableCopies: book.availableCopies,
    shelfLocation: book.shelfLocation || '',
  }));
  sendReport(res, rows, 'books-report');
});

export const membersReport = asyncHandler(async (req, res) => {
  const members = await User.find({ role: { $in: ['member', 'librarian'] } })
    .sort({ createdAt: -1 })
    .limit(5000);
  const rows = members.map((member) => ({
    name: member.name,
    email: member.email,
    studentId: member.studentId || '',
    phone: member.phone || '',
    role: member.role,
    status: member.membershipStatus,
    membershipDate: member.membershipDate.toISOString().slice(0, 10),
  }));
  sendReport(res, rows, 'members-report');
});

export const popularBooksReport = asyncHandler(async (req, res) => {
  const books = await Borrow.aggregate([
    { $group: { _id: '$book', timesBorrowed: { $sum: 1 } } },
    { $sort: { timesBorrowed: -1 } },
    { $limit: 50 },
    {
      $lookup: { from: 'books', localField: '_id', foreignField: '_id', as: 'book' },
    },
    { $unwind: '$book' },
  ]);
  const rows = books.map((item) => ({
    title: item.book.title,
    author: item.book.author,
    isbn: item.book.isbn || '',
    timesBorrowed: item.timesBorrowed,
    totalCopies: item.book.totalCopies,
  }));
  sendReport(res, rows, 'popular-books-report');
});
