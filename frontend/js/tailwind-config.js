/**
 * ATCodes Tailwind Configuration
 * Configures the design tokens, fonts, and dark mode strategy for Tailwind Play CDN
 */

if (window.tailwind) {
  window.tailwind.config = {
    darkMode: 'class',
    theme: {
      extend: {
        fontFamily: {
          sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
          mono: ['"JetBrains Mono"', 'monospace']
        },
        colors: {
          brand: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a'
          },
          dark: {
            bg: '#070a12',
            surface: '#0d1322',
            card: '#121a2e',
            elevated: '#17223b',
            border: '#1f2d4a',
            text: '#f8fafc',
            muted: '#94a3b8'
          }
        }
      }
    }
  };
}
