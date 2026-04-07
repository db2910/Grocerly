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
  // Variant-specific fields
  variantId?: string;    // ID of the selected variant
  variantName?: string;  // e.g. "Mango", "500ml"
  effectivePrice?: number; // variant price_override (if any), else product base price
}

interface CartState {
  items: CartItem[];
  addItem: (product: BaseProduct, quantity: number, variantId?: string, variantName?: string, effectivePrice?: number) => void;
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

      addItem: (product, quantity, variantId?, variantName?, effectivePrice?) => {
        // Unique cart key: productId + optional variantId
        const cartKey = variantId ? `${product.id}__${variantId}` : product.id;
        set((state) => {
          const existingItem = state.items.find((item) => item.id === cartKey);
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === cartKey
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }
          return {
            items: [...state.items, {
              ...product,
              id: cartKey,
              quantity,
              variantId,
              variantName,
              effectivePrice: effectivePrice ?? product.price,
              // Override image with variant image if provided
              imageUrl: product.imageUrl,
            }],
          };
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
        return items.reduce((total, item) => total + (item.effectivePrice ?? item.price) * item.quantity, 0);
      },
    }),
    {
      name: 'grocerly-cart',
    }
  )
);
