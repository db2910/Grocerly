'use client';

import { useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { Product } from "@/lib/supabase/db";
import { getUnitStep, formatQuantityLabel } from "@/lib/quantityUtils";
import { VariantPicker } from "./VariantPicker";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const step = getUnitStep(product.unit);
  const [quantity, setQuantity] = useState(step);
  const [showVariantPicker, setShowVariantPicker] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const hasVariants = product.variants && product.variants.length > 0;

  const increment = () => setQuantity(q => parseFloat((q + step).toFixed(1)));
  const decrement = () => setQuantity(q => parseFloat(Math.max(step, q - step).toFixed(1)));

  const handleAddToCart = () => {
    if (hasVariants) {
      setShowVariantPicker(true);
      return;
    }
    addItem(product as any, quantity);
    toast.success(`${product.name} added to cart`, {
      description: formatQuantityLabel(quantity, product.unit),
    });
    setQuantity(step);
  };

  return (
    <>
      <div className="group flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-square overflow-hidden bg-slate-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
          />
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.isFresh && (
              <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                Fresh
              </span>
            )}
            {product.isSale && (
              <span className="rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">
                Sale
              </span>
            )}
          </div>
          {/* Variant indicator badge */}
          {hasVariants && (
            <div className="absolute top-3 right-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1 shadow-sm border border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-[12px] text-primary">tune</span>
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{product.variants!.length} options</span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5 pb-6">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">{product.source}</span>
            <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">{product.unit}</span>
          </div>

          <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight line-clamp-2">{product.name}</h3>

          <div className="flex items-center gap-1.5 mb-4 text-xs text-slate-500">
            <span className="material-symbols-outlined text-[14px]">storefront</span>
            <span className="truncate">{product.marketName}</span>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex flex-col gap-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-black text-slate-900 dark:text-white">{product.price.toLocaleString()}</span>
                <span className="text-sm font-semibold text-slate-500 ml-1">RWF / {product.unit}</span>
              </div>
              {hasVariants && (
                <span className="text-xs text-slate-400 font-medium">prices vary by option</span>
              )}
            </div>

            <div className="flex items-center justify-between gap-3">
              {/* Only show qty stepper for non-variant products */}
              {!hasVariants && (
                <div className="flex h-10 items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-700 px-1 w-28">
                  <button onClick={decrement} className="p-1 text-slate-500 hover:text-primary transition-colors flex items-center justify-center h-8 w-8 rounded-md active:bg-slate-200 dark:active:bg-slate-600">
                    <span className="material-symbols-outlined text-lg">remove</span>
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-slate-700 dark:text-slate-200">
                    {step < 1 ? quantity.toFixed(1) : quantity}
                  </span>
                  <button onClick={increment} className="p-1 text-slate-500 hover:text-primary transition-colors flex items-center justify-center h-8 w-8 rounded-md active:bg-slate-200 dark:active:bg-slate-600">
                    <span className="material-symbols-outlined text-lg">add</span>
                  </button>
                </div>
              )}

              <button
                onClick={handleAddToCart}
                className={`flex h-10 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-bold text-white shadow-sm shadow-primary/30 transition-all hover:bg-primary/90 hover:shadow-primary/50 active:scale-95 group/btn ${hasVariants ? 'flex-1' : 'flex-1'}`}
              >
                <span className="material-symbols-outlined text-[20px] group-hover/btn:rotate-12 transition-transform">
                  {hasVariants ? 'tune' : 'shopping_cart'}
                </span>
                {hasVariants ? 'Choose Option' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Variant Picker Popup */}
      {showVariantPicker && hasVariants && (
        <VariantPicker
          product={product}
          variants={product.variants!}
          onClose={() => setShowVariantPicker(false)}
        />
      )}
    </>
  );
}
