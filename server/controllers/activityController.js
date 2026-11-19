import { ActivityLog } from '../models/ActivityLog.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { buildPaginationMeta, getPagination, sendSuccess } from '../utils/response.js';

export const getActivities = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};
  if (req.query.action) filter.action = req.query.action.toUpperCase();
  if (req.query.actor) filter.actor = req.query.actor;

  const [activities, total] = await Promise.all([
    ActivityLog.find(filter)
      .populate('actor', 'name role avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);

  sendSuccess(res, { data: activities, meta: buildPaginationMeta({ page, limit, total }) });
});
