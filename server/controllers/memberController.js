import crypto from 'crypto';
import { User } from '../models/User.js';
import { Borrow } from '../models/Borrow.js';
import { Fine } from '../models/Fine.js';
import { Reservation } from '../models/Reservation.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { buildPaginationMeta, buildSort, getPagination, sendSuccess } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';

const PUBLIC_FIELDS =
  'name email role phone studentId address avatar membershipDate membershipStatus createdAt';

const parseRoles = (role) => {
  if (!role || role === 'all') return ['member'];
  if (role === 'staff') return ['librarian', 'admin'];
  return [role];
};

export const getMembers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { role: { $in: parseRoles(req.query.role) } };

  if (req.query.search) {
    const search = req.query.search.trim();
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { studentId: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
    ];
  }
  if (req.query.status && req.query.status !== 'all') {
    filter.membershipStatus = req.query.status;
  }

  const sort = buildSort(req.query.sort, ['name', 'email', 'membershipDate', 'createdAt'], '-createdAt');
  const [members, total] = await Promise.all([
    User.find(filter).select(PUBLIC_FIELDS).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  sendSuccess(res, { data: members, meta: buildPaginationMeta({ page, limit, total }) });
});

export const getMember = asyncHandler(async (req, res) => {
  const member = await User.findOne({
    _id: req.params.id,
    role: { $in: ['member', 'librarian', 'admin'] },
  }).select(PUBLIC_FIELDS);
  if (!member) throw ApiError.notFound('Member not found');

  const [currentlyIssued, history, fines, reservations] = await Promise.all([
    Borrow.find({ member: member._id, status: 'issued' })
      .populate({ path: 'book', select: 'title author coverImage isbn' })
      .sort({ dueDate: 1 }),
    Borrow.find({ member: member._id, status: { $ne: 'issued' } })
      .populate({ path: 'book', select: 'title author coverImage' })
      .sort({ returnDate: -1 })
      .limit(20),
    Fine.find({ member: member._id }).populate('book', 'title').sort({ createdAt: -1 }),
    Reservation.find({ member: member._id })
      .populate('book', 'title author coverImage')
      .sort({ reservedAt: -1 })
      .limit(20),
  ]);

  const outstandingFine = fines
    .filter((fine) => fine.status === 'unpaid')
    .reduce((sum, fine) => sum + fine.amount, 0);

  sendSuccess(res, {
    data: {
      member,
      currentlyIssued,
      history,
      fines,
      reservations,
      outstandingFine,
    },
  });
});

export const createMember = asyncHandler(async (req, res) => {
  const { name, email, phone, studentId, address, role, membershipStatus } = req.body;

  if (await User.exists({ email: email.toLowerCase() })) {
    throw ApiError.conflict('An account with this email already exists');
  }
  if (studentId && (await User.exists({ studentId }))) {
    throw ApiError.conflict('This student ID is already registered');
  }

  const temporaryPassword = req.body.password || `Lib@${crypto.randomBytes(5).toString('hex')}`;
  const member = await User.create({
    name,
    email,
    password: temporaryPassword,
    phone,
    studentId,
    address,
    role: role === 'librarian' ? 'librarian' : 'member',
    membershipStatus: membershipStatus || 'active',
    membershipDate: req.body.membershipDate || Date.now(),
  });

  await logActivity(req, {
    action: 'MEMBER_CREATED',
    entity: 'User',
    entityId: member._id,
    description: `${member.name} was registered as a ${member.role}`,
  });

  sendSuccess(res, {
    status: 201,
    message: 'Member registered successfully',
    data: {
      member: await User.findById(member._id).select(PUBLIC_FIELDS),
      temporaryPassword: req.body.password ? undefined : temporaryPassword,
    },
  });
});

export const updateMember = asyncHandler(async (req, res) => {
  const allowed = [
    'name',
    'email',
    'phone',
    'studentId',
    'address',
    'role',
    'membershipStatus',
    'membershipDate',
  ];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });
  if (updates.email && (await User.exists({ email: updates.email, _id: { $ne: req.params.id } }))) {
    throw ApiError.conflict('Email is already in use');
  }
  if (
    updates.studentId &&
    (await User.exists({ studentId: updates.studentId, _id: { $ne: req.params.id } }))
  ) {
    throw ApiError.conflict('Student ID is already in use');
  }

  const member = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  }).select(PUBLIC_FIELDS);
  if (!member) throw ApiError.notFound('Member not found');

  await logActivity(req, {
    action: 'MEMBER_UPDATED',
    entity: 'User',
    entityId: member._id,
    description: `${member.name}'s profile was updated`,
  });

  sendSuccess(res, { message: 'Member updated successfully', data: member });
});

export const deleteMember = asyncHandler(async (req, res) => {
  const [activeBorrows, unpaidFines] = await Promise.all([
    Borrow.countDocuments({ member: req.params.id, status: 'issued' }),
    Fine.countDocuments({ member: req.params.id, status: 'unpaid' }),
  ]);
  if (activeBorrows || unpaidFines) {
    throw ApiError.conflict(
      `Cannot delete a member with ${activeBorrows} active borrow(s) and ${unpaidFines} unpaid fine(s). Deactivate instead.`
    );
  }

  const member = await User.findByIdAndDelete(req.params.id);
  if (!member) throw ApiError.notFound('Member not found');
  await Reservation.deleteMany({ member: member._id });

  await logActivity(req, {
    action: 'MEMBER_DELETED',
    entity: 'User',
    entityId: member._id,
    description: `${member.name} was deleted`,
  });

  sendSuccess(res, { message: 'Member deleted successfully' });
});

export const getMemberHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { member: req.params.memberId };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [borrows, total] = await Promise.all([
    Borrow.find(filter)
      .populate({ path: 'book', select: 'title author coverImage isbn category' })
      .sort({ issueDate: -1 })
      .skip(skip)
      .limit(limit),
    Borrow.countDocuments(filter),
  ]);

  sendSuccess(res, { data: borrows, meta: buildPaginationMeta({ page, limit, total }) });
});
