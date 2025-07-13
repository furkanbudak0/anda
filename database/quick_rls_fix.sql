-- =====================================================
-- QUICK RLS FIX FOR SIGNUP
-- =====================================================
-- Bu dosya sadece signup problemlerini çözer

-- Profiles için INSERT policy düzeltmesi
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Sellers için INSERT policy düzeltmesi
DROP POLICY IF EXISTS "Sellers can insert their own data" ON sellers;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON sellers;

CREATE POLICY "Enable insert for authenticated users" ON sellers
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins için INSERT policy düzeltmesi
DROP POLICY IF EXISTS "Admins can insert their own record" ON admins;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON admins;

CREATE POLICY "Enable insert for authenticated users" ON admins
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Seller applications için INSERT policy
DROP POLICY IF EXISTS "Sellers can create applications" ON seller_applications;

CREATE POLICY "Sellers can create applications" ON seller_applications
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- Admin notifications için INSERT policy
DROP POLICY IF EXISTS "Admins can insert notifications" ON admin_notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON admin_notifications;

CREATE POLICY "System can insert notifications" ON admin_notifications
    FOR INSERT WITH CHECK (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Quick RLS fix applied successfully!';
    RAISE NOTICE '🔐 Signup should now work without 404 errors';
END $$; 