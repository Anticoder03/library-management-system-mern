import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'notified', 'fulfilled', 'cancelled', 'expired'],
      default: 'pending',
      index: true,
    },
    reservedAt: { type: Date, default: Date.now },
    notifiedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
    fulfilledAt: { type: Date, default: null },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

reservationSchema.index({ book: 1, reservedAt: 1 });
reservationSchema.index(
  { book: 1, member: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending', 'notified'] } } }
);

export const Reservation = mongoose.model('Reservation', reservationSchema);
