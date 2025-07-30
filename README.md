# Anda - E-Ticaret Platformu

Modern ve kullanıcı dostu bir e-ticaret platformu. Satıcıların ürünlerini sergileyebileceği, alıcıların güvenli alışveriş yapabileceği kapsamlı bir online pazar yeri.

## Özellikler

### Kullanıcı Özellikleri

- **Hızlı Kayıt ve Giriş**: Basit ve güvenli kimlik doğrulama sistemi
- **Gelişmiş Arama**: Filtreleme ve sıralama seçenekleri ile ürün arama
- **Favori Ürünler**: Beğendiğiniz ürünleri favorilere ekleme
- **Sepet Yönetimi**: Kolay sepet ekleme ve yönetimi
- **Sipariş Takibi**: Gerçek zamanlı sipariş durumu takibi
- **Profil Yönetimi**: Kişisel bilgiler ve adres yönetimi
- **Bildirimler**: Sipariş durumu ve kampanya bildirimleri

### Satıcı Özellikleri

- **Ürün Yönetimi**: Toplu ürün ekleme ve düzenleme
- **Sipariş Yönetimi**: Gelen siparişleri takip etme
- **Satış Analitikleri**: Satış performansı ve raporlar
- **Stok Yönetimi**: Ürün stok durumu kontrolü
- **Fiyat Yönetimi**: Dinamik fiyatlandırma ve indirimler

### Admin Özellikleri

- **Kullanıcı Yönetimi**: Kullanıcı hesapları ve rolleri
- **İçerik Yönetimi**: Site içeriği ve ayarları
- **Güvenlik**: Güvenlik logları ve denetim
- **Performans İzleme**: Sistem performansı takibi
- **Yedekleme**: Veritabanı yedekleme yönetimi

## Kullanılan Teknolojiler

### Frontend

- **React 18**: Modern UI geliştirme
- **Vite**: Hızlı build tool ve development server
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Sayfa yönlendirme
- **React Hook Form**: Form yönetimi
- **React Query**: Server state yönetimi

### Backend & Veritabanı

- **Supabase**: Backend-as-a-Service platformu
- **PostgreSQL**: Güçlü ilişkisel veritabanı
- **Row Level Security (RLS)**: Güvenlik politikaları
- **Real-time**: Gerçek zamanlı veri güncellemeleri

### Kimlik Doğrulama & Güvenlik

- **Supabase Auth**: Güvenli kimlik doğrulama
- **JWT Tokens**: Güvenli oturum yönetimi
- **Role-based Access Control**: Rol tabanlı erişim kontrolü

### Geliştirme Araçları

- **ESLint**: Kod kalitesi kontrolü
- **Prettier**: Kod formatlaması
- **Git**: Versiyon kontrolü

## Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── auth/           # Kimlik doğrulama bileşenleri
│   ├── seller/         # Satıcı paneli bileşenleri
│   ├── orders/         # Sipariş yönetimi bileşenleri
│   └── ui/             # Temel UI bileşenleri
├── pages/              # Sayfa bileşenleri
│   ├── admin/          # Admin paneli sayfaları
│   └── ...             # Diğer sayfalar
├── services/           # API servisleri
├── hooks/              # Custom React hooks
├── contexts/           # React context'leri
└── utils/              # Yardımcı fonksiyonlar
```

## Özellik Detayları

### E-Ticaret Özellikleri

- **Ürün Kataloğu**: Kategorilere göre ürün listeleme
- **Ürün Detayları**: Detaylı ürün bilgileri ve görselleri
- **Filtreleme**: Fiyat, kategori, marka bazlı filtreleme
- **Sıralama**: Fiyat, popülerlik, tarih bazlı sıralama
- **Ödeme Sistemi**: Güvenli ödeme işlemleri
- **Kargo Takibi**: Sipariş kargo durumu takibi

### Admin Panel Özellikleri

- **Dashboard**: Genel istatistikler ve grafikler
- **Kullanıcı Yönetimi**: Kullanıcı hesapları ve izinleri
- **İçerik Yönetimi**: Site içeriği düzenleme
- **Sistem Ayarları**: Platform konfigürasyonu
- **Güvenlik Logları**: Sistem güvenlik takibi

### Satıcı Panel Özellikleri

- **Ürün Yönetimi**: Ürün ekleme, düzenleme, silme
- **Sipariş Takibi**: Gelen siparişleri yönetme
- **Satış Raporları**: Satış performansı analizi
- **Stok Kontrolü**: Ürün stok durumu yönetimi

## Güvenlik

- **Row Level Security (RLS)**: Veritabanı seviyesinde güvenlik
- **JWT Authentication**: Güvenli oturum yönetimi
- **Role-based Access**: Rol tabanlı erişim kontrolü
- **Input Validation**: Giriş verisi doğrulama
- **XSS Protection**: Cross-site scripting koruması

## Performans

- **Lazy Loading**: Sayfa bileşenlerinin ihtiyaç halinde yüklenmesi
- **Image Optimization**: Optimize edilmiş görsel yükleme
- **Caching**: Akıllı önbellekleme stratejileri
- **Code Splitting**: Kod bölme ile daha hızlı yükleme

Bu platform, modern e-ticaret ihtiyaçlarını karşılayan, ölçeklenebilir ve güvenli bir çözüm sunmaktadır.
