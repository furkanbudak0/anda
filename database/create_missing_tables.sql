-- =====================================================
-- EKSİK TABLOLARI OLUŞTURMA SQL'İ
-- =====================================================

-- 1. PROFILES TABLOSU
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name TEXT,
    phone TEXT,
    tc_id TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'seller', 'admin')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending_verification', 'suspended')),
    is_verified BOOLEAN DEFAULT false,
    avatar TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. SELLERS TABLOSU
CREATE TABLE IF NOT EXISTS public.sellers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    business_type TEXT CHECK (business_type IN ('individual', 'company', 'partnership')),
    phone TEXT,
    tax_id TEXT,
    website TEXT,
    description TEXT,
    categories TEXT[],
    status TEXT DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'approved', 'rejected', 'suspended', 'under_review')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    owner_first_name TEXT,
    owner_last_name TEXT,
    owner_email TEXT,
    owner_phone TEXT,
    owner_id_number TEXT,
    owner_dob DATE,
    bank_name TEXT,
    account_name TEXT,
    account_number TEXT,
    iban TEXT,
    swift_code TEXT,
    documents JSONB,
    application_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.profiles(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. SELLER_APPLICATIONS TABLOSU
CREATE TABLE IF NOT EXISTS public.seller_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES public.sellers(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES public.profiles(id),
    rejection_reason TEXT,
    application_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ADMIN_NOTIFICATIONS TABLOSU
CREATE TABLE IF NOT EXISTS public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    read_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- RLS (ROW LEVEL SECURITY) POLICIES
-- =====================================================

-- PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- SELLERS RLS
ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own data" ON public.sellers
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Sellers can update own data" ON public.sellers
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Sellers can insert own data" ON public.sellers
    FOR INSERT WITH CHECK (auth.uid() = id);

-- SELLER_APPLICATIONS RLS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view own applications" ON public.seller_applications
    FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can insert own applications" ON public.seller_applications
    FOR INSERT WITH CHECK (auth.uid() = seller_id);

-- ADMIN_NOTIFICATIONS RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view notifications" ON public.admin_notifications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Service role can insert notifications" ON public.admin_notifications
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- Sellers indexes
CREATE INDEX IF NOT EXISTS idx_sellers_email ON public.sellers(email);
CREATE INDEX IF NOT EXISTS idx_sellers_status ON public.sellers(status);
CREATE INDEX IF NOT EXISTS idx_sellers_business_name ON public.sellers(business_name);

-- Seller applications indexes
CREATE INDEX IF NOT EXISTS idx_seller_applications_seller_id ON public.seller_applications(seller_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON public.seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_seller_applications_submitted_at ON public.seller_applications(submitted_at);

-- Admin notifications indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON public.admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON public.admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON public.admin_notifications(created_at);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sellers_updated_at BEFORE UPDATE ON public.sellers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_applications_updated_at BEFORE UPDATE ON public.seller_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_notifications_updated_at BEFORE UPDATE ON public.admin_notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check if tables were created successfully
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('profiles', 'sellers', 'seller_applications', 'admin_notifications') 
        THEN '✅ CREATED' 
        ELSE '❌ MISSING' 
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'sellers', 'seller_applications', 'admin_notifications')
ORDER BY table_name; 