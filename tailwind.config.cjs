/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // --- Dark dashboard surfaces (deep charcoal → elevated panels) ---
        canvas: '#0B0F1A',        // app/canvas background
        surface: {
          DEFAULT: '#141A28',     // panels, cards
          raised: '#1B2333',      // elevated (headers, popovers)
          hover: '#222C40',       // hover state
        },
        hairline: '#2A3547',      // borders / dividers
        // --- Brand accent: electric cyan-navy ---
        brand: {
          DEFAULT: '#38BDF8',     // primary accent (cyan)
          dark: '#0EA5E9',
          active: '#7DD3FC',
          light: '#12324A',       // tinted fill on dark
          muted: '#5B7A93',
        },
        // --- Category / actor colors (tuned for dark bg) ---
        sky: { DEFAULT: '#38BDF8', light: '#0F2A3D' },
        amber: { DEFAULT: '#FBBF24', light: '#332608' },
        slate: { DEFAULT: '#94A3B8', light: '#1E2636' },
        teal: { DEFAULT: '#2DD4BF', light: '#0C2E2A' },
        violet: { DEFAULT: '#A78BFA', light: '#241A3D' },
        // --- Text / ink (inverted for dark) ---
        ink: { DEFAULT: '#E6EDF6', muted: '#8A97AC' },
        // --- Legacy aliases so untouched components keep rendering ---
        cream: '#0B0F1A',
        line: '#2A3547',
        navy: { DEFAULT: '#0B0F1A', dark: '#070A12' },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
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
        card: '0 1px 2px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.35)',
        glow: '0 0 0 1px rgba(56,189,248,.4), 0 0 20px rgba(56,189,248,.25)',
        panel: '0 4px 24px rgba(0,0,0,.5)',
      },
    },
  },
  plugins: [],
};
