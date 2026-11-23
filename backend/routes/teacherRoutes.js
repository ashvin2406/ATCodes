/**
 * Teacher Management & Content CMS Routes
 * Enforces teacher authorization on all endpoints.
 */
const express = require('express');
const router = express.Router();

const teacherController = require('../controllers/teacherController');
const courseController = require('../controllers/courseController');
const chapterController = require('../controllers/chapterController');
const lessonController = require('../controllers/lessonController');
const practicalController = require('../controllers/practicalController');
const enrollmentController = require('../controllers/enrollmentController');
const practiceController = require('../controllers/practiceController');
const assignmentController = require('../controllers/assignmentController');

const { authenticateUser, requireTeacher } = require('../middleware/authMiddleware');

// All teacher routes require authentication + teacher role
router.use(authenticateUser, requireTeacher);

// --- Student Management Endpoints ---
router.get('/students', teacherController.getStudents);
router.get('/students/:id', teacherController.getStudentById);
router.patch('/students/:id/status', teacherController.updateStudentStatus);
router.get('/students/:studentId/progress', teacherController.getStudentProgressReport);

// --- Course Enrollment Endpoints ---
router.post('/enrollments', enrollmentController.enrollStudent);
router.get('/enrollments', enrollmentController.getEnrollments);
router.delete('/enrollments/:id', enrollmentController.removeEnrollment);

// --- Course Management Endpoints ---
router.get('/courses', courseController.getCourses);
router.post('/courses', courseController.createCourse);
router.patch('/courses/reorder', courseController.reorderCourses);
router.get('/courses/:id', courseController.getCourseById);
router.patch('/courses/:id', courseController.updateCourse);
router.delete('/courses/:id', courseController.deleteCourse);

// --- Chapter Management Endpoints ---
router.get('/courses/:courseId/chapters', chapterController.getChaptersByCourse);
router.post('/courses/:courseId/chapters', chapterController.createChapter);
router.post('/courses/:courseId/chapters/bulk', chapterController.createChaptersBulk);
router.patch('/chapters/reorder', chapterController.reorderChapters);
router.patch('/chapters/:id', chapterController.updateChapter);
router.delete('/chapters/:id', chapterController.deleteChapter);

// --- Lesson & Content Management Endpoints ---
router.get('/chapters/:chapterId/lessons', lessonController.getLessonsByChapter);
router.post('/chapters/:chapterId/lessons', lessonController.createLesson);
router.post('/chapters/:chapterId/lessons/bulk', lessonController.createLessonsBulk);
router.post('/lessons/import-preview', lessonController.previewImport);
router.get('/lessons/:id', lessonController.getLessonById);
router.patch('/lessons/:id', lessonController.updateLesson);
router.patch('/lessons/:id/publish', lessonController.publishLesson);
router.delete('/lessons/:id', lessonController.deleteLesson);

// --- Practical Code Library Endpoints ---
router.get('/practicals', practicalController.getPracticals);
router.post('/practicals', practicalController.createPractical);
router.patch('/practicals/:id', practicalController.updatePractical);
router.delete('/practicals/:id', practicalController.deletePractical);

// --- Practice Challenge Management Endpoints ---
router.get('/practice', practiceController.getTeacherPractices);
router.post('/practice', practiceController.createPractice);
router.patch('/practice/:id', practiceController.updatePractice);
router.delete('/practice/:id', practiceController.deletePractice);

// --- Assignment & Evaluation Endpoints ---
router.get('/assignments', assignmentController.getTeacherAssignments);
router.post('/assignments', assignmentController.createAssignment);
router.patch('/assignments/:id', assignmentController.updateAssignment);
router.delete('/assignments/:id', assignmentController.deleteAssignment);
router.get('/assignments/:id/submissions', assignmentController.getAssignmentSubmissions);
router.patch('/submissions/:id/review', assignmentController.reviewSubmission);

module.exports = router;
