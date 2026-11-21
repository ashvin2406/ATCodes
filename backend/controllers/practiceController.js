/**
 * Practice Controller
 * Manages coding challenge creation for teachers and practice attempts for students.
 */
const mongoose = require('mongoose');
const Practice = require('../models/Practice');
const PracticeAttempt = require('../models/PracticeAttempt');

// --- Teacher Operations ---

async function createPractice(req, res, next) {
  try {
    const { title, description, instructions, difficulty, language, stub, solutionHint, courseId, lessonId } = req.body;

    if (!title || !description || !language) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and programming language are required'
      });
    }

    const practice = await Practice.create({
      title: title.trim(),
      description: description.trim(),
      instructions: instructions ? instructions.trim() : '',
      difficulty: difficulty || 'Beginner',
      language: language.trim(),
      stub: stub || '',
      solutionHint: solutionHint || '',
      courseId: courseId && mongoose.Types.ObjectId.isValid(courseId) ? courseId : null,
      lessonId: lessonId && mongoose.Types.ObjectId.isValid(lessonId) ? lessonId : null,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Practice challenge created successfully',
      data: practice
    });
  } catch (error) {
    next(error);
  }
}

async function getTeacherPractices(req, res, next) {
  try {
    const { courseId, language, difficulty, search } = req.query;
    const filter = {};

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filter.courseId = courseId;
    }
    if (language && language !== 'All') {
      filter.language = new RegExp(`^${language.trim()}$`, 'i');
    }
    if (difficulty && difficulty !== 'All') {
      filter.difficulty = new RegExp(`^${difficulty.trim()}$`, 'i');
    }
    if (search && search.trim()) {
      const q = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: q }, { description: q }];
    }

    const practices = await Practice.find(filter)
      .populate('courseId', 'title slug')
      .populate('lessonId', 'title slug')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        total: practices.length,
        practices
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updatePractice(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid practice ID format' });
    }

    const allowedUpdates = ['title', 'description', 'instructions', 'difficulty', 'language', 'stub', 'solutionHint', 'courseId', 'lessonId'];
    const updateData = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updateData[key] = req.body[key];
      }
    }

    const practice = await Practice.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Practice challenge not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Practice challenge updated successfully',
      data: practice
    });
  } catch (error) {
    next(error);
  }
}

async function deletePractice(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid practice ID format' });
    }

    const practice = await Practice.findByIdAndDelete(id);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Practice challenge not found' });
    }

    // Clean up attempts
    await PracticeAttempt.deleteMany({ practiceId: id });

    res.status(200).json({
      success: true,
      message: 'Practice challenge deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}

// --- Student Operations ---

async function getStudentPractices(req, res, next) {
  try {
    const { language, difficulty, search } = req.query;
    const filter = {};

    if (language && language !== 'All') {
      filter.language = new RegExp(`^${language.trim()}$`, 'i');
    }
    if (difficulty && difficulty !== 'All') {
      filter.difficulty = new RegExp(`^${difficulty.trim()}$`, 'i');
    }
    if (search && search.trim()) {
      const q = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: q }, { description: q }];
    }

    const practices = await Practice.find(filter)
      .populate('courseId', 'title slug')
      .populate('lessonId', 'title slug')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch student's attempts
    const attempts = await PracticeAttempt.find({ studentId: req.user._id }).lean();
    const attemptMap = new Map();
    for (const att of attempts) {
      attemptMap.set(att.practiceId.toString(), att);
    }

    // Augment practices with student's attempt status
    const augmentedPractices = practices.map((p) => {
      const attempt = attemptMap.get(p._id.toString());
      return {
        ...p,
        studentStatus: attempt ? attempt.status : 'pending',
        isCompleted: attempt ? attempt.status === 'completed' : false,
        studentCode: attempt ? attempt.codeSubmitted : p.stub
      };
    });

    res.status(200).json({
      success: true,
      data: {
        total: augmentedPractices.length,
        practices: augmentedPractices
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updatePracticeStatus(req, res, next) {
  try {
    const { practiceId } = req.params;
    const { status, codeSubmitted } = req.body;

    if (!mongoose.Types.ObjectId.isValid(practiceId)) {
      return res.status(400).json({ success: false, message: 'Invalid practice ID format' });
    }

    const validStatuses = ['attempted', 'completed', 'pending'];
    if (status && !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Status must be attempted, completed, or pending' });
    }

    const practice = await Practice.findById(practiceId);
    if (!practice) {
      return res.status(404).json({ success: false, message: 'Practice challenge not found' });
    }

    const newStatus = (status || 'attempted').toLowerCase();
    const updatePayload = {
      status: newStatus,
      completedAt: newStatus === 'completed' ? new Date() : null
    };
    if (codeSubmitted !== undefined) {
      updatePayload.codeSubmitted = codeSubmitted;
    }

    const attempt = await PracticeAttempt.findOneAndUpdate(
      { studentId: req.user._id, practiceId },
      { $set: updatePayload },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message: `Practice status updated to ${newStatus}`,
      data: attempt
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createPractice,
  getTeacherPractices,
  updatePractice,
  deletePractice,
  getStudentPractices,
  updatePracticeStatus
};
