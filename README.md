# ATCodes — Phase 5: Production Deployment, Security & Launch

**Tagline:** Learn. Teach. Build.

ATCodes is an educational platform designed for teachers and their student cohorts, engineered for security, high-performance pedagogical delivery, and production scalability.

- **Phase 1** delivered the complete frontend foundation (20+ responsive pages across Public Website, Teacher Studio, and Student Portal with the 10-Step ATCodes Learning Method).
- **Phase 2** delivered the real **Node.js + Express.js** backend, **MongoDB Atlas** persistence (via Mongoose), **bcrypt** password hashing, secure **JWT authentication via HTTP-only cookies**, role-based authorization guards, rate limiting, and automated testing.
- **Phase 3** delivered the **Teacher Content Management System (CMS)**: Course Management, Chapter Management, 10-Step Structured Lesson Management, ChatGPT Content Importer with zero-loss parsing, Lesson Editor with live preview, and Practical Code Library.
- **Phase 4** delivered the **Complete Student Learning Management System**: Student Account Workflow (Pending/Active/Suspended), Course Enrollment Guards, Student Dashboard Telemetry, 10-Step Lesson Viewer, Progress Tracking, Practice Arena, and Assignment Review & Grading.
- **Phase 5** delivers **Production Deployment, Security & Launch**:
  - **Hosting Architecture:** Prepared for dual-tier deployment — Static Frontend on Vercel/Netlify/Cloudflare Pages and Node.js REST API on Render/Railway/AWS/Docker.
  - **Atlas Production Database:** Connection pooling (min: 5, max: 50), automatic reconnect handling, and high-performance compound indexing.
  - **Hardened Security:** HTTPS cookies, rate limiting, Helmet HTTP security headers, CORS origin whitelisting, reverse proxy trust (`trust proxy: 1`), and zero stack trace leakage.
  - **SEO & Search Crawler Privacy:** `robots.txt` disallows all private teacher/student areas, `sitemap.xml` indexes only public curricula, and `<meta name="robots" content="noindex, nofollow">` protects all 15 private portal pages.
  - **Brand Assets:** Vector SVG favicon and custom branded `404.html` with theme toggle.
  - **120 Passing Automated Integration Tests:** Comprehensive test suite validating security, CMS, student workflow, and data persistence.

---

## 🏗️ Production System Architecture

```text
                            [ User Browser / Device ]
                                       │
                       ┌───────────────┴───────────────┐
                       │ HTTPS (TLS 1.3 / Cloudflare)  │
                       ▼                               ▼
             https://atcodes.in              https://api.atcodes.in
         ┌────────────────────────┐      ┌─────────────────────────────┐
         │    Static Frontend     │      │     Backend Node.js API     │
         │ (Vercel/Netlify/Pages) │      │  (Render / Railway / AWS)   │
         │                        │      │                             │
         │  - HTML5, CSS3, ES6 JS │      │  - Express.js, Helmet       │
         │  - Responsive UI       │─────▶│  - Rate Limiter, CORS       │
         │  - Theme Switcher      │ AJAX │  - HTTP-only Cookies        │
         │  - robots.txt / 404    │      │  - Trust Proxy Enabled      │
         └────────────────────────┘      └──────────────┬──────────────┘
                                                        │
                                                        │ TLS Mongoose Pool (min: 5, max: 50)
                                                        ▼
                                         ┌─────────────────────────────┐
                                         │     MongoDB Atlas (Cloud)   │
                                         │  - Replica Set (M0 / M10)   │
                                         │  - Automated Snapshots      │
                                         │  - Compound Indexes         │
                                         └─────────────────────────────┘
```

---

## 📁 Repository Directory Structure

```text
ATCodes/
├── frontend/                     # Connected Frontend Foundation & Portals
│   ├── index.html                # Public Landing Page (SEO canonical + Open Graph)
│   ├── courses.html              # Course Catalog with search & filters
│   ├── course-details.html       # Course details & expandable curriculum
│   ├── about.html                # Mission, vision & 10-step pedagogy
│   ├── login.html                # Connected authentication form (Teacher/Student)
│   ├── register.html             # Connected student self-registration form
│   ├── 404.html                  # Branded 404 Not Found page
│   ├── favicon.svg               # Vector platform favicon
│   ├── robots.txt                # Search crawler control (blocks private portals)
│   ├── sitemap.xml               # Search engine sitemap for public courses
│   ├── css/
│   │   └── custom.css            # Design tokens, transitions, code themes
│   ├── js/
│   │   ├── api.js                # Full Client API Bridge (supports dynamic window.__ATCODES_API_BASE__)
│   │   ├── auth.js               # Client Auth Bridge (fetch with credentials, route guards)
│   │   ├── mock-data.js          # Curriculum fallback data
│   │   ├── theme.js              # Dark/light mode persistence (zero FOUC)
│   │   ├── common.js             # Toasts, modals, clipboard helpers
│   │   └── tailwind-config.js    # Design system palette
│   ├── teacher/                  # Teacher Studio (Protected: noindex, nofollow)
│   │   ├── dashboard.html        # Teacher Overview with real DB course telemetry
│   │   ├── courses.html          # Course CRUD with status filters and modals
│   │   ├── course-details.html   # Chapter & Topic hierarchy manager
│   │   ├── lesson-editor.html    # Full 10-step ATCodes method teaching editor
│   │   ├── content-import.html   # ChatGPT Markdown Importer with zero-loss retention
│   │   ├── practical-library.html# Multi-language code snippet library
│   │   ├── students.html         # Live student roster, activation controls, enroll modal & progress report
│   │   └── settings.html         # Instructor profile & security parameters
│   └── student/                  # Student Portal (Protected: noindex, nofollow)
│       ├── dashboard.html        # Real-time student hub with continue learning & progress
│       ├── my-courses.html       # Enrolled curriculum tracks with real progress bars
│       ├── lesson.html           # Distraction-free 10-step lesson reader & navigation
│       ├── practice.html         # Code challenge arena with status toggles
│       ├── assignments.html      # Milestone missions with submission modal & feedback
│       ├── progress.html         # Progress telemetry, course breakdowns & streak logs
│       └── profile.html          # Authenticated student profile with enrolled courses
│
├── backend/                      # Node.js + Express + MongoDB Backend
│   ├── config/
│   │   ├── env.js                # Environment variable loader & validator
│   │   └── db.js                 # Production MongoDB Atlas Mongoose connection pool
│   ├── controllers/
│   │   ├── authController.js     # Register, login, logout, get current user
│   │   ├── teacherController.js  # Student roster listing, status updates, progress reports
│   │   ├── studentController.js  # Dashboard, enrolled courses, 10-step lesson reader, progress tracking
│   │   ├── enrollmentController.js# Student enrollment creation, listing, and deletion
│   │   ├── courseController.js   # Course CRUD, filtering, reordering, cascade delete
│   │   ├── chapterController.js  # Chapter CRUD under course, reordering, cascade delete
│   │   ├── lessonController.js   # Structured 10-step lesson CRUD, publish/draft toggle
│   │   ├── practiceController.js # Multi-language practice tasks and student attempt status
│   │   ├── assignmentController.js# Assignment CRUD, submissions, and teacher evaluation/feedback
│   │   └── practicalController.js# Practical snippet library CRUD
│   ├── middleware/
│   │   ├── authMiddleware.js     # authenticateUser, requireTeacher, requireStudent, requireActiveAccount
│   │   ├── rateLimiter.js        # Express rate limiting for brute-force protection
│   │   └── errorHandler.js       # Safe global error handler & 404 router
│   ├── models/
│   │   ├── User.js               # User model with bcrypt, compound index on role & accountStatus
│   │   ├── Course.js             # Course schema with slug, category, level, outcomes, status
│   │   ├── Chapter.js            # Chapter schema with courseId, order, status
│   │   ├── Lesson.js             # Structured Lesson schema with the 10 pedagogical sections
│   │   ├── Enrollment.js         # Student course enrollments with compound unique index
│   │   ├── Progress.js           # Lesson progress status with compound unique index
│   │   ├── Practice.js           # Coding challenge schema with compound index
│   │   ├── PracticeAttempt.js    # Student coding challenge attempt tracking
│   │   ├── Assignment.js         # Capstone assignment schema with marks & due date
│   │   ├── Submission.js         # Student submissions, evaluation marks & teacher feedback
│   │   └── Practical.js          # Practical snippet schema supporting 10 languages
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth endpoints
│   │   ├── teacherRoutes.js      # /api/teacher endpoints (instructor-only)
│   │   ├── studentRoutes.js      # /api/student endpoints (active enrolled students only)
│   │   └── index.js              # Master API router & public course discovery
│   ├── utils/
│   │   ├── chatgptParser.js      # 10-step heading regex parser, zero-loss retain
│   │   └── tokenUtils.js         # JWT signing, verification, and HTTP-only cookie handlers
│   ├── scripts/
│   │   ├── seedTeacher.js        # Teacher administrative seed script
│   │   └── seedContent.js        # Comprehensive curriculum, students, enrollments, practice & assignment seeder
│   ├── tests/
│   │   └── run-tests.js          # Automated integration test suite (120 assertions, in-memory MongoDB)
│   ├── Dockerfile                # Production multi-stage Docker build
│   ├── .dockerignore             # Docker build ignore rules
│   ├── .env                      # Local environment configuration (MongoDB Atlas configured)
│   ├── .env.example              # Environment variables template
│   ├── app.js                    # Express application configuration
│   ├── server.js                 # HTTP server entry point & graceful shutdown
│   └── package.json              # Backend dependencies and scripts
│
├── docs/
│   └── DEPLOYMENT_AND_MAINTENANCE.md # Production deployment, backup & recovery manual
├── render.yaml                   # Infrastructure-as-code for Render deployment
├── vercel.json                   # Vercel deployment configuration
├── netlify.toml                  # Netlify deployment configuration
├── .gitignore                    # Git ignore file (node_modules, .env, logs)
├── package.json                  # Root orchestration scripts
└── README.md                     # Documentation
```

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default in Dev | Production Example | Description |
| :--- | :---: | :--- | :--- | :--- |
| `NODE_ENV` | Yes | `development` | `production` | Switches security flags, cookie options, and logging |
| `PORT` | No | `5000` | `10000` (Render/Railway) | Port for backend HTTP server |
| `MONGODB_URI` | Yes | Local / Atlas URI | `mongodb+srv://...` | Secure connection string to MongoDB Atlas |
| `JWT_SECRET` | Yes | Fallback string | `rand_hex_64_chars` | Cryptographic secret for signing auth tokens |
| `FRONTEND_URL` | No | `http://localhost:5000` | `https://atcodes.in` | Main frontend origin for CORS and redirects |
| `COOKIE_DOMAIN` | No | `""` | `.atcodes.in` | Domain scope for session cookies across subdomains |
| `COOKIE_SAME_SITE` | No | `lax` | `lax` / `none` | SameSite cookie attribute (`none` if cross-domain) |
| `CORS_ORIGINS` | No | `*` | `https://atcodes.in,https://www.atcodes.in` | Comma-delimited origins permitted to call API |

---

## 🚀 Quick Start (Local Development)

### 1. Run Automated Test Suite
```bash
npm test
```
*Executes all **120 automated integration tests** across 38 stages using an isolated in-memory MongoDB server.*

### 2. Seed Database (MongoDB Atlas)
```bash
npm run seed:content
```
*Seeds teacher account, active & pending students, courses, chapters, 10-step structured lessons, enrollments, practice arena tasks, and milestone assignments.*

### 3. Start Development Server
```bash
npm run dev
# or
npm start
```
Server runs at `http://localhost:5000`.

### 4. Default Credentials
- **Teacher Portal:** `teacher@atcodes.internal` / `ATCodesTeacher2026!` (or `teacher@atcodes.dev` / `TeacherSecure2026!`)
- **Student Portal:** `student@atcodes.dev` / `StudentSecure2026!`

---

## 🌐 Production Deployment Steps

### Step 1: Deploy Backend (Render / Railway / AWS)
1. Push repository to private GitHub repo.
2. Link repository to [Render](https://render.com) Web Service.
3. Use Build Command: `cd backend && npm install --production`
4. Use Start Command: `node backend/server.js`
5. Fill environment variables as defined in table above.
6. Verify deployment at `https://<service-name>.onrender.com/api/health`.

### Step 2: Deploy Frontend (Vercel / Netlify / Cloudflare Pages)
1. Link repository to [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Set custom domain to `atcodes.in`.
4. Ensure `window.__ATCODES_API_BASE__` points to your backend URL (e.g. `https://api.atcodes.in`).

### Step 3: Custom Domain & DNS Mapping (`atcodes.in`)
- **A Record (`@`):** Points to Vercel/Netlify IP
- **CNAME (`www`):** Points to Vercel/Netlify CNAME
- **CNAME (`api`):** Points to Render/Railway service URL

---

## 💾 Backup, Recovery & Maintenance

Refer to the detailed guide: [DEPLOYMENT_AND_MAINTENANCE.md](file:///c:/Users/Ashvin%20Sir/Desktop/ATCodes/docs/DEPLOYMENT_AND_MAINTENANCE.md).

- **Backup:** `mongodump --uri="<MONGODB_URI>" --out="./backups/$(date +%Y-%m-%d)"`
- **Restore:** `mongorestore --uri="<MONGODB_URI>" --drop "./backups/<date>/atcodes"`
- **Health Monitoring:** Ping `/api/health` every 60s via UptimeRobot or BetterStack.

---

## ✅ Launch Verification Checklist

- [x] All 120 automated unit and integration tests passing.
- [x] MongoDB Atlas connection pool and compound indexes configured.
- [x] Secure HTTP-only cookies and bcrypt password hashing active.
- [x] Helmet security headers and dual-rate limiters active.
- [x] SEO configured (`robots.txt`, `sitemap.xml`, canonical URLs, `404.html`).
- [x] Private teacher and student portals protected from search engine indexing (`noindex, nofollow`).
- [x] `.env` excluded from version control via `.gitignore` and `.dockerignore`.
- [x] Dockerfile, Vercel, Netlify, and Render deployment templates ready.
