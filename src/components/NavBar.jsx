/* eslint-disable react/prop-types */
import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCartIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  HeartIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { getNavCategories, SPECIAL_CATEGORIES } from "../constants/categories";
import { useBringToFrontAndCenter } from "../utils/bringToFrontAndCenter";
import UserMenu from "./UserMenu";
import ThemeToggle from "./ThemeToggle";
import SearchBar from "./SearchBar";
import { memo } from "react";
import { sellerSignup } from "../services/apiAuth";

/**
 * MODERN NAVBAR WITH ADVANCED CATEGORY TAB SYSTEM
 *
 * Features:
 * - Hover-activated category tabs with subcategories
 * - Modern dropdown animations with Framer Motion
 * - Responsive design with mobile support
 * - Ultra-modern search with AI suggestions
 * - Glassmorphism effects and modern gradients
 * - Accessibility-first approach
 */

const NavBar = memo(function NavBar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSellerTestPanel, setShowSellerTestPanel] = useState(false);
  const [isCreatingSeller, setIsCreatingSeller] = useState(false);
  const dropdownRef = useRef(null);
  const categoryTimeoutRef = useRef(null);
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();

  // Use bring to front utility for dropdown
  const { bringToFront: _ } = useBringToFrontAndCenter("navbar-dropdown", {
    type: "DROPDOWN",
    isOpen: showCategoryDropdown,
  });

  // Get categories from constants
  const categories = useMemo(() => getNavCategories(), []);
  const specialCategories = useMemo(() => SPECIAL_CATEGORIES, []);

  // Search functionality handled by SearchBar component
  const handleSearch = useCallback(
    (e) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchQuery("");
      }
    },
    [searchQuery, navigate]
  );

  const handleMobileMenuToggle = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  const handleCloseMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  // Category dropdown handlers
  const handleCategoryHover = useCallback((category) => {
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current);
    }

    setActiveCategory(category);
    if (category?.subcategories && category.subcategories.length > 0) {
      setShowCategoryDropdown(true);
    }
  }, []);

  const handleCategoryLeave = useCallback(() => {
    categoryTimeoutRef.current = setTimeout(() => {
      setShowCategoryDropdown(false);
      setActiveCategory(null);
    }, 200); // Small delay to allow for cursor movement
  }, []);

  const handleDropdownEnter = useCallback(() => {
    if (categoryTimeoutRef.current) {
      clearTimeout(categoryTimeoutRef.current);
    }
  }, []);

  const handleDropdownLeave = useCallback(() => {
    categoryTimeoutRef.current = setTimeout(() => {
      setShowCategoryDropdown(false);
      setActiveCategory(null);
    }, 200);
  }, []);

  // Handle category click for direct navigation
  const handleCategoryClick = useCallback(
    (category) => {
      setShowCategoryDropdown(false);
      setActiveCategory(null);
      navigate(`/category/${category.slug}`);
    },
    [navigate]
  );

  // Handle subcategory click
  const handleSubcategoryClick = useCallback(
    (category, subcategory) => {
      setShowCategoryDropdown(false);
      setActiveCategory(null);
      navigate(`/category/${category.slug}/${subcategory.slug}`);
    },
    [navigate]
  );

  // Test Seller Creation Function
  const handleTestSellerCreation = async () => {
    console.log("🚀 STEP 1: Test seller creation started");
    setIsCreatingSeller(true);

    try {
      const testSellerData = {
        // Business Info
        businessType: "individual",
        companyName: "Test Mağaza " + Date.now(),
        businessEmail: `test${Date.now()}@example.com`,
        businessPhone: "05551234567",
        taxId: "1234567890",
        website: "https://test.com",
        businessDescription: "Test mağaza açıklaması",
        categories: ["elektronik", "giyim"],

        // Owner Info
        firstName: "Test",
        lastName: "Satıcı",
        ownerEmail: `test${Date.now()}@example.com`,
        ownerPhone: "05551234567",
        idNumber: "12345678901",
        dob: "1990-01-01",

        // Banking
        bankName: "Test Bank",
        accountName: "Test Hesap",
        accountNumber: "1234567890",
        iban: "TR123456789012345678901234",
        swiftCode: "TESTUS33",

        // Documents
        businessLicense: "test-license.pdf",
        idDocument: "test-id.pdf",
        taxCertificate: "test-tax.pdf",
        bankLetter: "test-bank.pdf",
      };

      console.log("📝 STEP 2: Test seller data prepared:", testSellerData);

      console.log("🔐 STEP 3: Calling sellerSignup function...");
      const result = await sellerSignup(testSellerData);

      console.log("✅ STEP 4: Seller signup completed successfully:", result);

      alert(
        `Test satıcı başarıyla oluşturuldu!\nEmail: ${testSellerData.businessEmail}\nŞifre: Otomatik oluşturuldu`
      );
    } catch (error) {
      console.error("❌ STEP 4: Seller signup failed:", error);
      console.error("❌ Error details:", {
        message: error.message,
        stack: error.stack,
        name: error.name,
      });

      alert(`Test satıcı oluşturulamadı!\nHata: ${error.message}`);
    } finally {
      setIsCreatingSeller(false);
      setShowSellerTestPanel(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (categoryTimeoutRef.current) {
        clearTimeout(categoryTimeoutRef.current);
      }
    };
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg fixed top-0 left-0 right-0 z-50 transition-colors">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 dark:from-orange-700 dark:to-orange-800 text-white text-sm">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>🚚</span>
            <span>Ücretsiz Kargo 150₺ ve Üzeri Alışverişlerde</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/help"
              className="hover:text-orange-200 transition-colors"
            >
              Yardım
            </Link>
            <Link
              to="/contact"
              className="hover:text-orange-200 transition-colors"
            >
              İletişim
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent group-hover:from-orange-700 group-hover:to-orange-800 transition-all duration-300">
              ANDA
            </div>
          </Link>

          {/* Ultra-Modern Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchBar
              placeholder="Ürün, kategori, marka ara..."
              variant="hero"
              size="md"
              showFilters={true}
              showVoice={true}
              className="w-full"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <ShoppingCartIcon className="h-6 w-6" />
              </motion.div>
              {itemCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 bg-orange-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                >
                  {itemCount > 99 ? "99+" : itemCount}
                </motion.span>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors group"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <HeartIcon className="h-6 w-6" />
              </motion.div>
            </Link>

            {/* Test Seller Button */}
            <button
              onClick={() => setShowSellerTestPanel(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium text-sm"
              title="Test Satıcı Oluştur"
            >
              <BuildingStorefrontIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Test Seller</span>
            </button>

            {/* User Menu */}
            {isAuthenticated ? (
              <UserMenu user={user} onLogout={logout} />
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 font-medium"
              >
                <UserIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Giriş Yap</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={handleMobileMenuToggle}
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Categories Navigation */}
      <div className="bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-8 relative">
            {/* Categories */}
            {categories.map((category) => (
              <div
                key={category.slug}
                className="relative"
                onMouseEnter={() => handleCategoryHover(category)}
                onMouseLeave={handleCategoryLeave}
              >
                <button
                  onClick={() => handleCategoryClick(category)}
                  className={`flex items-center gap-1 py-4 px-2 text-sm font-medium transition-colors duration-200 ${
                    activeCategory?.slug === category.slug
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400"
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.name}</span>
                  {category.subcategories &&
                    category.subcategories.length > 0 && (
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          activeCategory?.slug === category.slug &&
                          showCategoryDropdown
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    )}
                </button>
              </div>
            ))}

            {/* Special Categories */}
            {specialCategories.map((category) => (
              <Link
                key={category.slug}
                to={category.path}
                className="flex items-center gap-2 py-4 px-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200"
              >
                <span className="text-lg">{category.icon}</span>
                <span>{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Category Dropdown */}
      <AnimatePresence>
        {showCategoryDropdown && activeCategory?.subcategories && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 30,
              duration: 0.2,
            }}
            className="absolute left-0 right-0 top-full bg-white dark:bg-gray-800 shadow-2xl border-t-4 border-orange-500 z-50 backdrop-blur-lg"
            style={{
              background:
                "linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0.98))",
            }}
            onMouseEnter={handleDropdownEnter}
            onMouseLeave={handleDropdownLeave}
          >
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                {activeCategory.subcategories &&
                  activeCategory.subcategories
                    .slice(0, 8)
                    .map((subcategory) => (
                      <motion.div
                        key={subcategory.slug}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="group"
                      >
                        <button
                          onClick={() =>
                            handleSubcategoryClick(activeCategory, subcategory)
                          }
                          className="w-full text-left p-4 rounded-xl hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 dark:hover:from-orange-900/20 dark:hover:to-orange-800/20 transition-all duration-200 group-hover:shadow-lg"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">
                              {subcategory.icon || "📦"}
                            </span>
                            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                              {subcategory.name}
                            </h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                            {subcategory.description ||
                              "Kategori ürünlerini keşfedin"}
                          </p>
                          <div className="flex items-center gap-1 mt-2 text-orange-600 dark:text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-sm font-medium">Keşfet</span>
                            <ChevronRightIcon className="w-4 h-4" />
                          </div>
                        </button>
                      </motion.div>
                    ))}

                {/* Eğer 8'den fazla alt kategori varsa "Daha fazla" butonu */}
                {activeCategory.subcategories &&
                  activeCategory.subcategories.length > 8 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="group"
                    >
                      <button
                        onClick={() => handleCategoryClick(activeCategory)}
                        className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 hover:from-orange-100 hover:to-orange-200 transition-all duration-200 group-hover:shadow-lg border-2 border-dashed border-orange-300"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">➕</span>
                          <h3 className="font-semibold text-orange-600 dark:text-orange-400">
                            Daha Fazla
                          </h3>
                        </div>
                        <p className="text-sm text-orange-500 dark:text-orange-300">
                          +{activeCategory.subcategories.length - 8} kategori
                          daha
                        </p>
                        <div className="flex items-center gap-1 mt-2 text-orange-600 dark:text-orange-400">
                          <span className="text-sm font-medium">
                            Tümünü Gör
                          </span>
                          <ChevronRightIcon className="w-4 h-4" />
                        </div>
                      </button>
                    </motion.div>
                  )}
              </div>

              {/* Featured Products for Category */}
              <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-600">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {activeCategory.name} Kategorisinde Öne Çıkanlar
                </h4>
                <div className="text-center py-4">
                  <Link
                    to={`/category/${activeCategory.slug}`}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-medium rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all duration-200 transform hover:scale-105"
                    onClick={() => {
                      setShowCategoryDropdown(false);
                      setActiveCategory(null);
                    }}
                  >
                    Tüm {activeCategory.name} Ürünlerini Gör
                    <ChevronRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Mega Menu */}
      {showMegaMenu && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg border-t z-50">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
              {categories.map((category) => (
                <div key={category.slug} className="space-y-4">
                  <Link
                    to={`/category/${category.slug}`}
                    className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                    onClick={() => setShowMegaMenu(false)}
                  >
                    <span className="text-xl">{category.icon}</span>
                    {category.name}
                  </Link>

                  {/* Subcategories - maksimum 4 tane göster */}
                  {category.subcategories &&
                    category.subcategories.slice(0, 4).map((subcategory) => (
                      <Link
                        key={subcategory.slug}
                        to={`/category/${category.slug}/${subcategory.slug}`}
                        className="block text-sm text-gray-600 hover:text-orange-600 transition-colors pl-6"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        {subcategory.name}
                      </Link>
                    ))}

                  {/* Eğer 4'ten fazla alt kategori varsa "Daha fazla" linki */}
                  {category.subcategories &&
                    category.subcategories.length > 4 && (
                      <Link
                        to={`/category/${category.slug}`}
                        className="block text-sm text-orange-600 hover:text-orange-700 font-medium pl-6"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        + {category.subcategories.length - 4} daha fazla
                      </Link>
                    )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600 overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              {/* Mobile Search */}
              <div className="mb-6">
                <SearchBar
                  placeholder="Ürün, kategori, marka ara..."
                  variant="simple"
                  size="sm"
                  className="w-full"
                />
              </div>

              {/* Mobile Categories */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Kategoriler
                </h3>
                {categories.map((category) => (
                  <div key={category.slug} className="space-y-2">
                    <button
                      onClick={() => handleCategoryClick(category)}
                      className="w-full flex items-center justify-between py-3 px-4 text-left bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{category.icon}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </span>
                      </div>
                      {category.subcategories &&
                        category.subcategories.length > 0 && (
                          <ChevronRightIcon className="w-5 h-5 text-gray-400" />
                        )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Mobile Special Categories */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Özel Kategoriler
                </h3>
                {specialCategories.map((category) => (
                  <Link
                    key={category.slug}
                    to={category.path}
                    onClick={handleCloseMobileMenu}
                    className="flex items-center gap-3 py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>

              {/* Mobile Actions */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-600 space-y-4">
                <Link
                  to="/cart"
                  onClick={handleCloseMobileMenu}
                  className="flex items-center justify-between py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCartIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      Sepetim
                    </span>
                  </div>
                  {itemCount > 0 && (
                    <span className="bg-orange-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                      {itemCount > 99 ? "99+" : itemCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/wishlist"
                  onClick={handleCloseMobileMenu}
                  className="flex items-center gap-3 py-3 px-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <HeartIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    Favorilerim
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Test Seller Modal */}
      <AnimatePresence>
        {showSellerTestPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowSellerTestPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  🧪 Test Satıcı Oluştur
                </h3>
                <button
                  onClick={() => setShowSellerTestPanel(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Debug Modu:</strong> Bu panel ile test satıcısı
                    oluşturup console&apos;da tüm adımları takip edebilirsiniz.
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>⚠️ Dikkat:</strong> Her tıklamada yeni bir test
                    satıcısı oluşturulur. Console&apos;u açık tutun!
                  </p>
                </div>

                <button
                  onClick={handleTestSellerCreation}
                  disabled={isCreatingSeller}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                >
                  {isCreatingSeller ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Oluşturuluyor...
                    </>
                  ) : (
                    <>
                      <BuildingStorefrontIcon className="h-5 w-5" />
                      Test Satıcı Oluştur
                    </>
                  )}
                </button>

                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Console&apos;da (F12) tüm adımları takip edin
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
});

export default NavBar;
