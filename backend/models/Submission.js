/**
 * Assignment Submission Mongoose Model
 * Tracks student answers, evaluation marks, and instructor feedback.
 */
const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: [true, 'Assignment ID is required'],
      index: true
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true
    },
    submissionText: {
      type: String,
      required: [true, 'Submission text is required'],
      trim: true
    },
    attachments: [
      {
        filename: String,
        url: String
      }
    ],
    submittedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['submitted', 'reviewed'],
      default: 'submitted'
    },
    marks: {
      type: Number,
      default: null,
      min: 0
    },
    feedback: {
      type: String,
      default: ''
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index: A student has one submission record per assignment (resubmission updates this)
submissionSchema.index({ assignmentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);
