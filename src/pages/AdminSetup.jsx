/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAdminLogin, useCreateAdmin } from "../hooks/useAdminAuth";
import { useBringToFrontAndCenter } from "../utils/bringToFrontAndCenter";
import {
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  UserPlusIcon,
  KeyIcon,
  SparklesIcon,
  CogIcon,
  LockClosedIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { ShieldCheckIcon as ShieldCheckIconSolid } from "@heroicons/react/24/solid";
import Logo from "../components/Logo";
import { toast } from "react-hot-toast";

/**
 * MODERN ADMIN SETUP & LOGIN COMPONENT
 *
 * Features:
 * - Modern glassmorphism design
 * - Admin account creation with comprehensive validation
 * - Secure admin login system
 * - Role-based access control integration
 * - Enhanced security measures
 * - Responsive mobile-first design
 */

const AdminSetup = () => {
  const [mode, setMode] = useState("login"); // "login" or "setup"
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    // Login fields
    email: "furknbudak@gmail.com",
    password: "12345678",
    rememberMe: false,

    // Setup fields
    fullName: "Furkan Budak",
    confirmPassword: "12345678",
    adminLevel: "admin",
    phone: "05434343443",
    notes: "",
  });

  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  // Mutations
  const { mutate: adminLogin, isPending: isLoginLoading } = useAdminLogin();
  const { mutate: createAdmin, isPending: isCreateLoading } = useCreateAdmin();

  // Redirect authenticated admin users
  useEffect(() => {
    if (isAuthenticated && role === "admin") {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, role, navigate]);

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }

    adminLogin(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        onSuccess: () => {
          toast.success("Admin girişi başarılı!");
          navigate("/admin/dashboard");
        },
        onError: (error) => {
          toast.error(`Giriş hatası: ${error.message}`);
        },
      }
    );
  };

  const handleSetup = (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.email || !formData.fullName || !formData.password) {
      toast.error("Lütfen zorunlu alanları doldurun");
      return;
    }

    // Validate phone number length (max 20 chars for VARCHAR(20))
    if (formData.phone && formData.phone.length > 20) {
      toast.error("Telefon numarası çok uzun (maksimum 20 karakter)");
      return;
    }

    // Validate password confirmation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    createAdmin(
      {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        adminLevel: formData.adminLevel,
        phone: formData.phone,
        permissions: ["users", "sellers", "products", "orders", "analytics"], // Simplified permissions as TEXT[]
        notes: formData.notes,
      },
      {
        onSuccess: () => {
          toast.success("Admin hesabı başarıyla oluşturuldu!");
          setMode("login");
          setFormData((prev) => ({
            ...prev,
            password: "",
            confirmPassword: "",
          }));
        },
        onError: (error) => {
          toast.error(`Hesap oluşturma hatası: ${error.message}`);
        },
      }
    );
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Header */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full blur-lg opacity-75 animate-pulse" />
              <div className="relative bg-white rounded-full p-4 shadow-2xl">
                <Logo className="h-10 w-10" />
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-purple-200 text-lg">
            ANDA e-ticaret platformu yönetim sistemi
          </p>
        </motion.div>

        {/* Mode Toggle */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-2 border border-white/20">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("login")}
                className={`py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  mode === "login"
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                    : "text-purple-100 hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <KeyIcon className="w-5 h-5" />
                  Admin Girişi
                </div>
              </button>
              <button
                onClick={() => setMode("setup")}
                className={`py-3 px-4 rounded-xl font-medium transition-all duration-300 ${
                  mode === "setup"
                    ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg"
                    : "text-purple-100 hover:text-white hover:bg-white/10"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <UserPlusIcon className="w-5 h-5" />
                  Hesap Oluştur
                </div>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Main Form Container */}
        <motion.div
          variants={itemVariants}
          className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden"
        >
          <div className="p-8">
            <div className="flex items-center justify-center mb-6">
              <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-full p-4 border border-white/20">
                {mode === "login" ? (
                  <ShieldCheckIconSolid className="h-8 w-8 text-purple-300" />
                ) : (
                  <UserPlusIcon className="h-8 w-8 text-purple-300" />
                )}
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-center text-white mb-6">
              {mode === "login" ? "Admin Girişi" : "Yeni Admin Hesabı"}
            </h2>

            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <motion.form
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleLogin}
                  className="space-y-6"
                >
                  {/* Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Email Adresi
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                      autoComplete="email"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all"
                      placeholder="admin@anda.com"
                    />
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        required
                        autoComplete="current-password"
                        className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={formData.rememberMe}
                        onChange={(e) =>
                          handleInputChange("rememberMe", e.target.checked)
                        }
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-white/20 rounded bg-white/10 backdrop-blur-sm"
                      />
                      <label
                        htmlFor="remember-me"
                        className="ml-2 text-sm text-purple-100"
                      >
                        Beni hatırla
                      </label>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="text-sm text-purple-200 hover:text-white transition-colors"
                    >
                      Şifremi unuttum
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoginLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    {isLoginLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Giriş yapılıyor...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <LockClosedIcon className="w-5 h-5" />
                        Admin Paneline Giriş Yap
                      </div>
                    )}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form
                  key="setup"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSetup}
                  className="space-y-6 max-h-96 overflow-y-auto custom-scrollbar"
                >
                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Ad Soyad *
                    </label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) =>
                        handleInputChange("fullName", e.target.value)
                      }
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all"
                      placeholder="Admin Kullanıcı"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Email Adresi *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all"
                      placeholder="admin@anda.com"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Departman *
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) =>
                        handleInputChange("department", e.target.value)
                      }
                      required
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all"
                    >
                      <option value="" className="bg-gray-800 text-white">
                        Departman seçin
                      </option>
                      <option value="IT" className="bg-gray-800 text-white">
                        Bilgi İşlem
                      </option>
                      <option
                        value="Management"
                        className="bg-gray-800 text-white"
                      >
                        Yönetim
                      </option>
                      <option value="Sales" className="bg-gray-800 text-white">
                        Satış
                      </option>
                      <option
                        value="Support"
                        className="bg-gray-800 text-white"
                      >
                        Destek
                      </option>
                      <option
                        value="Marketing"
                        className="bg-gray-800 text-white"
                      >
                        Pazarlama
                      </option>
                    </select>
                  </div>

                  {/* Admin Level */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Yetki Seviyesi
                    </label>
                    <select
                      value={formData.adminLevel}
                      onChange={(e) =>
                        handleInputChange("adminLevel", e.target.value)
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all"
                    >
                      <option
                        value="moderator"
                        className="bg-gray-800 text-white"
                      >
                        Moderatör
                      </option>
                      <option value="admin" className="bg-gray-800 text-white">
                        Admin
                      </option>
                      <option
                        value="super_admin"
                        className="bg-gray-800 text-white"
                      >
                        Süper Admin
                      </option>
                    </select>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Şifre *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          handleInputChange("password", e.target.value)
                        }
                        required
                        minLength={8}
                        className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all"
                        placeholder="En az 8 karakter"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Şifre Tekrar *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) =>
                          handleInputChange("confirmPassword", e.target.value)
                        }
                        required
                        className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all"
                        placeholder="Şifreyi tekrar girin"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-purple-100 mb-2">
                      Telefon Numarası
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      maxLength={20}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent backdrop-blur-sm transition-all"
                      placeholder="05XX XXX XX XX (max 20 karakter)"
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isCreateLoading}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                  >
                    {isCreateLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Hesap oluşturuluyor...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircleIcon className="w-5 h-5" />
                        Admin Hesabı Oluştur
                      </div>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 px-8 py-4 border-t border-white/10">
            <div className="text-center">
              <div className="text-sm text-purple-200">
                Normal kullanıcı mısınız?{" "}
                <Link
                  to="/auth"
                  className="text-white hover:text-purple-100 font-medium transition-colors"
                >
                  Buradan giriş yapın
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          variants={itemVariants}
          className="mt-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 backdrop-blur-sm"
        >
          <div className="flex items-start gap-3">
            <ShieldCheckIcon className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-100">
              <strong>Güvenlik Uyarısı:</strong> Admin paneli sadece yetkili
              personel içindir. Lütfen kimlik bilgilerinizi güvende tutun ve
              hesabınızı paylaşmayın.
            </div>
          </div>
        </motion.div>

        {/* Development Info */}
        {import.meta.env.DEV && (
          <motion.div
            variants={itemVariants}
            className="mt-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4 backdrop-blur-sm"
          >
            <div className="flex items-start gap-3">
              <CogIcon className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-200">
                <strong>Geliştirici Modu:</strong> Test için admin hesabı
                oluşturabilir ve mevcut hesaplarla giriş yapabilirsiniz.
                Production ortamında bu panel gizlenecektir.
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default AdminSetup;
