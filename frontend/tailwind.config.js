/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mining: {
          darkest: '#070B14',
          darker: '#0B132B',
          dark: '#141D38',
          card: '#1C2541',
          panel: '#1E293B',
          border: '#2E3D5E',
          muted: '#64748B',
          light: '#F8FAFC',
          cyan: '#06B6D4',
          cyanGlow: 'rgba(6, 182, 212, 0.15)',
        },
        safety: {
          green: '#10B981',
          greenDark: '#047857',
          amber: '#F59E0B',
          amberDark: '#B45309',
          red: '#EF4444',
          redDark: '#991B1B',
          blue: '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'emergency-flash': 'emergencyFlash 1s infinite alternate',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        emergencyFlash: {
          '0%': { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' },
          '100%': { backgroundColor: 'rgba(239, 68, 68, 0.35)', borderColor: 'rgba(239, 68, 68, 0.9)' },
        },
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
