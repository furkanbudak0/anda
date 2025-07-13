import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "../contexts/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 group"
      aria-label={isDark ? "Açık moda geç" : "Karanlık moda geç"}
    >
      <div className="relative w-5 h-5">
        {/* Sun Icon */}
        <SunIcon
          className={`absolute inset-0 w-5 h-5 text-yellow-500 transition-all duration-300 transform ${
            isDark
              ? "opacity-0 rotate-90 scale-0"
              : "opacity-100 rotate-0 scale-100"
          }`}
        />

        {/* Moon Icon */}
        <MoonIcon
          className={`absolute inset-0 w-5 h-5 text-gray-700 dark:text-gray-300 transition-all duration-300 transform ${
            isDark
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-0"
          }`}
        />
      </div>

      {/* Hover effect ring */}
      <div className="absolute inset-0 rounded-full ring-2 ring-transparent group-hover:ring-blue-500/20 transition-all duration-300" />
    </button>
  );
}
