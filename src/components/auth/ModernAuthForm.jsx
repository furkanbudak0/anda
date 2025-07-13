/* eslint-disable react/prop-types */
import { useState } from "react";
import { useLogin, useUserSignup, useSellerSignup } from "../../hooks/useAuth";
import { Link, useSearchParams } from "react-router-dom";
import {
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  BuildingStorefrontIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import Spinner from "../Spinner";
import toast from "react-hot-toast";

/**
 * Modern, unified authentication form component
 * Supports user login/signup and seller registration
 */
export default function ModernAuthForm({
  mode = "login",
  userType = "user",
  onModeChange,
  className = "",
}) {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    confirmPassword: "",
    businessName: "",
    taxNumber: "",
    phone: "",
    tcId: "",
    birthDate: "",
    gender: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const loginMutation = useLogin();
  const userSignupMutation = useUserSignup();
  const sellerSignupMutation = useSellerSignup();

  const isLoading =
    loginMutation.isPending ||
    userSignupMutation.isPending ||
    sellerSignupMutation.isPending;
  const isSignup = mode === "signup";
  const isSeller = userType === "seller";

  // Get redirect path from URL params
  const redirectTo = searchParams.get("redirect") || null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.email) {
      errors.email = "E-posta adresi gerekli";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Geçerli bir e-posta adresi girin";
    }

    if (!formData.password) {
      errors.password = "Şifre gerekli";
    } else if (formData.password.length < 6) {
      errors.password = "Şifre en az 6 karakter olmalı";
    }

    if (isSignup) {
      if (!formData.fullName) {
        errors.fullName = "Ad soyad gerekli";
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Şifreler eşleşmiyor";
      }

      if (!formData.acceptTerms) {
        errors.acceptTerms = "Kullanım koşullarını kabul etmelisiniz";
      }

      if (isSeller) {
        if (!formData.businessName) {
          errors.businessName = "İşletme adı gerekli";
        }
        if (!formData.taxNumber) {
          errors.taxNumber = "Vergi numarası gerekli";
        }
        if (!formData.phone) {
          errors.phone = "Telefon numarası gerekli";
        }
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Lütfen tüm gerekli alanları doldurun");
      return;
    }

    if (isSignup) {
      if (isSeller) {
        sellerSignupMutation.mutate({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          businessName: formData.businessName,
          taxNumber: formData.taxNumber,
          phone: formData.phone,
        });
      } else {
        userSignupMutation.mutate({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          phone: formData.phone || null,
          tcId: formData.tcId || null,
          birthDate: formData.birthDate || null,
          gender: formData.gender || null,
        });
      }
    } else {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
        redirect: redirectTo,
      });
    }
  };

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-blue-500",
    "bg-green-500",
  ];
  const strengthLabels = ["Çok Zayıf", "Zayıf", "Orta", "İyi", "Güçlü"];

  const formVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const fieldVariants = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10 },
  };

  return (
    <motion.div
      variants={formVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.3 }}
      className={`w-full max-w-md mx-auto ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4"
        >
          {isSeller ? (
            <BuildingStorefrontIcon className="w-8 h-8 text-white" />
          ) : mode === "login" ? (
            <ShieldCheckIcon className="w-8 h-8 text-white" />
          ) : (
            <UserIcon className="w-8 h-8 text-white" />
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300"
        >
          {isSignup
            ? isSeller
              ? "Satıcı Ol"
              : "Hesap Oluştur"
            : isSeller
            ? "Satıcı Girişi"
            : "Hoş Geldiniz"}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-gray-600 dark:text-gray-400"
        >
          {isSignup
            ? isSeller
              ? "İşletmenizi ANDA'ya taşıyın"
              : "ANDA ailesine katılın"
            : isSeller
            ? "Satıcı panelinize erişin"
            : "Hesabınıza giriş yapın"}
        </motion.p>
      </div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <AnimatePresence mode="wait">
          {/* Email Field */}
          <motion.div
            key="email"
            variants={fieldVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-posta Adresi *
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="email"
                name="email"
                required
                className={`
                  w-full pl-10 pr-4 py-3 border rounded-xl transition-all duration-200
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  dark:bg-gray-800 dark:border-gray-600 dark:text-white
                  ${
                    validationErrors.email
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 hover:border-gray-400"
                  }
                `}
                placeholder={isSeller ? "isletme@email.com" : "ornek@email.com"}
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            {validationErrors.email && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600 flex items-center"
              >
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {validationErrors.email}
              </motion.p>
            )}
          </motion.div>

          {/* Full Name Field (Signup only) */}
          {isSignup && (
            <motion.div
              key="fullName"
              variants={fieldVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ad Soyad *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  required
                  className={`
                    w-full pl-10 pr-4 py-3 border rounded-xl transition-all duration-200
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    dark:bg-gray-800 dark:border-gray-600 dark:text-white
                    ${
                      validationErrors.fullName
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 hover:border-gray-400"
                    }
                  `}
                  placeholder="Adınız ve soyadınız"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>
              {validationErrors.fullName && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {validationErrors.fullName}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Seller-specific fields */}
          {isSignup && isSeller && (
            <>
              <motion.div
                key="businessName"
                variants={fieldVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  İşletme Adı *
                </label>
                <input
                  type="text"
                  name="businessName"
                  required
                  className={`
                    w-full px-4 py-3 border rounded-xl transition-all duration-200
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    dark:bg-gray-800 dark:border-gray-600 dark:text-white
                    ${
                      validationErrors.businessName
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 hover:border-gray-400"
                    }
                  `}
                  placeholder="Şirket/Mağaza adınız"
                  value={formData.businessName}
                  onChange={handleInputChange}
                />
                {validationErrors.businessName && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 flex items-center"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {validationErrors.businessName}
                  </motion.p>
                )}
              </motion.div>

              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  key="taxNumber"
                  variants={fieldVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2, delay: 0.3 }}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vergi No *
                  </label>
                  <input
                    type="text"
                    name="taxNumber"
                    required
                    className={`
                      w-full px-4 py-3 border rounded-xl transition-all duration-200
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-800 dark:border-gray-600 dark:text-white
                      ${
                        validationErrors.taxNumber
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 hover:border-gray-400"
                      }
                    `}
                    placeholder="1234567890"
                    value={formData.taxNumber}
                    onChange={handleInputChange}
                  />
                  {validationErrors.taxNumber && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-600 text-xs"
                    >
                      {validationErrors.taxNumber}
                    </motion.p>
                  )}
                </motion.div>

                <motion.div
                  key="phone"
                  variants={fieldVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2, delay: 0.4 }}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    className={`
                      w-full px-4 py-3 border rounded-xl transition-all duration-200
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-800 dark:border-gray-600 dark:text-white
                      ${
                        validationErrors.phone
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 hover:border-gray-400"
                      }
                    `}
                    placeholder="0500 000 00 00"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                  {validationErrors.phone && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-1 text-sm text-red-600 text-xs"
                    >
                      {validationErrors.phone}
                    </motion.p>
                  )}
                </motion.div>
              </div>
            </>
          )}

          {/* Password Field */}
          <motion.div
            key="password"
            variants={fieldVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.2,
              delay: isSignup ? (isSeller ? 0.5 : 0.2) : 0.1,
            }}
          >
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Şifre *
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                className={`
                  w-full pl-10 pr-12 py-3 border rounded-xl transition-all duration-200
                  focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  dark:bg-gray-800 dark:border-gray-600 dark:text-white
                  ${
                    validationErrors.password
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-gray-300 hover:border-gray-400"
                  }
                `}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                )}
              </button>
            </div>

            {/* Password Strength Indicator (Signup only) */}
            {isSignup && formData.password && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.3 }}
                className="mt-2"
              >
                <div className="flex space-x-1 mb-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-1 w-full rounded transition-colors duration-300 ${
                        i < passwordStrength
                          ? strengthColors[passwordStrength - 1]
                          : "bg-gray-200 dark:bg-gray-700"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Şifre Gücü:{" "}
                  {strengthLabels[passwordStrength - 1] || "Çok Zayıf"}
                </p>
              </motion.div>
            )}

            {validationErrors.password && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1 text-sm text-red-600 flex items-center"
              >
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {validationErrors.password}
              </motion.p>
            )}
          </motion.div>

          {/* Confirm Password Field (Signup only) */}
          {isSignup && (
            <motion.div
              key="confirmPassword"
              variants={fieldVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, delay: isSeller ? 0.6 : 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Şifre Tekrar *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  className={`
                    w-full pl-10 pr-12 py-3 border rounded-xl transition-all duration-200
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    dark:bg-gray-800 dark:border-gray-600 dark:text-white
                    ${
                      validationErrors.confirmPassword
                        ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                        : "border-gray-300 hover:border-gray-400"
                    }
                  `}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              {validationErrors.confirmPassword && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-1 text-sm text-red-600 flex items-center"
                >
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {validationErrors.confirmPassword}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Enhanced Profile Fields for User Signup */}
          {isSignup && !isSeller && (
            <>
              {/* Phone Field */}
              <motion.div
                key="phone"
                variants={fieldVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, delay: 0.4 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefon Numarası
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400 text-sm">🇹🇷</span>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    className={`
                      w-full pl-12 pr-4 py-3 border rounded-xl transition-all duration-200
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-800 dark:border-gray-600 dark:text-white
                      ${
                        validationErrors.phone
                          ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                          : "border-gray-300 hover:border-gray-400"
                      }
                    `}
                    placeholder="05XX XXX XX XX"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                {validationErrors.phone && (
                  <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-1 text-sm text-red-600 flex items-center"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                    {validationErrors.phone}
                  </motion.p>
                )}
              </motion.div>

              {/* TC ID and Birth Date Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TC ID Field */}
                <motion.div
                  key="tcId"
                  variants={fieldVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2, delay: 0.5 }}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    T.C. Kimlik No (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    name="tcId"
                    maxLength="11"
                    className={`
                      w-full px-4 py-3 border rounded-xl transition-all duration-200
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-800 dark:border-gray-600 dark:text-white
                      border-gray-300 hover:border-gray-400
                    `}
                    placeholder="12345678901"
                    value={formData.tcId}
                    onChange={handleInputChange}
                  />
                </motion.div>

                {/* Birth Date Field */}
                <motion.div
                  key="birthDate"
                  variants={fieldVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  transition={{ duration: 0.2, delay: 0.6 }}
                >
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Doğum Tarihi (Opsiyonel)
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    className={`
                      w-full px-4 py-3 border rounded-xl transition-all duration-200
                      focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      dark:bg-gray-800 dark:border-gray-600 dark:text-white
                      border-gray-300 hover:border-gray-400
                    `}
                    value={formData.birthDate}
                    onChange={handleInputChange}
                  />
                </motion.div>
              </div>

              {/* Gender Field */}
              <motion.div
                key="gender"
                variants={fieldVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, delay: 0.7 }}
              >
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cinsiyet (Opsiyonel)
                </label>
                <select
                  name="gender"
                  className={`
                    w-full px-4 py-3 border rounded-xl transition-all duration-200
                    focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                    dark:bg-gray-800 dark:border-gray-600 dark:text-white
                    border-gray-300 hover:border-gray-400
                  `}
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value="">Seçiniz</option>
                  <option value="male">Erkek</option>
                  <option value="female">Kadın</option>
                  <option value="other">Diğer</option>
                </select>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Terms and Conditions (Signup only) */}
        {isSignup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <div className="flex items-center">
              <input
                type="checkbox"
                name="acceptTerms"
                id="acceptTerms"
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                checked={formData.acceptTerms}
                onChange={handleInputChange}
              />
              <label
                htmlFor="acceptTerms"
                className="ml-2 text-sm text-gray-600 dark:text-gray-400"
              >
                <Link
                  to="/terms"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Kullanım Koşulları
                </Link>{" "}
                ve{" "}
                <Link
                  to="/privacy"
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Gizlilik Politikası
                </Link>
                'nı kabul ediyorum *
              </label>
            </div>
            {validationErrors.acceptTerms && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-600 flex items-center"
              >
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {validationErrors.acceptTerms}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Spinner size="sm" />
              <span className="ml-2">
                {isSignup ? "Hesap oluşturuluyor..." : "Giriş yapılıyor..."}
              </span>
            </div>
          ) : (
            <span className="flex items-center justify-center">
              {isSignup
                ? isSeller
                  ? "Satıcı Başvurusu Gönder"
                  : "Hesap Oluştur"
                : "Giriş Yap"}
              <CheckCircleIcon className="w-5 h-5 ml-2" />
            </span>
          )}
        </motion.button>

        {/* Switch Mode Links */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {!isSignup ? (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Hesabınız yok mu?{" "}
              <button
                type="button"
                onClick={() => onModeChange?.("signup")}
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Üye ol
              </button>
            </p>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Zaten hesabınız var mı?{" "}
              <button
                type="button"
                onClick={() => onModeChange?.("login")}
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Giriş yap
              </button>
            </p>
          )}

          {!isSignup && (
            <p className="text-sm">
              <Link
                to="/auth/forgot-password"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </p>
          )}
        </motion.div>
      </motion.form>
    </motion.div>
  );
}
