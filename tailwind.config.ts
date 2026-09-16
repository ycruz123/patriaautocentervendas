import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      colors: {
        gold: {
          50: "#fbf6e9",
          100: "#f5e9c4",
          300: "#e3c76c",
          400: "#dab84f",
          500: "#d4af37",
          600: "#b8942a",
          700: "#8f7220",
        },
        ink: {
          50: "#f5f5f5",
          100: "#e9e9e9",
          200: "#d5d5d5",
          300: "#b0b0b0",
          400: "#7a7a7a",
          500: "#525252",
          600: "#3a3a3a",
          700: "#262626",
          800: "#1a1a1a",
          900: "#0d0d0d",
          950: "#000000",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
