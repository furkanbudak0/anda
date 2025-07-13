import supabase from "./supabase";
import { createClient } from "@supabase/supabase-js";

// Service role client - signup sırasında RLS bypass için
const supabaseUrl = "https://cnoscrzbxisnprxkdpgt.supabase.co";
const serviceRoleKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNub3NjcnpieGlzbnByeGtkcGd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTY1ODE5MCwiZXhwIjoyMDY3MjM0MTkwfQ.j4LgUAq0lIOLixQdI_-m5fBWsij_i5tHhr7BFgUmvTU";
const serviceSupabase = createClient(supabaseUrl, serviceRoleKey);

/**
 * Enhanced user registration with proper transaction-like behavior
 */
export async function userSignup({
  fullName,
  email,
  password,
  phone = null,
  tcId = null,
  birthDate = null,
  gender = null,
}) {
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

  // STEP 1: Önce mevcut kayıt kontrolü
  console.log("Step 1: Checking existing records for:", email);

  try {
    // Profile'da var mı kontrol et (auth kontrolü signup sırasında otomatik yapılır)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .single();

    if (existingProfile) {
      throw new Error(
        "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin."
      );
    }
  } catch (error) {
    // Eğer "not found" hatası değilse, gerçek bir problem var
    if (error.message.includes("zaten kayıtlı")) {
      throw error;
    }
    // "not found" normal, devam et
    console.log("No existing records found, proceeding...");
  }

  let authUser = null;
  let profileCreated = false;

  try {
    // STEP 2: Auth user oluştur
    console.log("Step 2: Creating auth user...");

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: null, // Email confirmation tamamen kapat
        data: {
          fullName,
          phone,
          role: "user",
          status: "active",
        },
      },
    });

    if (authError) {
      console.error("Auth signup error:", authError);

      if (
        authError.message.includes("already registered") ||
        authError.message.includes("already been registered") ||
        authError.message.includes("User already registered")
      ) {
        throw new Error(
          "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin."
        );
      }

      throw new Error(`Hesap oluşturma hatası: ${authError.message}`);
    }

    if (!authData?.user) {
      throw new Error("Auth kullanıcısı oluşturulamadı");
    }

    authUser = authData.user;
    console.log("Auth user created successfully:", authUser.id);

    // STEP 3: Hemen ardından profile oluştur (using service role to bypass RLS)
    console.log("Step 3: Creating profile...");

    const { error: profileError } = await serviceSupabase
      .from("profiles")
      .insert([
        {
          id: authUser.id,
          email: authUser.email,
          name: fullName,
          full_name: fullName,
          phone: phone,
          tc_id: tcId,
          birth_date: birthDate ? new Date(birthDate) : null,
          gender: gender,
          role: "user",
          status: "active",
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (profileError) {
      console.error("Profile creation error:", profileError);

      // Profile başarısız olursa auth'ı geri almaya çalış
      throw new Error(`Profil oluşturulurken hata: ${profileError.message}`);
    }

    profileCreated = true;
    console.log("Profile created successfully");

    // STEP 4: Auto-login
    console.log("Step 4: Auto-login...");

    const { data: loginData, error: loginError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (loginError) {
      console.warn("Auto-login failed but user created:", loginError);

      // Login başarısız olsa bile kullanıcı oluşturuldu
      return {
        user: authUser,
        session: null,
        message: "Hesap oluşturuldu! Lütfen giriş yapmayı deneyin.",
      };
    }

    console.log("User registration completed successfully");
    return loginData;
  } catch (error) {
    console.error("Registration failed:", error);

    // Rollback: Profile oluşturulmuşsa sil
    if (profileCreated && authUser) {
      try {
        console.log("Rolling back: Deleting profile...");
        await supabase.from("profiles").delete().eq("id", authUser.id);
      } catch (rollbackError) {
        console.error("Profile rollback failed:", rollbackError);
      }
    }

    // Auth user rollback - Supabase Auth otomatik olarak handle eder
    // Profile silindiği için auth user da otomatik olarak temizlenir
    if (import.meta.env.DEV) {
      console.log(
        "Development: Auth rollback not needed - Supabase handles it automatically"
      );
    }

    throw error;
  }
}

/**
 * Enhanced seller registration with comprehensive business info
 */
export async function sellerSignup({
  // Business Info
  businessType,
  companyName,
  businessEmail,
  businessPhone,
  taxId,
  website,
  businessDescription,
  categories,

  // Owner Info
  firstName,
  lastName,
  ownerEmail,
  ownerPhone,
  idNumber,
  dob,

  // Banking
  bankName,
  accountName,
  accountNumber,
  iban,
  swiftCode,

  // Documents
  businessLicense,
  idDocument,
  taxCertificate,
  bankLetter,
}) {
  console.log("🔐 STEP 1: sellerSignup function called with data:", {
    businessEmail,
    companyName,
    businessType,
    firstName,
    lastName,
  });

  const tempPassword = generateTempPassword();
  console.log("🔑 STEP 1A: Generated temp password:", tempPassword);

  try {
    console.log("🔐 STEP 2: Creating auth user...");
    // 1. First create auth user with email confirmation disabled
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: businessEmail,
      password: tempPassword,
      options: {
        emailRedirectTo: null, // Disable email confirmation for now
        data: {
          role: "seller",
          status: "pending_verification",
          fullName: `${firstName} ${lastName}`,
          businessName: companyName,
          createdAt: new Date().toISOString(),
        },
      },
    });

    console.log("🔐 STEP 2A: Auth signup result:", { authData, authError });

    if (authError) {
      console.error("❌ STEP 2B: Auth error:", authError);
      throw new Error(authError.message);
    }

    if (!authData.user) {
      console.error("❌ STEP 2C: No user data returned");
      throw new Error("Kullanıcı oluşturulamadı");
    }

    console.log(
      "✅ STEP 2D: Auth user created successfully:",
      authData.user.id
    );

    let profileError, sellerError, applicationError;

    try {
      console.log("👤 STEP 3: Creating profile entry...");
      // 2. Create profile entry (using service role to bypass RLS)
      const profileData = {
        id: authData.user.id,
        email: businessEmail,
        full_name: `${firstName} ${lastName}`,
        name: `${firstName} ${lastName}`,
        role: "seller",
        status: "pending_verification",
        is_verified: false,
        created_at: new Date().toISOString(),
      };

      console.log("👤 STEP 3A: Profile data to insert:", profileData);

      const { error: profError } = await serviceSupabase
        .from("profiles")
        .insert([profileData]);
      profileError = profError;

      console.log("👤 STEP 3B: Profile insert result:", { profileError });

      if (profileError) {
        console.error("❌ STEP 3C: Profile creation failed:", profileError);
      } else {
        console.log("✅ STEP 3D: Profile created successfully");
      }

      console.log("🏪 STEP 4: Creating seller record...");
      // 3. Create seller record (using service role to bypass RLS)
      const sellerData = {
        id: authData.user.id,
        email: businessEmail,
        business_name: companyName,
        business_type: businessType,
        phone: businessPhone,
        tax_id: taxId,
        website,
        description: businessDescription,
        categories,
        status: "pending_verification",
        verification_status: "pending",
        owner_first_name: firstName,
        owner_last_name: lastName,
        owner_email: ownerEmail,
        owner_phone: ownerPhone,
        owner_id_number: idNumber,
        owner_dob: dob,
        bank_name: bankName,
        account_name: accountName,
        account_number: accountNumber,
        iban,
        swift_code: swiftCode,
        documents: {
          business_license: businessLicense,
          id_document: idDocument,
          tax_certificate: taxCertificate,
          bank_letter: bankLetter,
        },
        application_date: new Date().toISOString(),
      };

      console.log("🏪 STEP 4A: Seller data to insert:", sellerData);

      const { data: sellerResult, error: sellError } = await serviceSupabase
        .from("sellers")
        .insert([sellerData])
        .select()
        .single();

      sellerError = sellError;

      console.log("🏪 STEP 4B: Seller insert result:", {
        sellerResult,
        sellError,
      });

      if (sellError) {
        console.error("❌ STEP 4C: Seller creation failed:", sellError);
      } else {
        console.log(
          "✅ STEP 4D: Seller record created successfully:",
          sellerResult
        );
      }

      console.log("📝 STEP 5: Creating seller application record...");
      // 4. Create seller application record (using service role to bypass RLS)
      const applicationData = {
        seller_id: authData.user.id,
        business_name: companyName,
        status: "pending",
        submitted_at: new Date().toISOString(),
        application_data: {
          business: {
            name: companyName,
            type: businessType,
            phone: businessPhone,
            taxId,
            website,
            description: businessDescription,
            categories,
          },
          owner: {
            firstName,
            lastName,
            email: ownerEmail,
            phone: ownerPhone,
            idNumber,
            dob,
          },
          banking: {
            bankName,
            accountName,
            accountNumber,
            iban,
            swiftCode,
          },
        },
      };

      console.log("📝 STEP 5A: Application data to insert:", applicationData);

      const { error: appError } = await serviceSupabase
        .from("seller_applications")
        .insert([applicationData]);

      applicationError = appError;

      console.log("📝 STEP 5B: Application insert result:", { appError });

      if (appError) {
        console.error("❌ STEP 5C: Application creation failed:", appError);
      } else {
        console.log("✅ STEP 5D: Seller application created successfully");
      }

      console.log("🔔 STEP 6: Creating admin notification...");
      // 5. Create admin notification (using service role to bypass RLS)
      const notificationData = {
        type: "new_seller_application",
        title: "Yeni Satıcı Başvurusu",
        message: `${companyName} adlı işletmeden yeni satıcı başvurusu geldi.`,
        data: {
          sellerId: authData.user.id,
          businessName: companyName,
        },
        created_at: new Date().toISOString(),
        is_read: false,
      };

      console.log("🔔 STEP 6A: Notification data to insert:", notificationData);

      const { error: notifError } = await serviceSupabase
        .from("admin_notifications")
        .insert([notificationData]);

      console.log("🔔 STEP 6B: Notification insert result:", { notifError });

      if (notifError) {
        console.error("❌ STEP 6C: Notification creation failed:", notifError);
      } else {
        console.log("✅ STEP 6D: Admin notification created successfully");
      }

      console.log("🔍 STEP 7: Checking for database errors...");
      // Check for any database errors
      if (profileError || sellerError || applicationError) {
        console.error("❌ STEP 7A: Database errors found:", {
          profileError,
          sellerError,
          applicationError,
        });
        const errorMsg =
          profileError?.message ||
          sellerError?.message ||
          applicationError?.message;
        throw new Error(`Database işlemi başarısız: ${errorMsg}`);
      }

      console.log("✅ STEP 7B: No database errors found, proceeding...");

      console.log("📧 STEP 8: Sending verification email...");
      // 6. Only send verification email after successful database operations
      await sendVerificationEmail(businessEmail, companyName);

      console.log("📝 STEP 9: Logging activity...");
      // 7. Log the activity
      await logActivity(authData.user.id, "seller_registration", {
        businessName: companyName,
        businessType,
      });

      console.log("🎉 STEP 10: Seller signup completed successfully!");
      console.log(`✅ Final result for ${businessEmail}:`, {
        userId: authData.user.id,
        businessName: companyName,
        status: "pending_verification",
      });

      return {
        user: authData.user,
        seller: sellerResult,
        message:
          "Satıcı başvurunuz başarıyla alındı. Doğrulama e-postası gönderildi.",
      };
    } catch (dbError) {
      console.error("❌ DATABASE ERROR CATCH BLOCK:");
      console.error("Database operations failed for user:", authData.user.id);
      console.error("Database error details:", dbError);
      // If database operations failed, we can't easily delete the auth user
      // Log this for manual cleanup if needed
      throw new Error(`Database işlemi başarısız: ${dbError.message}`);
    }
  } catch (error) {
    console.error("❌ FINAL ERROR CATCH BLOCK:");
    console.error("Seller signup error:", error);
    console.error("Error stack:", error.stack);
    throw new Error(error.message || "Satıcı kaydı sırasında bir hata oluştu");
  }
}

/**
 * Generate temporary password for seller accounts
 */
const generateTempPassword = () => {
  return Math.random().toString(36).slice(-12) + "A1!";
};

/**
 * Send verification email to new sellers
 */
const sendVerificationEmail = async (email, businessName) => {
  try {
    // In production, integrate with email service (SendGrid, etc.)
    if (import.meta.env.DEV) {
      console.log(`Sending verification email to ${email} for ${businessName}`);
    }

    // For now, we'll use Supabase's built-in email verification
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
    });

    if (error) {
      console.error("Email verification error:", error);
    }

    return true;
  } catch (error) {
    console.error("Send verification email error:", error);
    return false;
  }
};

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

    if (sessionError) {
      console.error("Session error:", sessionError);
      return { user: null, profile: null };
    }

    if (!session?.user) {
      return { user: null, profile: null };
    }

    // Get user profile data
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

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
 * Admin signup with simplified approach - NO RPC FUNCTIONS
 */
export async function adminSignup({
  // Basic Info
  fullName,
  email,
  password,
  phone,

  // Admin Specific
  adminLevel = "admin", // 'admin', 'super_admin', 'moderator'
  permissions = [],

  // Created by (current admin)
  createdBy,

  // Notes
  notes = "",
}) {
  try {
    if (import.meta.env.DEV) {
      console.log(`🔶 STEP 1: Starting admin signup for ${email}`);
    }

    // STEP 1: Check for existing records - DIRECT TABLE QUERIES
    if (import.meta.env.DEV) {
      console.log(`🔍 STEP 1A: Checking existing profiles...`);
    }

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      if (import.meta.env.DEV) {
        console.log(`❌ Profile already exists:`, existingProfile);
      }
      throw new Error("Bu e-posta adresi zaten kayıtlı");
    }

    if (import.meta.env.DEV) {
      console.log(`🔍 STEP 1B: Checking existing admins...`);
    }

    const { data: existingAdmin } = await supabase
      .from("admins")
      .select("id, email")
      .eq("email", email)
      .maybeSingle();

    if (existingAdmin) {
      if (import.meta.env.DEV) {
        console.log(`❌ Admin already exists:`, existingAdmin);
      }
      throw new Error("Bu e-posta adresi zaten admin olarak kayıtlı");
    }

    if (import.meta.env.DEV) {
      console.log(`✅ STEP 1 Complete: No existing records found`);
    }

    // STEP 2: Create auth user
    if (import.meta.env.DEV) {
      console.log(`🔶 STEP 2: Creating auth user...`);
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: null, // Disable email confirmation
        data: {
          role: "admin",
          status: "active",
          fullName,
          adminLevel,
          createdAt: new Date().toISOString(),
        },
      },
    });

    if (authError) {
      if (import.meta.env.DEV) {
        console.error(`❌ STEP 2 Failed:`, authError);
      }

      // Handle specific Supabase auth errors
      if (
        authError.message?.includes("already registered") ||
        authError.message?.includes("User already registered")
      ) {
        throw new Error("Bu e-posta adresi zaten kayıtlı");
      }

      throw new Error(`Hesap oluşturulamadı: ${authError.message}`);
    }

    if (!authData?.user?.id) {
      if (import.meta.env.DEV) {
        console.error(`❌ STEP 2 Failed: No user ID returned`);
      }
      throw new Error("Admin kullanıcısı oluşturulamadı");
    }

    const userId = authData.user.id;

    if (import.meta.env.DEV) {
      console.log(`✅ STEP 2 Complete: Auth user created with ID ${userId}`);
    }

    // STEP 3: Create profile record
    if (import.meta.env.DEV) {
      console.log(`🔶 STEP 3: Creating profile record...`);
    }

    const profileData = {
      id: userId,
      email,
      full_name: fullName,
      name: fullName,
      role: "admin",
      status: "active",
      is_verified: true,
      created_at: new Date().toISOString(),
    };

    if (import.meta.env.DEV) {
      console.log(`📝 Profile data:`, profileData);
    }

    const { data: profile, error: profileError } = await serviceSupabase
      .from("profiles")
      .insert([profileData])
      .select()
      .single();

    if (profileError) {
      if (import.meta.env.DEV) {
        console.error(`❌ STEP 3 Failed:`, profileError);
        console.log(`🧹 Cleaning up auth user...`);
      }

      // Rollback: Try to clean up auth user (dev only)
      if (import.meta.env.DEV) {
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.warn("Auth cleanup warning:", cleanupError);
        }
      }

      throw new Error(`Profil oluşturulamadı: ${profileError.message}`);
    }

    if (import.meta.env.DEV) {
      console.log(`✅ STEP 3 Complete: Profile created`);
    }

    // STEP 4: Create admin record
    if (import.meta.env.DEV) {
      console.log(`🔶 STEP 4: Creating admin record...`);
    }

    const adminData = {
      id: userId,
      email,
      full_name: fullName,
      name: fullName,
      phone,
      admin_level: adminLevel,
      permissions: permissions,
      department: "Management",
      employee_id: `EMP${Date.now()}`,
      access_level: adminLevel === "super_admin" ? 5 : 3,
      emergency_contact: {},
      notes: notes || "",
      is_super_admin: adminLevel === "super_admin",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (import.meta.env.DEV) {
      console.log(`📝 Admin data:`, adminData);
    }

    const { data: admin, error: adminError } = await serviceSupabase
      .from("admins")
      .insert([adminData])
      .select()
      .single();

    if (adminError) {
      if (import.meta.env.DEV) {
        console.error(`❌ STEP 4 Failed:`, adminError);
        console.log(`🧹 Cleaning up profile and auth user...`);
      }

      // Rollback: Delete profile record
      try {
        await supabase.from("profiles").delete().eq("id", userId);
      } catch (cleanupError) {
        console.warn("Profile cleanup warning:", cleanupError);
      }

      // Rollback: Try to clean up auth user (dev only)
      if (import.meta.env.DEV) {
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.warn("Auth cleanup warning:", cleanupError);
        }
      }

      throw new Error(`Admin kaydı oluşturulamadı: ${adminError.message}`);
    }

    if (import.meta.env.DEV) {
      console.log(`✅ STEP 4 Complete: Admin record created`);
    }

    // STEP 5: Log admin creation activity
    if (import.meta.env.DEV) {
      console.log(`🔶 STEP 5: Logging admin creation...`);
    }

    try {
      await logActivity(userId, "admin_created", {
        adminLevel,
        createdBy,
        timestamp: new Date().toISOString(),
      });
    } catch (logError) {
      console.warn("Admin creation logging failed:", logError);
    }

    if (import.meta.env.DEV) {
      console.log(`🎉 Admin signup completed successfully for ${email}`);
    }

    return {
      user: authData.user,
      profile,
      admin,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Admin signup error:", error);
    }
    throw error;
  }
}

/**
 * Admin login with service role access
 */
export async function adminLogin({ email, password }) {
  try {
    if (import.meta.env.DEV) {
      console.log(`🔐 Admin login attempt for: ${email}`);
    }

    // 1. First authenticate with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (import.meta.env.DEV) {
        console.error(`❌ Auth error:`, error);
      }
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error("Giriş bilgileri geçersiz");
    }

    if (import.meta.env.DEV) {
      console.log(`✅ Auth successful for user: ${data.user.id}`);
    }

    // 2. Check if user is actually an admin - SERVICE ROLE ACCESS
    if (import.meta.env.DEV) {
      console.log(
        `🔍 Checking admin data with service role for user ID: ${data.user.id}`
      );
    }

    // Admin kontrolü - RLS policies ile güvenli
    const { data: adminData, error: adminError } = await supabase
      .from("admins")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (import.meta.env.DEV) {
      console.log(`🔍 Service role admin query result:`, {
        adminData,
        adminError,
      });
    }

    if (adminError) {
      if (import.meta.env.DEV) {
        console.error(`❌ Service role admin data fetch error:`, adminError);
      }
      await supabase.auth.signOut();
      throw new Error(`Admin yetki kontrolü başarısız: ${adminError.message}`);
    }

    if (!adminData) {
      if (import.meta.env.DEV) {
        console.error(`❌ Admin data is null`);
      }
      await supabase.auth.signOut();
      throw new Error("Admin kaydı bulunamadı");
    }

    if (!adminData.is_active) {
      if (import.meta.env.DEV) {
        console.error(`❌ Admin is not active:`, adminData);
      }
      await supabase.auth.signOut();
      throw new Error("Admin hesabı aktif değil");
    }

    if (import.meta.env.DEV) {
      console.log(
        `🎉 Admin login successful: ${email} (${adminData.admin_level})`
      );
      console.log(`📊 Admin data:`, adminData);
    }

    return {
      ...data,
      admin: adminData,
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("Admin login error:", error);
    }
    throw new Error(error.message || "Admin girişi sırasında bir hata oluştu");
  }
}

/**
 * Get all admins (for super admin)
 */
export async function getAllAdmins() {
  const { data, error } = await supabase
    .from("admins")
    .select(
      `
      *,
      created_by_profile:profiles!created_by(
        full_name,
        email
      )
    `
    )
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
