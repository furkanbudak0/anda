/* eslint-disable react/prop-types */
import { Helmet } from "react-helmet-async";
import {
  generateMetaTags,
  generateCanonicalUrl,
  generateJSONLD,
  DEFAULT_SEO,
} from "../utils/seo";

/**
 * SEO Component - React Helmet Async ile meta tag yönetimi
 * Her sayfaya özel SEO optimization
 */
export default function SEO({
  title,
  description,
  keywords,
  image,
  type = "website",
  product = null,
  schema = null,
  breadcrumbSchema = null,
  canonical = null,
  noIndex = false,
  children,
}) {
  // SEO data oluştur
  const seoData = {
    title: title ? `${title} | ${DEFAULT_SEO.siteName}` : DEFAULT_SEO.title,
    description: description || DEFAULT_SEO.description,
    keywords: keywords || DEFAULT_SEO.keywords,
    image: image || DEFAULT_SEO.image,
    url: canonical || DEFAULT_SEO.url,
    type,
    product,
  };

  // Meta tag'leri oluştur
  const metaTags = generateMetaTags(seoData);

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{seoData.title}</title>

      {/* Meta Tags */}
      {metaTags.map((tag, index) => {
        if (tag.property) {
          return (
            <meta key={index} property={tag.property} content={tag.content} />
          );
        }
        return <meta key={index} name={tag.name} content={tag.content} />;
      })}

      {/* Canonical URL */}
      {canonical && (
        <link rel="canonical" href={generateCanonicalUrl(canonical)} />
      )}

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}

      {/* Viewport for mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />

      {/* Schema.org JSON-LD */}
      {schema && (
        <script type="application/ld+json">{generateJSONLD(schema)}</script>
      )}

      {/* Breadcrumb Schema */}
      {breadcrumbSchema && (
        <script type="application/ld+json">
          {generateJSONLD(breadcrumbSchema)}
        </script>
      )}

      {/* Additional head elements */}
      {children}
    </Helmet>
  );
}

/**
 * Specialized SEO components
 */

/**
 * Homepage SEO
 */
export function HomepageSEO() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: DEFAULT_SEO.siteName,
    url: DEFAULT_SEO.url,
    description: DEFAULT_SEO.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${DEFAULT_SEO.url}/products?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <SEO
      title="Ana Sayfa"
      description={DEFAULT_SEO.description}
      keywords={DEFAULT_SEO.keywords}
      canonical="/"
      schema={schema}
    />
  );
}

/**
 * Product Page SEO
 */
export function ProductSEO({ product, category, seller, reviews = [] }) {
  if (!product) return null;

  const title = `${product.name}${category ? ` - ${category.name}` : ""}`;
  const description = `${
    product.name
  } ürününü ANDA'dan satın alın. ${product.description?.substring(
    0,
    150
  )}... ✓ Güvenli Ödeme ✓ Hızlı Kargo ✓ İade Garantisi`;
  const keywords = `${product.name}, ${category?.name || ""}, ${
    product.brand || ""
  }, online satın al, e-ticaret`;
  const image = product.image_url || product.images?.[0];

  // Product Schema
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images || [product.image_url],
    brand: {
      "@type": "Brand",
      name: product.brand || seller?.business_name || "ANDA",
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

  // Add reviews to schema
  if (reviews.length > 0) {
    const avgRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: avgRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      image={image}
      type="product"
      canonical={`/product/${product.slug}`}
      product={{
        name: product.name,
        price: product.discounted_price || product.price,
        currency: "TRY",
        brand: product.brand,
        availability: product.stock_quantity > 0 ? "in_stock" : "out_of_stock",
        condition: "new",
      }}
      schema={productSchema}
    />
  );
}

/**
 * Category Page SEO
 */
export function CategorySEO({ category, filters = {}, products = [] }) {
  if (!category) return null;

  const filterText = Object.keys(filters).length > 0 ? " - Filtrelenmiş" : "";
  const title = `${category.name} Ürünleri${filterText}`;
  const description = `${
    category.name
  } kategorisindeki en kaliteli ürünleri ANDA'da keşfedin. ${
    category.description || ""
  } ✓ Güvenli Alışveriş ✓ Hızlı Teslimat. ${products.length} ürün bulundu.`;
  const keywords = `${category.name}, ${category.name} ürünleri, online alışveriş, e-ticaret`;

  const categorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: description,
    url: `${DEFAULT_SEO.url}/category/${category.slug}`,
  };

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      canonical={`/category/${category.slug}`}
      schema={categorySchema}
    />
  );
}

/**
 * Seller Profile SEO
 */
export function SellerSEO({ seller, products = [] }) {
  if (!seller) return null;

  const title = `${seller.business_name || seller.store_name} - Satıcı Profili`;
  const description = `${
    seller.business_name || seller.store_name
  } satıcısının ${products.length} ürününü ANDA'da keşfedin. ${
    seller.bio || ""
  } ✓ Güvenilir Satıcı ✓ Kaliteli Ürünler`;
  const keywords = `${seller.business_name}, ${seller.store_name}, satıcı, mağaza, online alışveriş`;

  const sellerSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seller.business_name || seller.store_name,
    description: seller.bio,
    url: `${DEFAULT_SEO.url}/seller/${seller.slug}`,
    logo: seller.avatar_url,
    image: seller.banner_url,
  };

  return (
    <SEO
      title={title}
      description={description}
      keywords={keywords}
      image={seller.avatar_url || seller.banner_url}
      canonical={`/seller/${seller.slug}`}
      schema={sellerSchema}
    />
  );
}

/**
 * Blog/Article SEO
 */
export function ArticleSEO({ article }) {
  if (!article) return null;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: article.image,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: DEFAULT_SEO.siteName,
      logo: {
        "@type": "ImageObject",
        url: `${DEFAULT_SEO.url}/images/logo.png`,
      },
    },
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
  };

  return (
    <SEO
      title={article.title}
      description={article.description}
      keywords={article.keywords}
      image={article.image}
      type="article"
      canonical={`/blog/${article.slug}`}
      schema={articleSchema}
    />
  );
}

/**
 * Terms Page SEO
 */
export function TermsSEO() {
  return (
    <SEO
      title="Kullanım Şartları"
      description="ANDA e-ticaret platformunun kullanım şartları ve koşulları. Platform kullanımı, alışveriş kuralları ve satıcı yükümlülükler hakkında detaylı bilgi."
      keywords="kullanım şartları, şartlar ve koşullar, hukuki belgeler, ANDA"
      type="article"
      canonical="/terms"
    />
  );
}

/**
 * Forgot Password Page SEO
 */
export function ForgotPasswordSEO() {
  return (
    <SEO
      title="Şifremi Unuttum"
      description="ANDA hesabınızın şifresini sıfırlayın. Güvenli şifre sıfırlama işlemi için e-posta adresinizi girin."
      keywords="şifre sıfırlama, şifremi unuttum, hesap kurtarma, ANDA"
      type="webpage"
      canonical="/forgot-password"
    />
  );
}
