"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveOrder } from "@/lib/supabase/db";

// WhatsApp Icon SVG
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

// X Icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}

interface CustomOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomOrderModal({ isOpen, onClose }: CustomOrderModalProps) {
  const [form, setForm] = useState({
    customItems: "",
    name: "",
    phone: "",
    location: "",
  });
  const [touched, setTouched] = useState({ name: false, phone: false, location: false, customItems: false });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const isFormValid = form.name.trim() && form.phone.trim() && form.location.trim() && form.customItems.trim();

  const handleBlur = (field: keyof typeof touched) => setTouched(t => ({ ...t, [field]: true }));
  const fieldErr = (field: keyof typeof touched) => touched[field] && !form[field as keyof typeof form].trim();

  const handleSendCustomList = async () => {
    if (!isFormValid) {
      setTouched({ name: true, phone: true, location: true, customItems: true });
      toast.error('Please fill in all details before sending.');
      return;
    }

    setIsSubmitting(true);
    const now = new Date().toISOString();

    // 1. Save to Supabase as 'custom' order
    const { success } = await saveOrder(
      {
        customer_name: form.name,
        customer_phone: form.phone,
        delivery_location: form.location,
        is_gift: false,
        express_delivery: false,
        order_type: 'custom',
        custom_items: form.customItems,
        total_amount: 0, // Admin will reply with pricing
        whatsapp_sent: true,
        whatsapp_sent_at: now,
      },
      [] // No standard items
    );

    if (!success) {
      console.warn('Order DB save failed — WhatsApp still sent');
    }

    // 2. Open WhatsApp link
    const adminNumber = process.env.NEXT_PUBLIC_ADMIN_WHATSAPP_NUMBER || "250700000000";
    let text = `*Custom Grocery List* 📝\n\n`;
    text += `*Customer:* ${form.name}\n`;
    text += `*Phone:* ${form.phone}\n`;
    text += `*Delivery Location:* ${form.location}\n\n`;
    text += `*Items Needed:*\n${form.customItems}\n\n`;
    text += `Please reply with availability and total price. Thank you!`;

    window.open(`https://wa.me/${adminNumber}?text=${encodeURIComponent(text)}`, '_blank');
    
    // 3. Reset and close
    setForm({ customItems: "", name: "", phone: "", location: "" });
    setTouched({ name: false, phone: false, location: false, customItems: false });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-600 text-3xl">list_alt</span>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">Custom Order</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:bg-white hover:text-slate-700 rounded-full transition-colors"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 md:p-8 flex flex-col gap-6 overflow-y-auto max-h-[75vh]">
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Your Custom Grocery List <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.customItems}
              onChange={e => setForm({...form, customItems: e.target.value})}
              onBlur={() => handleBlur('customItems')}
              placeholder="e.g. 2kg potatoes, 1 pack brown sugar..."
              className={`w-full h-32 rounded-xl p-4 text-sm outline-none resize-none border transition-colors ${fieldErr('customItems') ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500'}`}
            />
          </div>

          <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
          
          <h3 className="font-bold text-lg">Delivery Information</h3>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
              <input
                value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                onBlur={() => handleBlur('name')}
                type="text"
                placeholder="John Doe"
                className={`rounded-lg h-12 px-4 outline-none text-sm transition-colors border ${fieldErr('name') ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-emerald-500'}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Phone Number <span className="text-red-500">*</span></label>
              <input
                value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                onBlur={() => handleBlur('phone')}
                type="tel"
                placeholder="+250 7XX XXX XXX"
                className={`rounded-lg h-12 px-4 outline-none text-sm transition-colors border ${fieldErr('phone') ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-emerald-500'}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Delivery Location <span className="text-red-500">*</span></label>
              <input
                value={form.location}
                onChange={e => setForm({...form, location: e.target.value})}
                onBlur={() => handleBlur('location')}
                type="text"
                placeholder="Kigali, Nyarugenge"
                className={`rounded-lg h-12 px-4 outline-none text-sm transition-colors border ${fieldErr('location') ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-slate-50 focus:border-emerald-500'}`}
              />
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex flex-col gap-3">
          <button
            onClick={handleSendCustomList}
            disabled={!isFormValid || isSubmitting}
            className="w-full h-14 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
              <WhatsAppIcon className="size-5" />
            )}
            Send Custom Order to WhatsApp
          </button>
          <p className="text-center text-xs text-slate-400 font-medium">Pricing will be calculated & confirmed via WhatsApp</p>
        </div>
      </div>
    </div>
  );
}
