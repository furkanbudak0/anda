/**
 * Auth User Cleanup Utility
 * Supabase Auth'da kalan "ghost" kullanıcıları temizlemek için yardımcı fonksiyonlar
 */

/**
 * Problematik kullanıcıları kontrol etmek için SQL sorguları
 */
export const authCleanupQueries = {
  // Auth'da olan ama profiles'da olmayan kullanıcıları listele
  checkOrphanUsers: `
    SELECT 
      au.id,
      au.email,
      au.created_at,
      'AUTH: VAR, PROFILES: YOK' as durum
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
    ORDER BY au.created_at DESC;
  `,

  // Specific email kontrol
  checkSpecificEmail: (email) => `
    SELECT 
      au.id,
      au.email,
      au.created_at,
      au.email_confirmed_at,
      CASE 
        WHEN p.id IS NOT NULL THEN 'PROFILES: VAR'
        ELSE 'PROFILES: YOK'
      END as profile_durumu
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE au.email = '${email}';
  `,

  // Email silme sorgusu
  deleteByEmail: (email) => `
    DELETE FROM auth.users 
    WHERE email = '${email}'
    AND id NOT IN (
      SELECT id FROM public.profiles 
      WHERE id IS NOT NULL
    );
  `,

  // Toplu temizlik (dikkatli kullan!)
  cleanupOrphans: `
    DELETE FROM auth.users au
    WHERE au.id NOT IN (
      SELECT p.id FROM public.profiles p WHERE p.id IS NOT NULL
      UNION
      SELECT a.id FROM public.admins a WHERE a.id IS NOT NULL
      UNION
      SELECT s.user_id FROM public.sellers s WHERE s.user_id IS NOT NULL
    );
  `,
};

/**
 * Dashboard cleanup instructions
 */
export const dashboardCleanupSteps = [
  "1. Supabase Dashboard'a git",
  "2. Authentication > Users sekmesine tıkla",
  "3. Problematik e-postayı ara (search box kullan)",
  "4. Kullanıcının sağındaki '...' menüsüne tıkla",
  "5. 'Delete user' seç",
  "6. Onayla ve sayfayı yenile",
];

/**
 * Console'da debug bilgisi göster
 */
export const debugAuthState = async (email) => {
  console.group(`🔍 Auth Debug: ${email}`);
  console.log("📧 Email:", email);
  console.log("🔗 SQL Kontrol Sorgusu:");
  console.log(authCleanupQueries.checkSpecificEmail(email));
  console.log("🗑️ SQL Silme Sorgusu:");
  console.log(authCleanupQueries.deleteByEmail(email));
  console.log("📋 Dashboard Adımları:", dashboardCleanupSteps);
  console.groupEnd();
};

/**
 * Frontend'te kullanım örnekleri
 */
export const usageExamples = {
  // Console'da debug
  debug: `debugAuthState('admin@anda.com')`,

  // SQL Kontrol
  checkUser: `authCleanupQueries.checkSpecificEmail('admin@anda.com')`,

  // SQL Silme
  deleteUser: `authCleanupQueries.deleteByEmail('admin@anda.com')`,
};

// Development modda console'a yardım bilgilerini yazdır
if (import.meta.env.DEV) {
  console.log("🛠️ Auth Cleanup Utility loaded!");
  console.log("📚 Usage:", usageExamples);
}
