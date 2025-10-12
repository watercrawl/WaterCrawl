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
        primary: {
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
