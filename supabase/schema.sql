-- ============================================================================
-- FairSplit - Supabase Database Schema (PostgreSQL DDL)
-- ============================================================================

-- 1. PROFILES (Users & Guests)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE,
    email TEXT,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    is_guest BOOLEAN DEFAULT false,
    paypal_me_handle TEXT,
    iban TEXT,
    bic TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. GROUPS
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'EUR',
    invite_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    simplify_debts BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. GROUP_MEMBERS
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(group_id, user_id)
);

-- 4. EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general',
    split_mode TEXT DEFAULT 'equal',
    total_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    tip_amount NUMERIC(12, 2) DEFAULT 0,
    tip_type TEXT DEFAULT 'fixed',
    tip_percentage NUMERIC(5, 2) DEFAULT 0,
    service_charge NUMERIC(12, 2) DEFAULT 0,
    surcharge_split_mode TEXT DEFAULT 'proportional',
    expense_date DATE DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. EXPENSE_PAYERS
CREATE TABLE IF NOT EXISTS public.expense_payers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount_paid NUMERIC(12, 2) NOT NULL,
    UNIQUE(expense_id, user_id)
);

-- 6. EXPENSE_ITEMS
CREATE TABLE IF NOT EXISTS public.expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER DEFAULT 1
);

-- 7. EXPENSE_ITEM_ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.expense_item_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES public.expense_items(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    share_count NUMERIC(6, 2) DEFAULT 1.0,
    UNIQUE(item_id, user_id)
);

-- 8. EXPENSE_SPLITS
CREATE TABLE IF NOT EXISTS public.expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    owed_amount NUMERIC(12, 2) NOT NULL,
    UNIQUE(expense_id, user_id)
);

-- 9. SETTLEMENTS
CREATE TABLE IF NOT EXISTS public.settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    payee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_method TEXT DEFAULT 'other',
    notes TEXT,
    settlement_date DATE DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settlements;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_settlements_group ON public.settlements(group_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_group ON public.activity_logs(group_id);
