/**
 * Grocerly — Supabase data fetching functions
 * These replace mock data imports throughout the app.
 */
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// ─── Types ──────────────────────────────────────────────────────────────────

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
}

export interface DbSetting {
  key: string;
  value: string;
  label: string | null;
  updated_at: string;
}

// Parsed settings for easy use in the app
export interface AppSettings {
  standardDeliveryFee: number;
  expressDeliveryFee: number;
  expressDeliveryLabel: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  standardDeliveryFee: 1500,
  expressDeliveryFee: 3500,
  expressDeliveryLabel: 'Get your order within 60 minutes',
};

export interface DbMarket {
  id: string;
  name: string;
  location: string;
  is_active: boolean;
}

export interface DbProduct {
  id: string;
  name: string;
  description?: string;
  price: number;
  unit: string;
  image_url: string | null;
  source: string | null;
  is_fresh: boolean;
  is_sale: boolean;
  category_id: string | null;
  market_id: string | null;
  is_active: boolean;
  // Joined fields
  categories?: { name: string; slug: string } | null;
  markets?: { name: string } | null;
  variants?: DbProductVariant[];
}

// Local Product type for UI/ProductCard compatibility
export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  source: string;
  marketName: string;
  categoryId: string;
  isFresh: boolean;
  isSale: boolean;
  variants?: DbProductVariant[];
}

export interface DbProductVariant {
  id: string;
  product_id: string;
  name: string;
  image_url: string | null;
  price_override: number | null; // null = use product base price
  sort_order: number;
}

export interface DbWeeklyBasket {
  id: string;
  name: string;
  description: string | null;
  total_price: number;
  is_active: boolean;
  week_label: string | null;
  items: DbWeeklyBasketItem[];
}

export interface DbWeeklyBasketItem {
  id: string;
  basket_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  price_at_time: number;
}

export interface OrderPayload {
  customer_name: string;
  customer_phone: string;
  delivery_location: string;
  is_gift: boolean;
  recipient_name?: string;
  recipient_phone?: string;
  express_delivery: boolean;
  order_type: 'standard' | 'basket' | 'custom';
  custom_items?: string;
  total_amount: number;
  whatsapp_sent: boolean;
  whatsapp_sent_at: string;
}

export interface OrderItemPayload {
  order_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  price_at_time: number;
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<DbCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, icon, sort_order')
    .order('sort_order');

  if (error) {
    console.error('fetchCategories error:', error.message);
    return [];
  }
  return data ?? [];
}

// ─── Settings ───────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<AppSettings> {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value');

  if (error || !data) {
    console.error('fetchSettings error:', error?.message);
    return DEFAULT_SETTINGS;
  }

  const map = Object.fromEntries(data.map((s: { key: string; value: string }) => [s.key, s.value]));

  return {
    standardDeliveryFee: parseInt(map['standard_delivery_fee'] ?? '1500', 10),
    expressDeliveryFee:  parseInt(map['express_delivery_fee']  ?? '3500', 10),
    expressDeliveryLabel: map['express_delivery_label'] ?? DEFAULT_SETTINGS.expressDeliveryLabel,
  };
}

export async function updateSetting(key: string, value: string): Promise<boolean> {
  const { error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);

  if (error) {
    console.error('updateSetting error:', error.message);
    return false;
  }
  return true;
}

// ─── Markets ────────────────────────────────────────────────────────────────

export async function fetchMarkets(activeOnly: boolean = true): Promise<DbMarket[]> {
  let query = supabase
    .from('markets')
    .select('id, name, location, is_active');
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('fetchMarkets error:', error.message);
    return [];
  }
  return data ?? [];
}

// ─── Products ───────────────────────────────────────────────────────────────

export async function fetchProducts(activeOnly: boolean = true): Promise<DbProduct[]> {
  let query = supabase
    .from('products')
    .select('id, name, price, unit, image_url, source, is_fresh, is_sale, is_active, category_id, market_id, categories(name, slug), markets(name)');
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('name');

  if (error) {
    console.error('fetchProducts error:', error.message);
    return [];
  }
  const products = (data ?? []).map((p: any) => ({
    ...p,
    categories: Array.isArray(p.categories) ? p.categories[0] : p.categories,
    markets: Array.isArray(p.markets) ? p.markets[0] : p.markets,
    variants: [] as DbProductVariant[],
  })) as DbProduct[];

  // Load variants for all products in one query
  if (products.length > 0) {
    const { data: variantsData } = await supabase
      .from('product_variants')
      .select('*')
      .in('product_id', products.map(p => p.id))
      .order('sort_order');
    if (variantsData) {
      const variantsByProduct: Record<string, DbProductVariant[]> = {};
      for (const v of variantsData) {
        if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
        variantsByProduct[v.product_id].push(v as DbProductVariant);
      }
      products.forEach(p => { p.variants = variantsByProduct[p.id] ?? []; });
    }
  }
  return products;
}

// ─── Product Variants ────────────────────────────────────────────────────────

export async function fetchVariantsForProduct(productId: string): Promise<DbProductVariant[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order');
  if (error) { console.error('fetchVariantsForProduct error:', error.message); return []; }
  return data ?? [];
}

export async function upsertProductVariant(variant: Partial<DbProductVariant>): Promise<DbProductVariant | null> {
  let query;
  if (variant.id) {
    query = supabase.from('product_variants').update(variant).eq('id', variant.id);
  } else {
    query = supabase.from('product_variants').insert(variant);
  }
  const { data, error } = await query.select('*').single();
  if (error) { console.error('upsertProductVariant error:', error.message); return null; }
  return data as DbProductVariant;
}

export async function deleteProductVariant(variantId: string): Promise<boolean> {
  const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
  if (error) { console.error('deleteProductVariant error:', error.message); return false; }
  return true;
}

export async function updateVariantSortOrder(variantId: string, sortOrder: number): Promise<boolean> {
  const { error } = await supabase
    .from('product_variants')
    .update({ sort_order: sortOrder })
    .eq('id', variantId);
  if (error) { console.error('updateVariantSortOrder error:', error.message); return false; }
  return true;
}

export async function upsertMarket(market: Partial<DbMarket>): Promise<DbMarket | null> {
  let query;
  if (market.id) {
    query = supabase.from('markets').update(market).eq('id', market.id);
  } else {
    query = supabase.from('markets').insert(market);
  }

  const { data, error } = await query.select('*').single();

  if (error) {
    console.error('upsertMarket error:', error.message);
    return null;
  }
  return data as DbMarket;
}

export async function deleteMarket(marketId: string): Promise<boolean> {
  const { error } = await supabase
    .from('markets')
    .update({ is_active: false })
    .eq('id', marketId);

  if (error) {
    console.error('deleteMarket error:', error.message);
    return false;
  }
  return true;
}
// ─── Weekly Baskets ─────────────────────────────────────────────────────────

export async function fetchWeeklyBaskets(activeOnly: boolean = true): Promise<DbWeeklyBasket[]> {
  let query = supabase
    .from('weekly_baskets')
    .select('*, weekly_basket_items(*)');
  
  if (activeOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('fetchWeeklyBaskets error:', error.message);
    return [];
  }

  // Map the join result to our interface
  return (data ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    total_price: parseFloat(b.total_price),
    is_active: b.is_active,
    week_label: b.week_label,
    items: (b.weekly_basket_items ?? []).map((i: any) => ({
      id: i.id,
      basket_id: i.basket_id,
      product_id: i.product_id,
      name: i.name,
      quantity: parseFloat(i.quantity),
      unit: i.unit,
      price_at_time: parseFloat(i.price_at_time)
    }))
  }));
}

export async function fetchAllWeeklyBaskets(): Promise<DbWeeklyBasket[]> {
  const { data, error } = await supabase
    .from('weekly_baskets')
    .select('*, weekly_basket_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchAllWeeklyBaskets error:', error.message);
    return [];
  }

  return (data ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    description: b.description,
    total_price: parseFloat(b.total_price),
    is_active: b.is_active,
    week_label: b.week_label,
    items: (b.weekly_basket_items ?? []).map((i: any) => ({
      id: i.id,
      basket_id: i.basket_id,
      product_id: i.product_id,
      name: i.name,
      quantity: parseFloat(i.quantity),
      unit: i.unit,
      price_at_time: parseFloat(i.price_at_time)
    }))
  }));
}

// ─── Orders (Admin) ─────────────────────────────────────────────────────────

export interface DbOrder extends OrderPayload {
  id: string;
  status: 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  items?: DbOrderItem[];
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit: string;
  price_at_time: number;
  subtotal: number;
}

export async function fetchOrders(): Promise<DbOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchOrders error:', error.message);
    return [];
  }

  return (data ?? []).map((o: any) => ({
    ...o,
    total_amount: parseFloat(o.total_amount),
    items: (o.order_items ?? []).map((i: any) => ({
      ...i,
      quantity: parseFloat(i.quantity),
      price_at_time: parseFloat(i.price_at_time),
      subtotal: parseFloat(i.subtotal)
    }))
  }));
}

export async function updateOrderStatus(orderId: string, status: DbOrder['status']): Promise<boolean> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) {
    console.error('updateOrderStatus error:', error.message);
    return false;
  }
  return true;
}

// ─── Product Admin ──────────────────────────────────────────────────────────

export async function upsertProduct(product: Partial<DbProduct>): Promise<DbProduct | null> {
  let query;
  if (product.id) {
    query = supabase.from('products').update(product).eq('id', product.id);
  } else {
    query = supabase.from('products').insert(product);
  }

  const { data, error } = await query.select('*, categories(name, slug), markets(name)').single();

  if (error) {
    console.error('upsertProduct error:', error.message);
    return null;
  }
  return data as DbProduct;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    console.error('deleteProduct error:', error.message);
    return false;
  }
  return true;
}

// ─── Weekly Basket Admin ────────────────────────────────────────────────────

export async function upsertWeeklyBasket(basket: Partial<DbWeeklyBasket>): Promise<DbWeeklyBasket | null> {
  let query;
  if (basket.id) {
    query = supabase.from('weekly_baskets').update(basket).eq('id', basket.id);
  } else {
    query = supabase.from('weekly_baskets').insert(basket);
  }

  const { data, error } = await query.select('*').single();

  if (error) {
    console.error('upsertWeeklyBasket error:', error.message);
    return null;
  }
  return data as DbWeeklyBasket;
}
export async function deleteWeeklyBasket(basketId: string): Promise<boolean> {
  const { error } = await supabase
    .from('weekly_baskets')
    .delete()
    .eq('id', basketId);

  if (error) {
    console.error('deleteWeeklyBasket error:', error.message);
    return false;
  }
  return true;
}
export async function upsertWeeklyBasketItem(item: Partial<DbWeeklyBasketItem>): Promise<DbWeeklyBasketItem | null> {
  let query;
  if (item.id) {
    query = supabase.from('weekly_basket_items').update(item).eq('id', item.id);
  } else {
    query = supabase.from('weekly_basket_items').insert(item);
  }

  const { data, error } = await query.select('*').single();

  if (error) {
    console.error('upsertWeeklyBasketItem error:', error.message);
    return null;
  }
  return data as DbWeeklyBasketItem;
}

export async function deleteWeeklyBasketItem(itemId: string): Promise<boolean> {
  const { error } = await supabase
    .from('weekly_basket_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('deleteWeeklyBasketItem error:', error.message);
    return false;
  }
  return true;
}

// ─── Save order to database ─────────────────────────────────────────────────

export async function saveOrder(
  order: OrderPayload,
  items: OrderItemPayload[]
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...order, items }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('saveOrder API error:', data.error, data.details);
      return { success: false, error: data.error || 'Failed to save order' };
    }

    return { success: true, orderId: data.orderId };
  } catch (error) {
    console.error('saveOrder network error:', error);
    return { success: false, error: 'Network error saving order' };
  }
}
