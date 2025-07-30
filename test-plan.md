# ANDA E-Ticaret Platformu - Test Planı

## 🎯 Test Hedefi

Bu test planı, ANDA e-ticaret platformunun MVP seviyesindeki tüm fonksiyonlarının çalışır durumda olduğunu doğrulamak için hazırlanmıştır.

---

## 📋 1. KULLANICI KAYIT VE GİRİŞ TESTLERİ

### 1.1 Misafir Kullanıcı Deneyimi

- [Evet] **Ana Sayfa Erişimi**: Misafir kullanıcılar ana sayfaya erişebiliyor mu?
- [Evet] **Ürün Görüntüleme**: Ürün listesi ve detay sayfaları görüntülenebiliyor mu?
- [Evet gayet güzel çalışıyor ama arama çubuğunun kategorilerin tepesinde büyük yer kaplaması durumu giderilmeli ve küçük bir kategori içinde ara butonuna çevirilebilir ya da navbar içerisinde çalışacak duruma getirilebilir.] **Kategori Filtreleme**: Kategoriler çalışıyor mu?
- [Evet gayet yeterli çalışıyor. Ürün bulunamadı yazarken mor buton çıkıyor onu turuncu yapalım yazıları da mavi'den siyah tonlarına çekelim.] **Arama Fonksiyonu**: Ürün arama çalışıyor mu?

### 1.2 Kullanıcı Kaydı

- [Evet] **Kayıt Formu**: Yeni kullanıcı kaydı formu açılıyor mu?
- [Evet] **Form Validasyonu**: Gerekli alanlar kontrol ediliyor mu?
- [Evet] **Kayıt İşlemi**: Kayıt başarılı oluyor mu?
- [Evet, Henüz Aktif edilmedi] **E-posta Doğrulama**: E-posta doğrulama süreci çalışıyor mu?

### 1.3 Kullanıcı Girişi

- [Evet] **Giriş Formu**: Giriş formu açılıyor mu?
- [Evet, İnvalid login credientials yazıyor onları türkçeleştirelim.] **Hatalı Giriş**: Yanlış bilgilerle giriş hata veriyor mu?
- [Evet] **Başarılı Giriş**: Doğru bilgilerle giriş yapılabiliyor mu?
- [Müşteri için ve seller için butonu yapılmamış ama hatırlama otomatik olarak mevcut] **Oturum Hatırlama**: "Beni hatırla" seçeneği çalışıyor mu?

### 1.4 Şifre İşlemleri

- [http://localhost:5173/auth/forgot-password bu kısım 404 veriyor henüz yapılmamış] **Şifre Sıfırlama**: Şifre sıfırlama e-postası gönderiliyor mu?
- [http://localhost:5173/dashboard ayarlar kısmında var ama çalışmıyor.] **Şifre Değiştirme**: Şifre değiştirme işlemi çalışıyor mu?

---

## 🛍️ 2. ÜRÜN GÖRÜNTÜLEME VE ARAŞTIRMA

### 2.1 Ana Sayfa

- [hayır] **Öne Çıkan Ürünler**: Öne çıkan ürünler gösteriliyor mu?
- [evet] **Yeni Ürünler**: Yeni ürünler bölümü çalışıyor mu?
- [hayır] **En Çok Satanlar**: En çok satan ürünler listeleniyor mu?
- [evet, ama bunlar mock data ile çalışıyorlar. Gerçek kategorilere göre olmalılar.] **Kampanyalar**: Kampanya banner'ları görüntüleniyor mu?
- [kontrol edecek demo data yoktu] **Sonsuz Kaydırma**: Sonsuz kaydırma çalışıyor mu?

### 2.2 Ürün Listesi

- [alt kategori bazlı olarak çalışıyor] **Kategori Filtreleme**: Kategori bazlı filtreleme çalışıyor mu?
- [böyle bir özellik yok] **Fiyat Filtreleme**: Fiyat aralığı filtreleme çalışıyor mu?
- [evet] **Sıralama**: Fiyat, popülerlik, tarih sıralaması çalışıyor mu?
- [eksik demo veriden dolayı test edilemedi] **Sayfalama**: Sayfalama veya sonsuz kaydırma çalışıyor mu?

### 2.3 Ürün Detay Sayfası

- [evet] **Ürün Bilgileri**: Ürün adı, fiyat, açıklama görüntüleniyor mu?
- [demo verilerin yüklenemiyor ama sebebi imagelerin linkleriyle ilgili olabilir] **Ürün Resimleri**: Ürün resimleri yükleniyor mu?
- [hayır burada problem var] **Satıcı Bilgileri**: Satıcı bilgileri gösteriliyor mu?
- [evet] **Stok Durumu**: Stok durumu kontrol ediliyor mu?
- [evet] **Adet Seçimi**: Adet seçimi çalışıyor mu?

### 2.4 Arama

- [evet] **Arama Çubuğu**: Arama çubuğu çalışıyor mu?
- [evet] **Arama Sonuçları**: Arama sonuçları doğru gösteriliyor mu?
- [hayır] **Otomatik Tamamlama**: Arama önerileri çalışıyor mu?

---

## 🛒 3. SEPET İŞLEMLERİ

### 3.1 Sepete Ekleme

- [evet] **Ürün Ekleme**: "Sepete Ekle" butonu çalışıyor mu?
- [kontrol edilmedi] **Adet Kontrolü**: Stok kontrolü yapılıyor mu?
- [evet] **Sepet Güncelleme**: Sepet sayısı güncelleniyor mu?
- [hayır] **Bildirim**: Sepete eklendi bildirimi gösteriliyor mu?

### 3.2 Sepet Yönetimi

- [evet] **Sepet Görüntüleme**: Sepet sayfası açılıyor mu?
- [evet] **Adet Değiştirme**: Ürün adedi değiştirilebiliyor mu?
- [evet] **Ürün Silme**: Sepetten ürün silinebiliyor mu?
- [evet] **Sepet Temizleme**: Sepet tamamen temizlenebiliyor mu?
- [evet] **Toplam Hesaplama**: Toplam fiyat doğru hesaplanıyor mu?

---

## ❤️ 4. FAVORİ İŞLEMLERİ

### 4.1 Favori Ekleme/Çıkarma

- [evet] **Favori Ekleme**: Kalp ikonuna tıklayınca favori ekleniyor mu?
- [evet] **Favori Çıkarma**: Favori ürün çıkarılabiliyor mu?
- [tercihen anlık güncellenmiyor.] **Durum Güncelleme**: Favori durumu anlık güncelleniyor mu?

### 4.2 Favori Listesi

- [evet] **Favori Sayfası**: Favori ürünler sayfası açılıyor mu?
- [evet] **Favori Listesi**: Favori ürünler listeleniyor mu?
- [evet] **Favori Silme**: Favori sayfasından ürün silinebiliyor mu?

---

## 💳 5. ÖDEME VE SİPARİŞ İŞLEMLERİ

### 5.1 Ödeme Sayfası

- [evet] **Ödeme Sayfası**: Sepetten ödeme sayfasına geçiş çalışıyor mu?
- [evet] **Adres Seçimi**: Teslimat adresi seçilebiliyor mu?
- [evet] **Adres Ekleme**: Yeni adres eklenebiliyor mu?
- [evet] **Ödeme Yöntemi**: Ödeme yöntemi seçilebiliyor mu?

### 5.2 Sipariş Onayı

- [evet] **Sipariş Özeti**: Sipariş özeti doğru gösteriliyor mu?
- [evet] **Fiyat Hesaplama**: Toplam, kargo, vergi hesaplaması doğru mu?
- [evet] **Sipariş Onayı**: Sipariş onaylanabiliyor mu?

### 5.3 Sipariş Takibi

- [üzerinde çalışıyor] **Sipariş Listesi**: Kullanıcı siparişlerini görebiliyor mu?
- [üzerinde çalışıyor] **Sipariş Detayı**: Sipariş detayları görüntülenebiliyor mu?
- [üzerinde çalışıyor] **Sipariş Durumu**: Sipariş durumu güncelleniyor mu?

---

## 👤 6. KULLANICI PROFİLİ VE AYARLAR

### 6.1 Profil Yönetimi

- [ ] **Profil Görüntüleme**: Kullanıcı profili görüntülenebiliyor mu?
- [ ] **Profil Düzenleme**: Profil bilgileri güncellenebiliyor mu?
- [ ] **Profil Resmi**: Profil resmi yüklenebiliyor mu?

### 6.2 Adres Yönetimi

- [evet] **Adres Listesi**: Kayıtlı adresler listeleniyor mu?
- [evet] **Adres Ekleme**: Yeni adres eklenebiliyor mu?
- [evet] **Adres Düzenleme**: Mevcut adres düzenlenebiliyor mu?
- [evet] **Adres Silme**: Adres silinebiliyor mu?
- [evet] **Varsayılan Adres**: Varsayılan adres ayarlanabiliyor mu?

### 6.3 Hesap Ayarları

- [ ] **Şifre Değiştirme**: Şifre değiştirilebiliyor mu?
- [ ] **E-posta Değiştirme**: E-posta adresi güncellenebiliyor mu?
- [ ] **Bildirim Ayarları**: Bildirim tercihleri ayarlanabiliyor mu?

---

## 🏪 7. SATICI PANELİ

### 7.1 Satıcı Girişi

- [ ] **Satıcı Girişi**: Satıcı hesabıyla giriş yapılabiliyor mu?
- [ ] **Satıcı Paneli**: Satıcı paneli açılıyor mu?

### 7.2 Ürün Yönetimi

- [ ] **Ürün Listesi**: Satıcının ürünleri listeleniyor mu?
- [ ] **Ürün Ekleme**: Yeni ürün eklenebiliyor mu?
- [ ] **Ürün Düzenleme**: Mevcut ürün düzenlenebiliyor mu?
- [ ] **Ürün Silme**: Ürün silinebiliyor mu?
- [ ] **Ürün Durumu**: Ürün aktif/pasif durumu değiştirilebiliyor mu?

### 7.3 Stok Yönetimi

- [ ] **Stok Görüntüleme**: Stok durumu görüntüleniyor mu?
- [ ] **Stok Güncelleme**: Stok miktarı güncellenebiliyor mu?
- [ ] **Stok Hareketleri**: Stok hareketleri takip edilebiliyor mu?

### 7.4 Sipariş Yönetimi

- [ ] **Sipariş Listesi**: Gelen siparişler listeleniyor mu?
- [ ] **Sipariş Detayı**: Sipariş detayları görüntülenebiliyor mu?
- [ ] **Sipariş Durumu**: Sipariş durumu güncellenebiliyor mu?

### 7.5 Satıcı Mağazası

- [ ] **Mağaza Sayfası**: Satıcı mağaza sayfası açılıyor mu?
- [ ] **Mağaza Bilgileri**: Mağaza bilgileri görüntüleniyor mu?
- [ ] **Mağaza Ürünleri**: Mağaza ürünleri listeleniyor mu?

---

## 🔧 8. ADMIN PANELİ

### 8.1 Admin Girişi

- [ ] **Admin Girişi**: Admin hesabıyla giriş yapılabiliyor mu?
- [ ] **Admin Paneli**: Admin paneli açılıyor mu?

### 8.2 Kullanıcı Yönetimi

- [ ] **Kullanıcı Listesi**: Tüm kullanıcılar listeleniyor mu?
- [ ] **Kullanıcı Detayı**: Kullanıcı detayları görüntülenebiliyor mu?
- [ ] **Kullanıcı Durumu**: Kullanıcı durumu değiştirilebiliyor mu?

### 8.3 Satıcı Yönetimi

- [ ] **Satıcı Listesi**: Tüm satıcılar listeleniyor mu?
- [ ] **Satıcı Onayı**: Satıcı başvuruları onaylanabiliyor mu?
- [ ] **Satıcı Durumu**: Satıcı durumu değiştirilebiliyor mu?

### 8.4 Ürün Yönetimi

- [ ] **Ürün Listesi**: Tüm ürünler listeleniyor mu?
- [ ] **Ürün Onayı**: Ürün onayı yapılabiliyor mu?
- [ ] **Ürün Durumu**: Ürün durumu değiştirilebiliyor mu?

### 8.5 Sipariş Yönetimi

- [ ] **Sipariş Listesi**: Tüm siparişler listeleniyor mu?
- [ ] **Sipariş Detayı**: Sipariş detayları görüntülenebiliyor mu?
- [ ] **Sipariş Durumu**: Sipariş durumu güncellenebiliyor mu?

### 8.6 İçerik Yönetimi

- [ ] **Kategori Yönetimi**: Kategoriler yönetilebiliyor mu?
- [ ] **Kampanya Yönetimi**: Kampanyalar oluşturulabiliyor mu?
- [ ] **Banner Yönetimi**: Banner'lar yönetilebiliyor mu?

---

## 📱 9. MOBİL UYUMLULUK

### 9.1 Responsive Tasarım

- [ ] **Mobil Görünüm**: Mobil cihazlarda düzgün görünüyor mu?
- [ ] **Tablet Görünüm**: Tablet cihazlarda düzgün görünüyor mu?
- [ ] **Desktop Görünüm**: Desktop'ta düzgün görünüyor mu?

### 9.2 Mobil Navigasyon

- [ ] **Mobil Menü**: Mobil menü açılıyor mu?
- [ ] **Dokunma Hedefleri**: Butonlar ve linkler dokunulabilir mi?
- [ ] **Kaydırma**: Sayfa kaydırma sorunsuz çalışıyor mu?

---

## 🔍 10. PERFORMANS VE GÜVENLİK

### 10.1 Sayfa Yükleme

- [ ] **Ana Sayfa**: Ana sayfa hızlı yükleniyor mu?
- [ ] **Ürün Sayfaları**: Ürün sayfaları hızlı yükleniyor mu?
- [ ] **Resim Yükleme**: Resimler hızlı yükleniyor mu?

### 10.2 Güvenlik

- [ ] **Oturum Güvenliği**: Oturum güvenli şekilde yönetiliyor mu?
- [ ] **Veri Koruma**: Kullanıcı verileri korunuyor mu?
- [ ] **XSS Koruması**: XSS saldırılarına karşı koruma var mı?

---

## 🐛 11. HATA YÖNETİMİ

### 11.1 Hata Sayfaları

- [ ] **404 Sayfası**: Olmayan sayfalar için 404 gösteriliyor mu?
- [ ] **500 Sayfası**: Sunucu hataları için uygun sayfa gösteriliyor mu?
- [ ] **Hata Mesajları**: Hata mesajları anlaşılır mı?

### 11.2 Form Validasyonu

- [ ] **Giriş Formu**: Giriş formu validasyonu çalışıyor mu?
- [ ] **Kayıt Formu**: Kayıt formu validasyonu çalışıyor mu?
- [ ] **Ürün Formu**: Ürün ekleme formu validasyonu çalışıyor mu?

---

## 📊 12. ANALİTİK VE RAPORLAMA

### 12.1 Satıcı Analitikleri

- [ ] **Satış Raporu**: Satış raporları görüntülenebiliyor mu?
- [ ] **Ürün Performansı**: Ürün performansı takip edilebiliyor mu?
- [ ] **Müşteri Analizi**: Müşteri analizi yapılabiliyor mu?

### 12.2 Admin Raporları

- [ ] **Platform Raporu**: Platform geneli raporlar görüntülenebiliyor mu?
- [ ] **Satıcı Raporu**: Satıcı performans raporları var mı?
- [ ] **Kullanıcı Raporu**: Kullanıcı aktivite raporları var mı?

---

## 🔔 13. BİLDİRİMLER

### 13.1 Sistem Bildirimleri

- [ ] **Başarı Bildirimleri**: İşlem başarılı bildirimleri gösteriliyor mu?
- [ ] **Hata Bildirimleri**: Hata bildirimleri gösteriliyor mu?
- [ ] **Uyarı Bildirimleri**: Uyarı bildirimleri gösteriliyor mu?

### 13.2 E-posta Bildirimleri

- [ ] **Kayıt Bildirimi**: Kayıt sonrası e-posta gönderiliyor mu?
- [ ] **Sipariş Bildirimi**: Sipariş sonrası e-posta gönderiliyor mu?
- [ ] **Şifre Sıfırlama**: Şifre sıfırlama e-postası gönderiliyor mu?

---

## 📝 TEST NOTLARI

### Test Yaparken Dikkat Edilecekler:

1. **Tarayıcı Uyumluluğu**: Chrome, Firefox, Safari, Edge'de test edin
2. **Cihaz Uyumluluğu**: Mobil, tablet, desktop'ta test edin
3. **İnternet Hızı**: Yavaş bağlantıda test edin
4. **Veri Girişi**: Farklı karakterler ve uzunluklarda test edin
5. **Eşzamanlı İşlemler**: Aynı anda birden fazla işlem yapın

### Hata Raporlama Formatı:

```
Hata Türü: [Bug/Feature Request/UI Issue]
Sayfa/Component: [Hangi sayfa/component]
Tarayıcı: [Chrome/Firefox/Safari/Edge]
Cihaz: [Desktop/Mobile/Tablet]
Adımlar: [Hata nasıl oluştu]
Beklenen Sonuç: [Ne olması gerekiyordu]
Gerçek Sonuç: [Ne oldu]
Ekran Görüntüsü: [Varsa]
```

---

## ✅ TEST TAMAMLAMA KONTROL LİSTESİ

- [ ] Tüm test senaryoları tamamlandı
- [ ] Kritik hatalar düzeltildi
- [ ] Performans kriterleri karşılandı
- [ ] Güvenlik testleri geçildi
- [ ] Mobil uyumluluk doğrulandı
- [ ] Kullanıcı deneyimi testleri tamamlandı

**Test Tarihi:** **\*\***\_\_\_**\*\***
**Test Eden:** **\*\***\_\_\_**\*\***
**Sonuç:** **\*\***\_\_\_**\*\***
