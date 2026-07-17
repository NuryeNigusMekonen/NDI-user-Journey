/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#1B1D28', dark: '#12131a' },
        brand: {
          DEFAULT: '#1F4E79',
          dark: '#163A5C',
          active: '#1D4A73',
          light: '#E8EEF5',
          muted: '#9DB6D0',
        },
        sky: { DEFAULT: '#0891B2', light: '#E4F4F8' },
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
        glow: '0 0 0 3px rgba(31,78,121,.18)',
      },
    },
  },
  plugins: [],
};
