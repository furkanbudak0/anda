import { Link } from "react-router-dom";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import NavBar from "../components/NavBar";
import { TermsSEO } from "../components/SEO";

export default function Terms() {
  return (
    <>
      <TermsSEO />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />

        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Kullanım Şartları
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                ANDA platformunu kullanarak bu şartları kabul etmiş olursunuz
              </p>
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                Son güncellenme: 15 Mart 2024
              </div>
            </div>

            {/* Önemli Uyarı */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 mb-8">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                    Önemli Bilgilendirme
                  </h3>
                  <p className="text-amber-700 dark:text-amber-300 text-sm">
                    Bu kullanım şartları, ANDA platformunu kullanmanız durumunda
                    sizin için bağlayıcıdır. Lütfen tüm maddeleri dikkatlice
                    okuyunuz.
                  </p>
                </div>
              </div>
            </div>

            {/* Ana İçerik */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 space-y-8">
              {/* 1. Genel Hükümler */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  1. Genel Hükümler
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>
                    Bu kullanım şartları, ANDA e-ticaret platformunun
                    kullanımına ilişkin kuralları ve koşulları belirler.
                  </p>
                  <p>
                    Platform üzerinden yapılan tüm işlemler için bu şartlar
                    geçerlidir ve Türkiye Cumhuriyeti kanunlarına tabidir.
                  </p>
                </div>
              </section>

              {/* 2. Hesap Oluşturma */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  2. Hesap Oluşturma ve Kullanım
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Hesap Gereksinimleri:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>18 yaşını doldurmuş olmanız gerekir</li>
                    <li>Doğru ve güncel bilgiler vermeniz zorunludur</li>
                    <li>Hesap güvenliğinden siz sorumlusunuz</li>
                    <li>Bir kişi yalnızca bir hesap açabilir</li>
                    <li>
                      Şüpheli aktiviteler tespit edilirse hesap askıya
                      alınabilir
                    </li>
                  </ul>
                </div>
              </section>

              {/* 3. Alışveriş Kuralları */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  3. Alışveriş ve Ödeme
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Sipariş Süreci:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Tüm fiyatlar KDV dahil olarak gösterilir</li>
                    <li>Sipariş onayı e-posta ile gönderilir</li>
                    <li>Ödeme güvenli SSL teknolojisi ile korunur</li>
                    <li>Stok durumuna göre sipariş iptal edilebilir</li>
                    <li>Promosyon kodları tek kullanımlıktır</li>
                  </ul>
                </div>
              </section>

              {/* 4. Satıcı Kuralları */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  4. Satıcı Yükümlülükleri
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Satıcı Sorumlulukları:
                  </h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Ürün açıklamaları doğru ve eksiksiz olmalıdır</li>
                    <li>Stok durumu güncel tutulmalıdır</li>
                    <li>Müşteri memnuniyeti öncelikli olmalıdır</li>
                    <li>Teslimat süreleri belirtilen şekilde olmalıdır</li>
                    <li>İade ve değişim politikalarına uyulmalıdır</li>
                  </ul>
                </div>
              </section>

              {/* 5. İade ve İptal */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  5. İade ve İptal Koşulları
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                      İade Hakları:
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-300">
                      <li>14 gün koşulsuz iade hakkı</li>
                      <li>Ürün orijinal ambalajında olmalıdır</li>
                      <li>Kullanılmamış ve hasarsız olmalıdır</li>
                      <li>İade kargo ücreti alıcıya aittir</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 6. Yasaklı Davranışlar */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
                  6. Yasaklı Davranışlar
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                      Kesinlikle Yasak:
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300">
                      <li>Sahte bilgi vermek</li>
                      <li>Başkalarının hesaplarını kullanmak</li>
                      <li>Sistemin güvenliğini tehdit etmek</li>
                      <li>Telif hakkı ihlali yapmak</li>
                      <li>Spam ve rahatsız edici davranışlar</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* 7. Veri Koruma */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  7. Kişisel Verilerin Korunması
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>
                    Kişisel verileriniz KVKK (Kişisel Verilerin Korunması
                    Kanunu) kapsamında işlenir ve korunur.
                  </p>
                  <p>
                    Detaylı bilgi için{" "}
                    <Link
                      to="/privacy"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Gizlilik Politikamızı
                    </Link>{" "}
                    inceleyebilirsiniz.
                  </p>
                </div>
              </section>

              {/* 8. Değişiklikler */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  8. Şartların Değiştirilmesi
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>
                    ANDA, bu kullanım şartlarını önceden bildirimde bulunarak
                    değiştirme hakkını saklı tutar.
                  </p>
                  <p>
                    Değişiklikler yürürlüğe girdikten sonra platformu kullanmaya
                    devam etmeniz, yeni şartları kabul ettiğiniz anlamına gelir.
                  </p>
                </div>
              </section>

              {/* 9. İletişim */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3" />
                  9. İletişim ve Destek
                </h2>
                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                  <p>
                    Bu kullanım şartları hakkında sorularınız için bizimle
                    iletişime geçebilirsiniz:
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-200">
                      📧 E-posta: legal@anda.com
                      <br />
                      📞 Telefon: +90 (212) 555-0123
                      <br />
                      🏢 Adres: Maslak, İstanbul
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* Alt Navigasyon */}
            <div className="mt-12 text-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  İlgili Belgeler
                </h3>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    to="/privacy"
                    className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    Gizlilik Politikası
                  </Link>
                  <Link
                    to="/help"
                    className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    Yardım Merkezi
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    İletişim
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
