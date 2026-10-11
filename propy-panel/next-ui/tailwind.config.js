const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            primary: { DEFAULT: "#F05A2A", foreground: "#ffffff" },
            focus: "#F05A2A",
          },
        },
        dark: {
          colors: {
            background: "#080D17",
            content1: "#0F1624",
            content2: "#151E2F",
            primary: { DEFAULT: "#FD7245", foreground: "#ffffff" },
            focus: "#FD7245",
          },
        },
      },
    }),
  ],
};
