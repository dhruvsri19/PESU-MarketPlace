-- ============================================================
-- UniMart — Campus C2C Marketplace
-- Supabase PostgreSQL Schema
-- ============================================================

-- Enable required extensions
-- =====================================================================
-- ⚠️  MIGRATION: Run this in Supabase SQL Editor if campus/branch
--    columns don't exist yet, or if you hit "could not find column
--    in schema cache" errors.
-- =====================================================================
--
--  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS campus TEXT;
--  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS branch TEXT;
--  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester INT;
--
--  -- Force PostgREST to reload its schema cache:
--  NOTIFY pgrst, 'reload schema';
--
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for fuzzy text search

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  phone TEXT,
  hostel TEXT,
  bio TEXT DEFAULT '',
  campus TEXT,
  branch TEXT,
  semester INT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- 2. CATEGORIES (seed data)
-- ============================================================
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,  -- emoji or icon name
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.categories (name, slug, icon) VALUES
  ('Books', 'books', '📚'),
  ('Electronics', 'electronics', '💻'),
  ('Hostel Gear', 'hostel-gear', '🏠'),
  ('Notes', 'notes', '📝');

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT USING (true);

-- ============================================================
-- 3. PRODUCTS
-- ============================================================
CREATE TYPE product_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');
CREATE TYPE product_status AS ENUM ('active', 'sold', 'reserved', 'deleted');

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  condition product_condition NOT NULL DEFAULT 'good',
  status product_status NOT NULL DEFAULT 'active',
  images TEXT[] DEFAULT '{}',   -- Supabase Storage URLs
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_seller ON public.products(seller_id);
CREATE INDEX idx_products_status_created ON public.products(status, created_at DESC);
CREATE INDEX idx_products_title_trgm ON public.products USING gin(title gin_trgm_ops);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are viewable by everyone"
  ON public.products FOR SELECT USING (status != 'deleted');

CREATE POLICY "Users can insert own products"
  ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update own products"
  ON public.products FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete own products"
  ON public.products FOR DELETE USING (auth.uid() = seller_id);

-- ============================================================
-- 4. CONVERSATIONS
-- ============================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, buyer_id)  -- one conversation per buyer per product
);

CREATE INDEX idx_conversations_buyer ON public.conversations(buyer_id);
CREATE INDEX idx_conversations_seller ON public.conversations(seller_id);
CREATE INDEX idx_conversations_last_msg ON public.conversations(last_message_at DESC);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id);

-- ============================================================
-- 5. MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);

-- Update conversation last_message_at on new message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view messages"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (auth.uid() = c.buyer_id OR auth.uid() = c.seller_id)
    )
  );

-- ============================================================
-- 6. WISHLISTS
-- ============================================================
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX idx_wishlists_user ON public.wishlists(user_id);

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
  ON public.wishlists FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to own wishlist"
  ON public.wishlists FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from own wishlist"
  ON public.wishlists FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 7. STORAGE BUCKET (run in Supabase Dashboard or via API)
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true);
-- CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
-- CREATE POLICY "Authenticated users can upload product images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
-- Add campus and branch columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS campus TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT;

-- Update RLS if needed (already public read, user update own)
-- Existing policies cover these new columns as long as they are part of the table.
