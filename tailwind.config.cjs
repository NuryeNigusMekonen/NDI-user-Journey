/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B1D28', dark: '#12131a' },
        brand: {
          DEFAULT: '#c8102e',
          dark: '#a60d26',
          active: '#c7112f',
          light: '#fdecef',
          muted: '#f0a0ad',
        },
        sky: { DEFAULT: '#0E7FBF', light: '#E9F5FB' },
        amber: { DEFAULT: '#B5730A', light: '#FBF1DF' },
        slate: { DEFAULT: '#5B6472', light: '#F0F1F3' },
        teal: { DEFAULT: '#0D7A6E', light: '#E6F5F3' },
        cream: '#F7F6F2',
        ink: { DEFAULT: '#1B1D28', muted: '#5A5E6C' },
        line: '#E2E0D8',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(27,29,40,.06), 0 12px 40px rgba(27,29,40,.1)',
        glow: '0 0 0 3px rgba(200,16,46,.18)',
      },
    },
  },
  plugins: [],
};
