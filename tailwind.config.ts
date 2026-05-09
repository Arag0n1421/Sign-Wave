import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#15202b",
        clinical: "#0f766e",
        signal: "#e85d45",
        calm: "#e7f5f2"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(21, 32, 43, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
