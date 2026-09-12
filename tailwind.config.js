/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  safelist: [
    'text-signal-intent', 'text-signal-alignment', 'text-signal-friction', 'text-signal-urgency', 'text-signal-trajectory',
    'bg-signal-intent', 'bg-signal-alignment', 'bg-signal-friction', 'bg-signal-urgency', 'bg-signal-trajectory',
    'bg-signal-intent/10', 'bg-signal-alignment/10', 'bg-signal-friction/10', 'bg-signal-urgency/10', 'bg-signal-trajectory/10',
    'bg-signal-intent/15', 'bg-signal-alignment/15', 'bg-signal-friction/15', 'bg-signal-urgency/15', 'bg-signal-trajectory/15',
    'bg-signal-intent/8', 'bg-signal-alignment/8', 'bg-signal-friction/8', 'bg-signal-urgency/8', 'bg-signal-trajectory/8',
    'border-signal-intent/20', 'border-signal-alignment/20', 'border-signal-friction/20', 'border-signal-urgency/20', 'border-signal-trajectory/20',
    'border-signal-intent/15', 'border-signal-alignment/15', 'border-signal-friction/15', 'border-signal-urgency/15',
    'bg-accent/8', 'border-accent/20',
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#06090f',
          900: '#0a0e1a',
          850: '#0e1320',
          800: '#121828',
          700: '#1a2138',
          600: '#252e4a',
          500: '#364060',
          400: '#5a6585',
          300: '#8893b0',
          200: '#b8c1d9',
          100: '#d8dfee',
        },
        signal: {
          intent: '#3b82f6',
          alignment: '#10b981',
          friction: '#f59e0b',
          urgency: '#ef4444',
          trajectory: '#8b5cf6',
        },
        accent: {
          DEFAULT: '#06b6d4',
          glow: '#22d3ee',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scan': 'scan 4s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
