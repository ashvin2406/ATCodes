# ATCodes — Learn. Teach. Build.

A premium, modern, futuristic educational platform frontend designed for one teacher and their student cohorts. ATCodes provides a structured environment to organize courses, chapters, topics, teacher blackboard notes, practical code snippets, student challenges, assignments, and telemetry.

---

## 🚀 Phase 1: Complete Frontend Foundation & UI

This repository contains the complete **Phase 1** frontend development. It features a fully responsive, multi-page web application engineered with clean HTML5, CSS3, Vanilla JavaScript, and Tailwind CSS. All interactions use local mock data structured for direct compatibility with our future Node.js + Express.js and MongoDB Atlas backend.

---

## 🛠️ Technology Stack

- **Markup:** Semantic HTML5
- **Styling:** CSS3, Tailwind CSS (via Tailwind Play CDN with custom theme config), and `css/custom.css`
- **Scripting:** Vanilla JavaScript (ES6+ modular architecture, zero frameworks)
- **Icons:** Lucide Icons (via CDN with dynamic icon creation)
- **Typography:** Google Fonts (*Plus Jakarta Sans* for UI, *JetBrains Mono* for code)
- **Data Engine:** Centralized mock database (`js/mock-data.js`)
- **Theme Engine:** Instantaneous dark/light theme switching with `localStorage` persistence and zero-flash initialization (`js/theme.js`)

---

## 📂 Project Structure

```text
atcodes-frontend/
├── index.html                  # Landing page with hero, features, curriculum preview
├── courses.html                # Course catalog with real-time search & category filters
├── course-details.html         # Curriculum details, expandable chapters & outcomes
├── about.html                  # Mission, vision, and 10-step learning philosophy
├── login.html                  # Demo login with Teacher / Student portal switcher
├── register.html               # Student self-registration form with validation
├── css/
│   └── custom.css              # Custom design tokens, scrollbars, code themes, animations
├── js/
│   ├── tailwind-config.js      # Custom Tailwind colors (brand electric blue, dark surfaces)
│   ├── theme.js                # Dark/light mode switcher with zero-FOUC script
│   ├── mock-data.js            # Centralized API-ready schema: courses, lessons, students
│   └── common.js               # Toast notifications, modal helpers, copy code, sidebars
├── teacher/
│   ├── dashboard.html          # Teacher overview, statistics, activity log, quick actions
│   ├── courses.html            # Course management, search, create modal, delete prompt
│   ├── course-details.html     # Chapter & topic architecture, add chapter/topic modals
│   ├── lesson-editor.html      # Full 10-step ATCodes method teaching content editor
│   ├── content-import.html     # Dedicated ChatGPT / Markdown AI Content Importer & Section Mapper
│   ├── practical-library.html  # Multi-language code snippets with 1-click copy
│   ├── students.html           # Student roster table, progress bars, profile view modal
│   └── settings.html           # Educator profile, notifications, and platform info
├── student/
│   ├── dashboard.html          # Student overview, continue learning card, assignments
│   ├── my-courses.html         # Enrolled course cards with progress bars
│   ├── lesson.html             # Distraction-free 10-step lesson reader & code challenge
│   ├── practice.html           # Coding challenges with language filters & status
│   ├── assignments.html        # Milestone missions with submission modal
│   ├── progress.html           # Track-by-track progress breakdown & streak stats
│   └── profile.html            # Student profile, bio, and active track enrollments
└── README.md                   # Complete documentation and setup guide
```

---

## 🧭 Page Directory (All 20 Pages)

### A. Public Website
1. **Home (`index.html`):** Modern SaaS landing page featuring the hero section, platform features, featured courses grid, 4-step workflow, educator philosophy, and full footer.
2. **Courses Catalog (`courses.html`):** Comprehensive list of 10 tech courses with real-time search and category filtering.
3. **Course Details (`course-details.html`):** Dynamic course details with learning outcomes, expandable chapter topics, and enrollment call-to-actions.
4. **About Us (`about.html`):** Narrative detailing ATCodes' mission, vision, and the 10-step pedagogical learning philosophy.
5. **Login (`login.html`):** Premium authentication demonstration featuring a Teacher vs. Student portal role toggle and demo credential helpers.
6. **Registration (`register.html`):** Student self-registration with full form validation, password visibility toggle, and match verification.

### B. Teacher Dashboard
7. **Overview (`teacher/dashboard.html`):** KPI statistics cards (Total Courses, Chapters, Topics, Active Students), Continue Teaching card, and recent student activity log.
8. **My Courses (`teacher/courses.html`):** Course management dashboard with a modal for creating new courses and delete confirmation dialogues.
9. **Course Details (`teacher/course-details.html`):** Deep chapter and topic hierarchy manager with modals to append new chapters and topics.
10. **Lesson Editor (`teacher/lesson-editor.html`):** Educator studio integrating the **10-step ATCodes Learning Method**, live student preview modal, draft saving, and publishing controls. Includes direct link to the Content Importer.
11. **Content Importer (`teacher/content-import.html`):** Dedicated AI Content Ingestion engine: parses ChatGPT / Markdown output, auto-maps all 10 ATCodes pedagogical sections, features an Unmapped Content safety reservoir, file upload (.md), live preview, and draft/publish saving.
12. **Practical Library (`teacher/practical-library.html`):** Repository of code snippets across C, C++, JavaScript, Node.js, and SQL with 1-click clipboard copying.
13. **Students (`teacher/students.html`):** Student roster table with enrollment counts, progress percentage bars, status toggles, and profile modals.
14. **Settings (`teacher/settings.html`):** Profile management, notification triggers, and Phase 2 architecture compatibility parameters.

### C. Student Portal
14. **Dashboard (`student/dashboard.html`):** Personal learning hub with streak tracker, metrics, Continue Learning card, and upcoming assignments.
15. **My Courses (`student/my-courses.html`):** Enrolled curriculum cards with visual progress bars and quick-jump resume buttons.
16. **Lesson Viewer (`student/lesson.html`):** Distraction-free lesson interface with chapter sidebar checklist, all 10 ATCodes pedagogical steps, interactive classroom challenge hints, and a "Mark Completed" celebration toggle.
17. **Practice Arena (`student/practice.html`):** Code challenges with difficulty badges, language filters, and test verification modals.
18. **Assignments (`student/assignments.html`):** Capstone chapter missions with status filters and a submission modal.
19. **My Progress (`student/progress.html`):** Course-by-course completion meters, 14-day study streak, and milestone logs.
20. **Student Profile (`student/profile.html`):** Account information, enrolled tracks, and bio editor.

---

## 🧠 The 10-Step ATCodes Learning Method

Every core lesson in ATCodes is structured around the following 10-step sequence:

1. **Curiosity:** A provocative engineering question or mystery that engages the student.
2. **Concept Discovery:** The precise theoretical definition and foundational terms.
3. **Real-Life Connection:** A memorable real-world analogy (e.g. hotel keycards for closures).
4. **Teacher's Blackboard:** Immutable laws, architectural diagrams, and core rules.
5. **Behind the Scenes:** Low-level compiler internals, V8 heap/stack dynamics, and memory behavior.
6. **Let's Build Something!:** A practical, non-trivial, production-level code implementation.
7. **Think Like a Developer:** Trade-offs, memory leak prevention, and edge cases.
8. **Classroom Challenge:** An interactive code bug puzzle with solution hints.
9. **Real Developer Knowledge:** How industry frameworks (React, Express, Redux) apply the concept.
10. **Chapter Mission:** A capstone milestone assignment submitted for grading.

---

## 🏃 How to Run the Project Locally

The platform is built with standard web technologies and requires no complex compilation or bundler setup.

### Option 1: VS Code Live Server (Recommended)
1. Open the `atcodes-frontend` folder in **Visual Studio Code**.
2. Install the **Live Server** extension if not already installed.
3. Right-click on `index.html` and select **"Open with Live Server"**.
4. The site will launch automatically at `http://127.0.0.1:5500/index.html`.

### Option 2: Python HTTP Server
Open PowerShell or your command terminal inside the project directory:
```bash
python -m http.server 3000
```
Then navigate to `http://localhost:3000` in your web browser.

### Option 3: Node `npx serve`
```bash
npx serve .
```

---

## 🔮 Future Backend Compatibility (Phase 2 Roadmap)

The Phase 1 frontend is built to integrate with:
- **Backend:** Node.js + Express.js REST API
- **Database:** MongoDB Atlas + Mongoose ODM
- **Planned Collections:**
  - `users`: Authentication, roles (`teacher`, `student`), profiles
  - `courses`: Metadata, category, level, duration
  - `chapters`: Hierarchical parent-child chapter schema
  - `lessons`: 10-step method document fields
  - `enrollments`: Student-to-course linkage
  - `progress`: Completed topics, completion timestamps
  - `assignments`: Prompts, instructions, rubrics
  - `submissions`: GitHub repo URLs, student notes, grades

---

## 📋 Phase 1 Acceptance Checklist

- [x] Public homepage (`index.html`) complete
- [x] Courses page (`courses.html`) complete with search and filters
- [x] Course details page (`course-details.html`) complete with expandable chapters
- [x] About page (`about.html`) complete with 10-step pedagogy
- [x] Login UI (`login.html`) works as demo with Teacher / Student switcher
- [x] Student registration UI (`register.html`) works as demo with validation
- [x] Teacher dashboard (`teacher/dashboard.html`) complete with KPI stats
- [x] Course management UI (`teacher/courses.html`) complete with Create Modal
- [x] Chapter and topic UI (`teacher/course-details.html`) complete
- [x] Lesson editor (`teacher/lesson-editor.html`) includes all 10 ATCodes sections
- [x] Practical Library (`teacher/practical-library.html`) complete with copy code
- [x] Student management UI (`teacher/students.html`) complete
- [x] Student dashboard (`student/dashboard.html`) complete
- [x] Student lesson viewer (`student/lesson.html`) complete with ATCodes method
- [x] Practice page (`student/practice.html`) complete
- [x] Assignments page (`student/assignments.html`) complete with submit modal
- [x] Progress page (`student/progress.html`) complete
- [x] Profile page (`student/profile.html`) complete
- [x] Dark/light theme works across all pages with zero flash
- [x] Responsive on desktop, tablet, and mobile layouts
- [x] All internal navigation links work with relative paths
- [x] Clean console, zero broken assets or missing dependencies
