import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          500: "#3b5bdb",
          600: "#2f4dc4",
          700: "#28409e",
        },
      },
    },
  },
  plugins: [],
};

export default config;
