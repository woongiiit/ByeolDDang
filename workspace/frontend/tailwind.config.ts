import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0A0A0A",
          foreground: "#FFFFFF",
        },
        bg: "#F7F7F8",
        surface: "#FFFFFF",
        border: "#E5E7EB",
        text: {
          DEFAULT: "#0F172A",
          muted: "#475569",
        },
        accent: {
          red: "#DC2626",
          green: "#16A34A",
          blue: "#2563EB",
          orange: "#F97316",
        },
      },
      borderRadius: {
        card: "12px",
        pill: "9999px",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "sans-serif",
        ],
      },
      maxWidth: {
        page: "1200px",
      },
    },
  },
  plugins: [],
};

export default config;
