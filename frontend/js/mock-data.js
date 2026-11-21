/**
 * ATCodes Central Client Data Interface
 * All hardcoded demo courses, fake chapters, and mock syllabuses have been removed.
 * Real data is served live from MongoDB Atlas via /api/courses and /api/student/*.
 */

window.ATCodesDB = (function () {
  const courses = [];

  return {
    getCourses() {
      return [];
    },
    getCourseById(id) {
      return null;
    },
    getCourseBySlug(slug) {
      return null;
    },
    getAllTopics() {
      return [];
    }
  };
})();
