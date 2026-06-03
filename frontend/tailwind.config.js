/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0eefe',
          200: '#baddfd',
          300: '#7cc2fb',
          400: '#36a3f6',
          500: '#0c87e8',
          600: '#0069c6',
          700: '#0153a0',
          800: '#064784',
          900: '#0b3d6e',
          950: '#072749',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
