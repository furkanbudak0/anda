-- =====================================================
-- ADMIN RLS POLICY FIX
-- =====================================================
-- Bu dosya admin tablosu için RLS policy'lerini düzeltir

-- Önce mevcut admin policies'leri temizle
DROP POLICY IF EXISTS "Admins can view all admin records" ON admins;

-- Admin tablosu için yeni RLS policies
CREATE POLICY "Admins can view their own record" ON admins
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can update their own record" ON admins
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert their own record" ON admins
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Super admin'ler tüm admin kayıtlarını görebilir
CREATE POLICY "Super admins can view all admin records" ON admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_super_admin = true AND is_active = true
        )
    );

-- Admin notifications için policy
DROP POLICY IF EXISTS "Admins can view notifications" ON admin_notifications;

CREATE POLICY "Admins can view notifications" ON admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Admins can insert notifications" ON admin_notifications
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

-- Audit logs için policy
DROP POLICY IF EXISTS "Admins can view audit logs" ON audit_logs;

CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admins 
            WHERE id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Admin RLS policies updated successfully!';
    RAISE NOTICE '🔐 Admin access should now work properly';
END $$; 