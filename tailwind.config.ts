import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "Warm archive" palette — deep forest-ink ground, warm parchment
        // surfaces, heirloom amber as the single "voice" accent.
        ink: {
          DEFAULT: "#20302E",
          soft: "#2C3F3C",
          80: "rgba(32,48,46,0.80)",
        },
        parchment: {
          DEFAULT: "#F4EFE6",
          deep: "#EBE3D5",
          card: "#FBF8F1",
        },
        amber: {
          DEFAULT: "#BE873B",
          soft: "#D8B074",
          wash: "#F0E3CC",
        },
        clay: "#A9573F",
        sage: "#6B7A6E",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(32,48,46,0.05), 0 8px 24px rgba(32,48,46,0.06)",
        lift: "0 4px 12px rgba(32,48,46,0.08), 0 16px 40px rgba(32,48,46,0.10)",
      },
      keyframes: {
        wave: {
          "0%,100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
        fadeup: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        wave: "wave 1s ease-in-out infinite",
        fadeup: "fadeup 0.5s ease both",
      },
    },
  },
  plugins: [],
};
export default config;
