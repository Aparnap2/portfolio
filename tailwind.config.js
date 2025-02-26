// tailwind.config.js
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'hsl(var(--primary))',
        secondary: 'hsl(var(--secondary))',
        accent1: 'hsl(var(--accent1))',
        accent2: 'hsl(var(--accent2))',
        text: 'hsl(var(--text))'
      },
      animation: {
        'circuit-pan': 'circuit-pan 20s linear infinite',
        'quantum-pulse': 'quantum-pulse 2s infinite',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
      keyframes: {
        'circuit-pan': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '80px 80px' }
        },
        'quantum-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.2)', opacity: '1' }
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' }
        }
      }
    }
  },
  plugins: [],
}