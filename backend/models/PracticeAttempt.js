/**
 * Practice Attempt Model
 * Tracks student practice challenge completions and submitted code.
 */
const mongoose = require('mongoose');

const practiceAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    practiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Practice',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['attempted', 'completed', 'pending'],
      default: 'attempted'
    },
    codeSubmitted: {
      type: String,
      default: ''
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

practiceAttemptSchema.index({ studentId: 1, practiceId: 1 }, { unique: true });

module.exports = mongoose.model('PracticeAttempt', practiceAttemptSchema);
