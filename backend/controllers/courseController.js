/**
 * Course Management Controller
 */
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');
const Practical = require('../models/Practical');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * GET /api/teacher/courses
 * Fetch all courses (with optional search & status filter)
 */
exports.getCourses = async (req, res, next) => {
  try {
    const { q, status, category } = req.query;
    const filter = {};

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } }
      ];
    }

    if (status && status !== 'All') {
      filter.status = status.toLowerCase();
    }

    if (category && category !== 'All') {
      filter.category = category;
    }

    const courses = await Course.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .populate('createdBy', 'fullName email')
      .lean();

    // Attach chapter and lesson counts
    for (const course of courses) {
      const chaptersCount = await Chapter.countDocuments({ courseId: course._id });
      const lessonsCount = await Lesson.countDocuments({ courseId: course._id });
      course.totalChapters = chaptersCount;
      course.totalTopics = lessonsCount;
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/teacher/courses/:id
 * Fetch course details with chapters & lessons
 */
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Fetch chapters in order
    const chapters = await Chapter.find({ courseId: course._id })
      .sort({ order: 1 })
      .lean();

    // Fetch lessons for each chapter
    for (const chapter of chapters) {
      chapter.lessons = await Lesson.find({ chapterId: chapter._id })
        .sort({ order: 1 })
        .select('title slug order estimatedDuration status updatedAt')
        .lean();
    }

    course.chapters = chapters;
    course.totalChapters = chapters.length;
    course.totalTopics = chapters.reduce((sum, ch) => sum + (ch.lessons ? ch.lessons.length : 0), 0);

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/teacher/courses
 * Create a new course
 */
exports.createCourse = async (req, res, next) => {
  try {
    const { title, description, category, level, duration, thumbnail, learningOutcomes, status } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required'
      });
    }

    let baseSlug = slugify(title);
    let uniqueSlug = baseSlug;
    let count = 1;
    while (await Course.exists({ slug: uniqueSlug })) {
      uniqueSlug = `${baseSlug}-${count++}`;
    }

    const course = await Course.create({
      title: title.trim(),
      slug: uniqueSlug,
      description: description.trim(),
      category: category.trim(),
      level: level || 'Beginner',
      duration: duration || '30 hours',
      thumbnail: thumbnail || '',
      learningOutcomes: Array.isArray(learningOutcomes) ? learningOutcomes : ['Foundational concepts', 'Hands-on practice'],
      status: status ? status.toLowerCase() : 'draft',
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/teacher/courses/:id
 * Update course details
 */
exports.updateCourse = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.createdBy; // Protect createdBy

    if (updates.title && !updates.slug) {
      updates.slug = slugify(updates.title);
    }
    if (updates.status) {
      updates.status = updates.status.toLowerCase();
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/teacher/courses/:id
 * Delete course and cascade delete chapters and lessons
 */
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Cascade delete lessons and chapters
    await Lesson.deleteMany({ courseId: course._id });
    await Chapter.deleteMany({ courseId: course._id });
    await Practical.deleteMany({ courseId: course._id });
    await course.deleteOne();

    res.status(200).json({
      success: true,
      message: `Course "${course.title}" and all its chapters & lessons were deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/teacher/courses/reorder
 * Reorder course list
 */
exports.reorderCourses = async (req, res, next) => {
  try {
    const { courseIds } = req.body;
    if (!Array.isArray(courseIds)) {
      return res.status(400).json({
        success: false,
        message: 'courseIds array is required'
      });
    }

    const updates = courseIds.map((id, index) =>
      Course.findByIdAndUpdate(id, { $set: { order: index } })
    );
    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: 'Courses reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};
