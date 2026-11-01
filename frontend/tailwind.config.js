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
        med: {
          navy: "#0B1733",
          secondary: "#142B50",
          deep: "#071226",
          surface: "#0D1B3A",
          card: "#102246",
          cardHover: "#152D5A",
          border: "#1C3560",
          borderLight: "#26487F",
          lightBg: "#F3F6FB",
          lightCard: "#FFFFFF",
          lightBorder: "#E2E8F0",
          cyan: "#35C5E8",
          cyanGlow: "rgba(53, 197, 232, 0.25)",
          green: "#19B77A",
          amber: "#F5A623",
          red: "#E94B5B",
          textDark: "#0B1733",
          textMuted: "#6B7C96",
          textLight: "#E8EEF8"
        },
        // Cyber-Cardiac Crimson & Obsidian Black Theme (Red & Black Dark Interface)
        obsidian: {
          bg: "#080204",
          surface: "#0D0407",
          card: "#120508",
          cardHover: "#1A070C",
          border: "#2A0910",
          borderHover: "#44101A",
          glow: "rgba(220, 38, 38, 0.25)"
        },
        crimson: {
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          950: "#450A0A",
        },
        cyber: {
          bg: "#080204",
          card: "#120508",
          border: "#2A0910",
          hover: "#1A070C",
          accent: "#EF4444",
          success: "#19B77A",
          warning: "#F5A623",
          danger: "#DC2626",
          text: "#F8FAFC",
          muted: "#94A3B8"
        }
      },
      fontFamily: {
        sans: ['Inter', 'Plus Jakarta Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'cyan-glow': '0 0 20px -3px rgba(53, 197, 232, 0.35)',
        'green-glow': '0 0 20px -3px rgba(25, 183, 122, 0.35)',
        'red-glow': '0 0 20px -3px rgba(220, 38, 38, 0.45)',
        'crimson-glow': '0 0 25px -2px rgba(239, 68, 68, 0.45)',
        'crimson-card': '0 10px 30px -5px rgba(220, 38, 38, 0.2)',
        'card-dark': '0 8px 30px rgba(8, 2, 4, 0.7)',
        'card-light': '0 4px 20px rgba(11, 23, 51, 0.06)',
      }
    },
  },
  plugins: [],
}
