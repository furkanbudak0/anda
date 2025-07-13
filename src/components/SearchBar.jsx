/* eslint-disable react/prop-types */
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ClockIcon,
  FireIcon,
  SparklesIcon,
  TagIcon,
  AdjustmentsHorizontalIcon,
  MicrophoneIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";
import { useBringToFrontAndCenter } from "../utils/bringToFrontAndCenter";
import { useAdvancedSearch } from "../hooks/useAdvancedSearch";
import { useSearchHistory } from "../hooks/useAdvancedSearch";

/**
 * ULTRA-MODERN SEARCH BAR WITH AI-POWERED SUGGESTIONS
 *
 * Features:
 * - Real-time autocomplete with category filtering
 * - Voice search with speech recognition
 * - Smart search suggestions and history
 * - Advanced filters with glassmorphism UI
 * - Trending searches and popular tags
 * - Keyboard shortcuts and accessibility
 * - Progressive enhancement and fallbacks
 * - Multi-language support ready
 */

const SearchBar = ({
  placeholder = "Ürün, kategori, marka ara...",
  showFilters = true,
  showVoice = true,
  variant = "default", // "default", "minimal", "hero"
  size = "md", // "sm", "md", "lg"
  className = "",
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Search hooks
  const {
    autocomplete,
    trendingSearches,
    popularTags,
    isSearching,
    searchResults,
    setSearchQuery: updateSearchQuery,
  } = useAdvancedSearch();

  const { history, clearHistory, removeFromHistory } = useSearchHistory();

  // Bring to front utility
  const { bringToFront, cleanup } = useBringToFrontAndCenter();

  // Size variants
  const getSizeClasses = () => {
    const sizes = {
      sm: "h-10 text-sm",
      md: "h-12 text-base",
      lg: "h-14 text-lg",
    };
    return sizes[size] || sizes.md;
  };

  // Variant styles
  const getVariantClasses = () => {
    const variants = {
      default:
        "bg-white/90 dark:bg-gray-800/90 border-gray-200 dark:border-gray-600",
      minimal:
        "bg-white/60 dark:bg-gray-900/60 border-gray-300/50 dark:border-gray-600/50",
      hero: "bg-white/95 dark:bg-gray-800/95 border-white/30 dark:border-gray-700/30 shadow-2xl",
    };
    return variants[variant] || variants.default;
  };

  // Handle search submission
  const handleSearch = useCallback(
    (query = searchQuery) => {
      if (!query.trim()) return;

      const finalQuery = query.trim();
      updateSearchQuery(finalQuery);

      if (onSearch) {
        onSearch(finalQuery);
      } else {
        navigate(`/products?search=${encodeURIComponent(finalQuery)}`);
      }

      setIsOpen(false);
      setSelectedSuggestionIndex(-1);
      inputRef.current?.blur();
    },
    [searchQuery, updateSearchQuery, onSearch, navigate]
  );

  // Handle suggestion selection
  const handleSelectSuggestion = useCallback(
    (suggestion) => {
      const query = suggestion.text || suggestion;
      setSearchQuery(query);
      handleSearch(query);
    },
    [handleSearch]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e) => {
      const value = e.target.value;
      setSearchQuery(value);
      updateSearchQuery(value);
      setSelectedSuggestionIndex(-1);

      if (value.length >= 2) {
        setIsOpen(true);
        if (dropdownRef.current) {
          bringToFront(dropdownRef.current, "DROPDOWN");
        }
      } else if (value.length === 0) {
        setIsOpen(true); // Show trending/history when empty
      }
    },
    [updateSearchQuery, bringToFront]
  );

  // Handle input focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setIsOpen(true);
    if (dropdownRef.current) {
      bringToFront(dropdownRef.current, "DROPDOWN");
    }
  }, [bringToFront]);

  // Handle input blur
  const handleBlur = useCallback(() => {
    // Delay blur to allow clicks on suggestions
    setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);
      setSelectedSuggestionIndex(-1);
      cleanup();
    }, 200);
  }, [cleanup]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      const suggestions = searchQuery
        ? autocomplete
        : [...history.slice(0, 5), ...trendingSearches.slice(0, 5)];

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => (prev > -1 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (
            selectedSuggestionIndex >= 0 &&
            suggestions[selectedSuggestionIndex]
          ) {
            handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
          } else {
            handleSearch();
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedSuggestionIndex(-1);
          inputRef.current?.blur();
          break;
        default:
          break;
      }
    },
    [
      searchQuery,
      autocomplete,
      history,
      trendingSearches,
      selectedSuggestionIndex,
      handleSelectSuggestion,
      handleSearch,
    ]
  );

  // Voice search functionality
  const handleVoiceSearch = useCallback(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      alert("Ses arama bu tarayıcıda desteklenmiyor");
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsVoiceSearching(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      handleSearch(transcript);
      setIsVoiceSearching(false);
    };

    recognition.onerror = () => {
      setIsVoiceSearching(false);
    };

    recognition.onend = () => {
      setIsVoiceSearching(false);
    };

    recognition.start();
  }, [handleSearch]);

  // Clear search
  const handleClear = useCallback(() => {
    setSearchQuery("");
    updateSearchQuery("");
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  }, [updateSearchQuery]);

  // Handle outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // Removed cleanup dependency

  // Prepare suggestions
  const suggestions = searchQuery
    ? autocomplete
    : [...history.slice(0, 5), ...trendingSearches.slice(0, 5)];

  return (
    <div ref={searchRef} className={`relative w-full ${className}`}>
      {/* Main Search Input */}
      <div className="relative group">
        {/* Background glow effect */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500 ${
            isFocused ? "opacity-100" : ""
          }`}
        />

        <div
          className={`relative flex items-center ${getSizeClasses()} ${getVariantClasses()} backdrop-blur-xl border-2 rounded-2xl transition-all duration-300 ${
            isFocused
              ? "border-purple-400 dark:border-purple-500 shadow-lg shadow-purple-500/25"
              : "hover:border-purple-300 dark:hover:border-purple-600"
          }`}
        >
          {/* Search Icon */}
          <div className="flex items-center pl-4">
            <MagnifyingGlassIcon
              className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-colors ${
                isFocused ? "text-purple-500" : ""
              }`}
            />
          </div>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 px-4 py-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base"
            autoComplete="off"
            spellCheck="false"
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pr-4">
            {/* Clear Button */}
            {searchQuery && (
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                aria-label="Temizle"
              >
                <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
              </motion.button>
            )}

            {/* Voice Search Button */}
            {showVoice && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleVoiceSearch}
                disabled={isVoiceSearching}
                className={`p-2 rounded-xl transition-all duration-300 ${
                  isVoiceSearching
                    ? "bg-red-500 text-white animate-pulse"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                }`}
                aria-label="Ses ile ara"
              >
                <MicrophoneIcon className="w-4 h-4" />
              </motion.button>
            )}

            {/* Advanced Filters Button */}
            {showFilters && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Gelişmiş arama"
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
              </motion.button>
            )}

            {/* Search Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSearch()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 shadow-md hover:shadow-lg"
            >
              Ara
            </motion.button>
          </div>
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (isSearching || suggestions.length > 0) && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto"
          >
            {/* Loading State */}
            {isSearching && (
              <div className="p-4 text-center">
                <div className="inline-flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  Aranıyor...
                </div>
              </div>
            )}

            {/* Suggestions */}
            {!isSearching && suggestions.length > 0 && (
              <div className="p-2">
                {/* Search Results */}
                {searchQuery && autocomplete.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Öneriler
                    </div>
                    {autocomplete.slice(0, 6).map((suggestion, index) => (
                      <motion.button
                        key={`autocomplete-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                          selectedSuggestionIndex === index
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <div className="flex-shrink-0">
                          {suggestion.type === "product" && (
                            <span className="text-lg">🛍️</span>
                          )}
                          {suggestion.type === "category" && (
                            <span className="text-lg">📂</span>
                          )}
                          {suggestion.type === "hashtag" && (
                            <TagIcon className="w-4 h-4" />
                          )}
                          {suggestion.type === "seller" && (
                            <span className="text-lg">🏪</span>
                          )}
                        </div>
                        <span className="flex-1 text-left">
                          {suggestion.text}
                        </span>
                        <div className="text-xs text-gray-400 capitalize">
                          {suggestion.type}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Search History */}
                {!searchQuery && history.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between px-3 py-2">
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Son Aramalar
                      </div>
                      <button
                        onClick={clearHistory}
                        className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                      >
                        Temizle
                      </button>
                    </div>
                    {history.slice(0, 5).map((item, index) => (
                      <motion.div
                        key={`history-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
                      >
                        <ClockIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <button
                          onClick={() => handleSelectSuggestion(item.query)}
                          className="flex-1 text-left text-gray-700 dark:text-gray-300"
                        >
                          {item.query}
                        </button>
                        <button
                          onClick={() => removeFromHistory(item.query)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                          aria-label="Geçmişten kaldır"
                        >
                          <XMarkIcon className="w-3 h-3 text-gray-400" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Trending Searches */}
                {!searchQuery && trendingSearches.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                      <FireIcon className="w-4 h-4" />
                      Popüler Aramalar
                    </div>
                    {trendingSearches.slice(0, 5).map((search, index) => (
                      <motion.button
                        key={`trending-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectSuggestion(search)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                          selectedSuggestionIndex === history.length + index
                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <FireIcon className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="flex-1 text-left">{search}</span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Popular Tags */}
                {!searchQuery && popularTags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-2">
                      <TagIcon className="w-4 h-4" />
                      Popüler Etiketler
                    </div>
                    <div className="flex flex-wrap gap-2 px-3 py-2">
                      {popularTags.slice(0, 8).map((tag, index) => (
                        <motion.button
                          key={`tag-${index}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleSelectSuggestion(`#${tag.tag}`)}
                          className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-3 py-1 rounded-full text-sm hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                        >
                          #{tag.tag}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {!isSearching && suggestions.length === 0 && searchQuery && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <SparklesIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Öneri bulunamadı</p>
                <p className="text-sm mt-1">Farklı kelimeler deneyin</p>
              </div>
            )}

            {/* Keyboard Shortcuts Hint */}
            <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 flex items-center justify-between">
              <span>Klavye kısayolları: ↑↓ seç, Enter ara, Esc kapat</span>
              <div className="flex items-center gap-1">
                <CommandLineIcon className="w-3 h-3" />
                <span>Ctrl + K</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchBar;

 