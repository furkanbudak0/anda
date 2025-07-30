import { useState } from "react";

/**
 * ANDA E-TİCARET PLATFORM - MERKEZİ VALİDASYON SİSTEMİ
 *
 * Tüm form validasyonları için merkezi, tutarlı ve yeniden kullanılabilir sistem
 * Email, telefon, IBAN, kredi kartı, Türkiye özel validasyonları
 */

/**
 * Common validation rules
 */
export const validationRules = {
  // Basic validations
  required: (value, fieldName = "Bu alan") => {
    if (!value || value.toString().trim() === "") {
      return `${fieldName} zorunludur`;
    }
    return null;
  },

  minLength: (value, min, fieldName = "Bu alan") => {
    if (value && value.length < min) {
      return `${fieldName} en az ${min} karakter olmalıdır`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = "Bu alan") => {
    if (value && value.length > max) {
      return `${fieldName} en fazla ${max} karakter olabilir`;
    }
    return null;
  },

  // Email validation
  email: (value, fieldName = "E-posta") => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return `Geçerli bir ${fieldName.toLowerCase()} adresi girin`;
    }
    return null;
  },

  // Turkish phone validation
  phone: (value, fieldName = "Telefon numarası") => {
    if (!value) return null;
    // Remove spaces and dashes for validation
    const cleanPhone = value.replace(/[\s-]/g, "");
    const phoneRegex = /^(\+90|0)?5\d{9}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return `Geçerli bir ${fieldName.toLowerCase()} girin (05XX XXX XX XX)`;
    }
    return null;
  },

  // Turkish ID number validation (TC Kimlik)
  tcId: (value, fieldName = "TC Kimlik Numarası") => {
    if (!value) return null;
    if (value.length !== 11 || !/^\d{11}$/.test(value)) {
      return `${fieldName} 11 haneli olmalıdır`;
    }

    // TC Kimlik No algorithm check
    const digits = value.split("").map(Number);
    const firstTen = digits.slice(0, 10);
    const eleventhDigit = digits[10];

    const sumOdd = firstTen
      .filter((_, i) => i % 2 === 0)
      .reduce((a, b) => a + b, 0);
    const sumEven = firstTen
      .filter((_, i) => i % 2 === 1)
      .reduce((a, b) => a + b, 0);

    const checkDigit = (sumOdd * 7 - sumEven) % 10;
    const lastDigit = (firstTen.reduce((a, b) => a + b, 0) + checkDigit) % 10;

    if (checkDigit !== digits[9] || lastDigit !== eleventhDigit) {
      return `Geçerli bir ${fieldName.toLowerCase()} girin`;
    }
    return null;
  },

  // IBAN validation for Turkey
  iban: (value, fieldName = "IBAN") => {
    if (!value) return null;
    const cleanIban = value.replace(/\s/g, "");

    if (!cleanIban.startsWith("TR") || cleanIban.length !== 26) {
      return `Türkiye IBAN'ı TR ile başlamalı ve 26 karakter olmalıdır`;
    }

    // Basic IBAN checksum validation
    const ibanRegex = /^TR\d{2}\d{4}\d{1}\d{16}$/;
    if (!ibanRegex.test(cleanIban)) {
      return `Geçerli bir ${fieldName} girin`;
    }
    return null;
  },

  // Credit card validation
  creditCard: (value, fieldName = "Kredi kartı numarası") => {
    if (!value) return null;
    const cleanCard = value.replace(/\s/g, "");

    // Luhn algorithm check
    let sum = 0;
    let alternate = false;

    for (let i = cleanCard.length - 1; i >= 0; i--) {
      let n = parseInt(cleanCard.charAt(i), 10);

      if (alternate) {
        n *= 2;
        if (n > 9) {
          n = (n % 10) + 1;
        }
      }

      sum += n;
      alternate = !alternate;
    }

    if (sum % 10 !== 0) {
      return `Geçerli bir ${fieldName.toLowerCase()} girin`;
    }
    return null;
  },

  // Password strength validation
  password: (value, fieldName = "Şifre") => {
    if (!value) return null;

    if (value.length < 8) {
      return `${fieldName} en az 8 karakter olmalıdır`;
    }

    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /\d/.test(value);

    if (!hasUpper || !hasLower || !hasNumber) {
      return `${fieldName} büyük harf, küçük harf ve rakam içermelidir`;
    }

    return null;
  },

  // Confirm password validation
  confirmPassword: (value, password, fieldName = "Şifre tekrarı") => {
    if (!value) return null;
    if (value !== password) {
      return "Şifreler eşleşmiyor";
    }
    return null;
  },

  // URL validation
  url: (value, fieldName = "Web sitesi") => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return `Geçerli bir ${fieldName.toLowerCase()} adresi girin (http:// veya https:// ile başlamalı)`;
    }
  },

  // Numeric validations
  numeric: (value, fieldName = "Bu alan") => {
    if (!value) return null;
    if (isNaN(Number(value))) {
      return `${fieldName} sayısal olmalıdır`;
    }
    return null;
  },

  min: (value, min, fieldName = "Değer") => {
    if (value !== null && value !== undefined && Number(value) < min) {
      return `${fieldName} en az ${min} olmalıdır`;
    }
    return null;
  },

  max: (value, max, fieldName = "Değer") => {
    if (value !== null && value !== undefined && Number(value) > max) {
      return `${fieldName} en fazla ${max} olabilir`;
    }
    return null;
  },

  // Date validations
  date: (value, fieldName = "Tarih") => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return `Geçerli bir ${fieldName.toLowerCase()} girin`;
    }
    return null;
  },

  futureDate: (value, fieldName = "Tarih") => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    if (date <= now) {
      return `${fieldName} gelecekte bir tarih olmalıdır`;
    }
    return null;
  },

  pastDate: (value, fieldName = "Tarih") => {
    if (!value) return null;
    const date = new Date(value);
    const now = new Date();
    if (date >= now) {
      return `${fieldName} geçmişte bir tarih olmalıdır`;
    }
    return null;
  },

  // Age validation (18+ check)
  minimumAge: (value, minAge = 18, fieldName = "Doğum tarihi") => {
    if (!value) return null;
    const birthDate = new Date(value);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    if (age < minAge) {
      return `En az ${minAge} yaşında olmalısınız`;
    }
    return null;
  },

  // Tax number validation (Turkey)
  taxNumber: (value, fieldName = "Vergi numarası") => {
    if (!value) return null;
    if (value.length !== 10 || !/^\d{10}$/.test(value)) {
      return `${fieldName} 10 haneli olmalıdır`;
    }
    return null;
  },

  // Postal code validation (Turkey)
  postalCode: (value, fieldName = "Posta kodu") => {
    if (!value) return null;
    if (!/^\d{5}$/.test(value)) {
      return `${fieldName} 5 haneli olmalıdır`;
    }
    return null;
  },
};

/**
 * Form validation composer
 * Combines multiple validation rules for a field
 */
export const validateField = (value, rules) => {
  for (const rule of rules) {
    const error = rule(value);
    if (error) {
      return error;
    }
  }
  return null;
};

/**
 * Validate entire form object
 */
export const validateForm = (formData, validationSchema) => {
  const errors = {};

  Object.entries(validationSchema).forEach(([fieldName, rules]) => {
    const value = formData[fieldName];
    const error = validateField(value, rules);
    if (error) {
      errors[fieldName] = error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Pre-defined validation schemas for common forms
 */
export const validationSchemas = {
  // Contact form schema
  contact: {
    name: [
      (value) => validationRules.required(value, "Ad soyad"),
      (value) => validationRules.minLength(value, 2, "Ad soyad"),
    ],
    email: [
      (value) => validationRules.required(value, "E-posta"),
      (value) => validationRules.email(value),
    ],
    subject: [
      (value) => validationRules.required(value, "Konu"),
      (value) => validationRules.minLength(value, 5, "Konu"),
    ],
    message: [
      (value) => validationRules.required(value, "Mesaj"),
      (value) => validationRules.minLength(value, 20, "Mesaj"),
    ],
  },

  // Address form schema
  address: {
    address_name: [(value) => validationRules.required(value, "Adres adı")],
    full_name: [
      (value) => validationRules.required(value, "Ad soyad"),
      (value) => validationRules.minLength(value, 2, "Ad soyad"),
    ],
    phone: [
      (value) => validationRules.required(value, "Telefon"),
      (value) => validationRules.phone(value),
    ],
    address_line: [
      (value) => validationRules.required(value, "Adres"),
      (value) => validationRules.minLength(value, 10, "Adres"),
    ],
    district: [(value) => validationRules.required(value, "İlçe")],
    city: [(value) => validationRules.required(value, "İl")],
    postal_code: [
      (value) => validationRules.required(value, "Posta kodu"),
      (value) => validationRules.postalCode(value),
    ],
  },

  // Payment method schema
  paymentMethod: {
    card_name: [(value) => validationRules.required(value, "Kart adı")],
    card_number: [
      (value) => validationRules.required(value, "Kart numarası"),
      (value) => validationRules.creditCard(value),
    ],
    card_holder_name: [
      (value) => validationRules.required(value, "Kart sahibi"),
      (value) => validationRules.minLength(value, 2, "Kart sahibi"),
    ],
    expiry_month: [
      (value) => validationRules.required(value, "Son kullanma ayı"),
    ],
    expiry_year: [
      (value) => validationRules.required(value, "Son kullanma yılı"),
    ],
    cvv: [
      (value) => validationRules.required(value, "CVV"),
      (value) => validationRules.minLength(value, 3, "CVV"),
      (value) => validationRules.maxLength(value, 4, "CVV"),
    ],
  },

  // Review form schema
  review: {
    rating: [
      (value) => validationRules.required(value, "Puan"),
      (value) => validationRules.min(value, 1, "Puan"),
      (value) => validationRules.max(value, 5, "Puan"),
    ],
    title: [
      (value) => validationRules.required(value, "Başlık"),
      (value) => validationRules.minLength(value, 5, "Başlık"),
    ],
    comment: [
      (value) => validationRules.required(value, "Yorum"),
      (value) => validationRules.minLength(value, 20, "Yorum"),
    ],
  },
};

/**
 * Real-time validation hook
 */
export const useFormValidation = (initialData, schema) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateSingleField = (fieldName, value) => {
    const fieldRules = schema[fieldName];
    if (!fieldRules) return null;

    return validateField(value, fieldRules);
  };

  const handleChange = (fieldName, value) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear error when user starts typing
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: null }));
    }
  };

  const handleBlur = (fieldName) => {
    setTouched((prev) => ({ ...prev, [fieldName]: true }));

    const error = validateSingleField(fieldName, formData[fieldName]);
    if (error) {
      setErrors((prev) => ({ ...prev, [fieldName]: error }));
    }
  };

  const validateAll = () => {
    const { isValid, errors: allErrors } = validateForm(formData, schema);
    setErrors(allErrors);

    // Mark all fields as touched
    const allTouched = Object.keys(schema).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    return isValid;
  };

  const reset = () => {
    setFormData(initialData);
    setErrors({});
    setTouched({});
  };

  return {
    formData,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
};

export default {
  validationRules,
  validateField,
  validateForm,
  validationSchemas,
  useFormValidation,
};
