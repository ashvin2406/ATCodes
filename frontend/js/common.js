/**
 * ATCodes Common Interactive Utilities
 * Handles Toasts, Modals, Clipboard, Responsive Sidebars, Accordions, and Form validation helpers.
 */

window.ATCodesUI = (function () {
  // Initialize Toast Container
  function getToastContainer() {
    let container = document.getElementById('atcodes-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'atcodes-toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4';
      document.body.appendChild(container);
    }
    return container;
  }

  function showToast(message, type = 'success', duration = 3500) {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-toast-in ${
      type === 'success' 
        ? 'bg-emerald-950/90 text-emerald-100 border-emerald-800' 
        : type === 'error'
        ? 'bg-rose-950/90 text-rose-100 border-rose-800'
        : type === 'warning'
        ? 'bg-amber-950/90 text-amber-100 border-amber-800'
        : 'bg-slate-900/90 text-slate-100 border-slate-700'
    }`;

    const iconName = type === 'success' ? 'check-circle-2' : type === 'error' ? 'alert-triangle' : type === 'warning' ? 'alert-circle' : 'info';
    
    toast.innerHTML = `
      <i data-lucide="${iconName}" class="w-5 h-5 flex-shrink-0"></i>
      <div class="text-sm font-medium flex-1">${message}</div>
      <button class="text-slate-400 hover:text-white transition-colors" onclick="this.parentElement.remove()">
        <i data-lucide="x" class="w-4 h-4"></i>
      </button>
    `;

    container.appendChild(toast);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: toast });
    }

    setTimeout(() => {
      toast.classList.replace('animate-toast-in', 'animate-toast-out');
      setTimeout(() => toast.remove(), 200);
    }, duration);
  }

  // Copy code helper
  function copyToClipboard(text, btnElement) {
    if (!navigator.clipboard) {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      handleCopySuccess(btnElement);
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      handleCopySuccess(btnElement);
    }).catch(err => {
      showToast('Could not copy to clipboard', 'error');
    });
  }

  function handleCopySuccess(btnElement) {
    showToast('Code copied to clipboard!', 'success');
    if (btnElement) {
      const originalHTML = btnElement.innerHTML;
      btnElement.innerHTML = `
        <i data-lucide="check" class="w-4 h-4 text-emerald-400"></i>
        <span class="text-xs text-emerald-400 font-medium">Copied!</span>
      `;
      if (window.lucide) window.lucide.createIcons({ root: btnElement });
      setTimeout(() => {
        btnElement.innerHTML = originalHTML;
        if (window.lucide) window.lucide.createIcons({ root: btnElement });
      }, 2000);
    }
  }

  // Generic Modal open / close
  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      document.body.style.overflow = 'hidden';
      if (window.lucide) window.lucide.createIcons({ root: modal });
    }
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }
  }

  // Sidebar toggle
  function toggleSidebar(sidebarId = 'app-sidebar') {
    const sidebar = document.getElementById(sidebarId);
    const overlay = document.getElementById('sidebar-backdrop');
    if (sidebar) {
      sidebar.classList.toggle('-translate-x-full');
      if (overlay) {
        overlay.classList.toggle('hidden');
      }
    }
  }

  // Refresh icons
  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  // Password visibility toggle
  function togglePasswordVisibility(inputId, toggleBtn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    if (toggleBtn) {
      const icon = toggleBtn.querySelector('[data-lucide]');
      if (icon) {
        icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        refreshIcons();
      }
    }
  }

  // Accordion toggle
  function toggleAccordion(headerElement) {
    const content = headerElement.nextElementSibling;
    const icon = headerElement.querySelector('.accordion-chevron');
    if (!content) return;
    const isHidden = content.classList.contains('hidden');
    if (isHidden) {
      content.classList.remove('hidden');
      if (icon) icon.classList.add('rotate-180');
    } else {
      content.classList.add('hidden');
      if (icon) icon.classList.remove('rotate-180');
    }
  }

  // Initial event bindings
  document.addEventListener('DOMContentLoaded', () => {
    refreshIcons();

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(modal => {
          closeModal(modal.id);
        });
      }
    });

    // Auto bind copy buttons
    document.querySelectorAll('[data-copy-target]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-copy-target');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          copyToClipboard(targetEl.innerText || targetEl.textContent, btn);
        }
      });
    });

    // Mobile nav toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
      });
    }
  });

  return {
    showToast,
    copyToClipboard,
    openModal,
    closeModal,
    toggleSidebar,
    refreshIcons,
    togglePasswordVisibility,
    toggleAccordion
  };
})();
