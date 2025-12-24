/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#FFC700',
          light: '#FFD740',
          dark: '#B8860B',
        },
        black: {
          DEFAULT: '#000000',
          light: '#0A0A0A',
          muted: '#1A1A1A',
        },
        gray: {
          dark: '#424242',
          muted: '#6B6B6B',
        },
      },
      fontFamily: {
        sentient: ['Sentient', 'Georgia', 'serif'],
        geist: ['Geist Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255, 199, 0, 0.4)' },
          '50%': { boxShadow: '0 0 0 15px rgba(255, 199, 0, 0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
