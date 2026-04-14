'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCartStore } from '@/store/cartStore';
import { DbProductVariant, Product } from '@/lib/supabase/db';
import { getUnitStep, formatQuantityLabel } from '@/lib/quantityUtils';

interface VariantPickerProps {
  product: Product;
  variants: DbProductVariant[];
  onClose: () => void;
}

export function VariantPicker({ product, variants, onClose }: VariantPickerProps) {
  // Map variantId -> quantity (starts at 0)
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    variants.forEach((v) => (init[v.id] = 0));
    return init;
  });
  const step = getUnitStep(product.unit);
  const addItem = useCartStore((s) => s.addItem);

  const isImageMode = variants.some((v) => !!v.image_url);

  const incrementVariant = (id: string) => {
    setQuantities((q) => ({
      ...q,
      [id]: parseFloat((q[id] + step).toFixed(1)),
    }));
  };
  const decrementVariant = (id: string) => {
    setQuantities((q) => ({
      ...q,
      [id]: parseFloat(Math.max(0, q[id] - step).toFixed(1)),
    }));
  };

  // Compute total price for preview
  const totalPrice = variants.reduce((sum, v) => {
    const qty = quantities[v.id] || 0;
    if (qty > 0) {
      const price = v.price_override ?? product.price;
      return sum + price * qty;
    }
    return sum;
  }, 0);

  const handleAddAll = () => {
    let added = false;
    variants.forEach((variant) => {
      const qty = quantities[variant.id] || 0;
      if (qty > 0) {
        const effectivePrice = variant.price_override ?? product.price;
        addItem(
          {
            ...product,
            imageUrl: variant.image_url ?? product.imageUrl,
          },
          qty,
          variant.id,
          variant.name,
          effectivePrice,
        );
        added = true;
      }
    });
    if (added) {
      toast.success(`${product.name} added to cart`, {
        description: `Total: ${totalPrice.toLocaleString()} RWF`,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full transition-colors z-10">
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
        {isImageMode ? (
          <>
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="pr-10">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{product.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">Choose your preferred options</p>
              </div>
            </div>
            <div className="px-6 pb-2">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {variants.map((variant) => {
                  const qty = quantities[variant.id] || 0;
                  const price = variant.price_override ?? product.price;
                  return (
                    <button key={variant.id} className="relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-150 text-left border-slate-200 dark:border-slate-700 hover:border-primary/40">
                      <div className="aspect-square bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        {variant.image_url ? (
                          <img src={variant.image_url} alt={variant.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-300 text-3xl">image</span>
                          </div>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{variant.name}</p>
                        <p className="text-xs font-black mt-0.5 text-primary">{price.toLocaleString()} RWF</p>
                        <div className="flex items-center justify-between mt-2">
                          <button onClick={() => decrementVariant(variant.id)} className="p-1 text-slate-500 hover:text-primary">-</button>
                          <span className="text-sm font-medium">{qty}</span>
                          <button onClick={() => incrementVariant(variant.id)} className="p-1 text-slate-500 hover:text-primary">+</button>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mx-6 my-4 border-t border-slate-100 dark:border-slate-700" />
            <div className="px-6 pb-6">
              <div className="flex justify-between mb-4">
                <span className="font-bold">Total: {totalPrice.toLocaleString()} RWF</span>
                <button onClick={handleAddAll} className="flex items-center gap-2 bg-primary text-white font-bold px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors">
                  Add All to Cart
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-8">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 pr-8">{product.name}</h2>
            <p className="text-xl font-medium text-slate-600 dark:text-slate-300 mt-2">{(variants[0].price_override ?? product.price).toLocaleString()} RWF</p>
            <div className="mt-8 mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Options:</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => {
                  const qty = quantities[variant.id] || 0;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        const newQty = qty === 0 ? step : 0;
                        setQuantities((q) => ({ ...q, [variant.id]: newQty }));
                      }}
                      className={`px-4 py-2 border rounded-md text-sm transition-colors duration-150 ${qty > 0 ? 'border-primary text-primary bg-primary/5 font-semibold' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'}`}
                    >
                      {variant.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-700 px-1 w-32 border border-slate-200 dark:border-slate-600">
                <button onClick={() => {
                  // decrement all selected quantities by step (minimum step)
                  const newQuantities: Record<string, number> = {};
                  Object.entries(quantities).forEach(([id, q]) => {
                    newQuantities[id] = Math.max(0, q - step);
                  });
                  setQuantities(newQuantities);
                }} className="p-1.5 text-slate-500 hover:text-primary flex items-center justify-center w-9 h-9 rounded-lg active:bg-slate-200 dark:active:bg-slate-600">
                  <span className="material-symbols-outlined text-lg">remove</span>
                </button>
                <span className="w-8 text-center text-sm font-bold text-slate-700 dark:text-slate-200">{formatQuantityLabel(Object.values(quantities).reduce((a, b) => a + b, 0), product.unit)}</span>
                <button onClick={() => {
                  // increment all selected quantities by step
                  const newQuantities: Record<string, number> = {};
                  Object.entries(quantities).forEach(([id, q]) => {
                    newQuantities[id] = parseFloat((q + step).toFixed(1));
                  });
                  setQuantities(newQuantities);
                }} className="p-1.5 text-slate-500 hover:text-primary flex items-center justify-center w-9 h-9 rounded-lg active:bg-slate-200 dark:active:bg-slate-600">
                  <span className="material-symbols-outlined text-lg">add</span>
                </button>
              </div>
              <button onClick={handleAddAll} className="flex h-12 flex-1 items-center justify-center gap-2 bg-primary text-sm font-bold text-white shadow-md shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95">
                Add All to Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
