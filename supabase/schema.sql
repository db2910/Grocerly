-- =============================================================================
-- GROCERLY MVP — Full Production Database Schema
-- Supabase PostgreSQL | Version 2.0
-- =============================================================================

-- ─── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLES
-- =============================================================================

-- ─── 1. Users (admin only for now) ────────────────────────────────────────────
-- Mirrors auth.users — stores extra profile fields for admin users.
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 2. Markets ────────────────────────────────────────────────────────────────
-- Physical market locations (Kimironko, Nyabugogo, Gikondo …)
CREATE TABLE IF NOT EXISTS public.markets (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  location    TEXT NOT NULL,          -- street / district info
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 3. Categories ─────────────────────────────────────────────────────────────
-- Product categories. `slug` is used in ?category= URL params.
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,   -- e.g. "fruits-veggies" — matches URL param
  icon        TEXT,                   -- Material Symbol name
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 4. Products ───────────────────────────────────────────────────────────────
-- Grocery products listed in the shop.
CREATE TABLE IF NOT EXISTS public.products (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT,
  price       NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  unit        TEXT NOT NULL,          -- "1kg pack", "1 Liter", "Tray of 30" …
  image_url   TEXT,
  source      TEXT,                   -- Vendor/farm name e.g. "Local Farm", "Inyange"
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  market_id   UUID REFERENCES public.markets(id) ON DELETE SET NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  is_fresh    BOOLEAN NOT NULL DEFAULT false,
  is_sale     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 5. Weekly Baskets ─────────────────────────────────────────────────────────
-- Curated weekly baskets managed by admins. Only one can be active at a time.
CREATE TABLE IF NOT EXISTS public.weekly_baskets (
  id           UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  total_price  NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (total_price >= 0),
  is_active    BOOLEAN NOT NULL DEFAULT false,
  week_label   TEXT,                  -- e.g. "Week of March 17, 2026"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_weekly_baskets_updated_at
  BEFORE UPDATE ON public.weekly_baskets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 6. Weekly Basket Items ────────────────────────────────────────────────────
-- Individual items inside a weekly basket.
CREATE TABLE IF NOT EXISTS public.weekly_basket_items (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  basket_id       UUID NOT NULL REFERENCES public.weekly_baskets(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,      -- denormalized for safety if product deleted
  quantity        NUMERIC(8,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit            TEXT NOT NULL,
  price_at_time   NUMERIC(12,2) NOT NULL CHECK (price_at_time >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── 7. Orders ─────────────────────────────────────────────────────────────────
-- Customer orders (guest checkout supported — no user auth required).
CREATE TABLE IF NOT EXISTS public.orders (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Customer info (always captured since guests don't have accounts)
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT NOT NULL,
  customer_email      TEXT,

  -- Delivery
  delivery_location   TEXT NOT NULL,
  express_delivery    BOOLEAN NOT NULL DEFAULT false,

  -- Gift order support
  is_gift             BOOLEAN NOT NULL DEFAULT false,
  recipient_name      TEXT,
  recipient_phone     TEXT,
  gift_message        TEXT,

  -- Order type metadata
  order_type          TEXT NOT NULL DEFAULT 'standard'
                        CHECK (order_type IN ('standard', 'basket', 'custom')),
  custom_items        TEXT,           -- free-text grocery list for custom orders
  basket_id           UUID REFERENCES public.weekly_baskets(id) ON DELETE SET NULL,

  -- Financials
  total_amount        NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),

  -- WhatsApp metadata (stored when order is sent via WhatsApp)
  whatsapp_sent       BOOLEAN NOT NULL DEFAULT false,
  whatsapp_sent_at    TIMESTAMPTZ,

  -- Status lifecycle
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'out_for_delivery', 'delivered', 'cancelled')),
  notes               TEXT,           -- internal admin notes

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── 8. Order Items ────────────────────────────────────────────────────────────
-- Individual line items in a standard or basket order.
-- quantity is NUMERIC to support 1.5kg, 0.5 litre etc.
CREATE TABLE IF NOT EXISTS public.order_items (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,      -- denormalized
  quantity        NUMERIC(8,3) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit            TEXT NOT NULL,
  price_at_time   NUMERIC(12,2) NOT NULL CHECK (price_at_time >= 0),
  subtotal        NUMERIC(12,2) GENERATED ALWAYS AS (quantity * price_at_time) STORED
);

-- =============================================================================
-- INDEXES (performance)
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_products_category    ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_market      ON public.products(market_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active   ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status        ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at    ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_basket_items_basket  ON public.weekly_basket_items(basket_id);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.markets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_baskets      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_basket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items         ENABLE ROW LEVEL SECURITY;

-- ─── Admin helper function ─────────────────────────────────────────────────────
-- Uses SECURITY DEFINER so it runs as the function owner, avoiding RLS recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ─── Users policies ────────────────────────────────────────────────────────────
-- Admins can manage all user rows; users can read/update only their own.
CREATE POLICY "Admins: full access to users"
  ON public.users FOR ALL USING (public.is_admin());

CREATE POLICY "Users: view own profile"
  ON public.users FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users: update own profile"
  ON public.users FOR UPDATE USING (auth.uid() = id);

-- ─── Markets policies ──────────────────────────────────────────────────────────
CREATE POLICY "Public: view active markets"
  ON public.markets FOR SELECT USING (is_active = true);

CREATE POLICY "Admins: full access to markets"
  ON public.markets FOR ALL USING (public.is_admin());

-- ─── Categories policies ───────────────────────────────────────────────────────
CREATE POLICY "Public: view all categories"
  ON public.categories FOR SELECT USING (true);

CREATE POLICY "Admins: full access to categories"
  ON public.categories FOR ALL USING (public.is_admin());

-- ─── Products policies ─────────────────────────────────────────────────────────
CREATE POLICY "Public: view active products"
  ON public.products FOR SELECT USING (is_active = true);

CREATE POLICY "Admins: full access to products"
  ON public.products FOR ALL USING (public.is_admin());

-- ─── Weekly baskets policies ───────────────────────────────────────────────────
CREATE POLICY "Public: view active weekly basket"
  ON public.weekly_baskets FOR SELECT USING (is_active = true);

CREATE POLICY "Admins: full access to weekly baskets"
  ON public.weekly_baskets FOR ALL USING (public.is_admin());

-- ─── Weekly basket items policies ──────────────────────────────────────────────
CREATE POLICY "Public: view items of active baskets"
  ON public.weekly_basket_items FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.weekly_baskets
      WHERE id = weekly_basket_items.basket_id AND is_active = true
    )
  );

CREATE POLICY "Admins: full access to basket items"
  ON public.weekly_basket_items FOR ALL USING (public.is_admin());

-- ─── Orders policies ───────────────────────────────────────────────────────────
-- Guests (unauthenticated) can INSERT an order. No one can SELECT unless admin.
CREATE POLICY "Public: insert orders (guest checkout)"
  ON public.orders FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins: full access to orders"
  ON public.orders FOR ALL USING (public.is_admin());

-- ─── Order items policies ──────────────────────────────────────────────────────
CREATE POLICY "Public: insert order items"
  ON public.order_items FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins: full access to order items"
  ON public.order_items FOR ALL USING (public.is_admin());

-- =============================================================================
-- SEED DATA — Markets
-- =============================================================================
INSERT INTO public.markets (name, location, description) VALUES
  ('Kimironko Market',  'Kimironko, Kigali',  'The largest fresh produce market in Kigali East'),
  ('Nyabugogo Market',  'Nyabugogo, Kigali',  'Main wholesale and retail market in central Kigali'),
  ('Gikondo Market',    'Gikondo, Kigali',    'Popular mixed market in Kigali South')
ON CONFLICT DO NOTHING;

-- =============================================================================
-- SEED DATA — Categories
-- =============================================================================
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
  ('Fruits & Vegetables',  'fruits-veggies',     'energy_savings_leaf', 1),
  ('Meat & Fish',          'meat-fish',           'set_meal',            2),
  ('Dairy & Eggs',         'dairy-eggs',          'egg_alt',             3),
  ('Grains & Staples',     'grains-staples',      'grain',               4),
  ('Cooking Essentials',   'cooking-essentials',  'restaurant',          5)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- SEED DATA — Products
-- (Uses subqueries to resolve category/market UUID from slug/name)
-- =============================================================================
INSERT INTO public.products (name, price, unit, image_url, source, category_id, market_id, is_fresh, is_sale)
SELECT
  p.name, p.price, p.unit, p.image_url, p.source,
  c.id AS category_id,
  m.id AS market_id,
  p.is_fresh, p.is_sale
FROM (VALUES
  -- Fruits & Vegetables
  ('Organic Tomatoes',    4500,  '1kg pack',     'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600', 'Local Farm',           'fruits-veggies',    'Kimironko Market',  true,  false),
  ('Red Onions',          2500,  '1kg pack',     'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&q=80&w=600', 'Local Farm',           'fruits-veggies',    'Nyabugogo Market',  false, false),
  ('Irish Potatoes',      3500,  '5kg sack',     'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600', 'Kinamira Cooperative', 'fruits-veggies',    'Kimironko Market',  false, false),
  ('Carrots',             1500,  '1kg pack',     'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&q=80&w=600', 'Local Farm',           'fruits-veggies',    'Gikondo Market',    true,  false),
  ('Green Cabbage',        800,  '1 head',       'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&q=80&w=600', 'Local Farm',           'fruits-veggies',    'Nyabugogo Market',  false, false),
  ('Green Bell Peppers',  2000,  '500g',         'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&q=80&w=600', 'Local Farm',           'fruits-veggies',    'Kimironko Market',  false, true),
  ('Hass Avocados',       2500,  '3 pieces',     'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&q=80&w=600', 'Local Farm',           'fruits-veggies',    'Gikondo Market',    true,  false),
  -- Meat & Fish
  ('Fresh Tilapia',       6500,  '1kg',          'https://images.unsplash.com/photo-1511246379532-6e27150a21dd?auto=format&fit=crop&q=80&w=600', 'Lake Kivu Catch',      'meat-fish',         'Nyabugogo Market',  true,  false),
  ('Premium Beef Steak',  8500,  '1kg',          'https://images.unsplash.com/photo-1603048297172-c92544798d5e?auto=format&fit=crop&q=80&w=600', 'Local Butcher',        'meat-fish',         'Kimironko Market',  false, false),
  ('Goat Meat',           7500,  '1kg',          'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80&w=600', 'Local Butcher',        'meat-fish',         'Nyabugogo Market',  false, false),
  ('Whole Chicken',       9000,  '1.5kg',        'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&q=80&w=600', 'Poultry Farm',         'meat-fish',         'Kimironko Market',  false, true),
  -- Dairy & Eggs
  ('Inyange Fresh Milk',  1200,  '1 Liter',      'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&q=80&w=600', 'Inyange',              'dairy-eggs',        'Gikondo Market',    false, false),
  ('Vanilla Yogurt',      1500,  '500ml',        'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600', 'Inyange',              'dairy-eggs',        'Kimironko Market',  false, false),
  ('Fresh Eggs',          4500,  'Tray of 30',   'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&q=80&w=600', 'Local Poultry',        'dairy-eggs',        'Nyabugogo Market',  true,  false),
  -- Grains & Staples
  ('Kigali Premium Rice', 15000, '10kg sack',    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600', 'Kigali Farms',         'grains-staples',    'Nyabugogo Market',  false, false),
  ('Maize Flour (Kawunga)',3500, '5kg',          'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=600', 'Minimex',              'grains-staples',    'Kimironko Market',  false, false),
  ('Dry Beans',           4000,  '5kg',          'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&q=80&w=600', 'Local Harvest',        'grains-staples',    'Nyabugogo Market',  false, true),
  ('Cassava Flour',       2800,  '3kg',          'https://images.unsplash.com/photo-1621245780587-c1ba4202c4de?auto=format&fit=crop&q=80&w=600', 'Local Harvest',        'grains-staples',    'Kimironko Market',  false, false),
  -- Cooking Essentials
  ('Sunflower Cooking Oil',8500, '3 Liters',     'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600', 'Golden Oil Co.',       'cooking-essentials','Nyabugogo Market',  false, false),
  ('Iodized Salt',         500,  '500g',         'https://plus.unsplash.com/premium_photo-1675200389270-349f2b8417c8?auto=format&fit=crop&q=80&w=600','Rwanda Salt',        'cooking-essentials','Kimironko Market',  false, false),
  ('White Sugar',         1500,  '1kg',          'https://images.unsplash.com/photo-1581457635900-51a700da316e?auto=format&fit=crop&q=80&w=600', 'Kabuye Sugar Works',   'cooking-essentials','Nyabugogo Market',  false, false),
  ('Mixed Spices Blend',  2000,  '200g jar',     'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600', 'Kigali Spices',        'cooking-essentials','Kimironko Market',  true,  false)
) AS p(name, price, unit, image_url, source, cat_slug, market_name, is_fresh, is_sale)
JOIN public.categories c ON c.slug = p.cat_slug
JOIN public.markets m    ON m.name = p.market_name;

-- =============================================================================
-- SEED DATA — Weekly Basket (sample active basket)
-- =============================================================================
WITH inserted_basket AS (
  INSERT INTO public.weekly_baskets (name, description, total_price, is_active, week_label)
  VALUES (
    'The Essentials Basket',
    'A balanced weekly basket for a family of 4 — fresh vegetables, protein, and pantry staples all sourced from Kimironko market.',
    35500,
    true,
    'Week of March 17, 2026'
  )
  RETURNING id
)
INSERT INTO public.weekly_basket_items (basket_id, product_id, name, quantity, unit, price_at_time)
SELECT
  ib.id,
  p.id,
  p.name,
  bi.qty,
  p.unit,
  p.price
FROM inserted_basket ib
CROSS JOIN (VALUES
  ('Organic Tomatoes',    1.0),
  ('Irish Potatoes',      1.0),
  ('Carrots',             1.0),
  ('Whole Chicken',       1.0),
  ('Fresh Eggs',          1.0),
  ('Inyange Fresh Milk',  2.0),
  ('Kigali Premium Rice', 1.0),
  ('Sunflower Cooking Oil',1.0)
) AS bi(pname, qty)
JOIN public.products p ON p.name = bi.pname;

-- ─── STORAGE: Product Images ────────────────────────────────────────────────
-- Create public bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Admins can upload product images
CREATE POLICY "Admins can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND public.is_admin());

-- Policy: Public can read product images
CREATE POLICY "Public can read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
