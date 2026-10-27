/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base surfaces
        base: "#F6F9FC",
        surface: "#FFFFFF",
        // Brand / primary (clinical blue)
        primary: {
          DEFAULT: "#1E5FA8",
          dark: "#164680",
          light: "#DCEEFB",
        },
        // Secondary accent (diagnostics teal)
        teal: {
          DEFAULT: "#0EA5A4",
          light: "#DCF6F5",
        },
        // Status colors
        amber: {
          DEFAULT: "#D98A1E",
          light: "#FCEFD9",
        },
        green: {
          DEFAULT: "#1E9E6B",
          light: "#DEF6EA",
        },
        red: {
          DEFAULT: "#D14343",
          light: "#FBE3E3",
        },
        ink: {
          DEFAULT: "#1A2433",
          muted: "#64748B",
          faint: "#94A3B8",
        },
        border: "#E4EAF1",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
      },
    },
  },
  plugins: [],
};
