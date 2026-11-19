import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: true,
      trim: true,
      maxlength: [60, 'Category name cannot exceed 60 characters'],
    },
    description: { type: String, trim: true, default: '' },
    color: { type: String, default: '#6366f1' },
    icon: { type: String, default: 'BookOpen' },
  },
  { timestamps: true }
);

categorySchema.pre('save', function normalizeName(next) {
  this.name = this.name.replace(/\b\w/g, (char) => char.toUpperCase());
  next();
});

export const Category = mongoose.model('Category', categorySchema);
