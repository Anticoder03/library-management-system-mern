import mongoose from 'mongoose';

const fineSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    borrow: { type: mongoose.Schema.Types.ObjectId, ref: 'Borrow' },
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
    amount: { type: Number, required: true, min: [0, 'Amount cannot be negative'] },
    reason: {
      type: String,
      enum: ['overdue', 'damage', 'lost', 'other'],
      default: 'overdue',
    },
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'waived'],
      default: 'unpaid',
      index: true,
    },
    description: { type: String, trim: true, default: '' },
    paidAt: { type: Date, default: null },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentMethod: { type: String, default: 'cash' },
  },
  { timestamps: true }
);

fineSchema.index({ createdAt: -1 });
fineSchema.index({ member: 1, status: 1 });

export const Fine = mongoose.model('Fine', fineSchema);
