import { useState } from "react";

const FAQ = () => {
  const [faqs] = useState([
    {
      id: 1,
      question: "Siparişimi nasıl takip edebilirim?",
      answer:
        "Siparişinizi takip etmek için 'Sipariş Takip' sayfasını kullanabilir veya size gönderilen takip numarasını kullanabilirsiniz.",
      category: "siparis",
    },
    {
      id: 2,
      question: "İade işlemi nasıl yapılır?",
      answer:
        "İade işlemi için müşteri hizmetlerimizle iletişime geçebilir veya hesabınızdan sipariş detaylarına giderek iade talebinde bulunabilirsiniz.",
      category: "iade",
    },
    {
      id: 3,
      question: "Ödeme yöntemleri nelerdir?",
      answer:
        "Kredi kartı, banka kartı, havale/EFT ve kapıda ödeme seçeneklerini kullanabilirsiniz.",
      category: "odeme",
    },
    {
      id: 4,
      question: "Kargo ücreti ne kadar?",
      answer:
        "Kargo ücreti sipariş tutarınıza ve bulunduğunuz bölgeye göre değişiklik göstermektedir. Detaylı bilgi için kargo hesaplama aracını kullanabilirsiniz.",
      category: "kargo",
    },
    {
      id: 5,
      question: "Ürün garantisi var mı?",
      answer:
        "Evet, tüm ürünlerimiz için garanti hizmeti sunuyoruz. Garanti süresi ürün kategorisine göre değişiklik göstermektedir.",
      category: "garanti",
    },
  ]);

  const [activeCategory, setActiveCategory] = useState("tumu");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = [
    { id: "tumu", name: "Tümü" },
    { id: "siparis", name: "Sipariş" },
    { id: "odeme", name: "Ödeme" },
    { id: "kargo", name: "Kargo" },
    { id: "iade", name: "İade" },
    { id: "garanti", name: "Garanti" },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "tumu" || faq.category === activeCategory;
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Sık Sorulan Sorular
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Aradığınız cevabı bulamadıysanız bizimle iletişime geçebilirsiniz
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Sorunuzu yazın..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category.id
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {filteredFaqs.map((faq) => (
            <div
              key={faq.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <details className="group">
                <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {faq.question}
                  </h3>
                  <svg
                    className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-6 pb-6">
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </details>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredFaqs.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Sonuç bulunamadı
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Arama kriterlerinizi değiştirmeyi deneyin.
            </p>
          </div>
        )}

        {/* Contact Section */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Hala yardıma mı ihtiyacınız var?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Sorunuzun cevabını bulamadıysanız müşteri hizmetlerimizle iletişime
            geçebilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              İletişime Geç
            </a>
            <a
              href="/help"
              className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Yardım Merkezi
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
