/**
 * ATCodes Theme Management System
 * Handles Dark/Light mode persistence, system preference detection, and instantaneous class application.
 */

(function () {
  const THEME_KEY = 'atcodes_theme';

  // Apply theme immediately to <html> to prevent flash of unstyled content
  function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  const initialTheme = getPreferredTheme();
  if (initialTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  window.ATCodesTheme = {
    get: function () {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    },
    set: function (theme) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem(THEME_KEY, 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem(THEME_KEY, 'light');
      }
      this.updateIcons();
      window.dispatchEvent(new CustomEvent('atcodes:themechange', { detail: { theme } }));
    },
    toggle: function () {
      const current = this.get();
      const next = current === 'dark' ? 'light' : 'dark';
      this.set(next);
      return next;
    },
    updateIcons: function () {
      const isDark = document.documentElement.classList.contains('dark');
      document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
        if (isDark) {
          icon.setAttribute('data-lucide', 'sun');
        } else {
          icon.setAttribute('data-lucide', 'moon');
        }
      });
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    }
  };

  // Wire up toggles on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    window.ATCodesTheme.updateIcons();
    document.querySelectorAll('[data-theme-toggle]').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        window.ATCodesTheme.toggle();
      });
    });
  });
})();
