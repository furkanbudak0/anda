# 🛒 ANDA E-Commerce Platform

Modern, ölçeklenebilir ve kullanıcı dostu e-ticaret platformu. React, Supabase ve Tailwind CSS ile geliştirilmiştir.

## ✨ Özellikler

### 🔐 Kimlik Doğrulama Sistemi

- **Üç Seviyeli Rol Sistemi**: Kullanıcı, Satıcı, Admin
- **JWT Token Tabanlı**: Güvenli oturum yönetimi
- **Rol Bazlı Erişim Kontrolü**: Sayfa ve component seviyesinde koruma
- **Supabase Auth**: Modern kimlik doğrulama altyapısı

### 🛍️ Alışveriş Deneyimi

- **Modern Ürün Kataloğu**: Gelişmiş filtreleme ve arama
- **Akıllı Sepet Sistemi**: Local storage ile kalıcılık
- **Favori Sistemi**: Wishlist yönetimi
- **Çok Adımlı Checkout**: Adres, kargo ve ödeme seçenekleri
- **Sipariş Takibi**: Gerçek zamanlı sipariş durumu

### 👥 Satıcı Araçları

- **Satıcı Dashboard**: Kapsamlı yönetim paneli
- **Ürün Yönetimi**: CRUD işlemleri ve varyant desteği
- **Stok Takibi**: Gerçek zamanlı stok yönetimi
- **Satış Analitiği**: Detaylı raporlama
- **Mağaza Sayfası**: Kişiselleştirilebilir satıcı profili

### 🛠️ Admin Paneli

- **Kullanıcı Yönetimi**: Kullanıcı ve satıcı onay sistemi
- **İçerik Moderasyonu**: Ürün ve yorum onayı
- **Sistem Analitiği**: Platform geneli istatistikler
- **Kupon Yönetimi**: İndirim ve promosyon araçları

### 🎨 Modern UI/UX

- **Responsive Tasarım**: Mobil öncelikli yaklaşım
- **Tailwind CSS**: Modern ve tutarlı tasarım sistemi
- **Component Library**: Yeniden kullanılabilir bileşenler
- **Loading States**: Smooth kullanıcı deneyimi
- **Toast Notifications**: Kullanıcı geri bildirimleri

## 🚀 Teknoloji Stack

### Frontend

- **React 18** - Modern React hooks ve context API
- **React Router v6** - Client-side routing
- **React Query** - Server state management
- **Tailwind CSS** - Utility-first CSS framework
- **Heroicons** - Beautiful SVG icons
- **React Hook Form** - Form validation
- **React Hot Toast** - Notification system

### Backend

- **Supabase** - Backend-as-a-Service
- **PostgreSQL** - Veritabanı
- **Row Level Security** - Güvenlik katmanı
- **Real-time subscriptions** - Canlı güncellemeler
- **File Storage** - Resim ve dosya depolama

### Geliştirme Araçları

- **Vite** - Build tool ve dev server
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## 📁 Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── auth/           # Kimlik doğrulama bileşenleri
│   ├── checkout/       # Checkout süreci bileşenleri
│   └── ...
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── pages/              # Sayfa bileşenleri
├── services/           # API servisleri
├── utils/              # Yardımcı fonksiyonlar
└── constants/          # Sabitler ve konfigürasyon
```

## ⚡ Hızlı Başlangıç

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Kurulum

1. **Repoyu klonlayın**

```bash
git clone https://github.com/username/anda-ecommerce.git
cd anda-ecommerce
```

2. **Bağımlılıkları yükleyin**

```bash
npm install
```

3. **Supabase yapılandırması**

   - Supabase hesabı oluşturun
   - Yeni proje oluşturun
   - `src/services/supabase.js` dosyasındaki URL ve anahtarları güncelleyin
   - `database/supabase-setup.sql` dosyasını SQL Editor'de çalıştırın

4. **Projeyi başlatın**

```bash
npm run dev
```

## 🗄️ Veritabanı Şeması

Platform 15+ tablo ile kapsamlı bir e-ticaret veritabanı sunar:

- **Kullanıcılar**: profiles, sellers, seller_applications
- **Ürünler**: products, product_variants, categories
- **Alışveriş**: cart_items, orders, order_items
- **Etkileşim**: reviews, wishlists, view_history
- **Sistem**: audit_logs, coupons, addresses

## 🔒 Güvenlik

- **Row Level Security (RLS)**: Tüm tablolar için güvenlik politikaları
- **JWT Authentication**: Güvenli token tabanlı kimlik doğrulama
- **Role-based Access**: Rol bazlı erişim kontrolü
- **Input Validation**: Form ve API input doğrulama
- **SQL Injection Protection**: Supabase güvenlik katmanı

## 📱 Responsive Tasarım

Platform tüm cihazlarda mükemmel çalışır:

- **Mobile First**: Mobil öncelikli tasarım
- **Tablet Optimized**: Tablet deneyimi
- **Desktop Enhanced**: Masaüstü gelişmiş özellikler

## 🎯 Performans

- **Code Splitting**: Sayfa bazlı kod bölme
- **Lazy Loading**: Gecikmeli yükleme
- **Image Optimization**: Resim optimizasyonu
- **Caching**: React Query ile akıllı önbellekleme
- **Bundle Size**: Optimize edilmiş paket boyutu

## 🛣️ Yol Haritası

- [ ] **V2.0**: AI destekli ürün önerileri
- [ ] **V2.1**: Çoklu dil desteği (i18n)
- [ ] **V2.2**: PWA desteği
- [ ] **V2.3**: Real-time chat desteği
- [ ] **V2.4**: Gelişmiş analitik dashboard
- [ ] **V2.5**: Mobile app (React Native)

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

- **Email**: info@anda.com
- **Website**: https://anda.com
- **GitHub**: https://github.com/username/anda-ecommerce

---

**ANDA** - Modern alışverişin yeni adresi 🚀
