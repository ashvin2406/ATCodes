/**
 * Student Learning Experience Routes
 * Enforces student authentication AND active account status across all endpoints.
 */
const express = require('express');
const router = express.Router();

const studentController = require('../controllers/studentController');
const practiceController = require('../controllers/practiceController');
const assignmentController = require('../controllers/assignmentController');

const { authenticateUser, requireStudent, requireActiveAccount } = require('../middleware/authMiddleware');

// All student learning routes require authentication, student role, and active account
router.use(authenticateUser, requireStudent, requireActiveAccount);

// --- Dashboard & Telemetry ---
router.get('/dashboard-data', studentController.getDashboardData);

// --- Student Enrolled Courses ---
router.get('/courses', studentController.getStudentCourses);
router.get('/courses/:id', studentController.getStudentCourseById);
router.get('/courses/:courseId/chapters', studentController.getStudentCourseChapters);

// --- 10-Step Lesson Viewer & Progression ---
router.get('/lessons/:id', studentController.getStudentLesson);
router.post('/lessons/:id/start', studentController.startLesson);
router.patch('/lessons/:id/complete', studentController.completeLesson);

// --- Learning Progress & Milestones ---
router.get('/progress', studentController.getStudentProgress);

// --- Practice Arena ---
router.get('/practice', practiceController.getStudentPractices);
router.post('/practice/:practiceId/status', practiceController.updatePracticeStatus);

// --- Assignments & Milestone Missions ---
router.get('/assignments', assignmentController.getStudentAssignments);
router.get('/assignments/:id', assignmentController.getStudentAssignmentById);
router.post('/assignments/:id/submit', assignmentController.submitAssignment);

module.exports = router;
