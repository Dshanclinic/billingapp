/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f1fa',
          100: '#c5ddf2',
          200: '#9fc6e8',
          300: '#79afde',
          400: '#5c9dd7',
          500: '#185FA5',
          600: '#145494',
          700: '#104882',
          800: '#0c3c71',
          900: '#082d57',
        },
      },
      fontFamily: {
        bangla: ['Noto Sans Bengali', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
