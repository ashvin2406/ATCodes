/**
 * Assignment Controller
 * Manages milestone assignments, student submissions, and teacher code review evaluations.
 */
const mongoose = require('mongoose');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');

// --- Teacher Operations ---

async function createAssignment(req, res, next) {
  try {
    const { title, description, courseId, chapterId, dueDate, totalMarks, instructions, status } = req.body;

    if (!title || !description || !courseId || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, courseId, and dueDate are required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid courseId format' });
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description.trim(),
      courseId,
      chapterId: chapterId && mongoose.Types.ObjectId.isValid(chapterId) ? chapterId : null,
      dueDate: new Date(dueDate),
      totalMarks: totalMarks !== undefined ? Number(totalMarks) : 100,
      instructions: instructions ? instructions.trim() : '',
      status: status || 'published',
      createdBy: req.user._id
    });

    await assignment.populate([
      { path: 'courseId', select: 'title slug' },
      { path: 'chapterId', select: 'title' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
}

async function getTeacherAssignments(req, res, next) {
  try {
    const { courseId, status } = req.query;
    const filter = {};

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filter.courseId = courseId;
    }
    if (status && ['draft', 'published', 'closed'].includes(status.toLowerCase())) {
      filter.status = status.toLowerCase();
    }

    const assignments = await Assignment.find(filter)
      .populate('courseId', 'title slug')
      .populate('chapterId', 'title')
      .sort({ createdAt: -1 })
      .lean();

    // Attach submission counts for each assignment
    const assignmentIds = assignments.map((a) => a._id);
    const submissionCounts = await Submission.aggregate([
      { $match: { assignmentId: { $in: assignmentIds } } },
      {
        $group: {
          _id: '$assignmentId',
          totalSubmissions: { $sum: 1 },
          reviewedSubmissions: {
            $sum: { $cond: [{ $eq: ['$status', 'reviewed'] }, 1, 0] }
          }
        }
      }
    ]);

    const countsMap = new Map();
    for (const sc of submissionCounts) {
      countsMap.set(sc._id.toString(), sc);
    }

    const enrichedAssignments = assignments.map((a) => {
      const counts = countsMap.get(a._id.toString()) || { totalSubmissions: 0, reviewedSubmissions: 0 };
      return {
        ...a,
        totalSubmissions: counts.totalSubmissions,
        reviewedSubmissions: counts.reviewedSubmissions
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total: enrichedAssignments.length,
        assignments: enrichedAssignments
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateAssignment(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment ID format' });
    }

    const allowedUpdates = ['title', 'description', 'courseId', 'chapterId', 'dueDate', 'totalMarks', 'instructions', 'status'];
    const updateData = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const assignment = await Assignment.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully',
      data: assignment
    });
  } catch (error) {
    next(error);
  }
}

async function deleteAssignment(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment ID format' });
    }

    const assignment = await Assignment.findByIdAndDelete(id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Clean up all submissions
    await Submission.deleteMany({ assignmentId: id });

    res.status(200).json({
      success: true,
      message: 'Assignment and associated submissions deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

async function getAssignmentSubmissions(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment ID format' });
    }

    const assignment = await Assignment.findById(id).populate('courseId', 'title slug').lean();
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const submissions = await Submission.find({ assignmentId: id })
      .populate('studentId', 'fullName email mobile accountStatus profileImage')
      .sort({ submittedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        assignment,
        totalSubmissions: submissions.length,
        submissions
      }
    });
  } catch (error) {
    next(error);
  }
}

async function reviewSubmission(req, res, next) {
  try {
    const { id } = req.params;
    const { marks, feedback } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid submission ID format' });
    }

    if (marks === undefined || marks === null || isNaN(Number(marks))) {
      return res.status(400).json({ success: false, message: 'Numeric marks value is required' });
    }

    const submission = await Submission.findById(id).populate('assignmentId');
    if (!submission) {
      return res.status(404).json({ success: false, message: 'Submission not found' });
    }

    submission.marks = Number(marks);
    submission.feedback = feedback ? feedback.trim() : '';
    submission.status = 'reviewed';
    submission.reviewedAt = new Date();
    await submission.save();

    await submission.populate('studentId', 'fullName email');

    res.status(200).json({
      success: true,
      message: 'Submission reviewed successfully',
      data: submission
    });
  } catch (error) {
    next(error);
  }
}

// --- Student Operations ---

async function getStudentAssignments(req, res, next) {
  try {
    // 1. Get active enrolled courses for student
    const activeEnrollments = await Enrollment.find({
      studentId: req.user._id,
      status: 'active'
    }).select('courseId');

    const courseIds = activeEnrollments.map((e) => e.courseId);

    // 2. Fetch published assignments for these courses
    const assignments = await Assignment.find({
      courseId: { $in: courseIds },
      status: 'published'
    })
      .populate('courseId', 'title slug')
      .populate('chapterId', 'title')
      .sort({ dueDate: 1 })
      .lean();

    // 3. Fetch student's submissions for these assignments
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({
      studentId: req.user._id,
      assignmentId: { $in: assignmentIds }
    }).lean();

    const submissionMap = new Map();
    for (const sub of submissions) {
      submissionMap.set(sub.assignmentId.toString(), sub);
    }

    // 4. Enrich assignments with submission status
    const enriched = assignments.map((a) => {
      const sub = submissionMap.get(a._id.toString());
      return {
        ...a,
        submission: sub || null,
        submissionStatus: sub ? (sub.status === 'reviewed' ? 'Graded' : 'Submitted') : 'Pending',
        isSubmitted: !!sub,
        marksAwarded: sub ? sub.marks : null,
        feedback: sub ? sub.feedback : ''
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total: enriched.length,
        assignments: enriched
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentAssignmentById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment ID format' });
    }

    const assignment = await Assignment.findOne({ _id: id, status: 'published' })
      .populate('courseId', 'title slug')
      .populate('chapterId', 'title')
      .lean();

    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found or not published' });
    }

    // Verify student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      courseId: assignment.courseId._id,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not enrolled in the course associated with this assignment'
      });
    }

    const submission = await Submission.findOne({
      assignmentId: assignment._id,
      studentId: req.user._id
    }).lean();

    res.status(200).json({
      success: true,
      data: {
        ...assignment,
        submission: submission || null,
        submissionStatus: submission ? (submission.status === 'reviewed' ? 'Graded' : 'Submitted') : 'Pending'
      }
    });
  } catch (error) {
    next(error);
  }
}

async function submitAssignment(req, res, next) {
  try {
    const { id } = req.params;
    const { submissionText, attachments } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment ID format' });
    }

    if (!submissionText || !submissionText.trim()) {
      return res.status(400).json({ success: false, message: 'Submission text is required' });
    }

    const assignment = await Assignment.findOne({ _id: id, status: 'published' });
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found or closed' });
    }

    // Verify student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      studentId: req.user._id,
      courseId: assignment.courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You must be actively enrolled in this course to submit assignments'
      });
    }

    // Upsert student submission
    const submission = await Submission.findOneAndUpdate(
      { assignmentId: id, studentId: req.user._id },
      {
        $set: {
          submissionText: submissionText.trim(),
          attachments: Array.isArray(attachments) ? attachments : [],
          submittedAt: new Date(),
          status: 'submitted'
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Assignment submitted successfully for instructor review',
      data: submission
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createAssignment,
  getTeacherAssignments,
  updateAssignment,
  deleteAssignment,
  getAssignmentSubmissions,
  reviewSubmission,
  getStudentAssignments,
  getStudentAssignmentById,
  submitAssignment
};
