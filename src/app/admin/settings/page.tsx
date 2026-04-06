"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/lib/store/adminStore";
import { toast } from "sonner";

type FeeKey = 'standard_delivery_fee' | 'express_delivery_fee' | 'express_delivery_label';

interface SettingField {
  key: FeeKey;
  label: string;
  description: string;
  icon: string;
  type: 'number' | 'text';
  prefix?: string;
  suffix?: string;
}

const SETTING_FIELDS: SettingField[] = [
  {
    key: 'standard_delivery_fee',
    label: 'Standard Delivery Fee',
    description: 'Shown to all customers at checkout by default.',
    icon: 'local_shipping',
    type: 'number',
    suffix: 'RWF',
  },
  {
    key: 'express_delivery_fee',
    label: 'Express Delivery Surcharge',
    description: 'Extra amount added to the standard fee when customer selects express delivery.',
    icon: 'bolt',
    type: 'number',
    suffix: 'RWF',
  },
  {
    key: 'express_delivery_label',
    label: 'Express Delivery Description',
    description: 'Short text shown next to the express delivery option.',
    icon: 'edit_note',
    type: 'text',
  },
];

export default function SettingsPage() {
  const { settings, updateDeliveryFee, refreshData, loading } = useAdminStore();
  const [values, setValues] = useState({
    standard_delivery_fee: '',
    express_delivery_fee: '',
    express_delivery_label: '',
  });
  const [saving, setSaving] = useState<FeeKey | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    refreshData();
  }, [refreshData]);

  // Sync local state when settings load from DB
  useEffect(() => {
    setValues({
      standard_delivery_fee:  String(settings.standardDeliveryFee),
      express_delivery_fee:   String(settings.expressDeliveryFee),
      express_delivery_label: settings.expressDeliveryLabel,
    });
  }, [settings]);

  if (!mounted) return null;

  const handleSave = async (field: SettingField) => {
    const val = values[field.key];
    if (!val.trim()) return;

    setSaving(field.key);
    const ok = await updateDeliveryFee(field.key, val);
    setSaving(null);

    if (ok) {
      toast.success(`${field.label} updated successfully`);
    } else {
      toast.error(`Failed to update ${field.label}`);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Settings</h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage delivery fees and business configuration.
          </p>
        </div>
        <button
          onClick={() => refreshData()}
          disabled={loading}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 border border-primary/5 transition-colors"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Reload
        </button>
      </div>

      {/* Delivery Fees Section */}
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">Delivery Fees</h2>
          <p className="text-sm text-slate-500">
            Changes take effect immediately for all new orders placed by customers.
          </p>
        </div>

        {SETTING_FIELDS.map((field) => {
          const isSaving = saving === field.key;
          const currentValue = field.key === 'standard_delivery_fee'
            ? settings.standardDeliveryFee
            : field.key === 'express_delivery_fee'
            ? settings.expressDeliveryFee
            : settings.expressDeliveryLabel;

          return (
            <div
              key={field.key}
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 p-6"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-primary text-[22px]">{field.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{field.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5 mb-4">{field.description}</p>

                  {/* Current Value Badge */}
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Current Value
                  </p>
                  <p className="text-2xl font-black text-primary mb-4">
                    {field.type === 'number'
                      ? `${Number(currentValue).toLocaleString()} RWF`
                      : currentValue}
                  </p>

                  {/* Edit Input */}
                  <div className="flex gap-3 items-center">
                    <div className="relative flex-1">
                      {field.type === 'number' ? (
                        <input
                          type="number"
                          min="0"
                          step="100"
                          value={values[field.key]}
                          onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSave(field)}
                          className="w-full h-12 px-4 pr-16 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                          placeholder="Enter amount..."
                        />
                      ) : (
                        <input
                          type="text"
                          value={values[field.key]}
                          onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSave(field)}
                          className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                          placeholder="Enter description..."
                        />
                      )}
                      {field.suffix && (
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          {field.suffix}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleSave(field)}
                      disabled={isSaving}
                      className="h-12 px-6 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-2 shrink-0 shadow-md shadow-primary/20"
                    >
                      {isSaving ? (
                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      ) : (
                        <span className="material-symbols-outlined text-[18px]">save</span>
                      )}
                      {isSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Info note */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
          <span className="material-symbols-outlined text-blue-500 text-[20px] mt-0.5 shrink-0">info</span>
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Delivery fees are shown live on the customer checkout page. Changing them here updates the cost for all future orders immediately — no refresh needed.
          </p>
        </div>
      </div>
    </div>
  );
}
