import { useMutation } from "@tanstack/react-query";
import { supabase } from "../services/supabase";
import toast from "react-hot-toast";

/**
 * Hook for requesting password reset
 */
export function usePasswordResetRequest() {
  return useMutation({
    mutationFn: async ({ email, userType = "user" }) => {
      // Check if user exists with given email and type
      let userExists = false;

      if (userType === "admin") {
        const { data: adminData } = await supabase
          .from("admins")
          .select("id")
          .eq("email", email)
          .single();
        userExists = !!adminData;
      } else if (userType === "seller") {
        const { data: sellerData } = await supabase
          .from("sellers")
          .select("id")
          .eq("email", email)
          .single();
        userExists = !!sellerData;
      } else {
        // Regular user
        const { data: userData } = await supabase.auth.admin.getUserByEmail(
          email
        );
        userExists = !!userData.user;
      }

      if (!userExists) {
        throw new Error(
          `Bu e-posta adresi ile kayıtlı ${
            userType === "admin"
              ? "admin"
              : userType === "seller"
              ? "satıcı"
              : "kullanıcı"
          } bulunamadı`
        );
      }

      // Create password reset request
      const resetToken = generateSecureToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const { data, error } = await supabase
        .from("password_reset_requests")
        .insert({
          email,
          user_type: userType,
          reset_token: resetToken,
          expires_at: expiresAt.toISOString(),
          is_used: false,
        })
        .select()
        .single();

      if (error) {
        console.error("Password reset request error:", error);
        throw new Error("Şifre sıfırlama talebi oluşturulamadı");
      }

      // Send email (in real app, this would be handled by backend)
      await sendPasswordResetEmail(email, resetToken, userType);

      return data;
    },
    onSuccess: () => {
      toast.success("Şifre sıfırlama linki e-posta adresinize gönderildi!", {
        duration: 5000,
      });
    },
    onError: (error) => {
      toast.error(error.message || "Şifre sıfırlama talebi gönderilemedi");
    },
  });
}

/**
 * Hook for verifying reset token
 */
export function usePasswordResetVerify() {
  return useMutation({
    mutationFn: async ({ token, email }) => {
      const { data, error } = await supabase
        .from("password_reset_requests")
        .select("*")
        .eq("reset_token", token)
        .eq("email", email)
        .eq("is_used", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        throw new Error("Geçersiz veya süresi dolmuş şifre sıfırlama linki");
      }

      return data;
    },
    onError: (error) => {
      toast.error(error.message || "Şifre sıfırlama linki geçersiz");
    },
  });
}

/**
 * Hook for completing password reset
 */
export function usePasswordResetComplete() {
  return useMutation({
    mutationFn: async ({ token, email, newPassword, confirmPassword }) => {
      if (newPassword !== confirmPassword) {
        throw new Error("Şifreler eşleşmiyor");
      }

      if (newPassword.length < 8) {
        throw new Error("Şifre en az 8 karakter olmalıdır");
      }

      // Verify token first
      const { data: resetRequest, error: verifyError } = await supabase
        .from("password_reset_requests")
        .select("*")
        .eq("reset_token", token)
        .eq("email", email)
        .eq("is_used", false)
        .gte("expires_at", new Date().toISOString())
        .single();

      if (verifyError || !resetRequest) {
        throw new Error("Geçersiz veya süresi dolmuş şifre sıfırlama linki");
      }

      // Update password based on user type
      if (resetRequest.user_type === "admin") {
        // Update admin password
        const { error: updateError } = await supabase
          .from("admins")
          .update({ password_hash: await hashPassword(newPassword) })
          .eq("email", email);

        if (updateError) {
          throw new Error("Admin şifresi güncellenemedi");
        }
      } else if (resetRequest.user_type === "seller") {
        // Update seller password
        const { error: updateError } = await supabase
          .from("sellers")
          .update({ password_hash: await hashPassword(newPassword) })
          .eq("email", email);

        if (updateError) {
          throw new Error("Satıcı şifresi güncellenemedi");
        }
      } else {
        // Update regular user password via Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({
          email: email,
          password: newPassword,
        });

        if (authError) {
          throw new Error("Kullanıcı şifresi güncellenemedi");
        }
      }

      // Mark reset request as used
      const { error: markError } = await supabase
        .from("password_reset_requests")
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
        })
        .eq("id", resetRequest.id);

      if (markError) {
        console.error("Reset request mark error:", markError);
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success(
        "Şifreniz başarıyla güncellendi! Şimdi yeni şifrenizle giriş yapabilirsiniz."
      );
    },
    onError: (error) => {
      toast.error(error.message || "Şifre güncellenemedi");
    },
  });
}

/**
 * Hook for admin-initiated password reset
 */
export function useAdminPasswordReset() {
  return useMutation({
    mutationFn: async ({ userId, userType, newPassword }) => {
      if (newPassword.length < 8) {
        throw new Error("Şifre en az 8 karakter olmalıdır");
      }

      if (userType === "user") {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          password: newPassword,
        });

        if (error) {
          throw new Error("Kullanıcı şifresi güncellenemedi");
        }
      } else if (userType === "seller") {
        const { error } = await supabase
          .from("sellers")
          .update({ password_hash: await hashPassword(newPassword) })
          .eq("id", userId);

        if (error) {
          throw new Error("Satıcı şifresi güncellenemedi");
        }
      }

      return { success: true };
    },
    onSuccess: () => {
      toast.success("Kullanıcı şifresi başarıyla güncellendi!");
    },
    onError: (error) => {
      toast.error(error.message || "Şifre güncellenemedi");
    },
  });
}

/**
 * Hook for checking password strength
 */
export function usePasswordStrength() {
  const checkStrength = (password) => {
    let strength = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password),
    };

    strength = Object.values(checks).filter(Boolean).length;

    let message = "";
    let color = "";

    if (strength < 2) {
      message = "Çok zayıf";
      color = "red";
    } else if (strength < 3) {
      message = "Zayıf";
      color = "orange";
    } else if (strength < 4) {
      message = "Orta";
      color = "yellow";
    } else if (strength < 5) {
      message = "Güçlü";
      color = "green";
    } else {
      message = "Çok güçlü";
      color = "green";
    }

    return {
      strength,
      message,
      color,
      checks,
      percentage: (strength / 5) * 100,
    };
  };

  return { checkStrength };
}

// Utility functions
function generateSecureToken() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashPassword(password) {
  // In a real application, use a proper hashing library like bcrypt
  // This is a simplified example
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sendPasswordResetEmail(email, token, userType) {
  // In a real application, this would be handled by your backend
  // For now, just log the email content
  const resetUrl = `${
    window.location.origin
  }/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  console.log(`
    Password Reset Email for ${userType}:
    To: ${email}
    Subject: Şifre Sıfırlama Talebi
    
    Merhaba,
    
    ${
      userType === "admin"
        ? "Admin"
        : userType === "seller"
        ? "Satıcı"
        : "Kullanıcı"
    } hesabınız için şifre sıfırlama talebinde bulundunuz.
    
    Şifrenizi sıfırlamak için aşağıdaki linke tıklayın:
    ${resetUrl}
    
    Bu link 24 saat geçerlidir.
    
    Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
    
    Saygılarımızla,
    ANDA Ekibi
  `);

  // In real app, integrate with email service like SendGrid, AWS SES, etc.
  return Promise.resolve();
}
