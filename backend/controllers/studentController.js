/**
 * Student Learning Experience Controller
 * Powers the Student Dashboard, Enrolled Courses, 10-Step Lesson Viewer,
 * Telemetry, and Progress Tracking.
 */
const mongoose = require('mongoose');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');

/**
 * Helper to get active enrolled course IDs for a student
 */
async function getActiveEnrolledCourseIds(studentId) {
  const enrollments = await Enrollment.find({
    studentId,
    status: 'active'
  }).select('courseId');
  return enrollments.map((e) => e.courseId);
}

// 1. Dashboard Overview Data
async function getDashboardData(req, res, next) {
  try {
    const studentId = req.user._id;

    // Fetch active enrolled courses
    const enrolledCourseIds = await getActiveEnrolledCourseIds(studentId);

    const courses = await Course.find({
      _id: { $in: enrolledCourseIds },
      status: 'published'
    })
      .sort({ order: 1 })
      .lean();

    // Calculate progress for each course
    let totalCompletedLessons = 0;
    let totalLessonsAcrossCourses = 0;

    const enrichedCourses = [];

    for (const c of courses) {
      const totalLessonsInCourse = await Lesson.countDocuments({
        courseId: c._id,
        status: 'published'
      });

      const completedInCourse = await Progress.countDocuments({
        studentId,
        courseId: c._id,
        status: 'completed'
      });

      totalLessonsAcrossCourses += totalLessonsInCourse;
      totalCompletedLessons += completedInCourse;

      const progressPct = totalLessonsInCourse > 0
        ? Math.round((completedInCourse / totalLessonsInCourse) * 100)
        : 0;

      const totalChapters = await Chapter.countDocuments({
        courseId: c._id,
        status: 'published'
      });

      enrichedCourses.push({
        ...c,
        totalChapters,
        totalTopics: totalLessonsInCourse,
        completedTopics: completedInCourse,
        progress: progressPct
      });
    }

    const overallProgress = totalLessonsAcrossCourses > 0
      ? Math.round((totalCompletedLessons / totalLessonsAcrossCourses) * 100)
      : 0;

    const pendingLessons = Math.max(0, totalLessonsAcrossCourses - totalCompletedLessons);

    // Find Continue Learning topic
    let continueLesson = null;
    const lastProgress = await Progress.findOne({
      studentId,
      status: 'inProgress'
    })
      .populate('lessonId', 'title slug estimatedDuration')
      .populate('courseId', 'title slug')
      .populate('chapterId', 'title')
      .sort({ updatedAt: -1 })
      .lean();

    if (lastProgress && lastProgress.lessonId) {
      continueLesson = {
        lessonId: lastProgress.lessonId._id,
        lessonTitle: lastProgress.lessonId.title,
        courseId: lastProgress.courseId?._id,
        courseTitle: lastProgress.courseId?.title,
        chapterTitle: lastProgress.chapterId?.title || 'Current Chapter',
        duration: lastProgress.lessonId.estimatedDuration || '30 mins'
      };
    } else if (courses.length > 0) {
      // Find the first uncompleted published lesson in the first course
      const firstCourseId = courses[0]._id;
      const completedLessonIds = (
        await Progress.find({ studentId, courseId: firstCourseId, status: 'completed' }).select('lessonId')
      ).map((p) => p.lessonId.toString());

      const nextLesson = await Lesson.findOne({
        courseId: firstCourseId,
        status: 'published',
        _id: { $nin: completedLessonIds }
      })
        .populate('chapterId', 'title')
        .sort({ order: 1 })
        .lean();

      if (nextLesson) {
        continueLesson = {
          lessonId: nextLesson._id,
          lessonTitle: nextLesson.title,
          courseId: courses[0]._id,
          courseTitle: courses[0].title,
          chapterTitle: nextLesson.chapterId?.title || 'Chapter 1',
          duration: nextLesson.estimatedDuration || '30 mins'
        };
      }
    }

    // Recently accessed lessons
    const recentProgressRecords = await Progress.find({ studentId })
      .populate('lessonId', 'title slug estimatedDuration status')
      .populate('courseId', 'title slug')
      .sort({ updatedAt: -1 })
      .limit(5)
      .lean();

    const recentlyAccessed = recentProgressRecords
      .filter((p) => p.lessonId && p.lessonId.status === 'published')
      .map((p) => ({
        lessonId: p.lessonId._id,
        title: p.lessonId.title,
        courseTitle: p.courseId?.title || '',
        status: p.status,
        updatedAt: p.updatedAt
      }));

    // Upcoming assignments for enrolled courses
    const upcomingAssignments = await Assignment.find({
      courseId: { $in: enrolledCourseIds },
      status: 'published'
    })
      .populate('courseId', 'title')
      .sort({ dueDate: 1 })
      .limit(4)
      .lean();

    const asgIds = upcomingAssignments.map((a) => a._id);
    const studentSubmissions = await Submission.find({
      studentId,
      assignmentId: { $in: asgIds }
    }).lean();

    const subMap = new Map();
    for (const sub of studentSubmissions) {
      subMap.set(sub.assignmentId.toString(), sub);
    }

    const assignmentsWithStatus = upcomingAssignments.map((a) => {
      const sub = subMap.get(a._id.toString());
      return {
        id: a._id,
        title: a.title,
        course: a.courseId?.title || 'Enrolled Course',
        dueDate: new Date(a.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        points: a.totalMarks,
        status: sub ? (sub.status === 'reviewed' ? 'Graded' : 'Submitted') : 'Pending',
        grade: sub && sub.marks !== null ? `${sub.marks}/${a.totalMarks}` : null
      };
    });

    res.status(200).json({
      success: true,
      data: {
        welcomeMessage: `Welcome back, ${req.user.fullName}!`,
        user: req.user.toSafeObject(),
        courses: enrichedCourses,
        totalCompletedLessons,
        pendingLessons,
        overallProgress,
        continueLesson,
        recentlyAccessed,
        upcomingAssignments: assignmentsWithStatus
      }
    });
  } catch (error) {
    next(error);
  }
}

// 2. Student Enrolled Courses
async function getStudentCourses(req, res, next) {
  try {
    const studentId = req.user._id;
    const enrolledCourseIds = await getActiveEnrolledCourseIds(studentId);

    const courses = await Course.find({
      _id: { $in: enrolledCourseIds },
      status: 'published'
    })
      .sort({ order: 1 })
      .lean();

    const coursesWithProgress = [];

    for (const c of courses) {
      const totalLessons = await Lesson.countDocuments({
        courseId: c._id,
        status: 'published'
      });

      const completedLessons = await Progress.countDocuments({
        studentId,
        courseId: c._id,
        status: 'completed'
      });

      const totalChapters = await Chapter.countDocuments({
        courseId: c._id,
        status: 'published'
      });

      // Find first lesson ID to start/continue
      const firstLesson = await Lesson.findOne({
        courseId: c._id,
        status: 'published'
      })
        .sort({ order: 1 })
        .select('_id');

      coursesWithProgress.push({
        ...c,
        totalChapters,
        totalTopics: totalLessons,
        completedTopics: completedLessons,
        progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        firstLessonId: firstLesson ? firstLesson._id : null
      });
    }

    res.status(200).json({
      success: true,
      data: {
        total: coursesWithProgress.length,
        courses: coursesWithProgress
      }
    });
  } catch (error) {
    next(error);
  }
}

// 3. Student Single Course Syllabus
async function getStudentCourseById(req, res, next) {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }

    // Verify student is enrolled in course
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: id,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not enrolled in this course.'
      });
    }

    const course = await Course.findOne({ _id: id, status: 'published' }).lean();
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or not published' });
    }

    // Fetch chapters and lessons
    const chapters = await Chapter.find({ courseId: course._id, status: 'published' }).sort({ order: 1 }).lean();
    const completedProgress = await Progress.find({ studentId, courseId: id, status: 'completed' }).select('lessonId').lean();
    const completedSet = new Set(completedProgress.map((p) => p.lessonId.toString()));

    for (const ch of chapters) {
      const lessons = await Lesson.find({ chapterId: ch._id, status: 'published' })
        .sort({ order: 1 })
        .select('title slug order estimatedDuration')
        .lean();

      ch.lessons = lessons.map((l) => ({
        ...l,
        isCompleted: completedSet.has(l._id.toString())
      }));
    }

    course.chapters = chapters;

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
}

// 4. Student Course Chapters List
async function getStudentCourseChapters(req, res, next) {
  try {
    const { courseId } = req.params;
    const studentId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'Invalid courseId' });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'You are not actively enrolled in this course'
      });
    }

    const chapters = await Chapter.find({ courseId, status: 'published' }).sort({ order: 1 }).lean();
    const completedRecords = await Progress.find({ studentId, courseId, status: 'completed' }).select('lessonId').lean();
    const completedSet = new Set(completedRecords.map((p) => p.lessonId.toString()));

    for (const ch of chapters) {
      const lessons = await Lesson.find({ chapterId: ch._id, status: 'published' })
        .sort({ order: 1 })
        .select('title slug order estimatedDuration')
        .lean();

      ch.lessons = lessons.map((l) => ({
        ...l,
        isCompleted: completedSet.has(l._id.toString())
      }));
    }

    res.status(200).json({
      success: true,
      data: chapters
    });
  } catch (error) {
    next(error);
  }
}

// 5. 10-Step Lesson Viewer
async function getStudentLesson(req, res, next) {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
    }

    const lesson = await Lesson.findOne({ _id: id, status: 'published' })
      .populate('courseId', 'title slug status')
      .populate('chapterId', 'title')
      .lean();

    if (!lesson || !lesson.courseId || lesson.courseId.status !== 'published') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found or course is not published'
      });
    }

    // Verify student is enrolled in the course
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: lesson.courseId._id,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not enrolled in this course.'
      });
    }

    // Fetch previous and next lessons in this course for seamless navigation
    const allCourseLessons = await Lesson.find({
      courseId: lesson.courseId._id,
      status: 'published'
    })
      .sort({ order: 1 })
      .select('_id title slug order chapterId')
      .lean();

    const currentIndex = allCourseLessons.findIndex((l) => l._id.toString() === lesson._id.toString());
    const prevLesson = currentIndex > 0 ? allCourseLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex >= 0 && currentIndex < allCourseLessons.length - 1 ? allCourseLessons[currentIndex + 1] : null;

    // Check student's progress on this lesson
    const progressRecord = await Progress.findOne({ studentId, lessonId: lesson._id }).lean();

    // Mark as inProgress automatically if not completed
    if (!progressRecord || progressRecord.status !== 'completed') {
      await Progress.findOneAndUpdate(
        { studentId, lessonId: lesson._id },
        {
          $setOnInsert: {
            courseId: lesson.courseId._id,
            chapterId: lesson.chapterId._id,
            startedAt: new Date()
          },
          $set: {
            status: progressRecord?.status === 'completed' ? 'completed' : 'inProgress',
            updatedAt: new Date()
          }
        },
        { upsert: true }
      );
    }

    // Get chapter lessons for the navigation sidebar
    const chapterLessons = await Lesson.find({
      chapterId: lesson.chapterId._id,
      status: 'published'
    })
      .sort({ order: 1 })
      .select('_id title slug order estimatedDuration')
      .lean();

    const completedInChapter = await Progress.find({
      studentId,
      lessonId: { $in: chapterLessons.map((l) => l._id) },
      status: 'completed'
    }).select('lessonId').lean();

    const completedLessonIds = new Set(completedInChapter.map((p) => p.lessonId.toString()));

    const sidebarLessons = chapterLessons.map((l) => ({
      ...l,
      isCurrent: l._id.toString() === lesson._id.toString(),
      isCompleted: completedLessonIds.has(l._id.toString())
    }));

    res.status(200).json({
      success: true,
      data: {
        ...lesson,
        isCompleted: progressRecord?.status === 'completed',
        progressStatus: progressRecord?.status || 'inProgress',
        navigation: {
          previous: prevLesson ? { id: prevLesson._id, title: prevLesson.title } : null,
          next: nextLesson ? { id: nextLesson._id, title: nextLesson.title } : null
        },
        sidebarLessons,
        completedCountInChapter: completedLessonIds.size,
        totalCountInChapter: chapterLessons.length
      }
    });
  } catch (error) {
    next(error);
  }
}

// 6. Start Lesson
async function startLesson(req, res, next) {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
    }

    const lesson = await Lesson.findOne({ _id: id, status: 'published' });
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found or not published' });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: lesson.courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
    }

    const progress = await Progress.findOneAndUpdate(
      { studentId, lessonId: id },
      {
        $setOnInsert: {
          courseId: lesson.courseId,
          chapterId: lesson.chapterId,
          startedAt: new Date()
        },
        $set: {
          status: 'inProgress',
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Lesson marked as in progress',
      data: progress
    });
  } catch (error) {
    next(error);
  }
}

// 7. Complete Lesson
async function completeLesson(req, res, next) {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid lesson ID' });
    }

    const lesson = await Lesson.findOne({ _id: id, status: 'published' });
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Lesson not found or not published' });
    }

    // Verify enrollment
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId: lesson.courseId,
      status: 'active'
    });

    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You are not enrolled in this course' });
    }

    // Determine target status (allows toggle if query ?toggle=true or body { toggle: true })
    const existing = await Progress.findOne({ studentId, lessonId: id });
    const isCurrentlyCompleted = existing?.status === 'completed';
    const targetStatus = req.body.status || (req.query.toggle === 'true' && isCurrentlyCompleted ? 'inProgress' : 'completed');

    const progress = await Progress.findOneAndUpdate(
      { studentId, lessonId: id },
      {
        $setOnInsert: {
          courseId: lesson.courseId,
          chapterId: lesson.chapterId,
          startedAt: new Date()
        },
        $set: {
          status: targetStatus,
          completedAt: targetStatus === 'completed' ? new Date() : null,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: targetStatus === 'completed' ? 'Congratulations! Lesson marked as completed.' : 'Lesson status updated to in progress.',
      data: progress
    });
  } catch (error) {
    next(error);
  }
}

// 8. Overall Student Progress Report
async function getStudentProgress(req, res, next) {
  try {
    const studentId = req.user._id;
    const enrolledCourseIds = await getActiveEnrolledCourseIds(studentId);

    const courses = await Course.find({
      _id: { $in: enrolledCourseIds },
      status: 'published'
    }).lean();

    const courseProgressReports = [];
    let grandTotalLessons = 0;
    let grandCompletedLessons = 0;

    for (const c of courses) {
      const totalLessons = await Lesson.countDocuments({
        courseId: c._id,
        status: 'published'
      });

      const completedLessons = await Progress.countDocuments({
        studentId,
        courseId: c._id,
        status: 'completed'
      });

      grandTotalLessons += totalLessons;
      grandCompletedLessons += completedLessons;

      courseProgressReports.push({
        courseId: c._id,
        title: c.title,
        slug: c.slug,
        category: c.category,
        totalLessons,
        completedLessons,
        percentage: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0
      });
    }

    const overallPercentage = grandTotalLessons > 0
      ? Math.round((grandCompletedLessons / grandTotalLessons) * 100)
      : 0;

    // Recent milestone events
    const recentCompletedLessons = await Progress.find({
      studentId,
      status: 'completed'
    })
      .populate('lessonId', 'title')
      .sort({ completedAt: -1 })
      .limit(5)
      .lean();

    const recentSubmissions = await Submission.find({
      studentId
    })
      .populate('assignmentId', 'title')
      .sort({ submittedAt: -1 })
      .limit(5)
      .lean();

    const milestones = [
      ...recentCompletedLessons.map((p) => ({
        type: 'lesson',
        title: `Completed Lesson: ${p.lessonId?.title || 'Course Lesson'}`,
        date: p.completedAt || p.updatedAt
      })),
      ...recentSubmissions.map((s) => ({
        type: 'assignment',
        title: `Submitted Assignment: ${s.assignmentId?.title || 'Milestone Assignment'}`,
        date: s.submittedAt
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    res.status(200).json({
      success: true,
      data: {
        overallPercentage,
        grandTotalLessons,
        grandCompletedLessons,
        courses: courseProgressReports,
        milestones
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardData,
  getStudentCourses,
  getStudentCourseById,
  getStudentCourseChapters,
  getStudentLesson,
  startLesson,
  completeLesson,
  getStudentProgress
};
