/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        surface: { DEFAULT: '#0f1117', 1: '#161b27', 2: '#1a2035', 3: '#1f2840' },
        brand:   { DEFAULT: '#3b82f6', dim: '#1d4ed8' },
      },
      animation: {
        'scale-in': 'scaleIn .18s ease-out',
        'slide-right': 'slideRight .25s ease-out',
        'fade-in': 'fadeIn .2s ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        scaleIn:    { from: { transform: 'scale(.95)', opacity: 0 }, to: { transform: 'scale(1)', opacity: 1 } },
        slideRight: { from: { transform: 'translateX(100%)', opacity: 0 }, to: { transform: 'translateX(0)', opacity: 1 } },
        fadeIn:     { from: { opacity: 0 }, to: { opacity: 1 } },
      },
    },
  },
  plugins: [],
};
