-- =====================================================
-- ANDA E-COMMERCE PLATFORM - COMPLETE DATABASE SETUP
-- =====================================================
-- Bu dosya Supabase SQL Editor'da çalıştırılmalıdır
-- Tüm tablolar, indexler, RLS policies ve storage buckets içerir

-- =====================================================
-- 1. CLEANUP (Eğer varsa mevcut tabloları temizle)
-- =====================================================

-- Mevcut tabloları güvenli şekilde sil
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS admin_campaigns CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS wishlist_items CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS product_variants CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS seller_applications CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =====================================================
-- 2. CORE TABLES (Ana tablolar)
-- =====================================================

-- KULLANICI PROFİLLERİ
CREATE TABLE profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    full_name VARCHAR(100),
    phone VARCHAR(20),
    tc_id VARCHAR(11),
    birth_date DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending_verification')),
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    last_login TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ADMİNLER
CREATE TABLE admins (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    admin_level VARCHAR(20) DEFAULT 'admin' CHECK (admin_level IN ('admin', 'super_admin', 'moderator')),
    permissions TEXT[] DEFAULT '{}',
    department VARCHAR(50) DEFAULT 'Management',
    employee_id VARCHAR(50),
    access_level INT DEFAULT 3 CHECK (access_level BETWEEN 1 AND 5),
    emergency_contact JSONB DEFAULT '{}',
    notes TEXT,
    is_super_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by uuid REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SATICILAR
CREATE TABLE sellers (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(100) NOT NULL,
    business_slug VARCHAR(100) UNIQUE,
    business_type VARCHAR(50),
    phone VARCHAR(20),
    tax_id VARCHAR(20),
    website VARCHAR(255),
    logo_url TEXT,
    banner_url TEXT,
    description TEXT,
    categories TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'active', 'suspended', 'rejected')),
    verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    owner_first_name VARCHAR(100),
    owner_last_name VARCHAR(100),
    owner_email VARCHAR(255),
    owner_phone VARCHAR(20),
    owner_id_number VARCHAR(20),
    owner_dob DATE,
    bank_name VARCHAR(100),
    account_name VARCHAR(100),
    account_number VARCHAR(50),
    iban VARCHAR(34),
    swift_code VARCHAR(20),
    documents JSONB DEFAULT '{}',
    application_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
    rating NUMERIC(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    total_products INT DEFAULT 0,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SATICI BAŞVURULARI
CREATE TABLE seller_applications (
    id SERIAL PRIMARY KEY,
    seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
    business_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by uuid REFERENCES admins(id),
    review_notes TEXT,
    application_data JSONB DEFAULT '{}'
);

-- KATEGORİLER
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id INT REFERENCES categories(id) ON DELETE CASCADE,
    icon TEXT,
    color VARCHAR(20) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ÜRÜNLER
CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    regular_price NUMERIC(12,2) CHECK (regular_price >= 0),
    discount NUMERIC(5,2) DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    thumbnail TEXT,
    images TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft', 'deleted')),
    is_featured BOOLEAN DEFAULT FALSE,
    stock_quantity INT DEFAULT 0 CHECK (stock_quantity >= 0),
    sku VARCHAR(100),
    weight NUMERIC(8,2),
    dimensions JSONB DEFAULT '{}',
    seo_title VARCHAR(255),
    seo_description TEXT,
    search_keywords TEXT,
    average_rating NUMERIC(3,2) DEFAULT 0,
    total_reviews INT DEFAULT 0,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ÜRÜN VARYANTLARI
CREATE TABLE product_variants (
    id SERIAL PRIMARY KEY,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    sku VARCHAR(100) UNIQUE,
    price NUMERIC(12,2) CHECK (price >= 0),
    compare_at_price NUMERIC(12,2) CHECK (compare_at_price >= 0),
    quantity INT DEFAULT 0 CHECK (quantity >= 0),
    option1 VARCHAR(50),
    option2 VARCHAR(50),
    option3 VARCHAR(50),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SİPARİŞLER
CREATE TABLE orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
    order_number VARCHAR(20) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
    subtotal_amount NUMERIC(12,2) NOT NULL CHECK (subtotal_amount >= 0),
    tax_amount NUMERIC(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    shipping_cost NUMERIC(12,2) DEFAULT 0 CHECK (shipping_cost >= 0),
    shipping_address JSONB NOT NULL,
    billing_address JSONB NOT NULL,
    payment_method VARCHAR(50),
    payment_details JSONB DEFAULT '{}',
    is_express_checkout BOOLEAN DEFAULT FALSE,
    notes TEXT,
    tracking_number VARCHAR(50),
    estimated_delivery DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- SİPARİŞ KALEMLERİ
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    variant_id INT REFERENCES product_variants(id) ON DELETE SET NULL,
    seller_id uuid REFERENCES sellers(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
    product_name VARCHAR(255) NOT NULL,
    product_image TEXT,
    variant_details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- YORUMLAR
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(100),
    content TEXT,
    images TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    helpful_votes INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(product_id, user_id)
);

-- WISHLIST
CREATE TABLE wishlists (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE wishlist_items (
    id SERIAL PRIMARY KEY,
    wishlist_id INT REFERENCES wishlists(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    variant_id INT REFERENCES product_variants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(wishlist_id, product_id, variant_id)
);

-- SEPET
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    product_id uuid REFERENCES products(id) ON DELETE CASCADE,
    variant_id INT REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, product_id, variant_id)
);

-- KAMPANYALAR
CREATE TABLE admin_campaigns (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(30) CHECK (campaign_type IN ('discount', 'promotion', 'featured', 'seasonal')),
    target_audience JSONB DEFAULT '{}',
    discount_percentage NUMERIC(5,2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount NUMERIC(12,2) CHECK (discount_amount >= 0),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_uses INT,
    current_uses INT DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    priority_score INT DEFAULT 0,
    created_by uuid REFERENCES admins(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- NOTİFİKASYONLAR
CREATE TABLE admin_notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- AUDIT LOGS
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50),
    record_id TEXT,
    old_values JSONB,
    new_values JSONB,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- 3. INDEXES (Performance optimizasyonları)
-- =====================================================

-- Profiles indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Admins indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_admin_level ON admins(admin_level);
CREATE INDEX idx_admins_is_active ON admins(is_active);

-- Sellers indexes
CREATE INDEX idx_sellers_email ON sellers(email);
CREATE INDEX idx_sellers_business_slug ON sellers(business_slug);
CREATE INDEX idx_sellers_status ON sellers(status);
CREATE INDEX idx_sellers_verification_status ON sellers(verification_status);
CREATE INDEX idx_sellers_rating ON sellers(rating);

-- Products indexes
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created_at ON products(created_at);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('turkish', name || ' ' || COALESCE(description, '')));

-- Product variants indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_is_active ON product_variants(is_active);

-- Orders indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_seller_id ON order_items(seller_id);

-- Reviews indexes
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_status ON reviews(status);

-- Wishlist indexes
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlist_items_wishlist_id ON wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_product_id ON wishlist_items(product_id);

-- Cart indexes
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Admins policies
CREATE POLICY "Enable insert for authenticated users" ON admins
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view their own record" ON admins
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can update their own record" ON admins
    FOR UPDATE USING (auth.uid() = id);

-- Super admin'ler tüm admin kayıtlarını görebilir
CREATE POLICY "Super admins can view all admin records" ON admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_super_admin = true AND is_active = true
        )
    );

-- Sellers policies
CREATE POLICY "Enable insert for authenticated users" ON sellers
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Sellers can view their own data" ON sellers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Sellers can update their own data" ON sellers
    FOR UPDATE USING (auth.uid() = id);

-- Public sellers data (for product pages)
CREATE POLICY "Public can view active sellers" ON sellers
    FOR SELECT USING (status = 'active' AND verification_status = 'approved');

-- Products policies
CREATE POLICY "Anyone can view active products" ON products
    FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can manage their own products" ON products
    FOR ALL USING (seller_id = auth.uid());

-- Product variants policies
CREATE POLICY "Anyone can view active variants" ON product_variants
    FOR SELECT USING (is_active = true);

CREATE POLICY "Sellers can manage variants of their products" ON product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_variants.product_id AND seller_id = auth.uid()
        )
    );

-- Orders policies
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Sellers can view orders for their products" ON orders
    FOR SELECT USING (seller_id = auth.uid());

CREATE POLICY "Users can create their own orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Reviews policies
CREATE POLICY "Anyone can view approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (user_id = auth.uid());

-- Wishlist policies
CREATE POLICY "Users can manage their own wishlists" ON wishlists
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own wishlist items" ON wishlist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM wishlists 
            WHERE id = wishlist_items.wishlist_id AND user_id = auth.uid()
        )
    );

-- Cart policies
CREATE POLICY "Users can manage their own cart" ON cart_items
    FOR ALL USING (user_id = auth.uid());

-- Seller applications policies
CREATE POLICY "Sellers can create applications" ON seller_applications
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can view their own applications" ON seller_applications
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Admins can view all applications" ON seller_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Admin notifications policies
CREATE POLICY "System can insert notifications" ON admin_notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view notifications" ON admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Audit logs policies
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 5. TRIGGERS AND FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON sellers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON product_variants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wishlists_updated_at BEFORE UPDATE ON wishlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON cart_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_campaigns_updated_at BEFORE UPDATE ON admin_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
    counter INTEGER;
BEGIN
    -- Get current date in YYYYMMDD format
    order_num := to_char(now(), 'YYYYMMDD');
    
    -- Get count of orders for today
    SELECT COALESCE(COUNT(*), 0) + 1 INTO counter
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE;
    
    -- Format: YYYYMMDD-XXXX (4 digit counter)
    RETURN order_num || '-' || LPAD(counter::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Auto-generate business slug
CREATE OR REPLACE FUNCTION generate_business_slug(business_name TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    counter INTEGER := 1;
    base_slug TEXT;
BEGIN
    -- Convert to lowercase and replace spaces with hyphens
    base_slug := lower(regexp_replace(business_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    slug := base_slug;
    
    -- Check if slug exists and append counter if needed
    WHILE EXISTS (SELECT 1 FROM sellers WHERE business_slug = slug) LOOP
        slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- Auto-generate product slug
CREATE OR REPLACE FUNCTION generate_product_slug(product_name TEXT)
RETURNS TEXT AS $$
DECLARE
    slug TEXT;
    counter INTEGER := 1;
    base_slug TEXT;
BEGIN
    -- Convert to lowercase and replace spaces with hyphens
    base_slug := lower(regexp_replace(product_name, '[^a-zA-Z0-9\s]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    slug := base_slug;
    
    -- Check if slug exists and append counter if needed
    WHILE EXISTS (SELECT 1 FROM products WHERE slug = slug) LOOP
        slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN slug;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. STORAGE BUCKETS
-- =====================================================

-- Product images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Product thumbnails bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-thumbnails', 'product-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Seller avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('seller-avatars', 'seller-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- User avatars bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Review images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-images', 'review-images', true)
ON CONFLICT (id) DO NOTHING;

-- Category images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

-- Seller documents bucket (private)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('seller-documents', 'seller-documents', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 7. INITIAL DATA (Test verileri)
-- =====================================================

-- Insert default categories
INSERT INTO categories (name, slug, description, icon, color, sort_order) VALUES
('Elektronik', 'elektronik', 'Elektronik ürünler', '📱', '#3B82F6', 1),
('Giyim', 'giyim', 'Giyim ve moda ürünleri', '👕', '#10B981', 2),
('Ev & Yaşam', 'ev-yasam', 'Ev ve yaşam ürünleri', '🏠', '#F59E0B', 3),
('Spor', 'spor', 'Spor ve fitness ürünleri', '⚽', '#EF4444', 4),
('Kitap', 'kitap', 'Kitap ve yayınlar', '📚', '#8B5CF6', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert subcategories
INSERT INTO categories (name, slug, description, parent_id, icon, color, sort_order) VALUES
('Telefon', 'telefon', 'Cep telefonları', 1, '📱', '#3B82F6', 1),
('Bilgisayar', 'bilgisayar', 'Bilgisayar ve laptop', 1, '💻', '#3B82F6', 2),
('Erkek Giyim', 'erkek-giyim', 'Erkek giyim ürünleri', 2, '👔', '#10B981', 1),
('Kadın Giyim', 'kadin-giyim', 'Kadın giyim ürünleri', 2, '👗', '#10B981', 2),
('Mobilya', 'mobilya', 'Ev mobilyaları', 3, '🪑', '#F59E0B', 1),
('Dekorasyon', 'dekorasyon', 'Ev dekorasyon ürünleri', 3, '🖼️', '#F59E0B', 2)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 8. COMPLETION MESSAGE
-- =====================================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ ANDA E-COMMERCE DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '📊 Tables created: 16';
    RAISE NOTICE '🔐 RLS Policies: Enabled on all tables';
    RAISE NOTICE '⚡ Indexes: 25+ performance indexes';
    RAISE NOTICE '🪣 Storage Buckets: 7 buckets created';
    RAISE NOTICE '📁 Categories: 11 default categories';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Your e-commerce platform is ready!';
    RAISE NOTICE '💡 Next steps:';
    RAISE NOTICE '   1. Test user registration';
    RAISE NOTICE '   2. Test seller registration';
    RAISE NOTICE '   3. Add products and test functionality';
END $$; 