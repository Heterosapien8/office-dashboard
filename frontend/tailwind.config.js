/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EBF5FB',
          100: '#D6EAF8',
          200: '#AED6F1',
          300: '#85C1E9',
          400: '#5DADE2',
          500: '#2E86C1',
          600: '#2874A6',
          700: '#1A5276',
          800: '#154360',
          900: '#0E2D47',
        },
        eco: {
          50:  '#D5F5E3',
          100: '#A9DFBF',
          200: '#7DCEA0',
          300: '#52BE80',
          400: '#27AE60',
          500: '#1E8449',
          600: '#196F3D',
          700: '#145A32',
          800: '#0E4628',
          900: '#093118',
        },
        danger: '#C0392B',
        warning: '#E67E22',
        success: '#1E8449',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
