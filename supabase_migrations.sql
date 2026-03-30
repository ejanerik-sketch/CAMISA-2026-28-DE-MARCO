-- Migrations for Paróquia Nossa Senhora de Fátima - Conexão 2026

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In a real app, use Supabase Auth, but for this simple migration we'll keep a users table
    role TEXT NOT NULL CHECK (role IN ('Administrador', 'Editor', 'Visualizador')),
    status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- Using the PED26-XXXX format
    name TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    endereco TEXT NOT NULL,
    grupo TEXT,
    pagamento TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pendente',
    items INTEGER NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    cart JSONB NOT NULL,
    created_by TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policies for Users (Simplified for this app)
CREATE POLICY "Allow public read for login" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage users" ON public.users FOR ALL USING (true); -- In production, restrict to admin role

-- Policies for Orders
CREATE POLICY "Allow public to create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated to read/update orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow authenticated to update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow authenticated to delete orders" ON public.orders FOR DELETE USING (true);

-- Initial Master Admin (Password: camisa2026)
INSERT INTO public.users (name, email, password, role, status)
VALUES ('Admin Master', 'ejanerik@gmail.com', 'camisa2026', 'Administrador', 'Ativo')
ON CONFLICT (email) DO NOTHING;
