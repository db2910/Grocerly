import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// One-time setup: creates the product_variants table.
// DELETE this file after running.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SQL = `
CREATE TABLE IF NOT EXISTS public.product_variants (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id   UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  image_url    TEXT,
  price_override NUMERIC,
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read variants" ON public.product_variants
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage variants" ON public.product_variants
  FOR ALL USING (auth.role() = 'authenticated');
`.trim();

export async function GET() {
  try {
    // Try a test query — if the table already exists, return success
    const { error: checkError } = await supabaseAdmin
      .from('product_variants')
      .select('id')
      .limit(1);

    if (!checkError) {
      return NextResponse.json({ success: true, message: '✅ product_variants table already exists.' });
    }

    // Table doesn't exist — return the SQL for manual execution
    return NextResponse.json({
      success: false,
      message: 'Table does not exist yet. Please run the SQL below in Supabase SQL Editor.',
      sql: SQL,
    }, { status: 200 });

  } catch (err) {
    console.error('setup-variants error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
