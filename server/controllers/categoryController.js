import { Category } from '../models/Category.js';
import { Book } from '../models/Book.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { sendSuccess } from '../utils/response.js';
import { logActivity } from '../services/activityService.js';

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await Category.aggregate([
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
        name: 1,
        description: 1,
        color: 1,
        icon: 1,
        createdAt: 1,
        bookCount: { $size: '$books' },
        availableCount: {
          $size: {
            $filter: {
              input: '$books',
              as: 'book',
              cond: { $gt: ['$$book.availableCopies', 0] },
            },
          },
        },
      },
    },
    { $sort: { name: 1 } },
  ]);
  sendSuccess(res, { data: categories });
});

export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, color, icon } = req.body;
  const escapedName = String(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (await Category.findOne({ name: { $regex: `^${escapedName}$`, $options: 'i' } })) {
    throw ApiError.conflict('Category already exists');
  }
  const category = await Category.create({ name, description, color, icon });
  await logActivity(req, {
    action: 'CATEGORY_CREATED',
    entity: 'Category',
    entityId: category._id,
    description: `Category "${category.name}" was created`,
  });
  sendSuccess(res, { status: 201, message: 'Category created', data: category });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: req.body.name,
      description: req.body.description,
      color: req.body.color,
      icon: req.body.icon,
    },
    { new: true, runValidators: true }
  );
  if (!category) throw ApiError.notFound('Category not found');
  sendSuccess(res, { message: 'Category updated', data: category });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const count = await Book.countDocuments({ category: req.params.id });
  if (count > 0) throw ApiError.conflict(`Cannot delete a category with ${count} book(s)`);
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw ApiError.notFound('Category not found');
  sendSuccess(res, { message: 'Category deleted' });
});
