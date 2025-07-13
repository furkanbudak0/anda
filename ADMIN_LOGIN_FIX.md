# 🔐 Admin Girişi Sorunu Çözüm Rehberi

## 🎯 Sorun Analizi

Admin girişi yapılamamasının olası sebepleri:

1. **RPC Fonksiyonu Sorunu**: `get_user_by_email` fonksiyonu çalışmıyor
2. **Tablo Senkronizasyonu**: Auth, Profiles ve Admins tabloları arasında tutarsızlık
3. **RLS Politikaları**: Row Level Security politikaları engelliyor
4. **Admin Kaydı Eksik**: Admin kullanıcısı hiç oluşturulmamış

## 🛠️ Çözüm Adımları

### Adım 1: Database'de RPC Fonksiyonlarını Güncelle

Supabase SQL Editor'de şu script'i çalıştır:

```sql
-- database/fix_admin_login_issues.sql dosyasını çalıştır
```

Bu script:

- `get_user_by_email` RPC fonksiyonunu günceller
- `admin_login_check` yeni RPC fonksiyonu oluşturur
- RLS politikalarını düzeltir
- Eksik admin kayıtlarını oluşturur

### Adım 2: Test Script'ini Çalıştır

```sql
-- database/simple_admin_test.sql dosyasını çalıştır
```

Bu script:

- Mevcut admin kayıtlarını kontrol eder
- RPC fonksiyonlarını test eder
- Eksik admin kullanıcısı varsa oluşturur

### Adım 3: Manuel Admin Kullanıcısı Oluştur

Eğer otomatik oluşturma çalışmazsa, manuel olarak:

1. **Supabase Dashboard > Authentication > Users**

   - Yeni kullanıcı ekle: `furknbudak@gmail.com`
   - Şifre: `12345678`
   - Email confirmation'ı devre dışı bırak

2. **SQL Editor'de**:

```sql
-- Profiles tablosuna ekle
INSERT INTO profiles (
    id,
    email,
    full_name,
    name,
    role,
    status,
    is_verified,
    created_at
) VALUES (
    'AUTH_USER_ID_FROM_DASHBOARD',
    'furknbudak@gmail.com',
    'Furkan Budak',
    'Furkan Budak',
    'admin',
    'active',
    true,
    NOW()
);

-- Admins tablosuna ekle
INSERT INTO admins (
    id,
    email,
    full_name,
    admin_level,
    is_active,
    created_at
) VALUES (
    'AUTH_USER_ID_FROM_DASHBOARD',
    'furknbudak@gmail.com',
    'Furkan Budak',
    'admin',
    true,
    NOW()
);
```

### Adım 4: Kod Güncellemeleri

Kod tarafında yapılan güncellemeler:

1. **`src/services/apiAuth.js`**:

   - `adminLogin` fonksiyonu güncellendi
   - `adminSignup` fonksiyonu güncellendi
   - RPC fonksiyonları kullanılıyor
   - Hata ayıklama logları eklendi

2. **RPC Fonksiyonları**:
   - `get_user_by_email`: Kullanıcı kontrolü
   - `admin_login_check`: Admin yetki kontrolü

## 🔍 Hata Ayıklama

### Console'da Kontrol Edilecek Loglar

```javascript
// Browser console'da şu logları kontrol et:
🔐 Admin login attempt for: furknbudak@gmail.com
✅ Auth successful for user: [USER_ID]
✅ Admin check successful: [ADMIN_DATA]
🎉 Admin login successful: furknbudak@gmail.com (admin)
```

### Olası Hata Mesajları

1. **"Bu e-posta adresi zaten kayıtlı"**

   - RPC fonksiyonu çalışmıyor
   - Tablolar arasında tutarsızlık var

2. **"Admin yetki kontrolü başarısız"**

   - RPC fonksiyonu bulunamıyor
   - Yetki sorunu var

3. **"Bu hesap admin yetkisine sahip değil"**
   - Admin kaydı eksik
   - RLS politikası engelliyor

## 🚀 Test Etme

1. **Admin Setup sayfasına git**: `/panel`
2. **Test bilgileri ile giriş yap**:
   - Email: `furknbudak@gmail.com`
   - Şifre: `12345678`
3. **Console'da logları kontrol et**
4. **Başarılı giriş sonrası admin paneline yönlendirilmeli**

## 📋 Kontrol Listesi

- [ ] Database script'leri çalıştırıldı
- [ ] RPC fonksiyonları oluşturuldu
- [ ] Admin kullanıcısı mevcut
- [ ] RLS politikaları düzeltildi
- [ ] Kod güncellemeleri yapıldı
- [ ] Test girişi başarılı

## 🔧 Ek Sorunlar

Eğer hala sorun varsa:

1. **Supabase Dashboard > Logs** kontrol et
2. **Network tab**'da API çağrılarını incele
3. **Console**'da hata mesajlarını kontrol et
4. **Database**'de tablo yapılarını doğrula

## 📞 Destek

Sorun devam ederse:

1. Supabase Dashboard'dan screenshot al
2. Console loglarını paylaş
3. Network tab'ından hata detaylarını paylaş
