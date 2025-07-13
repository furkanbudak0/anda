-- =====================================================
-- RLS FIX FOR SIGNUP PROCESS
-- =====================================================
-- Bu dosya signup sırasında RLS problemlerini çözer

-- Önce mevcut policies'leri temizle
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

DROP POLICY IF EXISTS "Sellers can insert their own data" ON sellers;
DROP POLICY IF EXISTS "Sellers can view their own data" ON sellers;
DROP POLICY IF EXISTS "Sellers can update their own data" ON sellers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sellers;
DROP POLICY IF EXISTS "Public can view active sellers" ON sellers;

DROP POLICY IF EXISTS "Admins can insert their own record" ON admins;
DROP POLICY IF EXISTS "Admins can view their own record" ON admins;
DROP POLICY IF EXISTS "Admins can update their own record" ON admins;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admins;
DROP POLICY IF EXISTS "Super admins can view all admin records" ON admins;

DROP POLICY IF EXISTS "Sellers can create applications" ON seller_applications;
DROP POLICY IF EXISTS "Sellers can view their own applications" ON seller_applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON seller_applications;

DROP POLICY IF EXISTS "System can insert notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON admin_notifications;

DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;

DROP POLICY IF EXISTS "Public can view active categories" ON categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;

DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Sellers can manage their own products" ON products;

DROP POLICY IF EXISTS "Public can view active variants" ON product_variants;
DROP POLICY IF EXISTS "Sellers can manage variants of their products" ON product_variants;

DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
DROP POLICY IF EXISTS "Sellers can view orders for their products" ON orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON orders;

DROP POLICY IF EXISTS "Users can view their own order items" ON order_items;
DROP POLICY IF EXISTS "Sellers can view order items for their products" ON order_items;

DROP POLICY IF EXISTS "Public can view approved reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;

DROP POLICY IF EXISTS "Users can manage their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can manage their own wishlist items" ON wishlist_items;

DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;

DROP POLICY IF EXISTS "Public can view active campaigns" ON admin_campaigns;
DROP POLICY IF EXISTS "Admins can manage campaigns" ON admin_campaigns;

-- =====================================================
-- PROFILES TABLE POLICIES
-- =====================================================

-- Profiles için INSERT policy - signup sırasında auth.uid() null olabilir
CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Profiles için SELECT policy
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Profiles için UPDATE policy
CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- SELLERS TABLE POLICIES
-- =====================================================

-- Sellers için INSERT policy - signup sırasında auth.uid() null olabilir
CREATE POLICY "Enable insert for authenticated users" ON sellers
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Sellers için SELECT policy
CREATE POLICY "Sellers can view their own data" ON sellers
    FOR SELECT USING (auth.uid() = id);

-- Sellers için UPDATE policy
CREATE POLICY "Sellers can update their own data" ON sellers
    FOR UPDATE USING (auth.uid() = id);

-- Public sellers data (for product pages)
CREATE POLICY "Public can view active sellers" ON sellers
    FOR SELECT USING (status = 'active' AND verification_status = 'approved');

-- =====================================================
-- ADMINS TABLE POLICIES
-- =====================================================

-- Admins için INSERT policy - signup sırasında auth.uid() null olabilir
CREATE POLICY "Enable insert for authenticated users" ON admins
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins için SELECT policy
CREATE POLICY "Admins can view their own record" ON admins
    FOR SELECT USING (auth.uid() = id);

-- Admins için UPDATE policy
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

-- =====================================================
-- SELLER APPLICATIONS POLICIES
-- =====================================================

-- Seller applications için INSERT policy
CREATE POLICY "Sellers can create applications" ON seller_applications
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Seller applications için SELECT policy
CREATE POLICY "Sellers can view their own applications" ON seller_applications
    FOR SELECT USING (auth.uid() = seller_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all applications" ON seller_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- ADMIN NOTIFICATIONS POLICIES
-- =====================================================

-- Admin notifications için INSERT policy - system can insert
CREATE POLICY "System can insert notifications" ON admin_notifications
    FOR INSERT WITH CHECK (true);

-- Admin notifications için SELECT policy
CREATE POLICY "Admins can view notifications" ON admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- AUDIT LOGS POLICIES
-- =====================================================

-- Audit logs için INSERT policy - system can insert
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Audit logs için SELECT policy
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- CATEGORIES POLICIES
-- =====================================================

-- Categories için public read access
CREATE POLICY "Public can view active categories" ON categories
    FOR SELECT USING (is_active = true);

-- Admins can manage categories
CREATE POLICY "Admins can manage categories" ON categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- =====================================================
-- PRODUCTS POLICIES
-- =====================================================

-- Products için public read access (active products only)
CREATE POLICY "Public can view active products" ON products
    FOR SELECT USING (status = 'active');

-- Sellers can manage their own products
CREATE POLICY "Sellers can manage their own products" ON products
    FOR ALL USING (seller_id = auth.uid());

-- =====================================================
-- PRODUCT VARIANTS POLICIES
-- =====================================================

-- Product variants için public read access (active variants only)
CREATE POLICY "Public can view active variants" ON product_variants
    FOR SELECT USING (is_active = true);

-- Sellers can manage variants of their products
CREATE POLICY "Sellers can manage variants of their products" ON product_variants
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM products 
            WHERE id = product_variants.product_id AND seller_id = auth.uid()
        )
    );

-- =====================================================
-- ORDERS POLICIES
-- =====================================================

-- Users can view their own orders
CREATE POLICY "Users can view their own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

-- Sellers can view orders for their products
CREATE POLICY "Sellers can view orders for their products" ON orders
    FOR SELECT USING (seller_id = auth.uid());

-- Users can create their own orders
CREATE POLICY "Users can create their own orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- ORDER ITEMS POLICIES
-- =====================================================

-- Users can view their own order items
CREATE POLICY "Users can view their own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE id = order_items.order_id AND user_id = auth.uid()
        )
    );

-- Sellers can view order items for their products
CREATE POLICY "Sellers can view order items for their products" ON order_items
    FOR SELECT USING (seller_id = auth.uid());

-- =====================================================
-- REVIEWS POLICIES
-- =====================================================

-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews" ON reviews
    FOR SELECT USING (status = 'approved');

-- Users can create reviews
CREATE POLICY "Users can create reviews" ON reviews
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- WISHLISTS POLICIES
-- =====================================================

-- Users can manage their own wishlists
CREATE POLICY "Users can manage their own wishlists" ON wishlists
    FOR ALL USING (user_id = auth.uid());

-- Users can manage their own wishlist items
CREATE POLICY "Users can manage their own wishlist items" ON wishlist_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM wishlists 
            WHERE id = wishlist_items.wishlist_id AND user_id = auth.uid()
        )
    );

-- =====================================================
-- CART ITEMS POLICIES
-- =====================================================

-- Users can manage their own cart
CREATE POLICY "Users can manage their own cart" ON cart_items
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- ADMIN CAMPAIGNS POLICIES
-- =====================================================

-- Public can view active campaigns
CREATE POLICY "Public can view active campaigns" ON admin_campaigns
    FOR SELECT USING (is_active = true);

-- Admins can manage campaigns
CREATE POLICY "Admins can manage campaigns" ON admin_campaigns
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ RLS policies updated successfully for signup process!';
    RAISE NOTICE '🔐 Signup should now work without 404 errors';
    RAISE NOTICE '📝 Key changes:';
    RAISE NOTICE '   - INSERT policies now allow auth.uid() = id during signup';
    RAISE NOTICE '   - Public read access for active products/categories';
    RAISE NOTICE '   - Proper admin and seller permissions';
END $$; 