/**
 * Assignment Mongoose Model
 * Manages milestone assignments and chapter capstone missions.
 */
const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
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
      default: null
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    totalMarks: {
      type: Number,
      required: [true, 'Total marks are required'],
      min: [1, 'Total marks must be at least 1'],
      default: 100
    },
    instructions: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'published'
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
assignmentSchema.index({ courseId: 1, status: 1 });
assignmentSchema.index({ dueDate: 1 });

module.exports = mongoose.model('Assignment', assignmentSchema);
