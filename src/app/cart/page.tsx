'use client';

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { useCartStore } from "@/store/cartStore";
import { getUnitStep } from "@/lib/quantityUtils";
import { saveOrder } from "@/lib/supabase/db";

// Inline WhatsApp icon SVG for reuse
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();

  const [isGift, setIsGift] = useState(false);
  const [expressDelivery, setExpressDelivery] = useState(false);
  const [touched, setTouched] = useState({ name: false, phone: false, location: false });
  const [form, setForm] = useState({
    name: "",
    phone: "",
    location: "",
    recipientName: "",
    recipientPhone: "",
  });

  const subtotal = getTotal();
  const deliveryFee = expressDelivery ? 3500 : 1500;
  const totalAmount = subtotal + deliveryFee;

  // Validation helpers
  const isFormValid = form.name.trim() && form.phone.trim() && form.location.trim();
  const canCheckout = items.length > 0 && isFormValid;

  const fieldErr = (field: 'name' | 'phone' | 'location') =>
    touched[field] && !form[field].trim();

  const handleBlur = (field: 'name' | 'phone' | 'location') =>
    setTouched(t => ({ ...t, [field]: true }));

  // Step-aware quantity controls inside the cart
  const handleDecrement = (id: string, currentQty: number, unit: string) => {
    const step = getUnitStep(unit);
    const next = parseFloat(Math.max(step, currentQty - step).toFixed(1));
    updateQuantity(id, next);
    toast.info('Quantity decreased');
  };

  const handleIncrement = (id: string, currentQty: number, unit: string) => {
    const step = getUnitStep(unit);
    const next = parseFloat((currentQty + step).toFixed(1));
    updateQuantity(id, next);
    toast.info('Quantity increased');
  };

  const handleRemove = (id: string, name: string) => {
    removeItem(id);
    toast.error(`${name} removed from cart`);
  };

  // Build and open the WhatsApp link — also saves the order to Supabase
  const handleCheckout = async () => {
    if (!isFormValid) {
      setTouched({ name: true, phone: true, location: true });
      toast.error('Please fill in all delivery details before sending.');
      return;
    }

    const adminNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "250700000000";
    let text = `*New Grocerly Order* 🛒\n\n`;
    text += `*Customer:* ${form.name}\n`;
    text += `*Phone:* ${form.phone}\n`;
    if (isGift) {
      text += `\n🎁 *GIFT DELIVERY*\n`;
      text += `*Recipient:* ${form.recipientName}\n`;
      text += `*Recipient Phone:* ${form.recipientPhone}\n`;
    }
    text += `\n*Delivery Location:* ${form.location}\n`;
    text += `*Express Delivery:* ${expressDelivery ? 'Yes (+2,000 RWF)' : 'No'}\n\n`;
    text += `*Items:*\n`;
    items.forEach(item => {
      const step = getUnitStep(item.unit ?? 'piece');
      const qtyLabel = step < 1 ? `${item.quantity.toFixed(1)} kg` : `${item.quantity}× ${item.unit}`;
      const lineTotal = (item.price * item.quantity).toLocaleString();
      text += `- ${item.name} (${qtyLabel}) — ${lineTotal} RWF\n`;
    });
    text += `\n*Subtotal:* ${subtotal.toLocaleString()} RWF\n`;
    text += `*Delivery Fee:* ${deliveryFee.toLocaleString()} RWF\n`;
    text += `*Total:* ${totalAmount.toLocaleString()} RWF\n`;
    text += `\nPlease confirm availability and delivery time. Thank you!`;

    // ── Save order to Supabase ──────────────────────────────────────────────
    const now = new Date().toISOString();
    
    const hasBasketItems = items.some(i => i.categoryId === 'basket');
    const orderType = hasBasketItems ? 'basket' : 'standard';

    const { success } = await saveOrder(
      {
        customer_name:     form.name,
        customer_phone:    form.phone,
        delivery_location: form.location,
        is_gift:           isGift,
        recipient_name:    isGift ? form.recipientName : undefined,
        recipient_phone:   isGift ? form.recipientPhone : undefined,
        express_delivery:  expressDelivery,
        order_type:        orderType,
        total_amount:      totalAmount,
        whatsapp_sent:     true,
        whatsapp_sent_at:  now,
      },
      items.map(item => ({
        order_id:       '',          // filled by saveOrder
        product_id:     item.id,
        name:           item.name,
        quantity:       item.quantity,
        unit:           item.unit ?? 'piece',
        price_at_time:  item.price,
      }))
    );

    if (!success) {
      console.warn('Order DB save failed — WhatsApp still sent');
    }
    // ────────────────────────────────────────────────────────────────────────

    window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`, '_blank');
    
    // Auto-clear the cart after a short delay so user can transition gracefully
    setTimeout(() => {
      clearCart();
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 w-full px-4 sm:px-6 py-8">

      {/* ── Left Column ───────────────────────────────────────────── */}
      <div className="lg:col-span-8 flex flex-col gap-8">

        {/* Breadcrumb + Heading */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-primary/70 text-sm font-medium">
            <Link className="hover:underline" href="/">Home</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-900 dark:text-slate-100">Checkout</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Your Shopping Cart</h1>
          <p className="text-slate-600 dark:text-slate-400">Review items, fill delivery details, and send your order.</p>
        </div>

        {/* ── Cart Items Table ── */}
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/10 overflow-hidden">
          <div className="p-5 border-b border-primary/5 flex justify-between items-center">
            <h2 className="text-lg font-bold">Itemized List</h2>
            <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {items.length === 0 ? (
            <div className="p-10 text-center text-slate-500 flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-5xl text-slate-300">shopping_cart</span>
              <p className="font-medium">Your cart is empty.</p>
              <Link href="/shop" className="text-primary font-bold hover:underline">Browse the Shop →</Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[500px]">
                <thead className="bg-primary/5 text-[11px] font-bold uppercase tracking-wider text-primary/80">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-5 py-3 text-center">Quantity</th>
                    <th className="px-5 py-3 text-right">Unit Price</th>
                    <th className="px-5 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {items.map(item => {
                    const step = getUnitStep(item.unit ?? 'piece');
                    const isWeight = step < 1;
                    // Weight: "1.0 kg"  |  Count: "1 × 30 units"
                    const qtyLabel = isWeight
                      ? `${item.quantity.toFixed(1)} kg`
                      : `${item.quantity} × ${item.unit}`;
                    const lineTotal = item.price * item.quantity;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Product Info */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                              <img src={item.imageUrl} alt={item.name} className="object-cover w-full h-full" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight">{item.name}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{item.marketName}</p>
                              <button
                                onClick={() => handleRemove(item.id, item.name)}
                                className="text-[11px] text-red-400 hover:text-red-600 font-semibold mt-1 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Quantity stepper */}
                        <td className="px-5 py-4 text-center">
                          <div className="inline-flex items-center gap-1 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg px-1">
                            <button
                              onClick={() => handleDecrement(item.id, item.quantity, item.unit ?? 'piece')}
                              className="w-7 h-7 flex items-center justify-center hover:text-primary transition-colors rounded"
                            >
                              <span className="material-symbols-outlined text-base">remove</span>
                            </button>
                            <span className="w-auto px-2 text-center text-sm font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                               {qtyLabel}
                             </span>
                            <button
                              onClick={() => handleIncrement(item.id, item.quantity, item.unit ?? 'piece')}
                              className="w-7 h-7 flex items-center justify-center hover:text-primary transition-colors rounded"
                            >
                              <span className="material-symbols-outlined text-base">add</span>
                            </button>
                          </div>
                        </td>

                        {/* Unit price */}
                        <td className="px-5 py-4 text-right text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {item.price.toLocaleString()} RWF
                        </td>

                        {/* Line total */}
                        <td className="px-5 py-4 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {lineTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })} RWF
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ── Delivery Information ── */}
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-primary/10 p-6">
          <div className="flex items-center gap-2 mb-6 border-b border-primary/5 pb-4">
            <span className="material-symbols-outlined text-primary">local_shipping</span>
            <h2 className="text-xl font-bold">Delivery Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                onBlur={() => handleBlur('name')}
                className={`rounded-lg h-12 px-4 outline-none text-sm transition-colors border ${fieldErr('name') ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700 bg-primary/5 focus:border-primary'}`}
                placeholder="John Doe"
                type="text"
              />
              {fieldErr('name') && <p className="text-xs text-red-500 font-medium">Name is required</p>}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                onBlur={() => handleBlur('phone')}
                className={`rounded-lg h-12 px-4 outline-none text-sm transition-colors border ${fieldErr('phone') ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700 bg-primary/5 focus:border-primary'}`}
                placeholder="+250 7XX XXX XXX"
                type="tel"
              />
              {fieldErr('phone') && <p className="text-xs text-red-500 font-medium">Phone number is required</p>}
            </div>

            {/* Location */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Delivery Location <span className="text-red-500">*</span>
              </label>
              <input
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
                onBlur={() => handleBlur('location')}
                className={`rounded-lg h-12 px-4 outline-none text-sm transition-colors border ${fieldErr('location') ? 'border-red-400 bg-red-50 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700 bg-primary/5 focus:border-primary'}`}
                placeholder="Kigali, Nyarugenge"
                type="text"
              />
              {fieldErr('location') && <p className="text-xs text-red-500 font-medium">Delivery location is required</p>}
            </div>
          </div>

          {/* Gift Option */}
          <div className="bg-primary/5 p-5 rounded-xl border-2 border-dashed border-primary/20 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <input
                checked={isGift}
                onChange={e => setIsGift(e.target.checked)}
                className="size-5 rounded border-primary text-primary focus:ring-primary accent-primary"
                id="gift"
                type="checkbox"
              />
              <label className="font-bold text-slate-800 dark:text-slate-200 cursor-pointer" htmlFor="gift">
                🎁 Send groceries to someone else (Gift Delivery)
              </label>
            </div>
            {isGift && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-4">
                <input
                  value={form.recipientName}
                  onChange={e => setForm({ ...form, recipientName: e.target.value })}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-11 px-4 text-sm outline-none focus:border-primary"
                  placeholder="Recipient Full Name"
                  type="text"
                />
                <input
                  value={form.recipientPhone}
                  onChange={e => setForm({ ...form, recipientPhone: e.target.value })}
                  className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-11 px-4 text-sm outline-none focus:border-primary"
                  placeholder="Recipient Phone Number"
                  type="tel"
                />
              </div>
            )}
          </div>

          {/* Express Delivery Toggle */}
          <div
            className={`flex items-center justify-between p-5 rounded-xl cursor-pointer transition-colors border-2 ${expressDelivery ? 'bg-primary/10 border-primary' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/40'}`}
            onClick={() => setExpressDelivery(!expressDelivery)}
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary rounded-lg text-white">
                <span className="material-symbols-outlined">bolt</span>
              </div>
              <div>
                <p className="font-bold">Express Delivery</p>
                <p className="text-xs text-slate-500">Get your order within 60 minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-bold text-primary">+2,000 RWF</span>
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${expressDelivery ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                {expressDelivery && <span className="material-symbols-outlined text-white text-sm">check</span>}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Right Column: Order Summary ─────────────────────────── */}
      <div className="lg:col-span-4">
        <div className="sticky top-28 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-primary/10 p-7 flex flex-col gap-5">
          <h2 className="text-2xl font-black border-b border-primary/10 pb-4 tracking-tight">Order Summary</h2>

          {/* Item breakdown */}
          {items.length > 0 && (
            <div className="flex flex-col gap-2 text-sm">
              {items.map(item => {
                const step = getUnitStep(item.unit ?? 'piece');
                const qtyLabel = step < 1
                  ? `${item.quantity.toFixed(1)} kg`
                  : `${item.quantity} × ${item.unit}`;
                return (
                  <div key={item.id} className="flex justify-between gap-2 text-slate-600 dark:text-slate-400">
                    <span className="truncate">{qtyLabel} {item.name}</span>
                    <span className="shrink-0 font-semibold">{(item.price * item.quantity).toLocaleString(undefined, { maximumFractionDigits: 0 })} RWF</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="h-px bg-primary/10" />

          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span>{subtotal.toLocaleString()} RWF</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Delivery Fee {expressDelivery && <span className="text-xs text-primary">(Express)</span>}</span>
              <span>{deliveryFee.toLocaleString()} RWF</span>
            </div>
          </div>

          <div className="h-px bg-primary/10" />

          <div className="flex justify-between items-center text-xl font-black">
            <span>Total</span>
            <span className="text-primary">{totalAmount.toLocaleString()} RWF</span>
          </div>

          {/* Validation hint */}
          {!isFormValid && items.length > 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 font-medium">
              Please fill in your Name, Phone, and Delivery Location to send your order.
            </p>
          )}

          <div className="flex flex-col gap-3 mt-2">
            <button
              onClick={handleCheckout}
              disabled={!canCheckout}
              className="w-full bg-primary disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
            >
              <WhatsAppIcon className="size-5" />
              Send Order via WhatsApp
            </button>
            <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">Safe & Secure Ordering</p>
          </div>
        </div>
      </div>
    </div>
  );
}
