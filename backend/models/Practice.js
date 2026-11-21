/**
 * Practice Mongoose Model
 * Represents coding challenges and exercises associated with courses or standalone.
 */
const mongoose = require('mongoose');

const practiceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Practice title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    instructions: {
      type: String,
      default: ''
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Easy', 'Medium', 'Hard'],
      default: 'Beginner'
    },
    language: {
      type: String,
      required: [true, 'Programming language is required'],
      trim: true
    },
    stub: {
      type: String,
      default: ''
    },
    solutionHint: {
      type: String,
      default: ''
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true
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

// Performance indexes
practiceSchema.index({ language: 1, difficulty: 1 });
practiceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Practice', practiceSchema);
