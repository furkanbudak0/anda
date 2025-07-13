import { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  EnvelopeIcon,
  QuestionMarkCircleIcon,
  ShoppingCartIcon,
  TruckIcon,
  CreditCardIcon,
  UserIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import NavBar from "../components/NavBar";
import { Link } from "react-router-dom";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const helpCategories = [
    {
      id: "orders",
      title: "Siparişler",
      icon: ShoppingCartIcon,
      color: "bg-blue-500",
      description: "Sipariş verme, takip etme ve iptal işlemleri",
      count: 12,
    },
    {
      id: "shipping",
      title: "Kargo & Teslimat",
      icon: TruckIcon,
      color: "bg-emerald-500",
      description: "Kargo süreçleri, teslimat zamanları ve ücretleri",
      count: 8,
    },
    {
      id: "payment",
      title: "Ödeme",
      icon: CreditCardIcon,
      color: "bg-purple-500",
      description: "Ödeme yöntemleri, faturalandırma ve iadeler",
      count: 15,
    },
    {
      id: "account",
      title: "Hesap Yönetimi",
      icon: UserIcon,
      color: "bg-orange-500",
      description: "Profil ayarları, şifre değişimi ve hesap güvenliği",
      count: 10,
    },
    {
      id: "security",
      title: "Güvenlik",
      icon: ShieldCheckIcon,
      color: "bg-red-500",
      description: "Güvenli alışveriş, gizlilik ve veri koruma",
      count: 6,
    },
    {
      id: "seller",
      title: "Satıcı Destek",
      icon: QuestionMarkCircleIcon,
      color: "bg-indigo-500",
      description: "Satıcı hesabı oluşturma ve mağaza yönetimi",
      count: 20,
    },
  ];

  const faqData = [
    {
      id: 1,
      category: "orders",
      question: "Nasıl sipariş verebilirim?",
      answer:
        "Ürünü seçtikten sonra 'Sepete Ekle' butonuna tıklayın. Sepetinizi kontrol edin ve 'Ödemeye Geç' butonuna basarak sipariş sürecini tamamlayın. Ödeme bilgilerinizi girdikten sonra siparişiniz onaylanacaktır.",
    },
    {
      id: 2,
      category: "orders",
      question: "Siparişimi nasıl takip edebilirim?",
      answer:
        "Hesabınıza giriş yaparak 'Siparişlerim' bölümünden takip kodunuzu görebilirsiniz. Ayrıca e-posta ile gönderilen takip linkini de kullanabilirsiniz.",
    },
    {
      id: 3,
      category: "shipping",
      question: "Kargo ücreti ne kadar?",
      answer:
        "150₺ ve üzeri alışverişlerde kargo ücretsizdir. 150₺ altındaki siparişler için kargo ücreti 15₺'dir. Hızlı kargo seçeneği için ek 10₺ ücret alınır.",
    },
    {
      id: 4,
      category: "shipping",
      question: "Ne kadar sürede teslim alırım?",
      answer:
        "Standart kargo 2-4 iş günü, hızlı kargo 1-2 iş günü içinde teslim edilir. Özel günlerde (bayram, kampanya dönemleri) teslimat süreleri uzayabilir.",
    },
    {
      id: 5,
      category: "payment",
      question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
      answer:
        "Kredi kartı, banka kartı, kapıda ödeme ve havale/EFT ile ödeme yapabilirsiniz. Tüm kartlar için 3D Secure güvenlik sistemi kullanılmaktadır.",
    },
    {
      id: 6,
      category: "payment",
      question: "İade sürecim nasıl işler?",
      answer:
        "Ürünü teslim aldıktan sonra 14 gün içinde iade edebilirsiniz. Ürün orijinal ambalajında ve kullanılmamış olmalıdır. İade sürecini hesabınızdan başlatabilirsiniz.",
    },
    {
      id: 7,
      category: "account",
      question: "Şifremi unuttum, ne yapmalıyım?",
      answer:
        "Giriş sayfasında 'Şifremi Unuttum' linkine tıklayın. E-posta adresinizi girin ve size gönderilen link ile yeni şifre oluşturun.",
    },
    {
      id: 8,
      category: "security",
      question: "Kişisel bilgilerim güvende mi?",
      answer:
        "Evet, tüm kişisel bilgileriniz SSL şifreleme ile korunmaktadır. KVKK ve GDPR uyumlu olarak verilerinizi işliyoruz ve üçüncü taraflarla paylaşmıyoruz.",
    },
  ];

  const filteredFaqs = faqData.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="pt-32 pb-16">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Size Nasıl Yardımcı Olabiliriz?
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Aradığınız cevabı hızlıca bulun veya destek ekibimizle iletişime
              geçin
            </p>

            {/* Search Bar */}
            <div className="relative max-w-2xl mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Sorunuzu buraya yazın..."
                className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Hızlı Erişim
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link
                to="/contact"
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  Canlı Destek
                </h3>
                <p className="text-gray-600 text-center">
                  7/24 uzmanlarımızla anlık sohbet edin
                </p>
              </Link>

              <a
                href="tel:+905001234567"
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mx-auto mb-4 group-hover:bg-emerald-200 transition-colors">
                  <PhoneIcon className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  Telefon Desteği
                </h3>
                <p className="text-gray-600 text-center">
                  (500) 123 45 67 numarasından arayın
                </p>
              </a>

              <a
                href="mailto:destek@anda.com"
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <EnvelopeIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  E-posta
                </h3>
                <p className="text-gray-600 text-center">
                  destek@anda.com adresine yazın
                </p>
              </a>
            </div>
          </div>

          {/* Help Categories */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Yardım Kategorileri
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {helpCategories.map((category) => (
                <div
                  key={category.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`${category.color} p-3 rounded-xl group-hover:scale-110 transition-transform`}
                    >
                      <category.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {category.title}
                        </h3>
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {category.count} makale
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mt-2">
                        {category.description}
                      </p>
                      <div className="flex items-center text-blue-600 text-sm mt-3 group-hover:text-blue-800">
                        <span>Daha fazla</span>
                        <ChevronRightIcon className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
              Sık Sorulan Sorular
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-4">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg font-medium text-gray-900">
                        {faq.question}
                      </span>
                      <ChevronDownIcon
                        className={`w-5 h-5 text-gray-500 transition-transform ${
                          openFaq === faq.id ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openFaq === faq.id && (
                      <div className="px-6 pb-4">
                        <div className="border-t pt-4">
                          <p className="text-gray-700 leading-relaxed">
                            {faq.answer}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredFaqs.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <QuestionMarkCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    Aradığınız soruyu bulamadık
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Farklı anahtar kelimeler deneyin veya destek ekibimizle
                    iletişime geçin
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                    Destek Ekibiyle İletişime Geç
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Contact CTA */}
          <div className="mt-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              Hala cevap bulamadınız mı?
            </h3>
            <p className="text-blue-100 mb-6 text-lg">
              Destek ekibimiz size yardımcı olmak için 7/24 burada
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-3 bg-white text-blue-600 font-medium rounded-xl hover:bg-gray-100 transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              İletişime Geç
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
