import { Book } from '../models/Book.js';
import { Borrow } from '../models/Borrow.js';
import { Reservation } from '../models/Reservation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, buildSort, getPagination, sendSuccess } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';
import { removeFile } from '../middleware/upload.js';
import { normalizeString } from '../utils/helpers.js';

const populateCategory = (query) =>
  query.populate({ path: 'category', select: 'name color icon' }).populate({
    path: 'addedBy',
    select: 'name',
  });

const pickBookFields = (body) => {
  const fields = [
    'title',
    'author',
    'isbn',
    'description',
    'category',
    'publisher',
    'publicationYear',
    'shelfLocation',
    'totalCopies',
    'availableCopies',
    'language',
    'tags',
  ];
  const data = {};
  fields.forEach((field) => {
    if (body[field] !== undefined) data[field] = body[field];
  });
  ['title', 'author', 'isbn', 'description', 'publisher', 'shelfLocation', 'language'].forEach(
    (field) => {
      if (typeof data[field] === 'string') data[field] = normalizeString(data[field]);
    }
  );
  if (data.tags && typeof data.tags === 'string') {
    data.tags = data.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return data;
};

export const getBooks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { isActive: { $ne: false } };

  if (req.query.search) {
    const search = normalizeString(req.query.search);
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { author: { $regex: search, $options: 'i' } },
      { isbn: { $regex: search, $options: 'i' } },
      { publisher: { $regex: search, $options: 'i' } },
    ];
  }
  if (req.query.category && req.query.category !== 'all') filter.category = req.query.category;
  if (req.query.availability === 'available') filter.availableCopies = { $gt: 0 };
  if (req.query.availability === 'unavailable') filter.availableCopies = 0;
  if (req.query.author) filter.author = { $regex: normalizeString(req.query.author), $options: 'i' };
  if (req.query.minYear) filter.publicationYear = { $gte: Number(req.query.minYear) };
  if (req.query.maxYear) {
    filter.publicationYear = { ...(filter.publicationYear || {}), $lte: Number(req.query.maxYear) };
  }

  const sort = buildSort(req.query.sort, [
    'title',
    'author',
    'publicationYear',
    'availableCopies',
    'createdAt',
    'totalCopies',
  ]);

  const [books, total] = await Promise.all([
    populateCategory(Book.find(filter)).sort(sort).skip(skip).limit(limit),
    Book.countDocuments(filter),
  ]);

  sendSuccess(res, { data: books, meta: buildPaginationMeta({ page, limit, total }) });
});

export const getBook = asyncHandler(async (req, res) => {
  const book = await populateCategory(Book.findById(req.params.id));
  if (!book) throw ApiError.notFound('Book not found');

  const activeBorrows = await Borrow.countDocuments({ book: book._id, status: 'issued' });
  const queue = await Reservation.countDocuments({
    book: book._id,
    status: { $in: ['pending', 'notified'] },
  });

  sendSuccess(res, {
    data: {
      ...book.toObject(),
      activeBorrows,
      reservationQueue: queue,
    },
  });
});

export const createBook = asyncHandler(async (req, res) => {
  const data = pickBookFields(req.body);
  if (data.availableCopies === undefined) data.availableCopies = data.totalCopies ?? 1;
  if (data.availableCopies > (data.totalCopies ?? 1)) {
    throw ApiError.badRequest('Available copies cannot exceed total copies');
  }
  if (req.file) data.coverImage = `/uploads/${req.file.filename}`;
  data.addedBy = req.user._id;

  const book = await Book.create(data);
  await logActivity(req, {
    action: 'BOOK_CREATED',
    entity: 'Book',
    entityId: book._id,
    description: `Book "${book.title}" was added`,
  });

  sendSuccess(res, { status: 201, message: 'Book added successfully', data: book });
});

export const updateBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw ApiError.notFound('Book not found');

  const data = pickBookFields(req.body);
  const totalCopies = data.totalCopies ?? book.totalCopies;
  const availableCopies = data.availableCopies ?? book.availableCopies;
  const activeBorrows = await Borrow.countDocuments({ book: book._id, status: 'issued' });

  if (availableCopies > totalCopies) {
    throw ApiError.badRequest('Available copies cannot exceed total copies');
  }
  if (availableCopies + activeBorrows > totalCopies) {
    throw ApiError.badRequest(
      `Cannot reduce copies below the ${activeBorrows} currently issued copy/copies`
    );
  }

  Object.assign(book, data);
  if (req.file) {
    removeFile(book.coverImage);
    book.coverImage = `/uploads/${req.file.filename}`;
  }
  await book.save();

  await logActivity(req, {
    action: 'BOOK_UPDATED',
    entity: 'Book',
    entityId: book._id,
    description: `Book "${book.title}" was updated`,
  });

  sendSuccess(res, { message: 'Book updated successfully', data: book });
});

export const deleteBook = asyncHandler(async (req, res) => {
  const book = await Book.findById(req.params.id);
  if (!book) throw ApiError.notFound('Book not found');

  const activeBorrows = await Borrow.countDocuments({ book: book._id, status: 'issued' });
  if (activeBorrows > 0) {
    throw ApiError.conflict('This book has active borrows and cannot be deleted');
  }

  await Promise.all([
    Reservation.updateMany(
      { book: book._id, status: { $in: ['pending', 'notified'] } },
      { status: 'cancelled' }
    ),
    book.deleteOne(),
  ]);
  removeFile(book.coverImage);

  await logActivity(req, {
    action: 'BOOK_DELETED',
    entity: 'Book',
    entityId: book._id,
    description: `Book "${book.title}" was deleted`,
  });

  sendSuccess(res, { message: 'Book deleted successfully' });
});

export const getFeaturedBooks = asyncHandler(async (_req, res) => {
  const books = await populateCategory(
    Book.find({ isActive: { $ne: false }, availableCopies: { $gt: 0 } })
  )
    .sort({ createdAt: -1 })
    .limit(8);
  sendSuccess(res, { data: books });
});
