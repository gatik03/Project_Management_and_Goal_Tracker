/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        sunken: "var(--sunken)",
        line: "var(--line)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        signal: "var(--signal)",
        ok: "var(--ok)",
        warn: "var(--warn)",
        danger: "var(--danger)",
      },
      fontFamily: {
        display: ["Bricolage Grotesque Variable", "sans-serif"],
        ui: ["Public Sans Variable", "sans-serif"],
      },
      borderRadius: { chip: "3px", control: "6px", panel: "10px" },
    },
  },
  plugins: [],
};
