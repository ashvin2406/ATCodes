/**
 * Teacher Management Controller
 * Manages student rosters, telemetry, account activation workflows,
 * and detailed student progress reports.
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const Submission = require('../models/Submission');
const { validateStatusUpdate } = require('../validators/authValidator');

async function getStudents(req, res, next) {
  try {
    const { status, search } = req.query;

    const query = { role: 'student' };

    if (status && ['pending', 'active', 'suspended'].includes(status.toLowerCase())) {
      query.accountStatus = status.toLowerCase();
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ fullName: searchRegex }, { email: searchRegex }];
    }

    const students = await User.find(query)
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .lean();

    // Enrich each student with real enrollments and progress telemetry
    const enrichedStudents = await Promise.all(
      students.map(async (student) => {
        const enrollments = await Enrollment.find({ studentId: student._id, status: 'active' })
          .populate('courseId', 'title slug')
          .lean();

        const enrolledCourses = enrollments.map((e) => e.courseId?.title).filter(Boolean);
        const courseIds = enrollments.map((e) => e.courseId?._id).filter(Boolean);

        const totalPublishedLessons = await Lesson.countDocuments({
          courseId: { $in: courseIds },
          status: 'published'
        });

        const completedLessons = await Progress.countDocuments({
          studentId: student._id,
          courseId: { $in: courseIds },
          status: 'completed'
        });

        const progressPercentage = totalPublishedLessons > 0
          ? Math.round((completedLessons / totalPublishedLessons) * 100)
          : 0;

        return {
          ...student,
          enrolledCourses,
          enrolledCount: enrolledCourses.length,
          completedLessons,
          totalLessons: totalPublishedLessons,
          progressPercentage
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        total: enrichedStudents.length,
        students: enrichedStudents
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, error: 'Invalid student ID format' });
    }

    const student = await User.findOne({ _id: id, role: 'student' }).select('-passwordHash').lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student record not found.'
      });
    }

    // Fetch enrollments with course details
    const enrollments = await Enrollment.find({ studentId: id })
      .populate('courseId', 'title slug category level duration')
      .lean();

    // Fetch progress and assignments
    const completedLessons = await Progress.countDocuments({ studentId: id, status: 'completed' });
    const inProgressLessons = await Progress.countDocuments({ studentId: id, status: 'inProgress' });

    const submissions = await Submission.find({ studentId: id })
      .populate('assignmentId', 'title totalMarks dueDate')
      .sort({ submittedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        student: {
          ...student,
          enrollments,
          completedLessons,
          inProgressLessons,
          submissions
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updateStudentStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { isValid, errors } = validateStatusUpdate(status);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: errors.join(' ')
      });
    }

    const student = await User.findOne({ _id: id, role: 'student' });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: 'Student record not found.'
      });
    }

    student.accountStatus = status.toLowerCase();
    await student.save();

    res.status(200).json({
      success: true,
      message: `Student status successfully updated to '${student.accountStatus}'.`,
      data: {
        student: student.toSafeObject()
      }
    });
  } catch (error) {
    next(error);
  }
}

async function getStudentProgressReport(req, res, next) {
  try {
    const { studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ success: false, message: 'Invalid studentId format' });
    }

    const student = await User.findOne({ _id: studentId, role: 'student' }).select('-passwordHash').lean();
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Active enrollments
    const enrollments = await Enrollment.find({ studentId, status: 'active' })
      .populate('courseId')
      .lean();

    const courseReports = [];
    let grandTotalLessons = 0;
    let grandCompletedLessons = 0;

    for (const e of enrollments) {
      const course = e.courseId;
      if (!course) continue;

      const totalLessons = await Lesson.countDocuments({ courseId: course._id, status: 'published' });
      const completedLessons = await Progress.countDocuments({ studentId, courseId: course._id, status: 'completed' });

      grandTotalLessons += totalLessons;
      grandCompletedLessons += completedLessons;

      courseReports.push({
        courseId: course._id,
        title: course.title,
        slug: course.slug,
        category: course.category,
        totalLessons,
        completedLessons,
        percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      });
    }

    const overallPercentage = grandTotalLessons > 0
      ? Math.round((grandCompletedLessons / grandTotalLessons) * 100)
      : 0;

    // Submissions
    const submissions = await Submission.find({ studentId })
      .populate('assignmentId', 'title totalMarks dueDate')
      .sort({ submittedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        student,
        overallPercentage,
        grandTotalLessons,
        grandCompletedLessons,
        courses: courseReports,
        submissions
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getStudents,
  getStudentById,
  updateStudentStatus,
  getStudentProgressReport
};
