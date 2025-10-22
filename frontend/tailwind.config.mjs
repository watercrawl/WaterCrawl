import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import logicalPlugin from 'tailwindcss-logical';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Semantic colors using CSS variables
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground) / <alpha-value>)',
          hover: 'rgb(var(--primary-hover) / <alpha-value>)',
          light: 'rgb(var(--primary-light) / <alpha-value>)',
          dark: 'rgb(var(--primary-dark) / <alpha-value>)',
          // Keep old scale for backward compatibility
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
          hover: 'rgb(var(--secondary-hover) / <alpha-value>)',
          light: 'rgb(var(--secondary-light) / <alpha-value>)',
          dark: 'rgb(var(--secondary-dark) / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--tertiary) / <alpha-value>)',
          foreground: 'rgb(var(--tertiary-foreground) / <alpha-value>)',
          hover: 'rgb(var(--tertiary-hover) / <alpha-value>)',
          light: 'rgb(var(--tertiary-light) / <alpha-value>)',
          dark: 'rgb(var(--tertiary-dark) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
          light: 'rgb(var(--success-light) / <alpha-value>)',
          dark: 'rgb(var(--success-dark) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
          light: 'rgb(var(--warning-light) / <alpha-value>)',
          dark: 'rgb(var(--warning-dark) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          foreground: 'rgb(var(--error-foreground) / <alpha-value>)',
          light: 'rgb(var(--error-light) / <alpha-value>)',
          dark: 'rgb(var(--error-dark) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          foreground: 'rgb(var(--info-foreground) / <alpha-value>)',
          light: 'rgb(var(--info-light) / <alpha-value>)',
          dark: 'rgb(var(--info-dark) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          focus: 'rgb(var(--border-focus) / <alpha-value>)',
        },
        input: {
          DEFAULT: 'rgb(var(--input) / <alpha-value>)',
          border: 'rgb(var(--input-border) / <alpha-value>)',
        },
        ring: 'rgb(var(--ring) / <alpha-value>)',
        text: {
          primary: 'rgb(var(--text-primary) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          link: 'rgb(var(--text-link) / <alpha-value>)',
          'link-hover': 'rgb(var(--text-link-hover) / <alpha-value>)',
        },
        sidebar: {
          bg: 'rgb(var(--sidebar-bg) / <alpha-value>)',
          text: 'rgb(var(--sidebar-text) / <alpha-value>)',
          'text-muted': 'rgb(var(--sidebar-text-muted) / <alpha-value>)',
          'active-bg': 'rgb(var(--sidebar-active-bg) / <alpha-value>)',
          'active-text': 'rgb(var(--sidebar-active-text) / <alpha-value>)',
          'hover-bg': 'rgb(var(--sidebar-hover-bg) / <alpha-value>)',
          border: 'rgb(var(--sidebar-border) / <alpha-value>)',
        },
        alert: {
          info: {
            bg: 'rgb(var(--alert-info-bg) / <alpha-value>)',
            border: 'rgb(var(--alert-info-border) / <alpha-value>)',
            text: 'rgb(var(--alert-info-text) / <alpha-value>)',
            icon: 'rgb(var(--alert-info-icon) / <alpha-value>)',
          },
          success: {
            bg: 'rgb(var(--alert-success-bg) / <alpha-value>)',
            border: 'rgb(var(--alert-success-border) / <alpha-value>)',
            text: 'rgb(var(--alert-success-text) / <alpha-value>)',
            icon: 'rgb(var(--alert-success-icon) / <alpha-value>)',
          },
          warning: {
            bg: 'rgb(var(--alert-warning-bg) / <alpha-value>)',
            border: 'rgb(var(--alert-warning-border) / <alpha-value>)',
            text: 'rgb(var(--alert-warning-text) / <alpha-value>)',
            icon: 'rgb(var(--alert-warning-icon) / <alpha-value>)',
          },
          error: {
            bg: 'rgb(var(--alert-error-bg) / <alpha-value>)',
            border: 'rgb(var(--alert-error-border) / <alpha-value>)',
            text: 'rgb(var(--alert-error-text) / <alpha-value>)',
            icon: 'rgb(var(--alert-error-icon) / <alpha-value>)',
          },
        },
      },
      fontFamily: {
        sans: ['var(--font-sans-default)', 'ui-sans-serif', 'system-ui'],
        persian: ['var(--font-sans-persian)', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [
    forms, 
    typography,
    logicalPlugin,
  ],
};
