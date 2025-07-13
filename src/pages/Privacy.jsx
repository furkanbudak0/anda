import NavBar from "../components/NavBar";
import { Link } from "react-router-dom";
import {
  ShieldCheckIcon,
  LockClosedIcon,
  EyeIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-2xl">
                <ShieldCheckIcon className="w-12 h-12 text-blue-600" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Gizlilik Politikası
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kişisel verilerinizi nasıl topladığımız, kullandığımız ve
              koruduğumuz hakkında detaylı bilgi
            </p>
            <p className="text-sm text-gray-500 mt-4">
              Son güncelleme: 15 Aralık 2024
            </p>
          </div>

          {/* Quick Navigation */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Hızlı Erişim
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <a
                href="#veri-toplama"
                className="text-blue-600 hover:text-blue-800"
              >
                Veri Toplama
              </a>
              <a
                href="#veri-kullanimi"
                className="text-blue-600 hover:text-blue-800"
              >
                Veri Kullanımı
              </a>
              <a
                href="#veri-koruma"
                className="text-blue-600 hover:text-blue-800"
              >
                Veri Koruma
              </a>
              <a
                href="#haklariniz"
                className="text-blue-600 hover:text-blue-800"
              >
                Haklarınız
              </a>
            </div>
          </div>

          <div className="space-y-12">
            {/* Veri Toplama */}
            <section
              id="veri-toplama"
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center mb-6">
                <DocumentTextIcon className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  1. Topladığımız Veriler
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Kişisel Bilgiler
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Ad, soyad ve iletişim bilgileri</li>
                    <li>• E-posta adresi ve telefon numarası</li>
                    <li>• Teslimat ve faturalandırma adresleri</li>
                    <li>• Doğum tarihi ve cinsiyet (isteğe bağlı)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    İşlem Bilgileri
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Sipariş geçmişi ve satın alma bilgileri</li>
                    <li>• Ödeme bilgileri (güvenli şekilde işlenir)</li>
                    <li>• Kargo ve teslimat tercihleri</li>
                    <li>• İade ve değişim talepleri</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Teknik Bilgiler
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• IP adresi ve tarayıcı bilgileri</li>
                    <li>• Cihaz türü ve işletim sistemi</li>
                    <li>• Site kullanım istatistikleri</li>
                    <li>• Çerezler ve benzeri teknolojiler</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Veri Kullanımı */}
            <section
              id="veri-kullanimi"
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center mb-6">
                <EyeIcon className="w-8 h-8 text-emerald-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  2. Verileri Nasıl Kullanırız
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Hizmet Sunumu
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Siparişlerinizi işleme alma ve teslimat</li>
                    <li>• Müşteri hizmetleri desteği sağlama</li>
                    <li>• Hesap yönetimi ve güvenlik</li>
                    <li>• Ödemelerinizi güvenli şekilde işleme</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    İletişim
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Sipariş durumu bildirimleri</li>
                    <li>• Promosyon ve kampanya duyuruları (izinle)</li>
                    <li>• Önemli hesap güncellemeleri</li>
                    <li>• Müşteri memnuniyeti anketleri</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Geliştirme
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Site performansını iyileştirme</li>
                    <li>• Kişiselleştirilmiş deneyim sunma</li>
                    <li>• Güvenlik önlemlerini geliştirme</li>
                    <li>• Analiz ve istatistik çalışmaları</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Veri Koruma */}
            <section
              id="veri-koruma"
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center mb-6">
                <LockClosedIcon className="w-8 h-8 text-purple-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  3. Veri Güvenliği
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Güvenlik Önlemleri
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• SSL şifreleme ile veri iletimi</li>
                    <li>• Güvenli sunucu altyapısı</li>
                    <li>• Düzenli güvenlik denetimleri</li>
                    <li>• Erişim kontrolü ve yetkilendirme</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Veri Saklama
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Veriler sadece gerekli süre boyunca saklanır</li>
                    <li>• Yasal yükümlülükler çerçevesinde arşivleme</li>
                    <li>• Güvenli silme prosedürleri</li>
                    <li>• Düzenli veri temizliği</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Üçüncü Taraflar
                  </h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Kargo şirketleri (sadece teslimat için)</li>
                    <li>• Ödeme hizmet sağlayıcıları</li>
                    <li>• Yasal yükümlülük durumları</li>
                    <li>• Analitik hizmet sağlayıcıları (anonim)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Haklarınız */}
            <section
              id="haklariniz"
              className="bg-white rounded-2xl shadow-lg p-8"
            >
              <div className="flex items-center mb-6">
                <ShieldCheckIcon className="w-8 h-8 text-orange-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  4. KVKK Haklarınız
                </h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Erişim Hakkı
                    </h3>
                    <p className="text-gray-700 text-sm">
                      Kişisel verilerinizin işlenip işlenmediğini öğrenme ve
                      işleniyorsa bilgi talep etme hakkınız vardır.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Düzeltme Hakkı
                    </h3>
                    <p className="text-gray-700 text-sm">
                      Yanlış veya eksik verilerinizin düzeltilmesini talep
                      edebilirsiniz.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Silme Hakkı
                    </h3>
                    <p className="text-gray-700 text-sm">
                      Kişisel verilerinizin silinmesini isteyebilirsiniz.
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      İtiraz Hakkı
                    </h3>
                    <p className="text-gray-700 text-sm">
                      Verilerinizin işlenmesine itiraz edebilirsiniz.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">
                    Hak Talebinde Bulunma
                  </h3>
                  <p className="text-blue-800 mb-4">
                    KVKK haklarınızı kullanmak için bizimle iletişime
                    geçebilirsiniz:
                  </p>
                  <div className="space-y-2 text-blue-800 text-sm">
                    <p>• E-posta: kvkk@anda.com</p>
                    <p>• Telefon: +90 (500) 123 45 67</p>
                    <p>
                      • Adres: Maslak Mahallesi, Ahi Evran Caddesi No:4/8, 34485
                      Sarıyer/İstanbul
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Çerezler */}
            <section className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                5. Çerezler (Cookies)
              </h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Çerez Türleri
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Zorunlu Çerezler
                      </h4>
                      <p className="text-sm text-gray-600">
                        Site işlevselliği için gerekli
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Analitik Çerezler
                      </h4>
                      <p className="text-sm text-gray-600">
                        Site performansını ölçmek için
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Pazarlama Çerezleri
                      </h4>
                      <p className="text-sm text-gray-600">
                        Kişiselleştirilmiş reklamlar için
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Çerez Yönetimi
                  </h3>
                  <p className="text-gray-700 mb-4">
                    Tarayıcı ayarlarınızdan çerezleri yönetebilir, silebilir
                    veya engelleyebilirsiniz. Ancak bazı çerezleri engellemek
                    site işlevselliğini etkileyebilir.
                  </p>
                </div>
              </div>
            </section>

            {/* İletişim */}
            <section className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-6">6. İletişim</h2>

              <div className="space-y-4">
                <p className="text-blue-100">
                  Gizlilik politikamız ile ilgili sorularınız için bizimle
                  iletişime geçebilirsiniz:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Veri Sorumlusu</h3>
                    <p className="text-blue-100 text-sm">
                      ANDA E-Ticaret A.Ş.
                      <br />
                      Maslak Mahallesi, Ahi Evran Caddesi No:4/8
                      <br />
                      34485 Sarıyer/İstanbul
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">İletişim Bilgileri</h3>
                    <p className="text-blue-100 text-sm">
                      E-posta: kvkk@anda.com
                      <br />
                      Telefon: +90 (500) 123 45 67
                      <br />
                      Web: www.anda.com/privacy
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Navigation Links */}
          <div className="mt-16 flex justify-center space-x-6 text-sm">
            <Link to="/terms" className="text-blue-600 hover:text-blue-800">
              Kullanım Koşulları
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/contact" className="text-blue-600 hover:text-blue-800">
              İletişim
            </Link>
            <span className="text-gray-400">•</span>
            <Link to="/help" className="text-blue-600 hover:text-blue-800">
              Yardım
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
