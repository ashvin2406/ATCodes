/**
 * Seed Initial Curriculum, Students, Enrollments, Practice & Assignments
 * Run with: npm run seed:content
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Course = require('../models/Course');
const Chapter = require('../models/Chapter');
const Lesson = require('../models/Lesson');
const Practical = require('../models/Practical');
const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Practice = require('../models/Practice');
const Assignment = require('../models/Assignment');

async function seedContent() {
  try {
    await connectDB();
    console.log('🌱 Starting curriculum content & Phase 4 LMS seed...');

    // 1. Find or create teacher
    let teacher = await User.findOne({ role: 'teacher' });
    const teacherPasswordHash = await User.hashPassword('ATCodesTeacher2026!');
    if (!teacher) {
      teacher = await User.create({
        fullName: 'Prof. Alex Turner',
        email: process.env.SEED_TEACHER_EMAIL || 'teacher@atcodes.internal',
        mobile: '9876543210',
        passwordHash: teacherPasswordHash,
        role: 'teacher',
        accountStatus: 'active'
      });
      console.log(`✔ Created teacher account: ${teacher.email}`);
    } else {
      teacher.passwordHash = teacherPasswordHash;
      await teacher.save();
      console.log(`✔ Updated teacher password hash for: ${teacher.email}`);
    }

    // 2. Find or create Active Student
    const studentPasswordHash = await User.hashPassword('StudentSecure2026!');
    let activeStudent = await User.findOne({ email: 'student@atcodes.dev' });
    if (!activeStudent) {
      activeStudent = await User.create({
        fullName: 'Rohan Sharma',
        email: 'student@atcodes.dev',
        mobile: '9876543211',
        passwordHash: studentPasswordHash,
        role: 'student',
        accountStatus: 'active'
      });
      console.log(`✔ Created active student account: ${activeStudent.email}`);
    } else {
      activeStudent.passwordHash = studentPasswordHash;
      await activeStudent.save();
      console.log(`✔ Updated student password hash for: ${activeStudent.email}`);
    }

    // 3. Find or create Pending Student
    let pendingStudent = await User.findOne({ email: 'pending@atcodes.dev' });
    if (!pendingStudent) {
      pendingStudent = await User.create({
        fullName: 'Priya Patel',
        email: 'pending@atcodes.dev',
        mobile: '9876543212',
        passwordHash: studentPasswordHash,
        role: 'student',
        accountStatus: 'pending'
      });
      console.log(`✔ Created pending student account: ${pendingStudent.email}`);
    } else {
      pendingStudent.passwordHash = studentPasswordHash;
      await pendingStudent.save();
      console.log(`✔ Updated pending student password hash for: ${pendingStudent.email}`);
    }

    // 4. Create or fetch Courses
    let jsCourse = await Course.findOne({ slug: 'javascript-core-and-asynchronous-mechanics' });
    if (!jsCourse) {
      jsCourse = await Course.create({
        title: 'JavaScript Core & Asynchronous Mechanics',
        slug: 'javascript-core-and-asynchronous-mechanics',
        description: 'Execution context, call stack, event loop, closures, prototypes, async/await, and modern ESNext capabilities.',
        category: 'Frontend & Fullstack',
        level: 'Intermediate',
        duration: '40 hours',
        status: 'published',
        order: 1,
        learningOutcomes: [
          'Master JavaScript execution context & memory lifecycle',
          'Build production asynchronous pipelines with Event Loop mastery',
          'Avoid common V8 memory leaks in real-world apps'
        ],
        createdBy: teacher._id
      });
      console.log(`✔ Created course: ${jsCourse.title}`);
    }

    let cCourse = await Course.findOne({ slug: 'c-systems-programming-and-memory-engineering' });
    if (!cCourse) {
      cCourse = await Course.create({
        title: 'C Systems Programming & Memory Engineering',
        slug: 'c-systems-programming-and-memory-engineering',
        description: 'Pointers, stack vs heap allocation, dynamic memory management, structs, file I/O, and low-level POSIX systems.',
        category: 'Systems Programming',
        level: 'Beginner',
        duration: '45 hours',
        status: 'published',
        order: 2,
        learningOutcomes: [
          'Understand memory addresses and pointer arithmetic',
          'Prevent segmentation faults and use valgrind for leak detection',
          'Implement fundamental data structures in pure C'
        ],
        createdBy: teacher._id
      });
      console.log(`✔ Created course: ${cCourse.title}`);
    }

    // 5. Create Chapters for JS Course
    let ch1 = await Chapter.findOne({ courseId: jsCourse._id, order: 1 });
    if (!ch1) {
      ch1 = await Chapter.create({
        title: 'Chapter 1: Execution Context & The V8 Engine',
        description: 'How the browser and Node.js engines parse, compile, and execute JavaScript code in memory.',
        courseId: jsCourse._id,
        order: 1,
        status: 'published'
      });
    }

    let ch2 = await Chapter.findOne({ courseId: jsCourse._id, order: 2 });
    if (!ch2) {
      ch2 = await Chapter.create({
        title: 'Chapter 2: Asynchronous JavaScript & The Event Loop',
        description: 'Microtasks, macrotasks, Promises, and zero-blocking concurrent architectural patterns.',
        courseId: jsCourse._id,
        order: 2,
        status: 'published'
      });
    }

    // 6. Create 10-Step Structured Lesson
    let lesson1 = await Lesson.findOne({ courseId: jsCourse._id, order: 1 });
    if (!lesson1) {
      lesson1 = await Lesson.create({
        title: 'Scope Chain & The Magic of Closures',
        slug: 'scope-chain-and-the-magic-of-closures',
        courseId: jsCourse._id,
        chapterId: ch1._id,
        order: 1,
        estimatedDuration: '30 mins',
        status: 'published',
        content: {
          curiosity: {
            title: 'Curiosity',
            text: "What happens when a function finishes executing, disappears from the call stack, and yet a nested child function still remembers and modifies the dead function's variables? In C, doing this would point to garbage memory or trigger a segmentation fault. Why does JavaScript keep variables alive in memory even after their parent has ended?",
            code: ''
          },
          conceptDiscovery: {
            title: 'Concept Discovery',
            text: 'A closure is the combination of a function bundled together (enclosed) with references to its surrounding state (the lexical environment). In JavaScript, closures are created every time a function is created, at function creation time.',
            code: `function createCounter(initialValue = 0) {\n  let count = initialValue;\n  return {\n    increment: () => ++count,\n    decrement: () => --count,\n    getValue: () => count\n  };\n}`,
            language: 'javascript'
          },
          realLifeConnection: {
            title: 'Real-Life Connection',
            text: 'Imagine checking into a hotel. The receptionist programs an electronic keycard. Even after the receptionist leaves their shift and goes home (parent function returns), your keycard still retains cryptographic authorization to open room 402.'
          },
          blackboard: {
            title: "Teacher's Blackboard",
            text: 'Core principles of lexical scoping:',
            bullets: [
              'Functions carry a hidden [[Environment]] property pointing to their parent Lexical Scope.',
              'Garbage Collection (Mark-and-Sweep) NEVER purges an object reachable via an active reference chain.',
              'Closures preserve references to memory addresses, NOT snapshot copies of values.'
            ]
          },
          behindTheScenes: {
            title: 'Behind the Scenes',
            text: "Normally, local variables exist on the execution stack frame. When V8's parser detects an inner function referencing an outer variable, it moves that variable from the ephemeral stack frame into a specialized Closure Scope allocated on the Heap."
          },
          practical: {
            title: "Let's Build Something!",
            text: 'A sliding-window API Rate Limiter using internal closure state:',
            code: `function createRateLimiter(limit, windowMs) {\n  let requestTimestamps = [];\n  return function (userId) {\n    const now = Date.now();\n    requestTimestamps = requestTimestamps.filter(t => now - t < windowMs);\n    if (requestTimestamps.length >= limit) {\n      return { allowed: false, remaining: 0 };\n    }\n    requestTimestamps.push(now);\n    return { allowed: true, remaining: limit - requestTimestamps.length };\n  };\n}`,
            language: 'javascript'
          },
          developerThinking: {
            title: 'Think Like a Developer',
            text: 'Because closures keep heap memory alive, holding onto a closure referencing heavy buffers (like raw video frames or full DOM trees) prevents garbage collection. Always nullify event handlers upon unmounting.'
          },
          classroomChallenge: {
            title: 'Classroom Challenge',
            text: 'What does the following classic loop print, and why does replacing var with let fix the behavior?',
            code: `for (var i = 1; i <= 3; i++) {\n  setTimeout(() => {\n    console.log('Value: ' + i);\n  }, 1000);\n}`,
            language: 'javascript',
            notes: 'var is function-scoped so all timeouts share the same i (=4). let is block-scoped so each iteration binds a distinct variable.'
          },
          developerKnowledge: {
            title: 'Real Developer Knowledge',
            text: 'React Hooks (such as useState and useEffect) are powered entirely by JavaScript closures! When your React component function re-renders, it references state values maintained in an internal fiber array indexed by hook order.'
          },
          chapterMission: {
            title: 'Chapter Mission',
            text: 'Implement a memoize(fn) higher-order function that uses a closure cache map to store return values of expensive computations. Test it with a Fibonacci function and measure the performance speedup.'
          }
        }
      });
      console.log(`✔ Created 10-step lesson: ${lesson1.title}`);
    }

    // 7. Enroll active student in JS course
    await Enrollment.findOneAndUpdate(
      { studentId: activeStudent._id, courseId: jsCourse._id },
      { $setOnInsert: { status: 'active', enrolledAt: new Date() } },
      { upsert: true }
    );
    console.log(`✔ Enrolled ${activeStudent.fullName} in ${jsCourse.title}`);

    // 8. Seed Lesson Progress
    await Progress.findOneAndUpdate(
      { studentId: activeStudent._id, lessonId: lesson1._id },
      {
        $setOnInsert: {
          courseId: jsCourse._id,
          chapterId: ch1._id,
          status: 'inProgress',
          startedAt: new Date()
        }
      },
      { upsert: true }
    );

    // 9. Seed Practice Challenges
    const existingPractices = await Practice.countDocuments();
    if (existingPractices === 0) {
      await Practice.create([
        {
          title: 'Implement Sliding Window Rate Limiter',
          description: 'Construct a rate limiting higher order function that throttles calls per unique user ID using a sliding window timestamps array in closure scope.',
          instructions: 'Return an object with { allowed: boolean, remaining: number }.',
          difficulty: 'Intermediate',
          language: 'JavaScript',
          stub: 'function createRateLimiter(limit, windowMs) {\n  // Implement sliding window closure\n}',
          courseId: jsCourse._id,
          createdBy: teacher._id
        },
        {
          title: 'Dynamic Heap Array Allocation & Safe Free',
          description: 'Allocate contiguous integers on the heap using malloc, populate with multiples of 10, print, and prevent dangling pointers by setting to NULL immediately upon free.',
          instructions: 'Compile with gcc -Wall -Wextra and verify zero leaks with valgrind.',
          difficulty: 'Beginner',
          language: 'C',
          stub: '#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    // Allocate heap buffer and free safely\n    return 0;\n}',
          courseId: cCourse._id,
          createdBy: teacher._id
        },
        {
          title: 'Aggregate User Enrollment Pipeline',
          description: 'Write a MongoDB aggregation pipeline that groups students by active vs pending accountStatus and calculates progress distribution.',
          instructions: 'Use $match, $group, and $project stages.',
          difficulty: 'Intermediate',
          language: 'SQL',
          stub: 'SELECT account_status, COUNT(*) AS total_students\nFROM users\nGROUP BY account_status;',
          createdBy: teacher._id
        }
      ]);
      console.log('✔ Seeded Practice challenges');
    }

    // 10. Seed Milestone Assignment
    const existingAssignments = await Assignment.countDocuments();
    if (existingAssignments === 0) {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      await Assignment.create({
        title: 'Memoization Cache Higher-Order Function',
        description: 'Build a production-grade memoize(fn, resolver) utility function utilizing a Map closure cache to store results of expensive calculations.',
        courseId: jsCourse._id,
        chapterId: ch1._id,
        dueDate,
        totalMarks: 100,
        instructions: 'Handle multiple arguments, custom cache resolver functions, and test with recursive Fibonacci.',
        status: 'published',
        createdBy: teacher._id
      });
      console.log('✔ Seeded Milestone Assignment');
    }

    // 11. Seed Practical Library Snippets
    const existingPracticals = await Practical.countDocuments();
    if (existingPracticals === 0) {
      await Practical.create([
        {
          title: 'Sliding Window Rate Limiter Closure',
          language: 'JavaScript',
          topic: 'Closures & Memory Scopes',
          explanation: 'Enforces rate limits by holding timestamps in private closure scope.',
          code: `function createRateLimiter(limit, windowMs) {\n  let requests = [];\n  return (id) => {\n    const now = Date.now();\n    requests = requests.filter(t => now - t < windowMs);\n    if (requests.length >= limit) return false;\n    requests.push(now);\n    return true;\n  };\n}`,
          courseId: jsCourse._id,
          createdBy: teacher._id
        },
        {
          title: 'Safe Dynamic Pointer Allocation & Free Pattern',
          language: 'C',
          topic: 'Pointers & Dynamic Memory',
          explanation: 'Safely allocate contiguous heap memory and prevent dangling pointers by setting to NULL immediately upon free.',
          code: `#include <stdio.h>\n#include <stdlib.h>\n\nint main(void) {\n    int *arr = malloc(10 * sizeof(int));\n    if (!arr) {\n        perror("Allocation failed");\n        return EXIT_FAILURE;\n    }\n    for (int i = 0; i < 10; i++) arr[i] = i * 10;\n    free(arr);\n    arr = NULL; // Prevent dangling pointer\n    return EXIT_SUCCESS;\n}`,
          courseId: cCourse._id,
          createdBy: teacher._id
        }
      ]);
      console.log('✔ Seeded Practical Code Library');
    }

    console.log('✨ Seed content finished successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedContent();
