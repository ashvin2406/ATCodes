/**
 * ATCodes Real Backend Authentication Client
 * Connects Frontend to Express.js REST API with HTTP-only cookies and credentials.
 * Does NOT trust localStorage for authentication or role authorization.
 */

window.ATCodesAuth = (function () {
  // Determine API Base URL dynamically
  function getApiBase() {
    if (window.__ATCODES_API_BASE__) return window.__ATCODES_API_BASE__;
    const origin = window.location.origin;
    // If running on backend server (port 5000), use relative /api
    if (origin.includes(':5000')) {
      return '/api';
    }
    // If running on VS Code Live Server (5500) or other frontend dev server (3000, 8080)
    return (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5000/api'
      : '/api';
  }

  const API_BASE = getApiBase();

  async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      credentials: 'include', // Crucial: sends & receives HTTP-only JWT cookies
      headers: {
        ...defaultHeaders,
        ...(options.headers || {})
      }
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data?.error || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.code = data?.code;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      // Network connectivity or offline backend fallback
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        const networkErr = new Error('Cannot connect to backend server at ' + API_BASE + '. Please make sure the backend is running on port 5000.');
        networkErr.status = 503;
        networkErr.isNetworkError = true;
        throw networkErr;
      }
      throw err;
    }
  }

  // Register Student
  async function register(userData) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  // Login (Teacher or Student)
  async function login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  // Logout (Clears HTTP-only cookie on server)
  async function logout() {
    try {
      await apiRequest('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API warning:', e.message);
    }
    // Determine relative path to login
    const isSubdir = window.location.pathname.includes('/teacher/') || window.location.pathname.includes('/student/');
    window.location.href = isSubdir ? '../login.html' : 'login.html';
  }

  // Get current authenticated user profile
  async function getCurrentUser() {
    return apiRequest('/auth/me', { method: 'GET' });
  }

  // Teacher: Get Students Roster
  async function getTeacherStudents(status = '', search = '') {
    const query = new URLSearchParams();
    if (status) query.append('status', status);
    if (search) query.append('search', search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/teacher/students${qs}`, { method: 'GET' });
  }

  // Teacher: Update Student Status
  async function updateStudentStatus(studentId, newStatus) {
    return apiRequest(`/teacher/students/${studentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });
  }

  /**
   * Route Guard
   * Verifies real backend session.
   * If unauthenticated, redirects to login.
   * If role mismatch, redirects to appropriate portal.
   */
  async function protectRoute(options = {}) {
    const { allowedRoles = [], requireActive = false } = options;
    const isSubdir = window.location.pathname.includes('/teacher/') || window.location.pathname.includes('/student/');
    const loginPath = isSubdir ? '../login.html' : 'login.html';

    try {
      const res = await getCurrentUser();
      const user = res?.data?.user;

      if (!user) {
        window.location.href = loginPath;
        return null;
      }

      // Check role permissions
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        if (user.role === 'teacher') {
          window.location.href = isSubdir ? '../teacher/dashboard.html' : 'teacher/dashboard.html';
        } else {
          window.location.href = isSubdir ? '../student/dashboard.html' : 'student/dashboard.html';
        }
        return null;
      }

      // Check active account status
      if (requireActive && user.accountStatus === 'pending') {
        renderPendingBanner();
      }

      // Update UI elements with real user info
      populateUserUI(user);

      return user;
    } catch (err) {
      if (err.status === 401 || err.code === 'UNAUTHENTICATED' || err.code === 'TOKEN_INVALID') {
        window.location.href = loginPath;
        return null;
      }
      console.warn('[ATCodesAuth] Guard notice:', err.message);
      return null;
    }
  }

  function renderPendingBanner() {
    let banner = document.getElementById('atcodes-pending-banner');
    if (!banner) {
      banner = document.createElement('div');
      banner.id = 'atcodes-pending-banner';
      banner.className = 'bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-md';
      banner.innerHTML = `
        <span>⚠️ Your student account is currently <strong>Pending Activation</strong> by your instructor. Protected lessons and submission missions will unlock upon approval.</span>
      `;
      document.body.prepend(banner);
    }
  }

  function populateUserUI(user) {
    // Populate display name
    document.querySelectorAll('[data-auth-name]').forEach(el => {
      el.textContent = user.fullName;
    });

    // Populate email
    document.querySelectorAll('[data-auth-email]').forEach(el => {
      el.textContent = user.email;
    });

    // Populate role
    document.querySelectorAll('[data-auth-role]').forEach(el => {
      el.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    });

    // Populate avatar initials
    const initials = user.fullName
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    document.querySelectorAll('[data-auth-avatar]').forEach(el => {
      el.textContent = initials;
    });

    // Populate status badge if present
    document.querySelectorAll('[data-auth-status]').forEach(el => {
      el.textContent = user.accountStatus.charAt(0).toUpperCase() + user.accountStatus.slice(1);
    });
  }

  /**
   * Sync Public Navigation with Real Session
   * If logged in, replaces "Sign In" with "Teacher Studio / Student Portal" and "Logout".
   * If already logged in and on login/register pages, auto-redirects to dashboard.
   */
  async function syncPublicNavbar() {
    const path = window.location.pathname.toLowerCase();
    const isPortal = path.includes('/teacher/') || path.includes('/student/');
    const isAuthPage = path.endsWith('/login.html') || path.endsWith('/register.html') || path.endsWith('login.html') || path.endsWith('register.html');

    try {
      const res = await getCurrentUser();
      const user = res?.data?.user;
      if (!user) return;

      const dashboardUrl = user.role === 'teacher' ? 'teacher/dashboard.html' : 'student/dashboard.html';

      // Auto-redirect if already authenticated and accessing login or register
      if (isAuthPage) {
        window.location.replace(dashboardUrl);
        return;
      }

      // If on public pages, dynamically sync header buttons
      if (!isPortal) {
        // 1. Update brand logo title
        document.querySelectorAll('header a[href="index.html"], header a[href="/"], header a[href="./index.html"]').forEach(logo => {
          logo.setAttribute('title', `Active Session: ${user.fullName} (${user.role === 'teacher' ? 'Teacher' : 'Student'})`);
        });

        // 2. Add or update Dashboard link in Nav (Desktop)
        document.querySelectorAll('header nav').forEach(nav => {
          let dashLink = nav.querySelector('[data-nav-dashboard]');
          if (!dashLink) {
            dashLink = document.createElement('a');
            dashLink.setAttribute('data-nav-dashboard', 'true');
            dashLink.href = dashboardUrl;
            dashLink.className = "text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5 transition-colors";
            dashLink.innerHTML = `<i data-lucide="layout-dashboard" class="w-4 h-4"></i><span>Dashboard</span>`;
            nav.appendChild(dashLink);
          } else {
            dashLink.href = dashboardUrl;
          }
        });

        // 3. Update right CTA action buttons group
        document.querySelectorAll('#auth-actions-group').forEach(group => {
          group.innerHTML = `
            <a href="${dashboardUrl}" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all">
              <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
              <span>${user.role === 'teacher' ? 'Teacher Studio' : 'Student Portal'}</span>
            </a>
            <button type="button" onclick="ATCodesAuth.logout()" title="Sign Out" class="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900 transition-all">
              <i data-lucide="log-out" class="w-4 h-4"></i>
            </button>
          `;
        });

        // Fallback for any container without #auth-actions-group ID
        document.querySelectorAll('header .flex.items-center.gap-3, header .flex.items-center.gap-4').forEach(container => {
          if (container.querySelector('#auth-actions-group')) return;
          const signInBtn = container.querySelector('a[href*="login.html"]');
          const getStartedBtn = container.querySelector('a[href*="register.html"]');
          if (signInBtn) signInBtn.remove();
          if (getStartedBtn) {
            getStartedBtn.outerHTML = `
              <div class="hidden sm:flex items-center gap-2" id="auth-synced-buttons">
                <a href="${dashboardUrl}" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all">
                  <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                  <span>${user.role === 'teacher' ? 'Teacher Studio' : 'Student Portal'}</span>
                </a>
                <button type="button" onclick="ATCodesAuth.logout()" title="Sign Out" class="p-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-500 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900 transition-all">
                  <i data-lucide="log-out" class="w-4 h-4"></i>
                </button>
              </div>
            `;
          }
        });

        // 4. Update Mobile Navigation Dropdown
        const mobileMenu = document.getElementById('mobile-menu');
        if (mobileMenu) {
          mobileMenu.querySelectorAll('a[href*="login.html"]').forEach(link => {
            link.href = dashboardUrl;
            link.textContent = 'Go to Dashboard';
            link.className = 'block py-2 text-sm font-bold text-blue-600 dark:text-blue-400';
          });
          const mobileRegisterLink = mobileMenu.querySelector('a[href*="register.html"]');
          if (mobileRegisterLink) {
            mobileRegisterLink.parentElement.innerHTML = `
              <a href="${dashboardUrl}" class="w-full text-center py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2">
                <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                <span>Open ${user.role === 'teacher' ? 'Teacher Studio' : 'Student Portal'}</span>
              </a>
              <button type="button" onclick="ATCodesAuth.logout()" class="w-full text-center py-2 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-semibold text-xs mt-1">
                Sign Out
              </button>
            `;
          }
        }

        if (window.lucide) window.lucide.createIcons();
      }
    } catch (e) {
      // Unauthenticated, silently continue as guest
    }
  }

  // Automatically execute session sync on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncPublicNavbar);
  } else {
    syncPublicNavbar();
  }

  return {
    getApiBase,
    register,
    login,
    logout,
    getCurrentUser,
    getTeacherStudents,
    updateStudentStatus,
    protectRoute,
    populateUserUI,
    syncPublicNavbar
  };
})();
