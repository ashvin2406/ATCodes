/**
 * Enrollment Controller
 * Handles teacher student enrollment operations, status toggling, and course rosters.
 */
const mongoose = require('mongoose');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Course = require('../models/Course');

async function enrollStudent(req, res, next) {
  try {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'studentId and courseId are both required'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId or courseId format'
      });
    }

    // Verify student exists and is indeed a student
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student account not found'
      });
    }

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Upsert or create enrollment
    let enrollment = await Enrollment.findOne({ studentId, courseId });
    if (enrollment) {
      if (enrollment.status === 'active') {
        return res.status(409).json({
          success: false,
          message: 'Student is already actively enrolled in this course',
          data: enrollment
        });
      }
      enrollment.status = 'active';
      enrollment.enrolledAt = new Date();
      await enrollment.save();
    } else {
      enrollment = await Enrollment.create({
        studentId,
        courseId,
        status: 'active',
        enrolledAt: new Date()
      });
    }

    await enrollment.populate([
      { path: 'studentId', select: 'fullName email accountStatus' },
      { path: 'courseId', select: 'title slug category status' }
    ]);

    res.status(201).json({
      success: true,
      message: `Student successfully enrolled in ${course.title}`,
      data: enrollment
    });
  } catch (error) {
    next(error);
  }
}

async function getEnrollments(req, res, next) {
  try {
    const { courseId, studentId, status } = req.query;
    const filter = {};

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filter.courseId = courseId;
    }
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) {
      filter.studentId = studentId;
    }
    if (status && ['active', 'inactive'].includes(status.toLowerCase())) {
      filter.status = status.toLowerCase();
    }

    const enrollments = await Enrollment.find(filter)
      .populate('studentId', 'fullName email mobile accountStatus')
      .populate('courseId', 'title slug category status duration')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        total: enrollments.length,
        enrollments
      }
    });
  } catch (error) {
    next(error);
  }
}

async function removeEnrollment(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid enrollment ID format'
      });
    }

    const enrollment = await Enrollment.findByIdAndDelete(id);
    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment record not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student course enrollment removed successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  enrollStudent,
  getEnrollments,
  removeEnrollment
};
