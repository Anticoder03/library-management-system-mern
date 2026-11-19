import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        'reservation_available',
        'book_issued',
        'book_returned',
        'fine_created',
        'fine_paid',
        'general',
      ],
      default: 'general',
    },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
    relatedBook: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    relatedBorrow: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrow' },
    relatedFine: { type: mongoose.Schema.Types.ObjectId, ref: 'Fine' },
    link: { type: String, default: '' },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
