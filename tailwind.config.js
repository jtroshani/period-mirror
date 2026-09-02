/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Semantic tokens — resolved from CSS variables so dark mode is a
        // single source of truth in `src/design-system/tokens.css`.
        bg: "rgb(var(--pm-bg) / <alpha-value>)",
        surface: "rgb(var(--pm-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--pm-surface-2) / <alpha-value>)",
        line: "rgb(var(--pm-line) / <alpha-value>)",
        ink: "rgb(var(--pm-ink) / <alpha-value>)",
        muted: "rgb(var(--pm-muted) / <alpha-value>)",
        faint: "rgb(var(--pm-faint) / <alpha-value>)",
        primary: "rgb(var(--pm-primary) / <alpha-value>)",
        "primary-soft": "rgb(var(--pm-primary-soft) / <alpha-value>)",
        "primary-ink": "rgb(var(--pm-primary-ink) / <alpha-value>)",
        accent: "rgb(var(--pm-accent) / <alpha-value>)",
        normal: "rgb(var(--pm-normal) / <alpha-value>)",
        "normal-soft": "rgb(var(--pm-normal-soft) / <alpha-value>)",
        notice: "rgb(var(--pm-notice) / <alpha-value>)",
        "notice-soft": "rgb(var(--pm-notice-soft) / <alpha-value>)",
        alert: "rgb(var(--pm-alert) / <alpha-value>)",
        "alert-soft": "rgb(var(--pm-alert-soft) / <alpha-value>)",
        info: "rgb(var(--pm-info) / <alpha-value>)",
      },
      fontFamily: {
        sans: [
          "InterVariable",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        display: [
          "Fraunces",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
      },
      borderRadius: {
        card: "1.25rem",
        sheet: "1.75rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(28 25 23 / 0.04), 0 8px 24px -12px rgb(28 25 23 / 0.10)",
        sheet: "0 -8px 40px -12px rgb(28 25 23 / 0.22)",
        nav: "0 -1px 0 rgb(28 25 23 / 0.06)",
      },
      maxWidth: {
        app: "30rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "sheet-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "scrim-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both",
        "sheet-up": "sheet-up 0.34s cubic-bezier(0.22, 1, 0.36, 1) both",
        "scrim-in": "scrim-in 0.2s ease-out both",
      },
    },
  },
  plugins: [],
};
