/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // --- Light workspace surfaces (white canvas, cool blue-paper insets) ---
        canvas: '#FFFFFF',        // main workspace / node ground
        surface: {
          DEFAULT: '#FFFFFF',     // panels, cards
          raised: '#F4F7FB',      // insets, headers, hovers (blue-biased paper)
          hover: '#E9F0F9',       // hover state
        },
        hairline: '#DCE5F0',      // blue-grey borders / dividers
        // --- Deep navy for the left rail (its own ground) ---
        rail: {
          DEFAULT: '#1B3A6B',     // sidebar background (deep institutional navy)
          raised: '#234779',      // elevated within rail
          hover: '#2B5490',       // rail hover
          line: '#33538A',        // rail dividers
        },
        // --- Brand accent: institutional blue ---
        brand: {
          DEFAULT: '#2563AE',     // primary accent
          dark: '#1E4E8C',        // hover
          active: '#3B7BC9',
          light: '#EAF1FB',       // tinted fill on light
          muted: '#9DB4D4',
        },
        // --- Category / actor colors (tuned for light bg) ---
        sky: { DEFAULT: '#2563AE', light: '#EAF1FB' },
        amber: { DEFAULT: '#C77A0A', light: '#FBF1E0' },
        slate: { DEFAULT: '#5A6B85', light: '#EDF1F6' },
        teal: { DEFAULT: '#0F9D8A', light: '#E2F4F1' },
        violet: { DEFAULT: '#6D57C9', light: '#EEEBFA' },
        // --- Semantic state (separate from the accent hue) ---
        good: '#0F9D6B',
        warn: '#C77A0A',
        crit: '#D14343',
        // --- Text / ink (near-black with a blue bias) ---
        ink: { DEFAULT: '#1A2433', muted: '#5A6B85' },
        // --- Legacy aliases so untouched components keep rendering ---
        cream: '#F4F7FB',
        line: '#DCE5F0',
        navy: { DEFAULT: '#1B3A6B', dark: '#12294D' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        // Sharper, more technical corners than MODO's soft rounded-xl
        lg: '0.5rem',
        xl: '0.625rem',
        '2xl': '0.75rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(27,58,107,.06), 0 4px 16px rgba(27,58,107,.08)',
        glow: '0 0 0 1px rgba(37,99,174,.25), 0 2px 8px rgba(37,99,174,.18)',
        panel: '0 8px 32px rgba(27,58,107,.14)',
      },
    },
  },
  plugins: [],
};
