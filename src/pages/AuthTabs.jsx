import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserIcon,
  BuildingStorefrontIcon,
  SparklesIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import ModernAuthForm from "../components/auth/ModernAuthForm";
import Logo from "../components/Logo";

/**
 * Modern authentication page with enhanced UX
 * Supports user and seller authentication flows
 */
export default function AuthTabs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL'den parametreleri al
  const activeTab = searchParams.get("tab") || "login";
  const userType = searchParams.get("type") || "user";

  const handleTabChange = (tab) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("tab", tab);
    setSearchParams(newParams);
  };

  const handleUserTypeChange = (type) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("type", type);
    setSearchParams(newParams);
  };

  const handleModeChange = (mode) => {
    handleTabChange(mode);
  };

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8"
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-10 -left-10 w-20 h-20 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-30 animate-pulse"></div>
      </div>

      {/* Back to Home Button */}
      <motion.button
        onClick={() => navigate("/")}
        className="absolute top-6 left-6 flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 transition-colors group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ArrowLeftIcon className="w-5 h-5 mr-2 transform group-hover:-translate-x-1 transition-transform" />
        Ana Sayfaya Dön
      </motion.button>

      {/* Logo and Brand */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-center mb-4">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-2xl shadow-lg"
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Logo className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ml-3"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            ANDA
          </motion.h1>
        </div>

        <motion.p
          className="text-gray-600 dark:text-gray-400 text-lg font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Modern alışverişin yeni adresi
        </motion.p>

        <motion.div
          className="flex items-center justify-center mt-2 text-sm text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <SparklesIcon className="w-4 h-4 mr-1" />
          Güvenli, hızlı ve kolay
        </motion.div>
      </motion.div>

      {/* User Type Selection */}
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-2xl p-1 shadow-lg border border-white/20">
          <div className="grid grid-cols-2 gap-1">
            <motion.button
              onClick={() => handleUserTypeChange("user")}
              className={`
                flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 relative
                ${
                  userType === "user"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700"
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <UserIcon className="w-5 h-5 mr-2" />
              Müşteri
              {userType === "user" && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              )}
            </motion.button>

            <motion.button
              onClick={() => handleUserTypeChange("seller")}
              className={`
                flex items-center justify-center px-6 py-3 rounded-xl font-medium transition-all duration-200 relative
                ${
                  userType === "seller"
                    ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-gray-700"
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <BuildingStorefrontIcon className="w-5 h-5 mr-2" />
              Satıcı
              {userType === "seller" && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Main Auth Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeTab}-${userType}`}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg"
        >
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
            {/* Tab Navigation */}
            <div className="relative p-6 pb-0">
              <div className="relative flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                <motion.div
                  className={`absolute top-1 h-8 bg-white dark:bg-gray-600 rounded-lg shadow-sm transition-transform duration-300 ease-in-out`}
                  style={{
                    width: "calc(50% - 4px)",
                    transform: `translateX(${
                      activeTab === "signup" ? "calc(100% + 4px)" : "2px"
                    })`,
                  }}
                  layoutId="activeTab"
                />

                <button
                  onClick={() => handleTabChange("login")}
                  className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                    activeTab === "login"
                      ? userType === "seller"
                        ? "text-emerald-600"
                        : "text-blue-600"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  Giriş Yap
                </button>

                <button
                  onClick={() => handleTabChange("signup")}
                  className={`relative z-10 w-1/2 py-2 text-sm font-medium transition-colors duration-200 rounded-lg ${
                    activeTab === "signup"
                      ? userType === "seller"
                        ? "text-emerald-600"
                        : "text-blue-600"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {userType === "seller" ? "Başvuru Yap" : "Üye Ol"}
                </button>
              </div>
            </div>

            {/* Form Container */}
            <div className="px-6 pb-6">
              <ModernAuthForm
                mode={activeTab}
                userType={userType}
                onModeChange={handleModeChange}
                className="mt-6"
              />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Benefits Section */}
      <motion.div
        className="mt-12 text-center max-w-4xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
          {userType === "seller"
            ? "Neden ANDA'da Satış Yapmalısınız?"
            : "Neden ANDA'yı Seçmelisiniz?"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {userType === "seller" ? (
            <>
              <motion.div
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <BuildingStorefrontIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Geniş Müşteri Kitlesi
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Milyonlarca aktif alıcıya ulaşın
                </p>
              </motion.div>

              <motion.div
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <CheckCircleIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Kolay Yönetim
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sezgisel satıcı paneli ile işlerinizi kolayca yönetin
                </p>
              </motion.div>

              <motion.div
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <StarIcon className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Premium Destek
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  7/24 satıcı desteği ve eğitim programları
                </p>
              </motion.div>
            </>
          ) : (
            <>
              <motion.div
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <SparklesIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Benzersiz Ürünler
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Milyonlarca kaliteli ürün arasından seçim yapın
                </p>
              </motion.div>

              <motion.div
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <CheckCircleIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Güvenli Alışveriş
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  256-bit SSL şifreleme ile güvenli ödeme
                </p>
              </motion.div>

              <motion.div
                className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                whileHover={{ scale: 1.02, y: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <StarIcon className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Hızlı Teslimat
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Türkiye geneli ücretsiz kargo seçenekleri
                </p>
              </motion.div>
            </>
          )}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div
        className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <p>© 2025 ANDA E-Ticaret Platformu. Tüm hakları saklıdır.</p>
        <div className="flex items-center justify-center mt-2 space-x-4">
          <button
            onClick={() => navigate("/privacy")}
            className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Gizlilik Politikası
          </button>
          <span>•</span>
          <button
            onClick={() => navigate("/terms")}
            className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Kullanım Koşulları
          </button>
          <span>•</span>
          <button
            onClick={() => navigate("/help")}
            className="hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Yardım
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
