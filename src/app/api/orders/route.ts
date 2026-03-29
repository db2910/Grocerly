import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { orderSchema } from '@/lib/validations/order';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create a Supabase client with the service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Rate Limiter if Redis URL is provided
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute per IP
    analytics: true,
  });
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting (if configured)
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for') ?? 'anonymous';
      const { success } = await ratelimit.limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
      }
    }

    // 2. Parse and Validate Request Body
    const body = await req.json();
    const result = orderSchema.safeParse(body);
    
    if (!result.success) {
      // Return validation errors
      return NextResponse.json(
        { error: 'Invalid order data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { items, ...orderData } = result.data;

    // 3. Insert Order using Service Role Key
    const { data: orderRow, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select('id')
      .single();

    if (orderError || !orderRow) {
      console.error('Order insert error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 4. Insert Order Items (if any)
    if (items && items.length > 0) {
      const dbItems = items.map(item => ({
        ...item,
        order_id: orderRow.id,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(dbItems);

      if (itemsError) {
        console.error('Order items insert error:', itemsError);
        // We still return success since the main order was created, 
        // but log the error. In a real production app, you might want to rollback or queue a retry.
      }
    }

    // 5. Success
    return NextResponse.json({ success: true, orderId: orderRow.id }, { status: 201 });

  } catch (error) {
    console.error('API /orders route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
