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
  const [selectedVariant, setSelectedVariant] = useState<DbProductVariant>(variants[0]);
  const step = getUnitStep(product.unit);
  const [quantity, setQuantity] = useState(step);
  const addItem = useCartStore((s) => s.addItem);

  const isImageMode = variants.some(v => !!v.image_url);
  const effectivePrice = selectedVariant.price_override ?? product.price;

  const increment = () => setQuantity(q => parseFloat((q + step).toFixed(1)));
  const decrement = () => setQuantity(q => parseFloat(Math.max(step, q - step).toFixed(1)));

  const handleAdd = () => {
    addItem(
      {
        ...product,
        // Use the variant image if available, else fall back to product image
        imageUrl: selectedVariant.image_url ?? product.imageUrl,
      },
      quantity,
      selectedVariant.id,
      selectedVariant.name,
      effectivePrice,
    );
    toast.success(`${product.name} (${selectedVariant.name}) added to cart`, {
      description: formatQuantityLabel(quantity, product.unit),
    });
    onClose();
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-full transition-colors z-10"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {isImageMode ? (
          /* ── Image Grid Layout (e.g. Juice Flavours) ── */
          <>
            <div className="flex items-start justify-between p-6 pb-4">
              <div className="pr-10">
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">{product.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">Choose your preferred option</p>
              </div>
            </div>

            <div className="px-6 pb-2">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {variants.map((variant) => {
                  const isSelected = variant.id === selectedVariant.id;
                  const variantPrice = variant.price_override ?? product.price;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all duration-150 text-left ${
                        isSelected
                          ? 'border-primary shadow-md shadow-primary/20 scale-[1.02]'
                          : 'border-slate-200 dark:border-slate-700 hover:border-primary/40'
                      }`}
                    >
                      <div className="aspect-square bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        {variant.image_url ? (
                          <img
                            src={variant.image_url}
                            alt={variant.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-slate-300 text-3xl">image</span>
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center shadow">
                          <span className="material-symbols-outlined text-white text-[14px]">check</span>
                        </div>
                      )}

                      <div className="p-2.5">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{variant.name}</p>
                        <p className={`text-xs font-black mt-0.5 ${isSelected ? 'text-primary' : 'text-slate-600 dark:text-slate-300'}`}>
                          {variantPrice.toLocaleString()} RWF
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mx-6 my-4 border-t border-slate-100 dark:border-slate-700" />

            <div className="px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Selected</p>
                  <p className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {selectedVariant.name}
                    {selectedVariant.price_override && (
                      <span className="ml-2 text-sm font-semibold text-primary">
                        {selectedVariant.price_override.toLocaleString()} RWF / {product.unit}
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-primary">{(effectivePrice * quantity).toLocaleString()}</p>
                  <p className="text-xs font-bold text-slate-400">RWF total</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-700 px-1 w-32 border border-slate-200 dark:border-slate-600">
                  <button
                    onClick={decrement}
                    className="p-1.5 text-slate-500 hover:text-primary transition-colors flex items-center justify-center w-9 h-9 rounded-lg active:bg-slate-200 dark:active:bg-slate-600"
                  >
                    <span className="material-symbols-outlined text-lg">remove</span>
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-slate-700 dark:text-slate-200">
                    {step < 1 ? quantity.toFixed(1) : quantity}
                  </span>
                  <button
                    onClick={increment}
                    className="p-1.5 text-slate-500 hover:text-primary transition-colors flex items-center justify-center w-9 h-9 rounded-lg active:bg-slate-200 dark:active:bg-slate-600"
                  >
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-md shadow-primary/30 transition-all hover:bg-primary/90 active:scale-95"
                >
                  <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                  Add to Cart
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ── Compact Pill Layout (e.g. Sacks of Rice, Sizes, screenshot style) ── */
          <div className="p-8">
            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 pr-8">{product.name}</h2>
            <p className="text-xl font-medium text-slate-600 dark:text-slate-300 mt-2">{effectivePrice.toLocaleString()} RWF</p>

            <div className="mt-8 mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">
                Size: <span className="text-slate-900 dark:text-slate-100 font-bold">{selectedVariant.name}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map(v => {
                  const isSelected = v.id === selectedVariant.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 border rounded-md text-sm transition-colors duration-150 ${
                        isSelected 
                          ? 'border-primary text-primary bg-primary/5 font-semibold' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Quantity</p>
              <div className="flex items-center gap-4">
                <div className="flex h-12 items-center justify-between border border-slate-200 dark:border-slate-700 rounded-md px-1 w-32 shrink-0">
                  <button
                    onClick={decrement}
                    className="p-2 text-slate-500 hover:text-primary transition-colors flex items-center justify-center rounded active:bg-slate-100 dark:active:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-[20px]">remove</span>
                  </button>
                  <span className="w-8 text-center text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {step < 1 ? quantity.toFixed(1) : quantity}
                  </span>
                  <button
                    onClick={increment}
                    className="p-2 text-slate-500 hover:text-primary transition-colors flex items-center justify-center rounded active:bg-slate-100 dark:active:bg-slate-800"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                </div>
                
                <button
                  onClick={handleAdd}
                  className="flex h-12 flex-1 items-center justify-center font-semibold rounded-md border border-primary text-primary hover:bg-primary hover:text-white transition-colors"
                >
                  Add to cart
                </button>
              </div>
              
              <button
                onClick={() => {
                  // Instant add and go to cart (approximating requested 'Buy it now' action)
                  addItem(
                    { ...product, imageUrl: product.imageUrl },
                    quantity,
                    selectedVariant.id,
                    selectedVariant.name,
                    effectivePrice
                  );
                  window.location.href = '/cart';
                }}
                className="w-full h-12 mt-4 bg-primary text-white font-bold rounded-md hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 active:scale-[0.98]"
              >
                Buy it now
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
