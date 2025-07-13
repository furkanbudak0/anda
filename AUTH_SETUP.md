# 🔐 ANDA E-Commerce JWT Authentication System

## 🎯 Genel Bakış

Bu kapsamlı JWT kimlik doğrulama sistemi, modern e-ticaret platformu için 3 farklı rol (kullanıcı/satıcı/admin) ile güvenli ve ölçeklenebilir bir çözüm sunar.

## 🏗️ Mimari Özellikler

### ✨ Temel Özellikler

- **JWT Token Tabanlı Kimlik Doğrulama**
- **3 Farklı Kullanıcı Rolü** (User, Seller, Admin)
- **Rol Tabanlı Yetki Sistemi** (RBAC)
- **Çok Aşamalı Satıcı Başvuru Süreci**
- **Güvenlik Audit Logları**
- **Dosya Yükleme Sistemi**
- **Row Level Security (RLS)**

### 🔒 Güvenlik Katmanları

- Supabase Row Level Security (RLS)
- JWT token doğrulama
- Rol bazlı erişim kontrolü
- Audit logging sistemi
- IP adresi ve user agent takibi
- Document upload güvenliği

## 📁 Dosya Yapısı

```
src/
├── contexts/
│   └── AuthContext.jsx          # Ana auth context
├── components/auth/
│   ├── ProtectedRoute.jsx       # Route koruma
│   ├── RoleGuard.jsx           # Component-level koruma
│   ├── AuthForm.jsx            # Modern giriş formu
│   └── SellerSignupForm.jsx    # Satıcı başvuru formu
├── hooks/
│   ├── useAuth.js              # Auth hook'lar
│   ├── useAdminAuth.js         # Admin özel hook'lar
│   └── useUser.js              # Backward compatibility
└── services/
    └── apiAuth.js              # API fonksiyonları
```

## 🗄️ Supabase Veritabanı Kurulumu

### 1. SQL Script Çalıştırma

```sql
-- database/supabase-setup.sql dosyasını Supabase SQL Editor'de çalıştırın
```

### 2. Tablolar

- `profiles` - Tüm kullanıcı profilleri
- `sellers` - Satıcı bilgileri ve doğrulama
- `seller_applications` - Başvuru süreçleri
- `admins` - Admin yetkileri
- `audit_logs` - Güvenlik logları
- `role_permissions` - Yetki sistemi
- `admin_notifications` - Admin bildirimleri

### 3. Storage Buckets

- `avatars` - Profil fotoğrafları (public)
- `documents` - Kimlik belgeleri (private)
- `business-licenses` - İş belgeleri (private)
- `product-images` - Ürün görselleri (public)
- `logos` - Logo dosyaları (public)
- `banners` - Banner görseller (public)

## 🚀 Kurulum Adımları

### 1. Supabase Konfigürasyonu

```javascript
// src/services/supabase.js
export const supabaseUrl = "YOUR_SUPABASE_URL";
const supabaseKey = "YOUR_SUPABASE_ANON_KEY";
```

### 2. İlk Admin Kullanıcısı Oluşturma

```sql
-- Supabase Dashboard > Authentication > Users
-- Yeni kullanıcı ekle, sonra:
UPDATE profiles
SET role = 'admin'
WHERE email = 'admin@yourdomain.com';

INSERT INTO admins (id, email, full_name, role, permissions)
VALUES (
  'USER_UUID_FROM_AUTH_USERS',
  'admin@yourdomain.com',
  'Admin User',
  'super_admin',
  '["manage_users", "manage_sellers", "approve_applications"]'
);
```

### 3. App.jsx'e Provider Ekleme

```jsx
// src/App.jsx
import { AuthProvider } from "./contexts/AuthContext";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{/* App content */}</AuthProvider>
    </QueryClientProvider>
  );
}
```

## 💡 Kullanım Örnekleri

### 1. Temel Authentication Hook

```jsx
import { useAuth } from "../contexts/AuthContext";

function MyComponent() {
  const { user, role, isAuthenticated, hasPermission, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Lütfen giriş yapın</div>;
  }

  return (
    <div>
      <h1>Hoş geldin, {user.user_metadata?.fullName}</h1>
      <p>Rolün: {role}</p>

      {hasPermission("manage_products") && <button>Ürün Yönet</button>}

      <button onClick={logout}>Çıkış Yap</button>
    </div>
  );
}
```

### 2. Route Koruma

```jsx
import { ProtectedRoute, AdminRoute, SellerRoute } from "../components/auth/ProtectedRoute";

// Sadece giriş yapmış kullanıcılar
<ProtectedRoute>
  <UserDashboard />
</ProtectedRoute>

// Sadece admin'ler
<AdminRoute>
  <AdminPanel />
</AdminRoute>

// Satıcı ve admin'ler
<SellerRoute>
  <SellerDashboard />
</SellerRoute>

// Özel yetki kontrolü
<ProtectedRoute requiredPermission="manage_products">
  <ProductManagement />
</ProtectedRoute>
```

### 3. Component-Level Koruma

```jsx
import { RoleGuard, AdminOnly, SellerOnly } from "../components/auth/RoleGuard";

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      <AdminOnly>
        <AdminPanel />
      </AdminOnly>

      <SellerOnly>
        <SellerStats />
      </SellerOnly>

      <RoleGuard permission="view_analytics">
        <AnalyticsComponent />
      </RoleGuard>
    </div>
  );
}
```

### 4. Login/Signup Hook'ları

```jsx
import { useLogin, useUserSignup, useSellerSignup } from "../hooks/useAuth";

function LoginForm() {
  const loginMutation = useLogin();

  const handleLogin = (credentials) => {
    loginMutation.mutate(credentials);
  };

  return <form onSubmit={handleLogin}>{/* Form fields */}</form>;
}
```

## 🔑 Rol ve Yetki Sistemi

### Roller

- **user**: Temel kullanıcı (alışveriş yapabilir)
- **seller**: Satıcı (ürün satabilir)
- **admin**: Yönetici (tüm yetkilere sahip)

### Yetkiler

```javascript
const ROLE_PERMISSIONS = {
  user: [
    "view_products",
    "add_to_cart",
    "place_order",
    "manage_profile",
    "view_orders",
    "add_review",
  ],
  seller: [
    "view_products",
    "manage_products",
    "view_seller_dashboard",
    "manage_seller_profile",
    "view_seller_orders",
    "manage_inventory",
    "view_analytics",
  ],
  admin: [
    "view_admin_dashboard",
    "manage_users",
    "manage_sellers",
    "approve_applications",
    "view_system_analytics",
    "manage_platform_settings",
    "audit_logs",
    "moderate_content",
  ],
};
```

## 📋 Satıcı Başvuru Süreci

### 1. Multi-Step Form

```jsx
import SellerSignupForm from "../components/auth/SellerSignupForm";

// 5 adımlı satıcı başvuru formu:
// 1. İşletme Bilgileri
// 2. Sahip Bilgileri
// 3. Bankacılık Bilgileri
// 4. Belgeler
// 5. Onay
```

### 2. Admin Onay Süreci

```jsx
import {
  useApproveSellerApplication,
  useRejectSellerApplication,
} from "../hooks/useAdminAuth";

function AdminPanel() {
  const approveMutation = useApproveSellerApplication();
  const rejectMutation = useRejectSellerApplication();

  const handleApprove = (sellerId) => {
    approveMutation.mutate({
      sellerId,
      adminId: currentUser.id,
    });
  };

  const handleReject = (sellerId, reason) => {
    rejectMutation.mutate({
      sellerId,
      adminId: currentUser.id,
      reason,
    });
  };
}
```

## 🔍 Audit Logging

### Otomatik Log Tutma

```javascript
// Her önemli işlem için otomatik log
await logActivity(userId, "login", {
  timestamp: new Date().toISOString(),
  ipAddress: userIP,
  userAgent: navigator.userAgent,
});
```

### Log Kategorileri

- `login` / `logout`
- `user_registration` / `seller_registration`
- `seller_approval` / `seller_rejection`
- `profile_update` / `password_update`
- `product_created` / `product_updated`

## 🛡️ Güvenlik Best Practices

### 1. RLS Policies

- Her tablo için uygun RLS politikaları
- Kullanıcılar sadece kendi verilerine erişebilir
- Admin'ler tüm verilere erişebilir

### 2. Token Yönetimi

- JWT token'lar otomatik olarak yenilenir
- Logout işleminde tüm token'lar temizlenir
- Session timeout koruması

### 3. File Upload Güvenliği

- Sadece belirli dosya türleri kabul edilir
- Dosya boyutu sınırlamaları
- Kullanıcılar sadece kendi dosyalarını görebilir

## 🎨 UI Components

### Modern Form Tasarımı

- Purple tema ile modern tasarım
- Responsive layout
- Loading states
- Error handling
- Password visibility toggle

### Toast Notifications

```javascript
// Otomatik başarı/hata mesajları
toast.success("Başarıyla giriş yaptınız!");
toast.error("Giriş bilgileri hatalı");
```

## 🚀 Production Checklist

### Güvenlik

- [ ] Supabase RLS policies aktif
- [ ] Environment variables güvenli
- [ ] HTTPS zorunlu
- [ ] Rate limiting aktif

### Email Sistemi

- [ ] Supabase email templates yapılandırıldı
- [ ] SMTP ayarları yapıldı
- [ ] Email verification aktif

### Monitoring

- [ ] Error tracking (Sentry vb.)
- [ ] Performance monitoring
- [ ] Audit log monitoring

## 🆘 Troubleshooting

### Yaygın Hatalar

#### "useAuth must be used within AuthProvider"

```jsx
// App.jsx'de AuthProvider doğru şekilde wrapped edilmiş mi?
<AuthProvider>
  <YourApp />
</AuthProvider>
```

#### "User not found" hatası

```sql
-- profiles tablosunda kullanıcı kaydı var mı?
SELECT * FROM profiles WHERE id = 'USER_UUID';
```

#### RLS Policy hatası

```sql
-- Doğru RLS policies aktif mi?
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

## 📞 Destek

Bu authentication sistemi hakkında sorularınız için:

- GitHub Issues
- Documentation
- Code comments

---

**🎉 Tebrikler!** Modern, güvenli ve ölçeklenebilir JWT authentication sisteminiz hazır!
