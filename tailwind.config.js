/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // ANDA Brand Colors - Amber/Orange Theme
        brand: {
          50: "#fefdf2",
          100: "#fef9e6",
          200: "#fdf2c9",
          300: "#fbe6a6",
          400: "#f9d071",
          500: "#f59e0b", // Primary brand color
          600: "#d97706", // Darker brand
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        secondary: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316", // Secondary orange
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
          950: "#431407",
        },
        accent: {
          50: "#fdf4ff",
          100: "#fae8ff",
          200: "#f5d0fe",
          300: "#f0abfc",
          400: "#e879f9",
          500: "#d946ef", // Purple accent
          600: "#c026d3",
          700: "#a21caf",
          800: "#86198f",
          900: "#701a75",
          950: "#4a044e",
        },
        success: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16",
        },
        warning: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
          950: "#451a03",
        },
        error: {
          50: "#fef2f2",
          100: "#fee2e2",
          200: "#fecaca",
          300: "#fca5a5",
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
          800: "#991b1b",
          900: "#7f1d1d",
          950: "#450a0a",
        },
        // Additional commerce-specific colors
        commerce: {
          discount: "#dc2626", // Red for discounts
          sale: "#f97316", // Orange for sales
          new: "#22c55e", // Green for new items
          featured: "#d946ef", // Purple for featured
          premium: "#7c3aed", // Violet for premium
        },
        // Rating colors
        rating: {
          yellow: "#fbbf24",
          gold: "#f59e0b",
          bronze: "#92400e",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Poppins", "system-ui", "sans-serif"],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["1rem", { lineHeight: "1.5rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "5xl": ["3rem", { lineHeight: "1" }],
        "6xl": ["3.75rem", { lineHeight: "1" }],
        "7xl": ["4.5rem", { lineHeight: "1" }],
        "8xl": ["6rem", { lineHeight: "1" }],
        "9xl": ["8rem", { lineHeight: "1" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
        144: "36rem",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        medium:
          "0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        large:
          "0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        brand: "0 4px 14px 0 rgba(245, 158, 11, 0.4)",
        "brand-lg": "0 10px 40px 0 rgba(245, 158, 11, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "bounce-slow": "bounce 2s infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "brand-gradient": "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
        "hero-gradient":
          "linear-gradient(135deg, #f59e0b 0%, #f97316 50%, #ea580c 100%)",
      },
      backdropBlur: {
        xs: "2px",
      },
      gridTemplateColumns: {
        "auto-fit": "repeat(auto-fit, minmax(250px, 1fr))",
        "auto-fill": "repeat(auto-fill, minmax(250px, 1fr))",
      },
      aspectRatio: {
        card: "4/5",
        product: "3/4",
        banner: "16/6",
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      screens: {
        xs: "475px",
        "3xl": "1600px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    // Custom plugin for utilities
    function ({ addUtilities, addComponents, theme }) {
      addUtilities({
        ".text-balance": {
          "text-wrap": "balance",
        },
        ".scrollbar-hide": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
          "&::-webkit-scrollbar": {
            display: "none",
          },
        },
        ".gradient-text": {
          background: "linear-gradient(135deg, #f59e0b, #f97316)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
      });

      addComponents({
        ".btn-primary": {
          "@apply bg-brand-500 hover:bg-brand-600 focus:ring-brand-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2":
            {},
        },
        ".btn-secondary": {
          "@apply bg-secondary-500 hover:bg-secondary-600 focus:ring-secondary-500 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2":
            {},
        },
        ".btn-outline": {
          "@apply border-2 border-brand-500 text-brand-600 hover:bg-brand-500 hover:text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2":
            {},
        },
        ".card": {
          "@apply bg-white dark:bg-gray-800 rounded-xl shadow-soft border border-gray-200 dark:border-gray-700":
            {},
        },
        ".card-hover": {
          "@apply card hover:shadow-medium transition-shadow duration-300": {},
        },
        ".input-field": {
          "@apply block w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-brand-500 focus:ring-brand-500 sm:text-sm":
            {},
        },
        ".badge": {
          "@apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium":
            {},
        },
        ".badge-primary": {
          "@apply badge bg-brand-100 text-brand-800": {},
        },
        ".badge-success": {
          "@apply badge bg-success-100 text-success-800": {},
        },
        ".badge-warning": {
          "@apply badge bg-warning-100 text-warning-800": {},
        },
        ".badge-error": {
          "@apply badge bg-error-100 text-error-800": {},
        },
      });
    },
  ],
};
