import mongoose from 'mongoose';

const { Schema } = mongoose;

const bookSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      maxlength: [120, 'Author cannot exceed 120 characters'],
    },
    isbn: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      default: undefined,
      index: true,
    },
    description: { type: String, trim: true, default: '' },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
      index: true,
    },
    publisher: { type: String, trim: true, default: '' },
    publicationYear: {
      type: Number,
      min: [1000, 'Invalid publication year'],
      max: [2100, 'Invalid publication year'],
    },
    coverImage: { type: String, default: '' },
    totalCopies: {
      type: Number,
      required: true,
      min: [1, 'Total copies must be at least 1'],
      default: 1,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, 'Available copies cannot be negative'],
      default: 1,
    },
    shelfLocation: { type: String, trim: true, default: '' },
    tags: [{ type: String, trim: true }],
    language: { type: String, trim: true, default: 'English' },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

bookSchema.virtual('isAvailable').get(function isAvailable() {
  return this.availableCopies > 0;
});

bookSchema.pre('validate', function validateCopies(next) {
  if (this.availableCopies > this.totalCopies) {
    next(new Error('Available copies cannot exceed total copies'));
    return;
  }
  next();
});

bookSchema.index({ title: 'text', author: 'text', isbn: 'text', publisher: 'text' });
bookSchema.index({ createdAt: -1 });
bookSchema.index({ availableCopies: 1, isActive: 1 });

export const Book = mongoose.model('Book', bookSchema);
