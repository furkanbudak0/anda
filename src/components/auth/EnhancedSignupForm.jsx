/* eslint-disable react/prop-types */
import { useState } from "react";
import { useUserSignup } from "../../hooks/useAuth";
import {
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  PhoneIcon,
  CalendarDaysIcon,
  IdentificationIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import Spinner from "../Spinner";
import toast from "react-hot-toast";

/**
 * Kapsamlı kullanıcı kayıt formu
 * Profiles tablosu için gereken tüm verileri toplar
 */
export default function EnhancedSignupForm({ onSuccess, onBackToLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone: "",
    tcId: "",
    birthDate: "",
    gender: "",
    acceptTerms: false,
    acceptPrivacy: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState({});

  const userSignupMutation = useUserSignup();
  const isLoading = userSignupMutation.isPending;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateStep1 = () => {
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

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Şifreler eşleşmiyor";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = "Ad soyad gerekli (en az 2 karakter)";
    }

    if (!formData.phone) {
      errors.phone = "Telefon numarası gerekli";
    } else if (
      !/^(\+90|0)?[5][0-9]{9}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      errors.phone = "Geçerli bir Türkiye telefon numarası girin";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep3 = () => {
    const errors = {};

    if (!formData.acceptTerms) {
      errors.acceptTerms = "Kullanım koşullarını kabul etmelisiniz";
    }

    if (!formData.acceptPrivacy) {
      errors.acceptPrivacy = "Gizlilik politikasını kabul etmelisiniz";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateStep3()) {
      toast.error("Lütfen tüm gerekli alanları doldurun");
      return;
    }

    // Format phone number
    const cleanPhone = formData.phone.replace(/\s/g, "");
    const formattedPhone = cleanPhone.startsWith("+90")
      ? cleanPhone
      : cleanPhone.startsWith("0")
      ? "+90" + cleanPhone.slice(1)
      : "+90" + cleanPhone;

    userSignupMutation.mutate({
      email: formData.email,
      password: formData.password,
      fullName: formData.name,
      phone: formattedPhone,
      tcId: formData.tcId || null,
      birthDate: formData.birthDate || null,
      gender: formData.gender || null,
    });
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

  const stepVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  const renderStep1 = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Hesap Oluştur
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          E-posta ve şifre bilgilerinizi girin
        </p>
      </div>

      {/* Email Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          E-posta Adresi
        </label>
        <div className="relative">
          <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="ornek@email.com"
          />
        </div>
        {validationErrors.email && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Şifre
        </label>
        <div className="relative">
          <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="En az 6 karakter"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Password Strength */}
        {formData.password && (
          <div className="mt-2">
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded ${
                    step <= passwordStrength
                      ? strengthColors[passwordStrength]
                      : "bg-gray-200 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Şifre Gücü: {strengthLabels[passwordStrength] || "Çok Zayıf"}
            </p>
          </div>
        )}

        {validationErrors.password && (
          <p className="text-red-500 text-sm mt-1">
            {validationErrors.password}
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Şifre Tekrar
        </label>
        <div className="relative">
          <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Şifrenizi tekrar girin"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showConfirmPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        {validationErrors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">
            {validationErrors.confirmPassword}
          </p>
        )}
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Kişisel Bilgiler
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Profil bilgilerinizi tamamlayın
        </p>
      </div>

      {/* Name Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ad Soyad *
        </label>
        <div className="relative">
          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Adınız ve soyadınız"
          />
        </div>
        {validationErrors.name && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.name}</p>
        )}
      </div>

      {/* Phone Field */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Telefon Numarası *
        </label>
        <div className="relative">
          <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="05XX XXX XX XX"
          />
        </div>
        {validationErrors.phone && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
        )}
      </div>

      {/* TC ID Field (Optional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          T.C. Kimlik No (Opsiyonel)
        </label>
        <div className="relative">
          <IdentificationIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            name="tcId"
            value={formData.tcId}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="11 haneli T.C. kimlik numarası"
            maxLength="11"
          />
        </div>
      </div>

      {/* Birth Date Field (Optional) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Doğum Tarihi (Opsiyonel)
        </label>
        <div className="relative">
          <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="date"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleInputChange}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Gender Field (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Cinsiyet (Opsiyonel)
        </label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Seçiniz</option>
          <option value="male">Erkek</option>
          <option value="female">Kadın</option>
          <option value="other">Diğer</option>
        </select>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      variants={stepVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Son Adım
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Koşulları onaylayın ve hesabınızı oluşturun
        </p>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 dark:text-white mb-2">
          Bilgi Özeti:
        </h3>
        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <span className="font-medium">E-posta:</span> {formData.email}
          </p>
          <p>
            <span className="font-medium">Ad Soyad:</span> {formData.name}
          </p>
          <p>
            <span className="font-medium">Telefon:</span> {formData.phone}
          </p>
          {formData.tcId && (
            <p>
              <span className="font-medium">T.C. No:</span> {formData.tcId}
            </p>
          )}
          {formData.birthDate && (
            <p>
              <span className="font-medium">Doğum Tarihi:</span>{" "}
              {formData.birthDate}
            </p>
          )}
          {formData.gender && (
            <p>
              <span className="font-medium">Cinsiyet:</span>{" "}
              {formData.gender === "male"
                ? "Erkek"
                : formData.gender === "female"
                ? "Kadın"
                : "Diğer"}
            </p>
          )}
        </div>
      </div>

      {/* Terms Acceptance */}
      <div className="space-y-4 mb-6">
        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            name="acceptTerms"
            checked={formData.acceptTerms}
            onChange={handleInputChange}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            <a
              href="/terms"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Kullanım Koşulları
            </a>
            'nı okudum ve kabul ediyorum *
          </span>
        </label>
        {validationErrors.acceptTerms && (
          <p className="text-red-500 text-sm">{validationErrors.acceptTerms}</p>
        )}

        <label className="flex items-start space-x-3">
          <input
            type="checkbox"
            name="acceptPrivacy"
            checked={formData.acceptPrivacy}
            onChange={handleInputChange}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            <a
              href="/privacy"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              Gizlilik Politikası
            </a>
            'nı okudum ve kabul ediyorum *
          </span>
        </label>
        {validationErrors.acceptPrivacy && (
          <p className="text-red-500 text-sm">
            {validationErrors.acceptPrivacy}
          </p>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            Adım {currentStep} / 3
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {Math.round((currentStep / 3) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Step Content */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        {/* Navigation Buttons */}
        <div className="flex justify-between space-x-4">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Geri
            </button>
          ) : (
            <button
              type="button"
              onClick={onBackToLogin}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
            >
              Giriş Yap
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              İleri
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Hesap Oluşturuluyor...</span>
                </>
              ) : (
                "Hesap Oluştur"
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
