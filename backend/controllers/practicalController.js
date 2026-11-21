/**
 * Practical Library Controller
 */
const Practical = require('../models/Practical');

/**
 * GET /api/teacher/practicals
 * Filter by language, search query
 */
exports.getPracticals = async (req, res, next) => {
  try {
    const { language, q, courseId } = req.query;
    const filter = {};

    if (language && language !== 'All') {
      filter.language = language;
    }

    if (courseId) {
      filter.courseId = courseId;
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { topic: { $regex: q, $options: 'i' } },
        { explanation: { $regex: q, $options: 'i' } },
        { code: { $regex: q, $options: 'i' } }
      ];
    }

    const practicals = await Practical.find(filter)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'fullName email')
      .populate('courseId', 'title')
      .lean();

    res.status(200).json({
      success: true,
      count: practicals.length,
      data: practicals
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/teacher/practicals
 */
exports.createPractical = async (req, res, next) => {
  try {
    const { title, description, language, code, explanation, topic, courseId, chapterId, lessonId } = req.body;

    if (!title || !language || !code) {
      return res.status(400).json({
        success: false,
        message: 'Title, language, and code are required'
      });
    }

    const validLanguages = ['C', 'C++', 'HTML', 'CSS', 'JavaScript', 'PHP', 'Java', 'Node.js', 'SQL', 'MongoDB'];
    if (!validLanguages.includes(language)) {
      return res.status(400).json({
        success: false,
        message: `Language must be one of: ${validLanguages.join(', ')}`
      });
    }

    const practical = await Practical.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      language,
      code,
      explanation: explanation ? explanation.trim() : '',
      topic: topic ? topic.trim() : '',
      courseId: courseId || null,
      chapterId: chapterId || null,
      lessonId: lessonId || null,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Practical snippet created successfully',
      data: practical
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/teacher/practicals/:id
 */
exports.updatePractical = async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.createdBy;

    const practical = await Practical.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!practical) {
      return res.status(404).json({
        success: false,
        message: 'Practical snippet not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Practical snippet updated successfully',
      data: practical
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/teacher/practicals/:id
 */
exports.deletePractical = async (req, res, next) => {
  try {
    const practical = await Practical.findById(req.params.id);
    if (!practical) {
      return res.status(404).json({
        success: false,
        message: 'Practical snippet not found'
      });
    }

    await practical.deleteOne();

    res.status(200).json({
      success: true,
      message: `Snippet "${practical.title}" deleted successfully`
    });
  } catch (error) {
    next(error);
  }
};
