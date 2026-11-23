/**
 * ATCodes Automated Test Suite — Phase 2 & Phase 3
 * Tests full Authentication, Security, Course CMS, Chapters, Lessons (10-Step sequence),
 * ChatGPT Content Importer, and Practical Library.
 */

const http = require('http');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../app');
const User = require('../models/User');
const { parseChatGPTMarkdown } = require('../utils/chatgptParser');

let mongod;
let server;
let baseUrl;
let teacherCookie = '';
let studentCookie = '';
let pendingStudentId = '';
let activeStudentCookie = '';

// Test tracking variables
let createdCourseId = '';
let createdChapterId = '';
let createdLessonId = '';
let createdPracticalId = '';

async function setup() {
  console.log('⚡ Starting in-memory MongoDB server for testing...');
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await mongoose.connect(uri);
  console.log('✔ Connected to in-memory MongoDB');

  // Start HTTP server on dynamic port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  console.log(`✔ Test server listening on ${baseUrl}`);
}

async function teardown() {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongod) {
    await mongod.stop();
  }
  console.log('✔ Test environment torn down cleanly');
}

// Helper HTTP request function
function makeRequest(method, path, body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);
    const headers = {
      'Content-Type': 'application/json',
      'Origin': 'http://localhost:5000'
    };
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const payload = body ? JSON.stringify(body) : null;
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(rawData);
          } catch (e) {
            json = rawData;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json
          });
        });
      }
    );

    req.on('error', reject);

    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return '';
  const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return first.split(';')[0];
}

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failCount++;
  }
}

async function runTests() {
  try {
    await setup();

    // ==========================================
    // Phase 2: AUTHENTICATION & ACCESS CONTROL
    // ==========================================

    console.log('\n--- 1. Testing Student Registration ---');
    const regRes = await makeRequest('POST', '/api/auth/register', {
      fullName: 'Alice Developer',
      email: 'alice@student.dev',
      mobile: '9876543210',
      password: 'StudentSecurePass123!',
      confirmPassword: 'StudentSecurePass123!',
      termsAccepted: true
    });
    assert(regRes.status === 201, 'Student registration returns HTTP 201 Created');
    assert(regRes.body.success === true, 'Response body indicates success: true');
    assert(regRes.body.data.user.role === 'student', 'New user role is student');
    assert(regRes.body.data.user.accountStatus === 'pending', 'New student accountStatus starts as pending');
    assert(!regRes.body.data.user.passwordHash, 'Response never exposes passwordHash');
    pendingStudentId = regRes.body.data.user.id;

    console.log('\n--- 2. Testing Password Hashing in Database ---');
    const userInDb = await User.findById(pendingStudentId);
    assert(userInDb.passwordHash !== 'StudentSecurePass123!', 'Password is not stored in plaintext');
    assert(userInDb.passwordHash.startsWith('$2'), 'Password is encrypted using bcrypt');

    console.log('\n--- 3. Testing Duplicate Email Rejection ---');
    const dupRes = await makeRequest('POST', '/api/auth/register', {
      fullName: 'Alice Clone',
      email: 'alice@student.dev',
      mobile: '9876543211',
      password: 'StudentSecurePass123!',
      confirmPassword: 'StudentSecurePass123!',
      termsAccepted: true
    });
    assert(dupRes.status === 409, 'Duplicate email registration returns HTTP 409 Conflict');
    assert(dupRes.body.success === false, 'Duplicate error response contains success: false');

    console.log('\n--- 4. Testing Teacher Account Seed & Setup ---');
    const teacherHash = await User.hashPassword('TeacherSecure2026!');
    const teacherUser = await User.create({
      fullName: 'Prof. Alex Turner',
      email: 'teacher@atcodes.dev',
      mobile: '9876543222',
      passwordHash: teacherHash,
      role: 'teacher',
      accountStatus: 'active'
    });
    assert(teacherUser.role === 'teacher', 'Teacher account created with teacher role');

    console.log('\n--- 5. Testing Teacher Login & Cookie Issuance ---');
    const teacherLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'teacher@atcodes.dev',
      password: 'TeacherSecure2026!'
    });
    assert(teacherLoginRes.status === 200, 'Teacher login returns HTTP 200 OK');
    assert(teacherLoginRes.body.data.user.role === 'teacher', 'Authenticated user role is teacher');
    teacherCookie = extractCookie(teacherLoginRes.headers);
    assert(teacherCookie.includes('atcodes_token='), 'Server sets HTTP-only session cookie');
    assert(teacherLoginRes.headers['set-cookie'][0].includes('HttpOnly'), 'Cookie contains HttpOnly directive');

    console.log('\n--- 6. Testing Invalid Login Rejection ---');
    const badLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'teacher@atcodes.dev',
      password: 'WrongPassword999!'
    });
    assert(badLoginRes.status === 401, 'Invalid password returns HTTP 401 Unauthorized');

    console.log('\n--- 7. Testing Current User (/api/auth/me) Safe Profile ---');
    const meRes = await makeRequest('GET', '/api/auth/me', null, teacherCookie);
    assert(meRes.status === 200, 'GET /api/auth/me returns HTTP 200');
    assert(meRes.body.data.user.email === 'teacher@atcodes.dev', 'Returns authenticated user safe profile');
    assert(!meRes.body.data.user.passwordHash, 'Profile omits passwordHash');

    console.log('\n--- 8. Testing Student Activation & Access ---');
    const activateRes = await makeRequest(
      'PATCH',
      `/api/teacher/students/${pendingStudentId}/status`,
      { status: 'active' },
      teacherCookie
    );
    assert(activateRes.status === 200, 'Teacher can activate student account');

    const studentLoginRes = await makeRequest('POST', '/api/auth/login', {
      email: 'alice@student.dev',
      password: 'StudentSecurePass123!'
    });
    activeStudentCookie = extractCookie(studentLoginRes.headers);
    assert(studentLoginRes.body.data.user.accountStatus === 'active', 'Student account is now active');

    // ==========================================
    // Phase 3: COURSE MANAGEMENT
    // ==========================================

    console.log('\n--- 9. Testing Course Creation (Teacher Only) ---');
    const createCourseRes = await makeRequest(
      'POST',
      '/api/teacher/courses',
      {
        title: 'Rust Systems & High-Performance Engineering',
        description: 'Memory safety without garbage collection, borrow checker, threads and async concurrency.',
        category: 'Systems Programming',
        level: 'Intermediate',
        duration: '35 hours',
        status: 'draft',
        learningOutcomes: ['Borrow checker mechanics', 'Fearless concurrency']
      },
      teacherCookie
    );
    assert(createCourseRes.status === 201, 'POST /api/teacher/courses returns HTTP 201 Created');
    assert(createCourseRes.body.success === true, 'Course creation marked success: true');
    assert(createCourseRes.body.data.slug.includes('rust-systems'), 'Course slug generated cleanly');
    assert(createCourseRes.body.data.status === 'draft', 'New course starts as draft');
    createdCourseId = createCourseRes.body.data._id;

    console.log('\n--- 10. Testing Course Creation Guard (Block Non-Teachers) ---');
    const studentBlockedCourse = await makeRequest(
      'POST',
      '/api/teacher/courses',
      { title: 'Hacked Course', description: 'desc', category: 'Hack' },
      activeStudentCookie
    );
    assert(studentBlockedCourse.status === 403, 'Student blocked from course creation with HTTP 403 Forbidden');

    console.log('\n--- 11. Testing Course Search & Filtering ---');
    const searchRes = await makeRequest('GET', '/api/teacher/courses?q=Rust', null, teacherCookie);
    assert(searchRes.status === 200, 'GET /api/teacher/courses with search returns HTTP 200');
    assert(searchRes.body.data.length >= 1, 'Search finds created course');
    assert(searchRes.body.data[0].title.includes('Rust'), 'Returned course title matches query');

    console.log('\n--- 12. Testing Course Details & Update ---');
    const updateCourseRes = await makeRequest(
      'PATCH',
      `/api/teacher/courses/${createdCourseId}`,
      { status: 'published', duration: '40 hours' },
      teacherCookie
    );
    assert(updateCourseRes.status === 200, 'PATCH /api/teacher/courses/:id returns HTTP 200');
    assert(updateCourseRes.body.data.status === 'published', 'Course status updated to published');

    const getCourseRes = await makeRequest('GET', `/api/teacher/courses/${createdCourseId}`, null, teacherCookie);
    assert(getCourseRes.status === 200, 'GET /api/teacher/courses/:id returns HTTP 200');
    assert(getCourseRes.body.data.duration === '40 hours', 'Updated fields verified in course fetch');

    console.log('\n--- 13. Testing Course Reordering ---');
    const reorderCourseRes = await makeRequest(
      'PATCH',
      '/api/teacher/courses/reorder',
      { courseIds: [createdCourseId] },
      teacherCookie
    );
    assert(reorderCourseRes.status === 200, 'Course reorder endpoint returns HTTP 200');

    // ==========================================
    // Phase 3: CHAPTER MANAGEMENT
    // ==========================================

    console.log('\n--- 14. Testing Chapter Creation & Relationship Guard ---');
    const createChapterRes = await makeRequest(
      'POST',
      `/api/teacher/courses/${createdCourseId}/chapters`,
      {
        title: 'Chapter 1: The Rust Borrow Checker & Lifetimes',
        description: 'Ownership semantics, mutable borrows, and reference validation at compile time.'
      },
      teacherCookie
    );
    assert(createChapterRes.status === 201, 'POST /api/teacher/courses/:id/chapters returns HTTP 201');
    assert(createChapterRes.body.data.courseId === createdCourseId, 'Chapter correctly references courseId');
    createdChapterId = createChapterRes.body.data._id;

    console.log('\n--- 15. Testing Chapter Listing for Course ---');
    const listChaptersRes = await makeRequest(
      'GET',
      `/api/teacher/courses/${createdCourseId}/chapters`,
      null,
      teacherCookie
    );
    assert(listChaptersRes.status === 200, 'GET chapters by course returns HTTP 200');
    assert(listChaptersRes.body.data.length === 1, 'Returns 1 chapter under course');

    console.log('\n--- 16. Testing Chapter Update & Reorder ---');
    const updateChRes = await makeRequest(
      'PATCH',
      `/api/teacher/chapters/${createdChapterId}`,
      { title: 'Chapter 1: Ownership, Borrowing & Stack Memory' },
      teacherCookie
    );
    assert(updateChRes.status === 200, 'PATCH chapter returns HTTP 200');
    assert(updateChRes.body.data.title.includes('Stack Memory'), 'Chapter title updated');

    const reorderChRes = await makeRequest(
      'PATCH',
      '/api/teacher/chapters/reorder',
      { chapterIds: [createdChapterId] },
      teacherCookie
    );
    assert(reorderChRes.status === 200, 'Chapter reorder endpoint returns HTTP 200');

    console.log('\n--- 16b. Testing Bulk Chapter Creation ---');
    const bulkChRes = await makeRequest(
      'POST',
      `/api/teacher/courses/${createdCourseId}/chapters/bulk`,
      { titles: ['Bulk Chapter A: Foundations', 'Bulk Chapter B: Advanced Architecture'] },
      teacherCookie
    );
    assert(bulkChRes.status === 201, 'POST /api/teacher/courses/:id/chapters/bulk returns HTTP 201');
    assert(bulkChRes.body.count === 2, '2 chapters created in bulk');
    assert(bulkChRes.body.data[0].title === 'Bulk Chapter A: Foundations', 'First bulk chapter title verified');

    // ==========================================
    // Phase 3: LESSON MANAGEMENT & 10 SECTIONS
    // ==========================================

    console.log('\n--- 17. Testing Lesson Creation with 10 Structured Sections ---');
    const createLessonRes = await makeRequest(
      'POST',
      `/api/teacher/chapters/${createdChapterId}/lessons`,
      {
        title: 'Ownership & Move Semantics in Rust',
        estimatedDuration: '30 mins',
        status: 'draft',
        content: {
          curiosity: {
            title: 'Curiosity',
            text: 'Why does assigning a variable to another in Rust cause the first variable to become completely unusable at compile-time?'
          },
          conceptDiscovery: {
            title: 'Concept Discovery',
            text: 'Each value in Rust has an owner. There can only be one owner at a time. When the owner goes out of scope, the value is dropped.',
            code: 'let s1 = String::from("hello");\nlet s2 = s1; // s1 moved here',
            language: 'rust'
          },
          realLifeConnection: {
            title: 'Real-Life Connection',
            text: 'Think of passing a physical car key to a friend. You no longer possess the key once passed.'
          },
          blackboard: {
            title: "Teacher's Blackboard",
            text: 'Rules of Ownership:',
            bullets: [
              'Each value has exactly one owner.',
              'Value dropped when owner goes out of scope.',
              'Move transfers ownership without deep heap copying.'
            ]
          },
          behindTheScenes: {
            title: 'Behind the Scenes',
            text: 'Rust invalidates the stack pointer of the original variable so no double-free occurs when dropping.'
          },
          practical: {
            title: "Let's Build Something!",
            text: 'Demonstrating ownership and custom Drop implementation:',
            code: 'struct Guard(&str);\nimpl Drop for Guard {\n    fn drop(&mut self) {\n        println!("Dropping guard");\n    }\n}',
            language: 'rust'
          },
          developerThinking: {
            title: 'Think Like a Developer',
            text: 'Avoid cloning large heap vectors just to satisfy the compiler; pass references with borrowed lifetimes instead.'
          },
          classroomChallenge: {
            title: 'Classroom Challenge',
            text: 'Fix the borrow checker error in the code below by passing a reference rather than taking ownership.',
            code: 'fn print_len(s: String) -> usize { s.len() }',
            language: 'rust'
          },
          developerKnowledge: {
            title: 'Real Developer Knowledge',
            text: 'High-frequency trading engines in Chicago and crypto infrastructure use Rust precisely for zero-cost ownership semantics.'
          },
          chapterMission: {
            title: 'Chapter Mission',
            text: 'Build a concurrent thread-safe LRU Cache with zero allocation locks.'
          }
        }
      },
      teacherCookie
    );
    assert(createLessonRes.status === 201, 'POST /api/teacher/chapters/:id/lessons returns HTTP 201');
    assert(createLessonRes.body.data.status === 'draft', 'New lesson starts as draft');
    assert(createLessonRes.body.data.content.curiosity.text.includes('compile-time'), 'Curiosity section saved');
    assert(createLessonRes.body.data.content.conceptDiscovery.code.includes('s1 moved'), 'Code block preserved');
    createdLessonId = createLessonRes.body.data._id;

    console.log('\n--- 18. Testing Lesson Fetch & Structured Content Verification ---');
    const getLessonRes = await makeRequest('GET', `/api/teacher/lessons/${createdLessonId}`, null, teacherCookie);
    assert(getLessonRes.status === 200, 'GET /api/teacher/lessons/:id returns HTTP 200');
    assert(getLessonRes.body.data.content.blackboard.bullets.length === 3, 'All blackboard bullet points preserved');
    assert(getLessonRes.body.data.content.practical.language === 'rust', 'Code block language preserved');

    console.log('\n--- 18b. Testing Bulk Lesson/Topic Creation ---');
    const bulkLessonRes = await makeRequest(
      'POST',
      `/api/teacher/chapters/${createdChapterId}/lessons/bulk`,
      {
        titles: ['Topic 1: Lifetimes & Borrow Checker', 'Topic 2: Smart Pointers (Rc, Arc, RefCell)'],
        estimatedDuration: '40 mins'
      },
      teacherCookie
    );
    assert(bulkLessonRes.status === 201, 'POST /api/teacher/chapters/:id/lessons/bulk returns HTTP 201');
    assert(bulkLessonRes.body.count === 2, '2 topics created in bulk');
    assert(bulkLessonRes.body.data[0].estimatedDuration === '40 mins', 'Bulk lesson duration set');
    assert(bulkLessonRes.body.data[0].status === 'draft', 'Bulk lessons default to draft');

    console.log('\n--- 19. Testing Lesson Publishing State Toggle ---');
    const publishRes = await makeRequest(
      'PATCH',
      `/api/teacher/lessons/${createdLessonId}/publish`,
      { status: 'published' },
      teacherCookie
    );
    assert(publishRes.status === 200, 'PATCH /api/teacher/lessons/:id/publish returns HTTP 200');
    assert(publishRes.body.data.status === 'published', 'Lesson successfully marked as published');

    console.log('\n--- 20. Testing Course Enrollment & Access Guard ---');
    // Unenrolled student blocked from course lesson
    const unenrolledLessonRes = await makeRequest(
      'GET',
      `/api/student/lessons/${createdLessonId}`,
      null,
      activeStudentCookie
    );
    assert(unenrolledLessonRes.status === 403, 'Unenrolled student blocked with HTTP 403 Forbidden');

    // Teacher enrolls student into course
    const enrollRes = await makeRequest(
      'POST',
      '/api/teacher/enrollments',
      { studentId: pendingStudentId, courseId: createdCourseId },
      teacherCookie
    );
    assert(enrollRes.status === 201, 'Teacher enrolls student with HTTP 201 Created');
    assert(enrollRes.body.success === true, 'Enrollment returned success: true');

    // Duplicate enrollment rejected
    const dupEnrollRes = await makeRequest(
      'POST',
      '/api/teacher/enrollments',
      { studentId: pendingStudentId, courseId: createdCourseId },
      teacherCookie
    );
    assert(dupEnrollRes.status === 409, 'Duplicate enrollment rejected with HTTP 409 Conflict');

    // Active enrolled student can now access published lesson
    const studentLessonRes = await makeRequest(
      'GET',
      `/api/student/lessons/${createdLessonId}`,
      null,
      activeStudentCookie
    );
    assert(studentLessonRes.status === 200, 'Active enrolled student can view published lesson');
    assert(studentLessonRes.body.data.content.chapterMission.text.includes('LRU Cache'), 'Student sees chapter mission');
    assert(studentLessonRes.body.data.progressStatus === 'inProgress', 'Lesson automatically tracked as inProgress');

    // ==========================================
    // Phase 3: CHATGPT CONTENT IMPORTER ENGINE
    // ==========================================

    console.log('\n--- 21. Testing ChatGPT Markdown Importer Unit Parser ---');
    const sampleChatGPTMarkdown = `
# Master Guide to PostgreSQL Indexes

Introduction paragraph before sections. This should be captured in unmapped content.

## 1. Curiosity
Why does a query on 10 million rows slow down to 8 seconds without an index, but finishes in 1.2 milliseconds with a B-Tree index?

## 2. Concept Discovery
A B-Tree (Balanced Tree) index is a self-balancing tree data structure that maintains sorted data and allows searches, sequential access, insertions, and deletions in logarithmic time.

\`\`\`sql
CREATE INDEX idx_users_email ON users(email);
\`\`\`

## 3. Real-Life Connection
Think of the index in the back of an 800-page encyclopedia. Instead of reading page 1 through 800, you flip to the back, look up "Quantum", and immediately jump to page 412.

## 4. Teacher's Blackboard
• Rule 1: Indexes speed up SELECT queries but add overhead to INSERT and UPDATE operations.
• Rule 2: Multi-column indexes follow the Leftmost Prefix Rule.
• Rule 3: Use EXPLAIN ANALYZE to verify whether Postgres chooses an Index Scan or Seq Scan.

## 5. Behind the Scenes
Postgres indexes store tuple pointers (ctid: block number and item offset) pointing directly to heap table pages.

## 6. Let's Build Something!
Here is a query execution comparison with execution plans:

\`\`\`sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 42;
\`\`\`

## 7. Think Like a Developer
Indexes consume disk space and RAM. Creating an index on a boolean column with only two distinct values is wasteful; use a partial index instead.

## 8. Classroom Challenge
Why did Postgres ignore the index in this query: WHERE LOWER(email) = 'test@example.com'? How do you fix it?

## 9. Real Developer Knowledge
Production databases running Shopify and GitHub use partial indexes and covering indexes (INCLUDE clause) to achieve zero-heap lookups.

## 10. Chapter Mission
Design an indexing strategy for an e-commerce database with 50M products supporting full-text search and category filtering under 10ms p99 latency.

### Unrecognized Extra Section
This extra text should not be discarded under any circumstance.
`;

    const parsedResult = parseChatGPTMarkdown(sampleChatGPTMarkdown);
    assert(parsedResult.success === true, 'Parser runs successfully');
    assert(parsedResult.mappedCount === 10, 'All 10 ATCodes pedagogical sections detected');
    assert(parsedResult.sections.curiosity.text.includes('10 million rows'), 'Curiosity section extracted');
    assert(parsedResult.sections.conceptDiscovery.code.includes('CREATE INDEX'), 'Code block inside Concept Discovery extracted');
    assert(parsedResult.sections.blackboard.bullets.length === 3, 'Blackboard bullet points extracted');
    assert(parsedResult.sections.practical.language === 'sql', 'Code language SQL identified');
    assert(parsedResult.unmappedContent.includes('Introduction paragraph'), 'Initial unmapped content preserved');
    assert(parsedResult.unmappedContent.includes('Unrecognized Extra Section'), 'Trailing unmapped content preserved without silent loss');

    console.log('\n--- 22. Testing Importer Preview API Endpoint ---');
    const previewApiRes = await makeRequest(
      'POST',
      '/api/teacher/lessons/import-preview',
      { rawMarkdown: sampleChatGPTMarkdown },
      teacherCookie
    );
    assert(previewApiRes.status === 200, 'POST /api/teacher/lessons/import-preview returns HTTP 200');
    assert(previewApiRes.body.mappedCount === 10, 'Preview API detects 10 sections');
    assert(previewApiRes.body.unmappedContent.length > 0, 'Preview API exposes unmapped content');

    // ==========================================
    // Phase 3: PRACTICAL CODE LIBRARY
    // ==========================================

    console.log('\n--- 23. Testing Practical Snippet Creation ---');
    const createSnippetRes = await makeRequest(
      'POST',
      '/api/teacher/practicals',
      {
        title: 'B-Tree Index Scan Optimization in PostgreSQL',
        language: 'SQL',
        topic: 'Database & Backend',
        explanation: 'Creating a composite index with INCLUDE columns for index-only scans.',
        code: 'CREATE INDEX idx_orders_covering ON orders (user_id) INCLUDE (total_amount, status);',
        courseId: createdCourseId
      },
      teacherCookie
    );
    assert(createSnippetRes.status === 201, 'POST /api/teacher/practicals returns HTTP 201 Created');
    assert(createSnippetRes.body.data.language === 'SQL', 'Snippet language stored');
    createdPracticalId = createSnippetRes.body.data._id;

    console.log('\n--- 24. Testing Practical Library Filter & Search ---');
    const filterSnippetRes = await makeRequest('GET', '/api/teacher/practicals?language=SQL', null, teacherCookie);
    assert(filterSnippetRes.status === 200, 'GET /api/teacher/practicals with filter returns HTTP 200');
    assert(filterSnippetRes.body.data.length >= 1, 'Filter by SQL returns created snippet');

    console.log('\n--- 25. Testing Practical Snippet Update & Delete ---');
    const updateSnipRes = await makeRequest(
      'PATCH',
      `/api/teacher/practicals/${createdPracticalId}`,
      { explanation: 'Updated optimization pattern explanation.' },
      teacherCookie
    );
    assert(updateSnipRes.status === 200, 'PATCH practical returns HTTP 200');
    assert(updateSnipRes.body.data.explanation.includes('Updated'), 'Practical explanation updated');

    const delSnipRes = await makeRequest('DELETE', `/api/teacher/practicals/${createdPracticalId}`, null, teacherCookie);
    assert(delSnipRes.status === 200, 'DELETE practical returns HTTP 200');

    // ==========================================
    // Phase 4: STUDENT LEARNING MANAGEMENT SYSTEM
    // ==========================================

    console.log('\n--- 26. Testing Student Dashboard & Telemetry API ---');
    const studentDashRes = await makeRequest('GET', '/api/student/dashboard-data', null, activeStudentCookie);
    assert(studentDashRes.status === 200, 'GET /api/student/dashboard-data returns HTTP 200');
    assert(studentDashRes.body.data.courses.length >= 1, 'Dashboard returns active enrolled courses');
    assert(studentDashRes.body.data.user.email === 'alice@student.dev', 'Returns student safe user profile');
    assert(typeof studentDashRes.body.data.overallProgress === 'number', 'Overall progress percentage calculated');

    console.log('\n--- 27. Testing Student Enrolled Courses API ---');
    const studentCoursesRes = await makeRequest('GET', '/api/student/courses', null, activeStudentCookie);
    assert(studentCoursesRes.status === 200, 'GET /api/student/courses returns HTTP 200');
    assert(studentCoursesRes.body.data.courses.some(c => c._id === createdCourseId), 'Enrolled course present in list');

    const singleCourseRes = await makeRequest('GET', `/api/student/courses/${createdCourseId}`, null, activeStudentCookie);
    assert(singleCourseRes.status === 200, 'GET /api/student/courses/:id returns syllabus with chapters');
    assert(singleCourseRes.body.data.chapters.length >= 1, 'Chapters returned in syllabus');

    console.log('\n--- 28. Testing Lesson Progress Tracking (Start & Complete) ---');
    const startLessonRes = await makeRequest('POST', `/api/student/lessons/${createdLessonId}/start`, null, activeStudentCookie);
    assert(startLessonRes.status === 200, 'POST /api/student/lessons/:id/start returns HTTP 200');
    assert(startLessonRes.body.data.status === 'inProgress', 'Lesson marked inProgress');

    const completeLessonRes = await makeRequest('PATCH', `/api/student/lessons/${createdLessonId}/complete`, { status: 'completed' }, activeStudentCookie);
    assert(completeLessonRes.status === 200, 'PATCH /api/student/lessons/:id/complete returns HTTP 200');
    assert(completeLessonRes.body.data.status === 'completed', 'Lesson successfully marked as completed');
    assert(completeLessonRes.body.data.completedAt !== null, 'completedAt timestamp recorded');

    console.log('\n--- 29. Testing Student Overall Progress & Milestones ---');
    const progressRes = await makeRequest('GET', '/api/student/progress', null, activeStudentCookie);
    assert(progressRes.status === 200, 'GET /api/student/progress returns HTTP 200');
    assert(progressRes.body.data.overallPercentage === 100, 'Overall progress reflects 100% completion');
    assert(progressRes.body.data.milestones.length >= 1, 'Milestones log recorded completed lesson');

    console.log('\n--- 30. Testing Practice Challenge CRUD (Teacher) ---');
    let createdPracticeId = '';
    const createPracticeRes = await makeRequest(
      'POST',
      '/api/teacher/practice',
      {
        title: 'Thread-Safe Rust Arc Mutex Arena',
        description: 'Share mutable counter state across spawned OS threads safely.',
        instructions: 'Use std::sync::Arc and std::sync::Mutex.',
        difficulty: 'Intermediate',
        language: 'Rust',
        stub: 'use std::sync::{Arc, Mutex};\n\nfn main() {}',
        courseId: createdCourseId
      },
      teacherCookie
    );
    assert(createPracticeRes.status === 201, 'POST /api/teacher/practice returns HTTP 201 Created');
    assert(createPracticeRes.body.data.difficulty === 'Intermediate', 'Practice challenge difficulty stored');
    createdPracticeId = createPracticeRes.body.data._id;

    console.log('\n--- 31. Testing Student Practice Arena & Status Updates ---');
    const studentPracticesRes = await makeRequest('GET', '/api/student/practice', null, activeStudentCookie);
    assert(studentPracticesRes.status === 200, 'GET /api/student/practice returns HTTP 200');
    assert(studentPracticesRes.body.data.practices.some(p => p._id === createdPracticeId), 'Student sees created practice');

    const updatePracticeStatusRes = await makeRequest(
      'POST',
      `/api/student/practice/${createdPracticeId}/status`,
      { status: 'completed', codeSubmitted: '// Rust solution code' },
      activeStudentCookie
    );
    assert(updatePracticeStatusRes.status === 200, 'POST /api/student/practice/:id/status returns HTTP 200');
    assert(updatePracticeStatusRes.body.data.status === 'completed', 'Practice status updated to completed');

    console.log('\n--- 32. Testing Assignment Creation (Teacher) ---');
    let createdAssignmentId = '';
    const asgDueDate = new Date();
    asgDueDate.setDate(asgDueDate.getDate() + 7);

    const createAsgRes = await makeRequest(
      'POST',
      '/api/teacher/assignments',
      {
        title: 'Build a Lock-Free Ring Buffer',
        description: 'Implement a single-producer single-consumer circular buffer in Rust.',
        courseId: createdCourseId,
        chapterId: createdChapterId,
        dueDate: asgDueDate.toISOString(),
        totalMarks: 100,
        instructions: 'Use atomic usize head and tail indices with Acquire/Release orderings.'
      },
      teacherCookie
    );
    assert(createAsgRes.status === 201, 'POST /api/teacher/assignments returns HTTP 201 Created');
    assert(createAsgRes.body.data.totalMarks === 100, 'Assignment total marks stored');
    createdAssignmentId = createAsgRes.body.data._id;

    console.log('\n--- 33. Testing Student Assignment View & Submission ---');
    const studentAsgListRes = await makeRequest('GET', '/api/student/assignments', null, activeStudentCookie);
    assert(studentAsgListRes.status === 200, 'GET /api/student/assignments returns HTTP 200');
    const pendingAsg = studentAsgListRes.body.data.assignments.find(a => a._id === createdAssignmentId);
    assert(pendingAsg && pendingAsg.submissionStatus === 'Pending', 'Assignment initially marked as Pending');

    const submitAsgRes = await makeRequest(
      'POST',
      `/api/student/assignments/${createdAssignmentId}/submit`,
      { submissionText: 'https://github.com/alice/lock-free-ring-buffer' },
      activeStudentCookie
    );
    assert(submitAsgRes.status === 200, 'POST /api/student/assignments/:id/submit returns HTTP 200');
    assert(submitAsgRes.body.data.status === 'submitted', 'Submission status recorded as submitted');
    const submissionId = submitAsgRes.body.data._id;

    console.log('\n--- 34. Testing Teacher Submission Review & Grading ---');
    const teacherSubmissionsRes = await makeRequest('GET', `/api/teacher/assignments/${createdAssignmentId}/submissions`, null, teacherCookie);
    assert(teacherSubmissionsRes.status === 200, 'GET /api/teacher/assignments/:id/submissions returns HTTP 200');
    assert(teacherSubmissionsRes.body.data.totalSubmissions === 1, 'Teacher sees 1 student submission');

    const gradeRes = await makeRequest(
      'PATCH',
      `/api/teacher/submissions/${submissionId}/review`,
      { marks: 98, feedback: 'Flawless atomic ordering implementation with clean tests!' },
      teacherCookie
    );
    assert(gradeRes.status === 200, 'PATCH /api/teacher/submissions/:id/review returns HTTP 200');
    assert(gradeRes.body.data.marks === 98, 'Marks stored correctly');
    assert(gradeRes.body.data.status === 'reviewed', 'Submission marked as reviewed');

    console.log('\n--- 35. Testing Student Evaluated Grade & Feedback Visibility ---');
    const verifiedStudentAsgRes = await makeRequest('GET', `/api/student/assignments/${createdAssignmentId}`, null, activeStudentCookie);
    assert(verifiedStudentAsgRes.status === 200, 'GET single assignment returns HTTP 200');
    assert(verifiedStudentAsgRes.body.data.submissionStatus === 'Graded', 'Student sees assignment graded');
    assert(verifiedStudentAsgRes.body.data.submission.marks === 98, 'Student sees evaluated marks 98');
    assert(verifiedStudentAsgRes.body.data.submission.feedback.includes('Flawless'), 'Student sees teacher feedback');

    console.log('\n--- 36. Testing Teacher Detailed Student Progress Report Telemetry ---');
    const stdReportRes = await makeRequest('GET', `/api/teacher/students/${pendingStudentId}/progress`, null, teacherCookie);
    assert(stdReportRes.status === 200, 'GET /api/teacher/students/:id/progress returns HTTP 200');
    assert(stdReportRes.body.data.overallPercentage === 100, 'Teacher sees 100% student progress');
    assert(stdReportRes.body.data.submissions.length === 1, 'Teacher report includes student assignment submission');

    console.log('\n--- 37. Testing Cross-Role Security Guards ---');
    const studentBlockedAsg = await makeRequest('POST', '/api/teacher/assignments', { title: 'Hack' }, activeStudentCookie);
    assert(studentBlockedAsg.status === 403, 'Student blocked from POST /api/teacher/assignments with HTTP 403');

    const studentBlockedEnroll = await makeRequest('POST', '/api/teacher/enrollments', { studentId: pendingStudentId, courseId: createdCourseId }, activeStudentCookie);
    assert(studentBlockedEnroll.status === 403, 'Student blocked from POST /api/teacher/enrollments with HTTP 403');

    const studentBlockedReport = await makeRequest('GET', `/api/teacher/students/${pendingStudentId}/progress`, null, activeStudentCookie);
    assert(studentBlockedReport.status === 403, 'Student blocked from teacher telemetry reports with HTTP 403');

    // Clean up practice and assignment before course deletion
    await makeRequest('DELETE', `/api/teacher/practice/${createdPracticeId}`, null, teacherCookie);
    await makeRequest('DELETE', `/api/teacher/assignments/${createdAssignmentId}`, null, teacherCookie);

    // ==========================================
    // Phase 3: CASCADING DELETION INTEGRITY
    // ==========================================

    console.log('\n--- 38. Testing Course Deletion & Cascade Cleanliness ---');
    const delCourseRes = await makeRequest('DELETE', `/api/teacher/courses/${createdCourseId}`, null, teacherCookie);
    assert(delCourseRes.status === 200, 'DELETE course returns HTTP 200');

    // Verify chapters and lessons under course were deleted
    const verifyChRes = await makeRequest('GET', `/api/teacher/courses/${createdCourseId}/chapters`, null, teacherCookie);
    assert(verifyChRes.status === 404, 'Deleted course returns 404');

    const verifyLessonRes = await makeRequest('GET', `/api/teacher/lessons/${createdLessonId}`, null, teacherCookie);
    assert(verifyLessonRes.status === 404, 'Lessons under deleted course cascade removed');

    console.log('\n====================================================');
    console.log(`📊 Test Summary: ${passCount} Passed, ${failCount} Failed`);
    console.log('====================================================');

    if (failCount > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('❌ Test suite runtime error:', err);
    process.exitCode = 1;
  } finally {
    await teardown();
  }
}

runTests();
