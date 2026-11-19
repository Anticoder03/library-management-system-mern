import { ActivityLog } from '../models/ActivityLog.js';

export const logActivity = async (req, { action, entity, entityId, description, metadata }) => {
  try {
    return await ActivityLog.create({
      actor: req?.user?._id,
      action,
      entity,
      entityId,
      description,
      metadata,
      ip: req?.ip || '',
      userAgent: req?.get?.('user-agent') || '',
    });
  } catch (error) {
    console.error('Activity log failed:', error.message);
    return null;
  }
};
