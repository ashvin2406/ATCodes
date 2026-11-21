/**
 * Progress Mongoose Model
 * Tracks student lesson completion states, telemetry, and timestamps.
 */
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chapter',
      required: [true, 'Chapter ID is required']
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'Lesson ID is required'],
      index: true
    },
    status: {
      type: String,
      enum: {
        values: ['notStarted', 'inProgress', 'completed'],
        message: '{VALUE} is not a valid progress status'
      },
      default: 'inProgress'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date,
      default: null
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: A student has exactly one progress record per lesson
progressSchema.index({ studentId: 1, lessonId: 1 }, { unique: true });

// Compound index for course-level telemetry queries
progressSchema.index({ studentId: 1, courseId: 1, status: 1 });

module.exports = mongoose.model('Progress', progressSchema);
