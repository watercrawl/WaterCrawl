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
          soft: 'rgb(var(--primary-soft) / <alpha-value>)',
          strong: 'rgb(var(--primary-strong) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground) / <alpha-value>)',
          hover: 'rgb(var(--secondary-hover) / <alpha-value>)',
          soft: 'rgb(var(--secondary-soft) / <alpha-value>)',
          strong: 'rgb(var(--secondary-strong) / <alpha-value>)',
        },
        tertiary: {
          DEFAULT: 'rgb(var(--tertiary) / <alpha-value>)',
          foreground: 'rgb(var(--tertiary-foreground) / <alpha-value>)',
          hover: 'rgb(var(--tertiary-hover) / <alpha-value>)',
          soft: 'rgb(var(--tertiary-soft) / <alpha-value>)',
          strong: 'rgb(var(--tertiary-strong) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
          soft: 'rgb(var(--success-soft) / <alpha-value>)',
          strong: 'rgb(var(--success-strong) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
          soft: 'rgb(var(--warning-soft) / <alpha-value>)',
          strong: 'rgb(var(--warning-strong) / <alpha-value>)',
        },
        error: {
          DEFAULT: 'rgb(var(--error) / <alpha-value>)',
          foreground: 'rgb(var(--error-foreground) / <alpha-value>)',
          soft: 'rgb(var(--error-soft) / <alpha-value>)',
          strong: 'rgb(var(--error-strong) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          foreground: 'rgb(var(--info-foreground) / <alpha-value>)',
          soft: 'rgb(var(--info-soft) / <alpha-value>)',
          strong: 'rgb(var(--info-strong) / <alpha-value>)',
        },
        border: 'rgb(var(--border) / <alpha-value>)',
        input: {
          DEFAULT: 'rgb(var(--input) / <alpha-value>)',
          border: 'rgb(var(--input-border) / <alpha-value>)',
        },
        ring: 'rgb(var(--ring) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans-default)', 'ui-sans-serif', 'system-ui'],
        persian: ['var(--font-sans-persian)', 'ui-sans-serif', 'system-ui'],
      },
      keyframes: {
        'dot-bounce': {
          '0%, 80%, 100%': { 
            transform: 'scale(0)',
            opacity: '0.5',
          },
          '40%': { 
            transform: 'scale(1)',
            opacity: '1',
          },
        },
      },
      animation: {
        'dot-bounce': 'dot-bounce 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [
    forms, 
    typography,
    logicalPlugin,
  ],
};
