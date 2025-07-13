# Service Layer Organization Guide

## 📁 Dosya Yapısı

```
src/services/
├── index.js              # Merkezi export sistemi
├── supabase.js          # Supabase client configuration
├── apiAuth.js           # Authentication services
├── apiProducts.js       # Product-related services
├── apiSellers.js        # Seller-related services
├── getProductById.js    # Specific product lookup utility
└── README.md            # Bu dosya
```

## 🎯 Service Layer Prensipleri

### 1. Single Responsibility

- Her service dosyası tek bir domain'e odaklanır
- `apiAuth.js` - sadece authentication
- `apiProducts.js` - sadece ürün işlemleri
- `apiSellers.js` - sadece satıcı işlemleri

### 2. Consistent Error Handling

```javascript
// ✅ Doğru error handling
try {
  const { data, error } = await supabase.from("products").select("*");
  if (error) throw new Error(error.message);
  return data;
} catch (err) {
  throw new Error(`Product fetch failed: ${err.message}`);
}
```

### 3. Comprehensive JSDoc

```javascript
/**
 * Get products with filters, pagination, and sorting
 * @param {Object} options - Query options
 * @param {number} options.offset - Pagination offset
 * @param {number} options.limit - Items per page
 * @param {string} options.sortBy - Sort field
 * @returns {Promise<{products: Array, total: number, hasMore: boolean}>}
 */
async getProducts(options = {}) {
  // Implementation
}
```

## 🔄 Merkezi Export Sistemi

### Nasıl Kullanılır

```javascript
// ❌ Eski yöntem - direkt import
import { userSignup } from "../services/apiAuth";
import { apiProducts } from "../services/apiProducts";

// ✅ Yeni yöntem - merkezi import
import { userSignup, apiProducts, supabase } from "../services";

// ✅ Service discovery için
import { services, serviceHealthCheck } from "../services";
```

### Service Discovery

```javascript
// Tüm available service'leri görme
import { services } from "../services";
console.log(Object.keys(services)); // ['auth', 'products', 'sellers']

// Dynamic service loading
const authService = await services.auth.login();
```

## 📊 Health Check Sistemi

```javascript
import { serviceHealthCheck } from "../services";

// Service layer health kontrolü
const health = await serviceHealthCheck();
console.log(health.status); // 'healthy' | 'error'
```

## 🛠️ Service Layer Optimization İyileştirmeleri

### Tamamlanan

- ✅ Merkezi export sistemi (`index.js`)
- ✅ Service discovery mechanism
- ✅ Health check functionality
- ✅ Consistent error handling patterns
- ✅ Comprehensive documentation

### Gelecek İyileştirmeler

- 🔄 Service caching layer
- 🔄 Request deduplication
- 🔄 Service retry mechanisms
- 🔄 Performance monitoring
- 🔄 Service versioning

## 📋 Best Practices

### 1. Function Naming

- `get*` - Veri getirme işlemleri
- `create*` - Yeni kayıt oluşturma
- `update*` - Mevcut kayıt güncelleme
- `delete*` - Kayıt silme
- `bulk*` - Toplu işlemler

### 2. Parameter Validation

```javascript
const validateProductData = (product) => {
  if (!product.name || product.name.length < 3) {
    throw new Error("Ürün adı en az 3 karakter olmalıdır");
  }
  // Diğer validasyonlar...
};
```

### 3. Response Standardization

```javascript
// ✅ Consistent response format
return {
  data: results,
  total: count,
  hasMore: offset + limit < count,
  meta: {
    offset,
    limit,
    sortBy,
    sortOrder,
  },
};
```

### 4. Query Optimization

```javascript
// ✅ Efficient Supabase queries
const query = supabase
  .from("products")
  .select(
    `
    *,
    seller:sellers(business_name, logo_url),
    category:categories(name, slug)
  `
  )
  .eq("status", "active")
  .range(offset, offset + limit - 1);
```

## 🔍 Debugging ve Monitoring

### Development Mode Logging

```javascript
if (import.meta.env.DEV) {
  console.log("Service call:", { method: "getProducts", params });
}
```

### Error Tracking

```javascript
// Service error'ları centralized logging için
const logServiceError = (service, method, error, params) => {
  console.error(`[${service}] ${method} failed:`, {
    error: error.message,
    params,
    timestamp: new Date().toISOString(),
  });
};
```

## 📈 Performance Optimization

### 1. Query Caching

- React Query ile automatic caching
- Appropriate staleTime ve cacheTime ayarları

### 2. Batch Operations

```javascript
// ✅ Bulk operations için optimized
async bulkUpdateProducts(productIds, updates) {
  return supabase
    .from('products')
    .update(updates)
    .in('id', productIds);
}
```

### 3. Selective Loading

```javascript
// ✅ Sadece gerekli field'ları yükle
.select('id, name, price, image_url')
```

---

**Son Güncelleme:** 2024-12-01  
**Versiyon:** 1.0.0  
**Maintainer:** ANDA Development Team
