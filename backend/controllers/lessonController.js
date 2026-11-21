/**
 * Lesson & Content Management Controller
 */
const Lesson = require('../models/Lesson');
const Chapter = require('../models/Chapter');
const Course = require('../models/Course');
const { parseChatGPTMarkdown } = require('../utils/chatgptParser');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * GET /api/teacher/chapters/:chapterId/lessons
 */
exports.getLessonsByChapter = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const lessons = await Lesson.find({ chapterId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/teacher/lessons/:id
 */
exports.getLessonById = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('courseId', 'title slug category')
      .populate('chapterId', 'title order')
      .lean();

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/teacher/chapters/:chapterId/lessons
 * Create a new structured lesson
 */
exports.createLesson = async (req, res, next) => {
  try {
    const { chapterId } = req.params;
    const { title, estimatedDuration, content, status } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Lesson title is required'
      });
    }

    const chapter = await Chapter.findById(chapterId);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const lastLesson = await Lesson.findOne({ chapterId }).sort({ order: -1 });
    const nextOrder = lastLesson ? lastLesson.order + 1 : 0;

    let baseSlug = slugify(title);
    let uniqueSlug = baseSlug;
    let count = 1;
    while (await Lesson.exists({ slug: uniqueSlug, chapterId })) {
      uniqueSlug = `${baseSlug}-${count++}`;
    }

    const lesson = await Lesson.create({
      title: title.trim(),
      slug: uniqueSlug,
      chapterId: chapter._id,
      courseId: chapter.courseId,
      order: nextOrder,
      estimatedDuration: estimatedDuration || '25 mins',
      status: status === 'published' ? 'published' : 'draft', // defaults to draft
      content: content || {}
    });

    res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/teacher/lessons/:id
 * Update lesson title, duration, or structured content
 */
exports.updateLesson = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.courseId;
    delete updates.chapterId;

    if (updates.title && !updates.slug) {
      updates.slug = slugify(updates.title);
    }

    const lesson = await Lesson.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: lesson
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/teacher/lessons/:id/publish
 * Toggle or set published/draft state
 */
exports.publishLesson = async (req, res, next) => {
  try {
    const { status } = req.body;
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const targetStatus = status ? status.toLowerCase() : (lesson.status === 'published' ? 'draft' : 'published');
    if (!['published', 'draft'].includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "published" or "draft"'
      });
    }

    lesson.status = targetStatus;
    await lesson.save();

    res.status(200).json({
      success: true,
      message: `Lesson is now ${lesson.status}`,
      data: {
        id: lesson._id,
        status: lesson.status
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/teacher/lessons/:id
 */
exports.deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    await lesson.deleteOne();

    res.status(200).json({
      success: true,
      message: `Lesson "${lesson.title}" deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/teacher/lessons/import-preview
 * Ingest raw Markdown or ChatGPT text, parse into 10 structured sections,
 * and return preview data with unmapped content retention without saving.
 */
exports.previewImport = async (req, res, next) => {
  try {
    const { rawMarkdown } = req.body;
    if (!rawMarkdown || typeof rawMarkdown !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'rawMarkdown string is required for import parsing'
      });
    }

    const parseResult = parseChatGPTMarkdown(rawMarkdown);

    res.status(200).json({
      success: true,
      ...parseResult
    });
  } catch (error) {
    next(error);
  }
};
