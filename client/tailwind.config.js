/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        corporate: {
          blue: "#2563eb",
          navy: "#172033",
          line: "#e5e7eb",
          surface: "#f8fafc"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      spacing: {
        68: "17rem"
      }
    }
  },
  plugins: []
};
