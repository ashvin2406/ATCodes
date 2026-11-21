const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    slug: {
      type: String,
      required: [true, 'Course slug is required'],
      unique: true,
      trim: true,
      lowercase: true
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      required: [true, 'Course category is required'],
      trim: true
    },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'All Levels'],
      default: 'Beginner'
    },
    thumbnail: {
      type: String,
      default: ''
    },
    duration: {
      type: String,
      default: '30 hours'
    },
    learningOutcomes: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    order: {
      type: Number,
      default: 0
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for chapters
courseSchema.virtual('chapters', {
  ref: 'Chapter',
  localField: '_id',
  foreignField: 'courseId'
});

// Indexes for query performance
courseSchema.index({ status: 1 });
courseSchema.index({ category: 1 });
courseSchema.index({ order: 1 });
courseSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Course', courseSchema);
