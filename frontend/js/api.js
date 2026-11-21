/**
 * ATCodes Frontend API Client
 * Connects Teacher Studio and Course CMS to Express.js REST APIs.
 */

const API_BASE = window.__ATCODES_API_BASE__
  ? window.__ATCODES_API_BASE__
  : (window.location.origin.includes(':5000')
      ? '/api'
      : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'http://localhost:5000/api'
          : '/api'));

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include' // Sends secure HTTP-only cookies
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  const data = await response.json().catch(() => ({ success: false, message: 'Server communication error' }));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

window.ATCodesAPI = {
  // --- Course APIs ---
  async getCourses(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/teacher/courses?${query}` : '/teacher/courses';
    const res = await apiRequest(endpoint);
    return res.data || [];
  },

  async getCourse(id) {
    const res = await apiRequest(`/teacher/courses/${id}`);
    return res.data;
  },

  async createCourse(courseData) {
    return apiRequest('/teacher/courses', 'POST', courseData);
  },

  async updateCourse(id, courseData) {
    return apiRequest(`/teacher/courses/${id}`, 'PATCH', courseData);
  },

  async deleteCourse(id) {
    return apiRequest(`/teacher/courses/${id}`, 'DELETE');
  },

  async reorderCourses(courseIds) {
    return apiRequest('/teacher/courses/reorder', 'PATCH', { courseIds });
  },

  // --- Chapter APIs ---
  async getChapters(courseId) {
    const res = await apiRequest(`/teacher/courses/${courseId}/chapters`);
    return res.data || [];
  },

  async createChapter(courseId, chapterData) {
    return apiRequest(`/teacher/courses/${courseId}/chapters`, 'POST', chapterData);
  },

  async updateChapter(id, chapterData) {
    return apiRequest(`/teacher/chapters/${id}`, 'PATCH', chapterData);
  },

  async deleteChapter(id) {
    return apiRequest(`/teacher/chapters/${id}`, 'DELETE');
  },

  async reorderChapters(chapterIds) {
    return apiRequest('/teacher/chapters/reorder', 'PATCH', { chapterIds });
  },

  // --- Lesson APIs ---
  async getLessons(chapterId) {
    const res = await apiRequest(`/teacher/chapters/${chapterId}/lessons`);
    return res.data || [];
  },

  async getLesson(id) {
    const res = await apiRequest(`/teacher/lessons/${id}`);
    return res.data;
  },

  async createLesson(chapterId, lessonData) {
    return apiRequest(`/teacher/chapters/${chapterId}/lessons`, 'POST', lessonData);
  },

  async updateLesson(id, lessonData) {
    return apiRequest(`/teacher/lessons/${id}`, 'PATCH', lessonData);
  },

  async publishLesson(id, status = 'published') {
    return apiRequest(`/teacher/lessons/${id}/publish`, 'PATCH', { status });
  },

  async deleteLesson(id) {
    return apiRequest(`/teacher/lessons/${id}`, 'DELETE');
  },

  // --- ChatGPT Importer Preview ---
  async previewImport(rawMarkdown) {
    return apiRequest('/teacher/lessons/import-preview', 'POST', { rawMarkdown });
  },

  // --- Practical Code Library APIs ---
  async getPracticals(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/teacher/practicals?${query}` : '/teacher/practicals';
    const res = await apiRequest(endpoint);
    return res.data || [];
  },

  async createPractical(data) {
    return apiRequest('/teacher/practicals', 'POST', data);
  },

  async updatePractical(id, data) {
    return apiRequest(`/teacher/practicals/${id}`, 'PATCH', data);
  },

  async deletePractical(id) {
    return apiRequest(`/teacher/practicals/${id}`, 'DELETE');
  },

  // --- Phase 4: Teacher Enrollment APIs ---
  async getEnrollments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/teacher/enrollments?${query}` : '/teacher/enrollments';
    const res = await apiRequest(endpoint);
    return res.data?.enrollments || [];
  },

  async enrollStudent(studentId, courseId) {
    return apiRequest('/teacher/enrollments', 'POST', { studentId, courseId });
  },

  async removeEnrollment(id) {
    return apiRequest(`/teacher/enrollments/${id}`, 'DELETE');
  },

  // --- Phase 4: Teacher Practice Challenge Management ---
  async getTeacherPractices(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/teacher/practice?${query}` : '/teacher/practice';
    const res = await apiRequest(endpoint);
    return res.data?.practices || [];
  },

  async createPractice(data) {
    return apiRequest('/teacher/practice', 'POST', data);
  },

  async updatePractice(id, data) {
    return apiRequest(`/teacher/practice/${id}`, 'PATCH', data);
  },

  async deletePractice(id) {
    return apiRequest(`/teacher/practice/${id}`, 'DELETE');
  },

  // --- Phase 4: Teacher Assignment & Evaluation Management ---
  async getTeacherAssignments(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/teacher/assignments?${query}` : '/teacher/assignments';
    const res = await apiRequest(endpoint);
    return res.data?.assignments || [];
  },

  async createAssignment(data) {
    return apiRequest('/teacher/assignments', 'POST', data);
  },

  async updateAssignment(id, data) {
    return apiRequest(`/teacher/assignments/${id}`, 'PATCH', data);
  },

  async deleteAssignment(id) {
    return apiRequest(`/teacher/assignments/${id}`, 'DELETE');
  },

  async getAssignmentSubmissions(assignmentId) {
    const res = await apiRequest(`/teacher/assignments/${assignmentId}/submissions`);
    return res.data || { submissions: [] };
  },

  async reviewSubmission(submissionId, marks, feedback) {
    return apiRequest(`/teacher/submissions/${submissionId}/review`, 'PATCH', { marks, feedback });
  },

  async getStudentProgressReport(studentId) {
    const res = await apiRequest(`/teacher/students/${studentId}/progress`);
    return res.data;
  },

  // --- Phase 4: Student Learning Experience APIs ---
  async getStudentDashboard() {
    const res = await apiRequest('/student/dashboard-data');
    return res.data;
  },

  async getStudentCourses() {
    const res = await apiRequest('/student/courses');
    return res.data?.courses || [];
  },

  async getStudentCourse(courseId) {
    const res = await apiRequest(`/student/courses/${courseId}`);
    return res.data;
  },

  async getStudentLesson(lessonId) {
    const res = await apiRequest(`/student/lessons/${lessonId}`);
    return res.data;
  },

  async startStudentLesson(lessonId) {
    return apiRequest(`/student/lessons/${lessonId}/start`, 'POST');
  },

  async completeStudentLesson(lessonId, toggle = false) {
    const query = toggle ? '?toggle=true' : '';
    return apiRequest(`/student/lessons/${lessonId}/complete${query}`, 'PATCH');
  },

  async getStudentProgress() {
    const res = await apiRequest('/student/progress');
    return res.data;
  },

  async getStudentPractices(params = {}) {
    const query = new URLSearchParams(params).toString();
    const endpoint = query ? `/student/practice?${query}` : '/student/practice';
    const res = await apiRequest(endpoint);
    return res.data?.practices || [];
  },

  async updatePracticeStatus(practiceId, status, codeSubmitted = '') {
    return apiRequest(`/student/practice/${practiceId}/status`, 'POST', { status, codeSubmitted });
  },

  async getStudentAssignments() {
    const res = await apiRequest('/student/assignments');
    return res.data?.assignments || [];
  },

  async getStudentAssignment(id) {
    const res = await apiRequest(`/student/assignments/${id}`);
    return res.data;
  },

  async submitAssignment(assignmentId, submissionText, attachments = []) {
    return apiRequest(`/student/assignments/${assignmentId}/submit`, 'POST', { submissionText, attachments });
  }
};
