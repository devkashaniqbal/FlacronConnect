import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        // Primary — Flame Orange
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        // Accent — Amber / Gold
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Ink — True Black scale
        ink: {
          DEFAULT: '#0a0a0a',
          50:  '#f5f5f5',
          100: '#e8e8e8',
          200: '#d1d1d1',
          300: '#b0b0b0',
          400: '#888888',
          500: '#636363',
          600: '#4a4a4a',
          700: '#333333',
          800: '#1a1a1a',
          900: '#0f0f0f',
          950: '#0a0a0a',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark:    '#0a0a0a',
        },
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in':   'scaleIn 0.2s ease-out',
        'spin-slow':  'spin 3s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'bounce-sm':  'bounceSm 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' },                                           '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(16px)' },            '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-16px)' },           '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn:   { '0%': { opacity: '0', transform: 'scale(0.95)' },                '100%': { opacity: '1', transform: 'scale(1)' } },
        bounceSm:  { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-4px)' } },
      },
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        // Orange → Amber → Red gradient
        'gradient-brand':   'linear-gradient(135deg, #f97316 0%, #ea580c 50%, #dc2626 100%)',
        // Black gradient for dark surfaces
        'gradient-dark':    'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        // Warm mesh for light backgrounds
        'mesh-light':       'radial-gradient(at 40% 20%, #fff7ed 0px, transparent 50%), radial-gradient(at 80% 0%, #fef3c7 0px, transparent 50%)',
        // Black mesh for dark backgrounds
        'mesh-dark':        'radial-gradient(at 40% 20%, #1a0a00 0px, transparent 50%), radial-gradient(at 80% 0%, #120a00 0px, transparent 50%)',
      },
      boxShadow: {
        'brand':      '0 4px 24px rgba(249,115,22,0.30)',
        'brand-lg':   '0 8px 40px rgba(249,115,22,0.40)',
        'glass':      '0 4px 24px rgba(0,0,0,0.08)',
        'glass-dark': '0 4px 24px rgba(0,0,0,0.5)',
        'ink':        '0 4px 24px rgba(0,0,0,0.25)',
      },
    },
  },
  plugins: [],
}

export default config
