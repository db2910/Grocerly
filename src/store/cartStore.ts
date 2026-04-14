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

export interface CartVariantSelection {
  variantId: string;
  variantName: string;
  quantity: number;
  price: number;
}

export interface CartItem extends BaseProduct {
  quantity: number;
  // Basket-specific fields
  isBasket?: boolean;
  basketItemCount?: number;
  basketItems?: BasketItemMeta[];
  // Grouped Variant selections
  selectedVariants?: CartVariantSelection[];
}

interface CartState {
  items: CartItem[];
  // addItem now accepts an optional variant or a batch of variants
  addItem: (product: BaseProduct, quantity: number, variantId?: string, variantName?: string, effectivePrice?: number) => void;
  addBasket: (basket: {
    id: string;
    name: string;
    total_price: number;
    items: BasketItemMeta[];
  }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, variantId?, variantName?, effectivePrice?) => {
        set((state) => {
          const productId = product.id;
          const existingItem = state.items.find((item) => item.id === productId);

          // 1. Handling items WITH variants
          if (variantId && variantName) {
            const price = effectivePrice ?? product.price;
            const newSelection: CartVariantSelection = {
              variantId,
              variantName,
              quantity,
              price
            };

            if (existingItem) {
              const variants = existingItem.selectedVariants || [];
              const variantIndex = variants.findIndex(v => v.variantId === variantId);

              let updatedVariants;
              if (variantIndex > -1) {
                // Update existing variant quantity inside this product
                updatedVariants = [...variants];
                updatedVariants[variantIndex] = {
                  ...updatedVariants[variantIndex],
                  quantity: updatedVariants[variantIndex].quantity + quantity
                };
              } else {
                // Add new variant type to this product
                updatedVariants = [...variants, newSelection];
              }

              return {
                items: state.items.map((item) =>
                  item.id === productId
                    ? { ...item, selectedVariants: updatedVariants, quantity: updatedVariants.reduce((sum, v) => sum + v.quantity, 0) }
                    : item
                ),
              };
            }

            // Create new product entry with this first variant
            return {
              items: [...state.items, {
                ...product,
                id: productId,
                quantity: quantity,
                selectedVariants: [newSelection],
              }],
            };
          }

          // 2. Handling standard items (NO variants)
          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === productId
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            items: [...state.items, {
              ...product,
              id: productId,
              quantity,
            }],
          };
        });
      },

      addBasket: (basket) => {
        const basketId = `basket-${basket.id}`;
        set((state) => {
          const existing = state.items.find((item) => item.id === basketId);
          if (existing) return state;

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

      updateQuantity: (productId, quantity, variantId?) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== productId) return item;

            if (variantId && item.selectedVariants) {
              const updatedVariants = item.selectedVariants.map(v => 
                v.variantId === variantId ? { ...v, quantity } : v
              ).filter(v => v.quantity > 0);

              // If no variants left, the item will likely be removed or kept as 0
              return { 
                ...item, 
                selectedVariants: updatedVariants,
                quantity: updatedVariants.reduce((sum, v) => sum + v.quantity, 0)
              };
            }

            return { ...item, quantity };
          }).filter(item => item.quantity > 0) // Remove product if total quantity hits 0
        }));
      },

      clearCart: () => set({ items: [] }),

      getTotal: () => {
        const { items } = get();
        return items.reduce((total, item) => {
          if (item.selectedVariants && item.selectedVariants.length > 0) {
            const variantTotal = item.selectedVariants.reduce((vSum, v) => vSum + (v.price * v.quantity), 0);
            return total + variantTotal;
          }
          return total + (item.price * item.quantity);
        }, 0);
      },
    }),
    {
      name: 'grocerly-cart',
    }
  )
);
