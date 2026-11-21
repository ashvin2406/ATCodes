/**
 * API Router Index
 */
const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const teacherRoutes = require('./teacherRoutes');
const studentRoutes = require('./studentRoutes');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');

// Mount API route groups
router.use('/auth', authRoutes);
router.use('/teacher', teacherRoutes);
router.use('/student', studentRoutes);

// Public published course listing
router.get('/courses', async (req, res, next) => {
  try {
    const courses = await Course.find({ status: 'published' }).sort({ order: 1 }).lean();
    for (const c of courses) {
      c.totalChapters = await Chapter.countDocuments({ courseId: c._id, status: 'published' });
      c.totalTopics = await Lesson.countDocuments({ courseId: c._id, status: 'published' });
    }
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    next(error);
  }
});

// Public published course details
router.get('/courses/:id', async (req, res, next) => {
  try {
    const course = await Course.findOne({
      $or: [{ _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null }, { slug: req.params.id }],
      status: 'published'
    }).lean();

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found or not published' });
    }

    const chapters = await Chapter.find({ courseId: course._id, status: 'published' }).sort({ order: 1 }).lean();
    for (const ch of chapters) {
      ch.lessons = await Lesson.find({ chapterId: ch._id, status: 'published' })
        .sort({ order: 1 })
        .select('title slug order estimatedDuration status')
        .lean();
    }
    course.chapters = chapters;
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
