/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "deleted-bg": "#fff5f5",
        "deleted-text": "#dc2626",
        "orange-600": "#dd6b20",
        "orange-800": "#c05621",
        "orange-700": "#c05621",
        "orange-100": "#fffaf0",
      },
    },
  },
  plugins: [
    require("tailwindcss/plugin")(({ addComponents }) => {
      addComponents({
        ".toast-container": {
          "@apply font-sans text-sm": {},
        },
        ".Toastify__toast": {
          "@apply rounded-lg shadow-lg mb-2": {},
        },
      });
    }),
  ],
};
