/**
 * ANDA E-COMMERCE PLATFORM CATEGORIES
 * Simplified category structure with 4-5 subcategories per main category
 */

export const categories = [
  {
    name: "Kadın",
    slug: "kadin",
    description: "Kadın giyim ve aksesuarları",
    icon: "👗",
    subcategories: [
      {
        name: "Elbise",
        slug: "elbise",
        description: "Günlük ve özel gün elbiseleri",
      },
      {
        name: "Üst Giyim",
        slug: "ust-giyim",
        description: "Bluz, gömlek, t-shirt",
      },
      {
        name: "Alt Giyim",
        slug: "alt-giyim",
        description: "Pantolon, etek, şort",
      },
      {
        name: "Dış Giyim",
        slug: "dis-giyim",
        description: "Ceket, mont, hırka",
      },
      {
        name: "İç Giyim",
        slug: "ic-giyim",
        description: "Sütyeni, külot, pijama",
      },
    ],
  },
  {
    name: "Erkek",
    slug: "erkek",
    description: "Erkek giyim ve aksesuarları",
    icon: "👔",
    subcategories: [
      {
        name: "Gömlek",
        slug: "gomlek",
        description: "Klasik ve günlük gömlekler",
      },
      {
        name: "T-Shirt",
        slug: "t-shirt",
        description: "Basic ve baskılı t-shirtler",
      },
      {
        name: "Pantolon",
        slug: "pantolon",
        description: "Kumaş pantolon, jean, eşofman",
      },
      {
        name: "Dış Giyim",
        slug: "dis-giyim",
        description: "Ceket, mont, sweatshirt",
      },
      {
        name: "İç Giyim",
        slug: "ic-giyim",
        description: "Atlet, boxer, çorap",
      },
    ],
  },
  {
    name: "Çocuk",
    slug: "cocuk",
    description: "Çocuk giyim ve oyuncakları",
    icon: "👶",
    subcategories: [
      {
        name: "Kız Çocuk",
        slug: "kiz-cocuk",
        description: "0-16 yaş kız çocuk giyim",
      },
      {
        name: "Erkek Çocuk",
        slug: "erkek-cocuk",
        description: "0-16 yaş erkek çocuk giyim",
      },
      {
        name: "Bebek",
        slug: "bebek",
        description: "0-2 yaş bebek ürünleri",
      },
      {
        name: "Oyuncak",
        slug: "oyuncak",
        description: "Eğitici ve eğlenceli oyuncaklar",
      },
    ],
  },
  {
    name: "Ayakkabı",
    slug: "ayakkabi",
    description: "Kadın, erkek ve çocuk ayakkabıları",
    icon: "👠",
    subcategories: [
      {
        name: "Kadın Ayakkabı",
        slug: "kadin-ayakkabi",
        description: "Topuklu, casual, spor ayakkabı",
      },
      {
        name: "Erkek Ayakkabı",
        slug: "erkek-ayakkabi",
        description: "Klasik, casual, spor ayakkabı",
      },
      {
        name: "Çocuk Ayakkabı",
        slug: "cocuk-ayakkabi",
        description: "İlk adım, okul, spor ayakkabısı",
      },
      {
        name: "Spor Ayakkabı",
        slug: "spor-ayakkabi",
        description: "Koşu, fitness, basketbol ayakkabısı",
      },
      {
        name: "Outdoor",
        slug: "outdoor",
        description: "Bot, çizme, trekking ayakkabısı",
      },
    ],
  },
  {
    name: "Çanta",
    slug: "canta",
    description: "El çantası, sırt çantası ve valiz",
    icon: "👜",
    subcategories: [
      {
        name: "Kadın Çanta",
        slug: "kadin-canta",
        description: "El çantası, omuz çantası, clutch",
      },
      {
        name: "Erkek Çanta",
        slug: "erkek-canta",
        description: "Evrak çantası, deri çanta, cüzdan",
      },
      {
        name: "Sırt Çantası",
        slug: "sirt-cantasi",
        description: "Okul, spor, günlük sırt çantası",
      },
      {
        name: "Valiz",
        slug: "valiz",
        description: "Kabin, orta, büyük boy valiz",
      },
    ],
  },
  {
    name: "Aksesuar",
    slug: "aksesuar",
    description: "Takı, saat ve aksesuarlar",
    icon: "💎",
    subcategories: [
      {
        name: "Takı",
        slug: "taki",
        description: "Kolye, küpe, yüzük, bilezik",
      },
      {
        name: "Saat",
        slug: "saat",
        description: "Kadın, erkek, akıllı saatler",
      },
      {
        name: "Gözlük",
        slug: "gozluk",
        description: "Güneş gözlüğü, optik gözlük",
      },
      {
        name: "Şapka",
        slug: "sapka",
        description: "Bere, şapka, kasket",
      },
      {
        name: "Kemer",
        slug: "kemer",
        description: "Deri kemer, kumaş kemer",
      },
    ],
  },
  {
    name: "Kozmetik",
    slug: "kozmetik",
    description: "Güzellik ve kişisel bakım",
    icon: "💄",
    subcategories: [
      {
        name: "Makyaj",
        slug: "makyaj",
        description: "Ruj, far, fondöten, maskara",
      },
      {
        name: "Cilt Bakım",
        slug: "cilt-bakim",
        description: "Temizlik, nemlendirici, serum",
      },
      {
        name: "Saç Bakım",
        slug: "sac-bakim",
        description: "Şampuan, saç kremi, serum",
      },
      {
        name: "Parfüm",
        slug: "parfum",
        description: "Kadın, erkek, unisex parfüm",
      },
    ],
  },
  {
    name: "Elektronik",
    slug: "elektronik",
    description: "Teknoloji ürünleri",
    icon: "📱",
    subcategories: [
      {
        name: "Telefon",
        slug: "telefon",
        description: "Akıllı telefon, aksesuar",
      },
      {
        name: "Bilgisayar",
        slug: "bilgisayar",
        description: "Laptop, tablet, aksesuar",
      },
      {
        name: "Ses Sistemi",
        slug: "ses-sistemi",
        description: "Kulaklık, hoparlör, ses sistemi",
      },
      {
        name: "Oyun",
        slug: "oyun",
        description: "Konsol, oyun, aksesuar",
      },
    ],
  },
  {
    name: "Ev & Yaşam",
    slug: "ev-yasam",
    description: "Ev dekorasyonu ve yaşam",
    icon: "🏠",
    subcategories: [
      {
        name: "Dekorasyon",
        slug: "dekorasyon",
        description: "Tablo, vazo, süs eşyası",
      },
      {
        name: "Mutfak",
        slug: "mutfak",
        description: "Mutfak gereçleri, pişirme",
      },
      {
        name: "Banyo",
        slug: "banyo",
        description: "Banyo aksesuarları, havlu",
      },
      {
        name: "Yatak Odası",
        slug: "yatak-odasi",
        description: "Yatak örtüsü, yastık, nevresim",
      },
      {
        name: "Aydınlatma",
        slug: "aydinlatma",
        description: "Avize, lamba, aydınlatma",
      },
    ],
  },
  {
    name: "Spor",
    slug: "spor",
    description: "Spor ve outdoor ürünleri",
    icon: "⚽",
    subcategories: [
      {
        name: "Fitness",
        slug: "fitness",
        description: "Spor aleti, protein, vitamin",
      },
      {
        name: "Outdoor",
        slug: "outdoor",
        description: "Kamp, trekking, doğa sporları",
      },
      {
        name: "Takım Sporları",
        slug: "takim-sporlari",
        description: "Futbol, basketbol, voleybol",
      },
      {
        name: "Su Sporları",
        slug: "su-sporlari",
        description: "Yüzme, dalış, su sporları",
      },
    ],
  },
];

// Helper functions
export const getCategoryBySlug = (slug) => {
  return categories.find((cat) => cat.slug === slug);
};

export const getSubcategoryBySlug = (categorySlug, subcategorySlug) => {
  const category = getCategoryBySlug(categorySlug);
  return category?.subcategories?.find((sub) => sub.slug === subcategorySlug);
};

export const getAllSubcategories = () => {
  return categories.flatMap(
    (cat) =>
      cat.subcategories?.map((sub) => ({
        ...sub,
        categoryName: cat.name,
        categorySlug: cat.slug,
      })) || []
  );
};

// Special categories for navigation
export const SPECIAL_CATEGORIES = [
  {
    name: "En Çok Satanlar",
    slug: "best-sellers",
    description: "En popüler ürünler",
    icon: "🔥",
    path: "/best-sellers",
  },
  {
    name: "Yeni Ürünler",
    slug: "new-arrivals",
    description: "Yeni eklenen ürünler",
    icon: "✨",
    path: "/new-arrivals",
  },
  {
    name: "Kampanyalar",
    slug: "campaigns",
    description: "İndirimli ürünler",
    icon: "🎯",
    path: "/campaigns",
  },
];

// Get categories formatted for navigation
export const getNavCategories = () => {
  return categories.map((category) => ({
    ...category,
    subcategories: category.subcategories?.slice(0, 8) || [], // Max 8 subcategory
  }));
};

export default categories;
