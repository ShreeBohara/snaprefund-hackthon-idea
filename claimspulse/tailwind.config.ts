import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular"]
      },
      colors: {
        brand: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          text: "var(--text)",
          primary: "var(--primary)",
          danger: "var(--danger)",
          warn: "var(--warn)",
          success: "var(--success)"
        }
      },
      boxShadow: {
        soft: "0 8px 24px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
