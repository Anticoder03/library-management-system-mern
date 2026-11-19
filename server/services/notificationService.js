import { Notification } from '../models/Notification.js';

export const notify = async (payload) => {
  try {
    return await Notification.create(payload);
  } catch (error) {
    console.error('Notification creation failed:', error.message);
    return null;
  }
};

export const notifyMany = async (recipientIds, payload) => {
  if (!recipientIds?.length) return [];
  return Notification.insertMany(
    recipientIds.map((recipient) => ({ recipient, ...payload })),
    { ordered: false }
  ).catch((error) => {
    console.error('Bulk notification failed:', error.message);
    return [];
  });
};
