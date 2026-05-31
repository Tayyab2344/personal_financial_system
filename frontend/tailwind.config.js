/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0b0f19',
        darkCard: '#151c2c',
        glassBg: 'rgba(21, 28, 44, 0.6)',
        glowBlue: '#3b82f6',
        glowGreen: '#10b981',
        glowPurple: '#8b5cf6',
        glowPink: '#ec4899',
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.4)',
        'glow-green': '0 0 15px rgba(16, 185, 129, 0.4)',
        'glow-purple': '0 0 15px rgba(139, 92, 246, 0.4)',
        'glow-pink': '0 0 15px rgba(236, 72, 153, 0.4)',
      }
    },
  },
  plugins: [],
}
