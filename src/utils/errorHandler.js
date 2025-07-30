import { toast } from "react-hot-toast";

/**
 * Supabase hatalarını işle ve kullanıcı dostu mesajlar göster
 */
export const handleSupabaseError = (error, context = "") => {
  console.error(`Supabase Error (${context}):`, error);

  let message = "Bir hata oluştu. Lütfen tekrar deneyin.";

  if (error?.code) {
    switch (error.code) {
      case "23505": // Unique constraint violation
        message = "Bu kayıt zaten mevcut.";
        break;
      case "23503": // Foreign key violation
        message = "İlişkili kayıt bulunamadı.";
        break;
      case "42P01": // Table doesn't exist
        message = "Veritabanı tablosu bulunamadı.";
        break;
      case "42703": // Column doesn't exist
        message = "Veritabanı kolonu bulunamadı.";
        break;
      case "PGRST116": // JWT error
        message = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
        break;
      case "PGRST301": // Row Level Security
        message = "Bu işlem için yetkiniz bulunmuyor.";
        break;
      default:
        message = error.message || "Veritabanı hatası oluştu.";
    }
  }

  toast.error(message);
  return message;
};

/**
 * API hatalarını işle
 */
export const handleApiError = (error, context = "") => {
  console.error(`API Error (${context}):`, error);

  let message = "Sunucu hatası oluştu. Lütfen tekrar deneyin.";

  if (error?.response?.status) {
    switch (error.response.status) {
      case 400:
        message = "Geçersiz istek. Lütfen verilerinizi kontrol edin.";
        break;
      case 401:
        message = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
        break;
      case 403:
        message = "Bu işlem için yetkiniz bulunmuyor.";
        break;
      case 404:
        message = "İstenen kaynak bulunamadı.";
        break;
      case 422:
        message = "Gönderilen veriler geçersiz.";
        break;
      case 429:
        message = "Çok fazla istek gönderdiniz. Lütfen bekleyin.";
        break;
      case 500:
        message = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
        break;
      default:
        message = error.response?.data?.message || "Bilinmeyen hata oluştu.";
    }
  } else if (error?.message) {
    message = error.message;
  }

  toast.error(message);
  return message;
};

/**
 * Form validasyon hatalarını işle
 */
export const handleValidationError = (errors, context = "") => {
  console.error(`Validation Error (${context}):`, errors);

  if (typeof errors === "string") {
    toast.error(errors);
    return errors;
  }

  if (Array.isArray(errors)) {
    const message = errors.join(", ");
    toast.error(message);
    return message;
  }

  if (typeof errors === "object") {
    const messages = Object.values(errors).filter(Boolean);
    const message = messages.join(", ");
    toast.error(message);
    return message;
  }

  const message = "Form verilerinde hata var. Lütfen kontrol edin.";
  toast.error(message);
  return message;
};

/**
 * Genel hata işleyici
 */
export const handleError = (error, context = "") => {
  if (error?.code && error.code.startsWith("PGRST")) {
    return handleSupabaseError(error, context);
  }

  if (error?.response) {
    return handleApiError(error, context);
  }

  if (error?.message) {
    toast.error(error.message);
    return error.message;
  }

  const message = "Beklenmeyen bir hata oluştu.";
  toast.error(message);
  return message;
};

/**
 * Loading state ile birlikte hata işleme
 */
export const handleErrorWithLoading = (error, setLoading, context = "") => {
  setLoading?.(false);
  return handleError(error, context);
};

/**
 * Success mesajı göster
 */
export const showSuccess = (message) => {
  toast.success(message);
};

/**
 * Info mesajı göster
 */
export const showInfo = (message) => {
  toast(message, {
    icon: "ℹ️",
  });
};

/**
 * Warning mesajı göster
 */
export const showWarning = (message) => {
  toast(message, {
    icon: "⚠️",
  });
};
