/**
 * Enrollment Mongoose Model
 * Tracks student enrollments in courses with unique compound index.
 */
const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
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
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'inactive'],
        message: '{VALUE} is not a valid enrollment status'
      },
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: A student can only have one enrollment record per course
enrollmentSchema.index({ studentId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
