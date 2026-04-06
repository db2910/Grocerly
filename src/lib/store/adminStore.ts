import { create } from 'zustand';
import { format, parseISO } from 'date-fns';
import { 
  fetchOrders, 
  fetchProducts, 
  fetchMarkets, 
  fetchWeeklyBaskets,
  fetchSettings,
  updateSetting,
  updateOrderStatus as dbUpdateOrderStatus,
  upsertProduct as dbUpsertProduct,
  deleteProduct as dbDeleteProduct,
  upsertWeeklyBasket as dbUpsertWeeklyBasket,
  deleteWeeklyBasket as dbDeleteWeeklyBasket,
  upsertWeeklyBasketItem as dbUpsertWeeklyBasketItem,
  deleteWeeklyBasketItem as dbDeleteWeeklyBasketItem,
  upsertMarket as dbUpsertMarket,
  deleteMarket as dbDeleteMarket,
  AppSettings,
  DEFAULT_SETTINGS,
  DbOrder,
  DbProduct,
  DbMarket,
  DbWeeklyBasket,
  DbWeeklyBasketItem
} from '../supabase/db';

interface AdminState {
  // Data
  orders: DbOrder[];
  products: DbProduct[];
  markets: DbMarket[];
  weeklyBaskets: DbWeeklyBasket[];
  settings: AppSettings;
  loading: boolean;
  
  // Lifecycle
  refreshData: () => Promise<void>;

  // Order Actions
  updateOrderStatus: (orderId: string, status: DbOrder['status']) => Promise<void>;

  // Product Actions
  saveProduct: (product: Partial<DbProduct>) => Promise<DbProduct | null>;
  deleteProduct: (productId: string) => Promise<void>;

  // Weekly Basket Actions
  saveBasket: (basket: Partial<DbWeeklyBasket>) => Promise<DbWeeklyBasket | null>;
  deleteBasket: (basketId: string) => Promise<boolean>;
  saveBasketItem: (item: Partial<DbWeeklyBasketItem>) => Promise<DbWeeklyBasketItem | null>;
  removeBasketItem: (itemId: string) => Promise<void>;
  toggleBasketActive: (basketId: string) => Promise<boolean>;

  // Market Actions
  saveMarket: (market: Partial<DbMarket>) => Promise<DbMarket | null>;
  deleteMarket: (marketId: string) => Promise<boolean>;

  // Settings Actions
  updateDeliveryFee: (key: 'standard_delivery_fee' | 'express_delivery_fee' | 'express_delivery_label', value: string) => Promise<boolean>;
  
  // Computed (Getters)
  getPendingOrdersCount: () => number;
  getTodayOrdersCount: () => number;
  getTodayRevenue: () => number;
  getActiveProductsCount: () => number;
  getActiveBasket: () => DbWeeklyBasket | undefined;
}

export const useAdminStore = create<AdminState>((set, get) => ({
  // Initial State
  orders: [],
  products: [],
  markets: [],
  weeklyBaskets: [],
  settings: DEFAULT_SETTINGS,
  loading: false,

  refreshData: async () => {
    set({ loading: true });
    try {
      const [orders, products, markets, weeklyBaskets, settings] = await Promise.all([
        fetchOrders(),
        fetchProducts(false),
        fetchMarkets(false),
        fetchWeeklyBaskets(false),
        fetchSettings(),
      ]);
      set({ orders, products, markets, weeklyBaskets, settings, loading: false });
    } catch (error) {
      console.error('refreshData error:', error);
      set({ loading: false });
    }
  },

  // Order Actions
  updateOrderStatus: async (orderId, status) => {
    const ok = await dbUpdateOrderStatus(orderId, status);
    if (ok) {
      set((state) => ({
        orders: state.orders.map((o) => o.id === orderId ? { ...o, status } : o),
      }));
    }
  },

  // Product Actions
  saveProduct: async (productData) => {
    console.log('[Store] saveProduct input:', productData);
    const saved = await dbUpsertProduct(productData);
    if (saved) {
      console.log('[Store] saveProduct success:', saved);
      set((state) => {
        const exists = state.products.find(p => p.id === saved.id);
        if (exists) {
          return { products: state.products.map(p => p.id === saved.id ? saved : p) };
        } else {
          return { products: [saved, ...state.products] };
        }
      });
      return saved;
    }
    console.error('[Store] saveProduct failed');
    return null;
  },

  deleteProduct: async (productId) => {
    const ok = await dbDeleteProduct(productId);
    if (ok) {
      set((state) => ({
        products: state.products.filter((p) => p.id !== productId),
      }));
    }
  },

  // Weekly Basket Actions
  saveBasket: async (basketData) => {
    console.log('[Store] saveBasket input:', basketData);
    const saved = await dbUpsertWeeklyBasket(basketData);
    if (saved) {
      console.log('[Store] saveBasket success:', saved);
      set((state) => {
        const exists = state.weeklyBaskets.find(b => b.id === saved.id);
        if (exists) {
          return {
            weeklyBaskets: state.weeklyBaskets.map(b => b.id === saved.id ? { ...saved, items: b.items } : b)
          };
        } else {
          return {
            weeklyBaskets: [{ ...saved, items: [] }, ...state.weeklyBaskets]
          };
        }
      });
      return saved;
    }
    console.error('[Store] saveBasket failed');
    return null;
  },

  deleteBasket: async (basketId) => {
    const success = await dbDeleteWeeklyBasket(basketId);
    if (success) {
      set((state) => ({
        weeklyBaskets: state.weeklyBaskets.filter(b => b.id !== basketId)
      }));
    }
    return success;
  },

  saveBasketItem: async (itemData) => {
    console.log('[Store] saveBasketItem input:', itemData);
    const saved = await dbUpsertWeeklyBasketItem(itemData);
    if (saved) {
      console.log('[Store] saveBasketItem success:', saved);
      set((state) => ({
        weeklyBaskets: state.weeklyBaskets.map(b => {
          if (b.id !== saved.basket_id) return b;
          const exists = b.items.find(i => i.id === saved.id);
          const newItems = exists 
            ? b.items.map(i => i.id === saved.id ? saved : i)
            : [...b.items, saved];
          return { ...b, items: newItems };
        })
      }));
      return saved;
    }
    console.error('[Store] saveBasketItem failed');
    return null;
  },

  removeBasketItem: async (itemId) => {
    const ok = await dbDeleteWeeklyBasketItem(itemId);
    if (ok) {
      set((state) => ({
        weeklyBaskets: state.weeklyBaskets.map(b => ({
          ...b,
          items: b.items.filter(i => i.id !== itemId)
        }))
      }));
    }
  },

  toggleBasketActive: async (basketId) => {
    const basket = get().weeklyBaskets.find(b => b.id === basketId);
    if (!basket) return false;
    console.log('[Store] toggleBasketActive input:', basketId, !basket.is_active);
    const updated = await dbUpsertWeeklyBasket({ id: basketId, is_active: !basket.is_active });
    if (updated) {
      console.log('[Store] toggleBasketActive success:', updated);
      set((state) => ({
        weeklyBaskets: state.weeklyBaskets.map(b => b.id === basketId ? { ...b, is_active: updated.is_active } : b)
      }));
      return true;
    }
    console.error('[Store] toggleBasketActive failed');
    return false;
  },

  // Market Actions
  saveMarket: async (marketData) => {
    const saved = await dbUpsertMarket(marketData);
    if (saved) {
      set((state) => {
        const exists = state.markets.find(m => m.id === saved.id);
        if (exists) {
          return { markets: state.markets.map(m => m.id === saved.id ? saved : m) };
        } else {
          return { markets: [saved, ...state.markets] };
        }
      });
      return saved;
    }
    return null;
  },

  deleteMarket: async (marketId) => {
    const success = await dbDeleteMarket(marketId);
    if (success) {
      set((state) => ({
        markets: state.markets.map(m => m.id === marketId ? { ...m, is_active: false } : m)
      }));
    }
    return success;
  },

  // Settings Actions
  updateDeliveryFee: async (key, value) => {
    const ok = await updateSetting(key, value);
    if (ok) {
      const updated = await fetchSettings();
      set({ settings: updated });
    }
    return ok;
  },

  // Computed Values
  getPendingOrdersCount: () => {
    return get().orders.filter((order) => order.status === 'pending').length;
  },

  getTodayOrdersCount: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return get().orders.filter((order) => {
      const orderDate = format(parseISO(order.created_at), 'yyyy-MM-dd');
      return orderDate === today && (order.status || '').toLowerCase() !== 'cancelled';
    }).length;
  },

  getTodayRevenue: () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return get().orders
      .filter((order) => {
        const orderDate = format(parseISO(order.created_at), 'yyyy-MM-dd');
        return orderDate === today && (order.status || '').toLowerCase() !== 'cancelled';
      })
      .reduce((sum, order) => sum + (order.total_amount || 0), 0);
  },

  getActiveProductsCount: () => {
    return get().products.filter((product) => product.is_active).length;
  },

  getActiveBasket: () => {
    return get().weeklyBaskets.find((b) => b.is_active);
  },
}));
