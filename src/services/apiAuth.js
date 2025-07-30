import supabase from "./supabase";
// import { logEvent } from "../utils/logger"; // Şu an kullanılmıyor, ihtiyaç olursa aç

/**
 * Enhanced user registration with role-based metadata
 */
export async function userSignup({ fullName, email, password, phone = null }) {
  // E-posta formatını kontrol et
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    throw new Error("Geçerli bir e-posta adresi girin");
  }

  // Şifre kontrolü
  if (!password || password.length < 6) {
    throw new Error("Şifre en az 6 karakter olmalı");
  }

  // Ad soyad kontrolü
  if (!fullName || fullName.trim().length < 2) {
    throw new Error("Ad soyad en az 2 karakter olmalı");
  }

  // Telefon kontrolü (eğer verilmişse)
  if (phone && !/^(\+90|0)?[5][0-9]{9}$/.test(phone.replace(/\s/g, ""))) {
    throw new Error("Geçerli bir Türkiye telefon numarası girin");
  }

  let authUser = null;

  try {
    // 1. Auth user oluştur (email confirmation KAPALI)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Email confirmation'ı devre dışı bırak
        data: {
          fullName,
          phone,
          role: "user",
          status: "active",
          createdAt: new Date().toISOString(),
        },
      },
    });

    if (error) {
      // Auth hatalarını düzgün handle et
      if (
        // bu kodda mantıksal hata var:
        error.message.includes("already registered") &&
        error.message.includes("already been registered")
      ) {
        throw new Error(
          "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin."
        );
      }
      throw new Error(`Hesap oluşturma hatası: ${error.message}`);
    }

    if (!data?.user) {
      throw new Error("Kullanıcı oluşturulamadı");
    }

    authUser = data.user;

    // profiles tablosuna manuel insert işlemini kaldırıyorum, trigger otomatik ekliyor

    // 3. HER ŞEY BAŞARILI - Şimdi email confirmation gönder
    try {
      // Manuel email confirmation gönder
      await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?verified=true`,
        },
      });

      console.log("Confirmation email sent successfully");
    } catch (emailError) {
      console.warn("Email sending failed but user created:", emailError);
      // Email gönderilemese bile user oluşturulmuş olsun
    }

    // 4. Başarı durumunda giriş yap
    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      console.warn("Auto-login failed:", loginError);
      // Login başarısız olsa bile user oluşturuldu
      throw new Error("Hesap oluşturuldu! Lütfen giriş yapmayı deneyin.");
    }

    return loginData;
  } catch (error) {
    // Eğer auth user oluşturulmuşsa ama başka bir hata varsa temizle
    if (authUser && error.message.includes("Profil oluşturulurken hata")) {
      try {
        await supabase.auth.admin.deleteUser(authUser.id);
        console.log("Cleaned up auth user after profile creation failure");
      } catch (cleanupError) {
        console.error("Failed to cleanup auth user:", cleanupError);
      }
    }

    throw error;
  }
}

/**
 * Enhanced seller registration with comprehensive business info
 */
export async function sellerSignup({
  fullName,
  companyName,
  taxId,
  phone,
  email,
  password,
}) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined,
      data: {
        fullName,
        companyName,
        taxId,
        phone,
        role: "seller",
        status: "pending_verification",
        createdAt: new Date().toISOString(),
      },
    },
  });

  if (error) throw new Error(error.message);
  if (!data.user) {
    throw new Error("Kullanıcı oluşturulamadı");
  }
  // Tüm ek kayıtlar Supabase trigger/fonksiyonları ile otomatik oluşturulacak.
}

/**
 * Enhanced login with role-based validation and security checks
 */
export async function login({ email, password }) {
  // 1. Authenticate user
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error(error.message);

  // 2. Get user profile and role information
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    console.error("Profile fetch error:", profileError);
  }

  const role = data.user.user_metadata?.role || profile?.role || "user";

  // 3. Role-specific validations
  if (role === "seller") {
    const { data: sellerData, error: sellerError } = await supabase
      .from("sellers")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (sellerError) {
      await supabase.auth.signOut();
      throw new Error(
        "Satıcı bilgileri alınamadı. Lütfen destek ile iletişime geçin."
      );
    }

    // Check seller status
    switch (sellerData.status) {
      case "pending_verification":
        await supabase.auth.signOut();
        throw new Error(
          "Hesabınız doğrulama bekliyor. Lütfen e-postanızı kontrol edin."
        );

      case "under_review":
        await supabase.auth.signOut();
        throw new Error(
          "Başvurunuz inceleme aşamasında. Onaylandığında size bildirilecek."
        );

      case "suspended":
        await supabase.auth.signOut();
        throw new Error(
          "Hesabınız askıya alınmış. Lütfen destek ekibi ile iletişime geçin."
        );

      case "rejected":
        await supabase.auth.signOut();
        throw new Error(
          "Başvurunuz reddedilmiş. Daha fazla bilgi için destek ekibi ile iletişime geçin."
        );

      case "approved":
        // All good, continue
        break;

      default:
        await supabase.auth.signOut();
        throw new Error("Geçersiz hesap durumu.");
    }

    // Update last login for seller
    await supabase
      .from("sellers")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.user.id);
  }

  // 4. Log successful login
  await logActivity(data.user.id, "login", {
    role,
    timestamp: new Date().toISOString(),
  });

  // 5. Update last login in profiles
  if (profile) {
    await supabase
      .from("profiles")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.user.id);
  }

  return {
    user: data.user,
    profile,
    role,
  };
}

/**
 * Enhanced user data retrieval with profile information
 */
export async function getCurrentUser() {
  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    console.log("DEBUG getCurrentUser - Supabase session:", session);

    if (sessionError) {
      console.error("Session error:", sessionError);
      return { user: null, profile: null };
    }

    if (!session?.user) {
      console.warn("DEBUG getCurrentUser - No session user");
      return { user: null, profile: null };
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    console.log("DEBUG getCurrentUser - Profile:", profile);
    if (profileError) {
      console.error("Profile fetch error:", profileError);
    }

    // For sellers, also get seller-specific data
    let sellerData = null;
    if (
      session.user.user_metadata?.role === "seller" ||
      profile?.role === "seller"
    ) {
      const { data: seller, error: sellerError } = await supabase
        .from("sellers")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (sellerError) {
        console.error("Seller data fetch error:", sellerError);
      } else {
        sellerData = seller;
      }
    }

    return {
      user: session.user,
      profile,
      sellerData,
    };
  } catch (error) {
    console.error("Get current user error:", error);
    return { user: null, profile: null };
  }
}

/**
 * Enhanced logout with cleanup and audit logging
 */
export async function logout() {
  try {
    // Get current user for logging before logout
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // Log logout activity
      await logActivity(user.id, "logout", {
        timestamp: new Date().toISOString(),
      });
    }

    const { error } = await supabase.auth.signOut();

    if (error) throw new Error(error.message);

    return true;
  } catch (error) {
    console.error("Logout error:", error);
    // Force logout even if logging fails
    return true;
  }
}

/**
 * Update user profile and authentication data
 */
export async function updateCurrentUser({ password, fullName, avatar }) {
  try {
    // 1. Update auth metadata if fullName provided
    let updateData = {};
    if (fullName !== undefined) {
      updateData.data = { fullName };
    }
    if (password) {
      updateData.password = password;
    }

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase.auth.updateUser(updateData);
      if (error) throw new Error(error.message);
    }

    // 2. Update profile table
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profileUpdates = {};
      if (fullName !== undefined) profileUpdates.full_name = fullName;
      if (avatar !== undefined) profileUpdates.avatar = avatar;

      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.updated_at = new Date().toISOString();

        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdates)
          .eq("id", user.id);

        if (profileError) {
          console.error("Profile update error:", profileError);
        }
      }

      // 3. Log activity
      await logActivity(user.id, "profile_update", {
        updatedFields: Object.keys(profileUpdates),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    throw new Error(error.message || "Profil güncellenirken hata oluştu");
  }
}

/**
 * Admin function to approve seller applications
 */
export async function approveSellerApplication(sellerId, adminId) {
  try {
    // 1. Update seller status
    const { error: sellerError } = await supabase
      .from("sellers")
      .update({
        status: "approved",
        verification_status: "verified",
        approved_at: new Date().toISOString(),
        approved_by: adminId,
      })
      .eq("id", sellerId);

    if (sellerError) throw new Error(sellerError.message);

    // 2. Update profile status
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", sellerId);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // 3. Update application status
    const { error: applicationError } = await supabase
      .from("seller_applications")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
      })
      .eq("seller_id", sellerId);

    if (applicationError) {
      console.error("Application update error:", applicationError);
    }

    // 4. Log activity
    await logActivity(adminId, "seller_approval", {
      sellerId,
      action: "approved",
    });

    await logActivity(sellerId, "account_approved", {
      approvedBy: adminId,
    });

    return { success: true };
  } catch (error) {
    console.error("Approve seller error:", error);
    throw new Error(error.message || "Satıcı onaylanırken hata oluştu");
  }
}

/**
 * Admin function to reject seller applications
 */
export async function rejectSellerApplication(sellerId, adminId, reason) {
  try {
    // 1. Update seller status
    const { error: sellerError } = await supabase
      .from("sellers")
      .update({
        status: "rejected",
        verification_status: "rejected",
        rejected_at: new Date().toISOString(),
        rejected_by: adminId,
        rejection_reason: reason,
      })
      .eq("id", sellerId);

    if (sellerError) throw new Error(sellerError.message);

    // 2. Update application status
    const { error: applicationError } = await supabase
      .from("seller_applications")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminId,
        rejection_reason: reason,
      })
      .eq("seller_id", sellerId);

    if (applicationError) {
      console.error("Application update error:", applicationError);
    }

    // 3. Log activity
    await logActivity(adminId, "seller_rejection", {
      sellerId,
      reason,
    });

    await logActivity(sellerId, "account_rejected", {
      rejectedBy: adminId,
      reason,
    });

    return { success: true };
  } catch (error) {
    console.error("Reject seller error:", error);
    throw new Error(error.message || "Satıcı reddedilirken hata oluştu");
  }
}

/**
 * Activity logging for audit trails
 */
export async function logActivity(userId, action, metadata = {}) {
  try {
    const { error } = await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        action,
        metadata,
        ip_address: await getUserIP(),
        user_agent: navigator.userAgent,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error && import.meta.env.DEV) {
      console.error("Activity logging error:", error);
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Log activity error:", error);
    }
  }
}

/**
 * Get user IP address for security logging
 */
async function getUserIP() {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error("Get IP error:", error);
    return "unknown";
  }
}

/**
 * Get pending seller applications for admin review
 */
export async function getPendingSellerApplications() {
  try {
    const { data, error } = await supabase
      .from("seller_applications")
      .select(
        `
        *,
        seller:sellers(*)
      `
      )
      .eq("status", "pending")
      .order("submitted_at", { ascending: false });

    if (error) throw new Error(error.message);

    return data;
  } catch (error) {
    console.error("Get pending applications error:", error);
    throw new Error("Bekleyen başvurular alınırken hata oluştu");
  }
}

/**
 * Password reset functionality
 */
export async function resetPassword(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw new Error(error.message);

    return { success: true };
  } catch (error) {
    console.error("Reset password error:", error);
    throw new Error(error.message || "Şifre sıfırlama e-postası gönderilemedi");
  }
}

/**
 * Update password with new password
 */
export async function updatePassword(newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw new Error(error.message);

    // Log activity
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await logActivity(user.id, "password_update", {
        timestamp: new Date().toISOString(),
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Update password error:", error);
    throw new Error(error.message || "Şifre güncellenirken hata oluştu");
  }
}

/**
 * Admin signup with proper database schema alignment
 */
export async function adminSignup({
  email,
  password,
  phone,
  adminLevel = "admin",
  createdBy,
}) {
  let createdUser = null;
  try {
    // 1. Create auth user with admin role
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // Disable email confirmation for admin
        data: {
          fullName: email.split("@")[0], // Default fullName from email
          phone,
          role: "admin",
          status: "active",
          createdAt: new Date().toISOString(),
        },
      },
    });

    if (error) {
      await logDebug(`adminSignup error: ${error.message}`);
      throw new Error(error.message);
    }
    if (!data.user) {
      await logDebug(`adminSignup error: Admin kullanıcısı oluşturulamadı`);
      throw new Error("Admin kullanıcısı oluşturulamadı");
    }
    createdUser = data.user;

    // profiles tablosuna manuel insert işlemini kaldırıyorum, trigger otomatik ekliyor
    // admins tablosuna da manuel insert kaldırıldı, trigger otomatik ekleyecek

    // 5. Log admin creation activity (optional - don't fail if this fails)
    if (createdBy) {
      try {
        await logActivity(createdBy, "admin_created", {
          newAdminId: data.user.id,
          newAdminEmail: email,
          adminLevel,
        });
      } catch (logError) {
        await logDebug(`adminSignup logActivity error: ${logError.message}`);
      }
    }

    if (import.meta.env.DEV) {
      console.log(`Admin created successfully: ${email}`);
    }

    return {
      user: data.user,
      message: "Admin hesabı başarıyla oluşturuldu.",
    };
  } catch (dbError) {
    await logDebug(`adminSignup catch error: ${dbError.message}`);
    console.error(
      "Database operations failed for admin:",
      createdUser?.id,
      dbError
    );
    throw new Error(`Database işlemi başarısız: ${dbError.message}`);
  }
}

/**
 * Admin login with enhanced tracking
 */
export async function adminLogin({ email, password }) {
  try {
    // 1. First authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      await logDebug(`adminLogin error: ${error.message}`);
      throw new Error(error.message);
    }

    if (!data.user) {
      await logDebug(`adminLogin error: Giriş bilgileri geçersiz`);
      throw new Error("Giriş bilgileri geçersiz");
    }

    // 2. Check if user is actually an admin
    const { data: adminData, error: adminError } = await supabase
      .from("profiles")
      .select("id, role, full_name, email, is_active, department")
      .eq("id", data.user.id)
      .eq("role", "admin")
      .eq("is_active", true)
      .single();

    if (adminError || !adminData) {
      await supabase.auth.signOut();
      await logDebug(`adminLogin error: Bu hesap admin yetkisine sahip değil`);
      throw new Error("Bu hesap admin yetkisine sahip değil");
    }

    // 3. Update admin last activity (optional - don't fail if this fails)
    try {
      await supabase
        .from("profiles")
        .update({
          last_login: new Date().toISOString(),
        })
        .eq("id", data.user.id);
    } catch (updateError) {
      await logDebug(
        `adminLogin last_login update error: ${updateError.message}`
      );
    }

    // 4. Log admin login activity (optional - don't fail if this fails)
    try {
      await logActivity(data.user.id, "admin_login", {
        loginTime: new Date().toISOString(),
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        adminLevel: adminData.role, // role bilgisini adminLevel olarak kullan
        department: adminData.department,
      });
    } catch (logError) {
      await logDebug(`adminLogin logActivity error: ${logError.message}`);
    }

    if (import.meta.env.DEV) {
      console.log(`Admin login successful: ${email} (${adminData.role})`);
    }

    return {
      ...data,
      admin: adminData,
    };
  } catch (error) {
    await logDebug(`adminLogin catch error: ${error.message}`);
    console.error("Admin login error:", error);
    throw new Error(error.message || "Admin girişi sırasında bir hata oluştu");
  }
}

/**
 * Get all admins (for super admin)
 */
export async function getAllAdmins() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "admin")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Get admin profile by ID
 */
export async function getAdminProfile(adminId) {
  const { data, error } = await supabase
    .from("admins")
    .select(
      `
      *,
      profile:profiles(
        full_name,
        email,
        avatar,
        last_login
      ),
      created_by_profile:profiles!created_by(
        full_name,
        email
      )
    `
    )
    .eq("id", adminId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Update admin profile
 */
export async function updateAdminProfile(adminId, updates) {
  const { data, error } = await supabase
    .from("admins")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log admin profile update
  await logActivity(adminId, "admin_profile_updated", {
    updatedFields: Object.keys(updates),
  });

  return data;
}

/**
 * Deactivate admin account
 */
export async function deactivateAdmin(adminId, deactivatedBy, reason) {
  const { data, error } = await supabase
    .from("admins")
    .update({
      is_active: false,
      notes: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Also update profile status
  await supabase
    .from("profiles")
    .update({ status: "inactive" })
    .eq("id", adminId);

  // Log admin deactivation
  await logActivity(deactivatedBy, "admin_deactivated", {
    deactivatedAdminId: adminId,
    reason,
  });

  return data;
}

/**
 * Reactivate admin account
 */
export async function reactivateAdmin(adminId, reactivatedBy) {
  const { data, error } = await supabase
    .from("admins")
    .update({
      is_active: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Also update profile status
  await supabase
    .from("profiles")
    .update({ status: "active" })
    .eq("id", adminId);

  // Log admin reactivation
  await logActivity(reactivatedBy, "admin_reactivated", {
    reactivatedAdminId: adminId,
  });

  return data;
}

/**
 * Check if user has admin permissions
 */
export async function checkAdminPermissions(userId, requiredPermission) {
  const { data, error } = await supabase
    .from("admins")
    .select("permissions, admin_level, is_active")
    .eq("id", userId)
    .eq("is_active", true)
    .single();

  if (error || !data) return false;

  // Super admins have all permissions
  if (data.admin_level === "super_admin") return true;

  // Check specific permission
  return data.permissions[requiredPermission] === true;
}

/**
 * Update admin permissions
 */
export async function updateAdminPermissions(adminId, permissions, updatedBy) {
  const { data, error } = await supabase
    .from("admins")
    .update({
      permissions,
      updated_at: new Date().toISOString(),
    })
    .eq("id", adminId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Log permission update
  await logActivity(updatedBy, "admin_permissions_updated", {
    targetAdminId: adminId,
    newPermissions: permissions,
  });

  return data;
}

// Debug log tablosuna hata yazan fonksiyon
async function logDebug(message) {
  try {
    await supabase
      .from("debug_logs")
      .insert([{ message, log_time: new Date().toISOString() }]);
  } catch (e) {
    // Sessizce yut
  }
}

// JWT token'ı al ve sakla
export async function getJwtToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const token = data?.session?.access_token;
  if (token) {
    localStorage.setItem("jwt_token", token);
  }
  return token;
}

// Kayıt fonksiyonunda JWT token'ı döndür
export async function signup(email, password, extraData) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: extraData },
  });
  if (error) throw error;
  // Kayıt sonrası Supabase otomatik olarak oturum açmaz, email doğrulama gerekir
  return data;
}
