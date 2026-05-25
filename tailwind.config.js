/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Mirror the CSS variables defined in src/index.css as Tailwind color
      // tokens so utilities like `bg-bg-elev`, `text-text-3`, `border-border`
      // automatically reflect the active theme. Use `rgb(var(--accent-rgb) / <alpha-value>)`
      // for the accent so opacity modifiers (`bg-accent/10`) work.
      colors: {
        bg: "var(--bg)",
        "bg-elev": "var(--bg-elev)",
        "bg-elev2": "var(--bg-elev2)",
        "bg-muted": "var(--bg-muted)",
        border: "var(--border)",
        text: "var(--text)",
        "text-2": "var(--text-2)",
        "text-3": "var(--text-3)",
        "text-4": "var(--text-4)",
        "text-5": "var(--text-5)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        warn: "var(--warn)",
      },
      fontFamily: {
        arabic: ["Amiri", "Scheherazade New", "Traditional Arabic", "serif"],
        display: ["'Cormorant Garamond'", "serif"],
        sans: ["'DM Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
