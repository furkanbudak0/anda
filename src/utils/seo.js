/**
 * SEO UTILITIES - Meta Tags & Schema Markup
 * Dynamic SEO management for ANDA E-commerce Platform
 */

// Site varsayılan SEO bilgileri
export const DEFAULT_SEO = {
  title: "ANDA - Premium E-ticaret Platformu",
  description:
    "ANDA'da binlerce kaliteli ürün, güvenli alışveriş ve hızlı teslimat. En iyi fiyatlarla alışverişin keyfini çıkarın.",
  keywords: "e-ticaret, online alışveriş, anda, kaliteli ürün, güvenli ödeme",
  image: "/images/og-default.jpg",
  url: "https://anda.com.tr",
  siteName: "ANDA",
  twitterCard: "summary_large_image",
  type: "website",
};

/**
 * Sayfa için dinamik SEO metadataları oluşturur
 */
export function generateSEOData({
  title,
  description,
  keywords,
  image,
  url,
  type = "website",
  article = null,
  product = null,
  organization = null,
}) {
  const seoTitle = title
    ? `${title} | ${DEFAULT_SEO.siteName}`
    : DEFAULT_SEO.title;
  const seoDescription = description || DEFAULT_SEO.description;
  const seoKeywords = keywords
    ? `${keywords}, ${DEFAULT_SEO.keywords}`
    : DEFAULT_SEO.keywords;
  const seoImage = image || DEFAULT_SEO.image;
  const seoUrl = url || DEFAULT_SEO.url;

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    image: seoImage,
    url: seoUrl,
    type,
    article,
    product,
    organization,
  };
}

/**
 * Ürün sayfası için SEO verisi
 */
export function generateProductSEO(product, category) {
  const title = `${product.name} - ${category?.name || "Ürünler"}`;
  const description = `${
    product.name
  } ürününü ANDA'dan satın alın. ${product.description?.substring(
    0,
    150
  )}... ✓ Güvenli Ödeme ✓ Hızlı Kargo ✓ İade Garantisi`;
  const keywords = `${product.name}, ${category?.name || ""}, ${
    product.brand || ""
  }, online satın al, e-ticaret`;
  const image = product.image_url || product.images?.[0] || DEFAULT_SEO.image;
  const price = product.price || product.discounted_price;

  return generateSEOData({
    title,
    description,
    keywords,
    image,
    type: "product",
    product: {
      name: product.name,
      description: product.description,
      image,
      price,
      currency: "TRY",
      brand: product.brand,
      category: category?.name,
      availability: product.stock_quantity > 0 ? "in_stock" : "out_of_stock",
      condition: "new",
      sku: product.sku,
      rating: product.rating,
      reviewCount: product.review_count,
    },
  });
}

/**
 * Kategori sayfası için SEO verisi
 */
export function generateCategorySEO(category, filters = {}) {
  const filterText = Object.keys(filters).length > 0 ? " - Filtrelenmiş" : "";
  const title = `${category.name} Ürünleri${filterText}`;
  const description = `${
    category.name
  } kategorisindeki en kaliteli ürünleri ANDA'da keşfedin. ${
    category.description || ""
  } ✓ Güvenli Alışveriş ✓ Hızlı Teslimat`;
  const keywords = `${category.name}, ${category.name} ürünleri, online alışveriş, e-ticaret`;

  return generateSEOData({
    title,
    description,
    keywords,
    type: "category",
  });
}

/**
 * Satıcı profili için SEO verisi
 */
export function generateSellerSEO(seller) {
  const title = `${seller.business_name || seller.store_name} - Satıcı Profili`;
  const description = `${
    seller.business_name || seller.store_name
  } satıcısının ürünlerini ANDA'da keşfedin. ${
    seller.bio || ""
  } ✓ Güvenilir Satıcı ✓ Kaliteli Ürünler`;
  const keywords = `${seller.business_name}, ${seller.store_name}, satıcı, mağaza, online alışveriş`;

  return generateSEOData({
    title,
    description,
    keywords,
    image: seller.avatar_url || seller.banner_url,
    type: "profile",
    organization: {
      name: seller.business_name || seller.store_name,
      description: seller.bio,
      image: seller.avatar_url,
      url: `/seller/${seller.slug}`,
    },
  });
}

/**
 * Schema.org Product markup
 */
export function generateProductSchema(product, seller, reviews = []) {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images || [product.image_url],
    brand: {
      "@type": "Brand",
      name: product.brand || seller?.business_name,
    },
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: product.discounted_price || product.price,
      priceCurrency: "TRY",
      availability:
        product.stock_quantity > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: seller?.business_name || "ANDA",
      },
    },
  };

  // Add aggregateRating if reviews exist
  if (reviews.length > 0) {
    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

/**
 * Schema.org Organization markup
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ANDA",
    url: "https://anda.com.tr",
    logo: "https://anda.com.tr/images/logo.png",
    description: "Türkiye'nin güvenilir e-ticaret platformu",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+90-212-000-0000",
      contactType: "customer service",
      email: "destek@anda.com.tr",
    },
    sameAs: [
      "https://facebook.com/anda",
      "https://instagram.com/anda",
      "https://twitter.com/anda",
    ],
  };
}

/**
 * Schema.org BreadcrumbList markup
 */
export function generateBreadcrumbSchema(breadcrumbs) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: `https://anda.com.tr${crumb.path}`,
    })),
  };
}

/**
 * Schema.org WebSite markup (arama için)
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "ANDA",
    url: "https://anda.com.tr",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://anda.com.tr/products?search={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Meta tag helper - Helmet için
 */
export function generateMetaTags(seoData) {
  const tags = [
    // Basic Meta Tags
    { name: "description", content: seoData.description },
    { name: "keywords", content: seoData.keywords },

    // Open Graph
    { property: "og:title", content: seoData.title },
    { property: "og:description", content: seoData.description },
    { property: "og:image", content: seoData.image },
    { property: "og:url", content: seoData.url },
    { property: "og:type", content: seoData.type },
    { property: "og:site_name", content: DEFAULT_SEO.siteName },

    // Twitter Card
    { name: "twitter:card", content: DEFAULT_SEO.twitterCard },
    { name: "twitter:title", content: seoData.title },
    { name: "twitter:description", content: seoData.description },
    { name: "twitter:image", content: seoData.image },
  ];

  // Product-specific tags
  if (seoData.product) {
    tags.push(
      { property: "product:price:amount", content: seoData.product.price },
      { property: "product:price:currency", content: seoData.product.currency },
      { property: "product:brand", content: seoData.product.brand },
      {
        property: "product:availability",
        content: seoData.product.availability,
      },
      { property: "product:condition", content: seoData.product.condition }
    );
  }

  return tags;
}

/**
 * Canonical URL generator
 */
export function generateCanonicalUrl(path, baseUrl = DEFAULT_SEO.url) {
  return `${baseUrl}${path}`;
}

/**
 * JSON-LD script tag generator
 */
export function generateJSONLD(schema) {
  return JSON.stringify(schema, null, 2);
}
