const mongoose = require('mongoose');

const practicalSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Practical title is required'],
      trim: true,
      maxlength: [180, 'Title cannot exceed 180 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    language: {
      type: String,
      required: [true, 'Language is required'],
      enum: ['C', 'C++', 'HTML', 'CSS', 'JavaScript', 'PHP', 'Java', 'Node.js', 'SQL', 'MongoDB'],
      default: 'JavaScript'
    },
    code: {
      type: String,
      required: [true, 'Code is required']
    },
    explanation: {
      type: String,
      default: '',
      trim: true
    },
    topic: {
      type: String,
      default: '',
      trim: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      default: null
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
practicalSchema.index({ language: 1 });
practicalSchema.index({ createdBy: 1 });
practicalSchema.index({ courseId: 1 });

module.exports = mongoose.model('Practical', practicalSchema);
