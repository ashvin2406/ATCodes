const mongoose = require('mongoose');

const chapterSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Chapter title is required'],
      trim: true,
      maxlength: [180, 'Chapter title cannot exceed 180 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Chapter description cannot exceed 1000 characters']
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required']
    },
    order: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for lessons
chapterSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'chapterId'
});

// Indexes
chapterSchema.index({ courseId: 1, order: 1 });

module.exports = mongoose.model('Chapter', chapterSchema);
