/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          dark: '#1e40af',    // blue-800
        },
        background: {
          DEFAULT: '#f8fafc', // slate-50
          dark: '#0f172a',    // slate-900
        },
        surface: {
          DEFAULT: '#ffffff', // white
          dark: '#1e293b',    // slate-800
        },
        accent: {
          DEFAULT: '#38bdf8', // sky-400
          dark: '#0ea5e9',    // sky-600
        },
      },
      borderRadius: {
        DEFAULT: '0.375rem', // rounded-md
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
