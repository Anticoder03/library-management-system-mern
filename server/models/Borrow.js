import mongoose from 'mongoose';
import { isOverdue } from '../utils/helpers.js';

const borrowSchema = new mongoose.Schema(
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
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    returnedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    issueDate: { type: Date, default: Date.now, required: true },
    dueDate: { type: Date, required: true },
    returnDate: { type: Date, default: null },
    status: {
      type: String,
      enum: ['issued', 'returned', 'lost'],
      default: 'issued',
      index: true,
    },
    fineAmount: { type: Number, default: 0, min: 0 },
    finePaid: { type: Boolean, default: false },
    renewalCount: { type: Number, default: 0, min: 0 },
    conditionOnReturn: { type: String, default: '' },
    notes: { type: String, trim: true, default: '' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

borrowSchema.virtual('overdue').get(function overdueVirtual() {
  return isOverdue(this);
});

borrowSchema.index({ member: 1, status: 1 });
borrowSchema.index({ book: 1, status: 1 });
borrowSchema.index({ dueDate: 1, status: 1 });
borrowSchema.index({ createdAt: -1 });

export const Borrow = mongoose.model('Borrow', borrowSchema);
