/**
 * Chapter Management Controller
 */
const Chapter = require('../models/Chapter');
const Course = require('../models/Course');
const Lesson = require('../models/Lesson');

/**
 * GET /api/teacher/courses/:courseId/chapters
 */
exports.getChaptersByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const chapters = await Chapter.find({ courseId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    for (const ch of chapters) {
      ch.lessons = await Lesson.find({ chapterId: ch._id })
        .sort({ order: 1 })
        .select('title slug order estimatedDuration status updatedAt')
        .lean();
      ch.totalLessons = ch.lessons.length;
    }

    res.status(200).json({
      success: true,
      count: chapters.length,
      data: chapters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/teacher/courses/:courseId/chapters
 */
exports.createChapter = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { title, description, status } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Chapter title is required'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Determine next order
    const lastChapter = await Chapter.findOne({ courseId }).sort({ order: -1 });
    const nextOrder = lastChapter ? lastChapter.order + 1 : 0;

    const chapter = await Chapter.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      courseId,
      order: nextOrder,
      status: status || 'published'
    });

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: chapter
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/teacher/chapters/:id
 */
exports.updateChapter = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.courseId; // Prevent changing parent course arbitrarily

    const chapter = await Chapter.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Chapter updated successfully',
      data: chapter
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/teacher/chapters/:id
 * Cascades delete of child lessons
 */
exports.deleteChapter = async (req, res, next) => {
  try {
    const chapter = await Chapter.findById(req.params.id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Cascade delete lessons under this chapter
    await Lesson.deleteMany({ chapterId: chapter._id });
    await chapter.deleteOne();

    res.status(200).json({
      success: true,
      message: `Chapter "${chapter.title}" and its topics were deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/teacher/chapters/reorder
 */
exports.reorderChapters = async (req, res, next) => {
  try {
    const { chapterIds } = req.body;
    if (!Array.isArray(chapterIds)) {
      return res.status(400).json({
        success: false,
        message: 'chapterIds array is required'
      });
    }

    const updates = chapterIds.map((id, index) =>
      Chapter.findByIdAndUpdate(id, { $set: { order: index } })
    );
    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: 'Chapters reordered successfully'
    });
  } catch (error) {
    next(error);
  }
};
