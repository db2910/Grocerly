import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BaseProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  marketName: string;
  source: string;
  unit?: string;
}

export interface BasketItemMeta {
  name: string;
  quantity: number;
  unit: string;
  price_at_time: number;
}

export interface CartItem extends BaseProduct {
  quantity: number;
  // Basket-specific fields — only present when isBasket = true
  isBasket?: boolean;
  basketItemCount?: number;
  basketItems?: BasketItemMeta[];
}

interface CartState {
  items: CartItem[];
  addItem: (product: BaseProduct, quantity: number) => void;
  addBasket: (basket: {
    id: string;
    name: string;
    total_price: number;
    items: BasketItemMeta[];
  }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity) => {
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return { items: [...state.items, { ...product, quantity }] };
        });
      },

      addBasket: (basket) => {
        const basketId = `basket-${basket.id}`;
        set((state) => {
          const existing = state.items.find((item) => item.id === basketId);
          if (existing) {
            // "one per order" rule — don't increment if already exists
            return state;
          }
          const basketItem: CartItem = {
            id: basketId,
            name: basket.name,
            price: basket.total_price,
            quantity: 1,
            imageUrl: '',
            categoryId: 'basket',
            marketName: 'Grocerly Curated',
            source: 'Weekly Basket',
            unit: 'basket',
            isBasket: true,
            basketItemCount: basket.items.length,
            basketItems: basket.items,
          };
          return { items: [...state.items, basketItem] };
        });
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'grocerly-cart',
    }
  )
);
