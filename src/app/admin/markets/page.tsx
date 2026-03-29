"use client";

import { useEffect, useState, useMemo } from "react";
import { useAdminStore } from "@/lib/store/adminStore";
import { Plus, Trash2, MapPin, Store, X, Check } from "lucide-react";
import { toast } from "sonner";

export default function MarketsPage() {
  const { markets, orders, products, saveMarket, deleteMarket, refreshData, loading } = useAdminStore();
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", location: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMounted(true);
    refreshData();
  }, [refreshData]);

  if (!mounted) return null;

  const marketStats = markets.map((m) => {
    let revenue = 0;
    let pendingCount = 0;
    const uniqueOrderIds = new Set<string>();

    orders.forEach((o) => {
      let hasMarketItem = false;
      const oStatus = (o.status || '').toLowerCase();
      
      (o.items || []).forEach((item) => {
        const product = products.find(p => p.id === item.product_id);
        if (product && product.market_id === m.id) {
          hasMarketItem = true;
          if (oStatus !== "cancelled") {
            revenue += item.subtotal || (item.quantity * item.price_at_time);
          }
        }
      });

      if (hasMarketItem) {
        uniqueOrderIds.add(o.id);
        if (oStatus === "pending") pendingCount++;
      }
    });

    const marketProducts = products.filter(p => p.market_id === m.id);
    const total_products = marketProducts.length;
    
    // Vendor logic: Count unique sources (vendors) for products in this market
    const uniqueVendors = new Set(
      marketProducts
        .map(p => p.source)
        .filter(s => s && s.trim() !== "")
    );
    const active_vendors = uniqueVendors.size || 0;

    return { ...m, totalOrders: uniqueOrderIds.size, revenue, pendingCount, total_products, active_vendors };
  });

  const totalRevenue = marketStats.reduce((s, m) => s + m.revenue, 0);

  const handleAddMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.location) return;

    setIsSubmitting(true);
    const success = await saveMarket({ 
      name: formData.name, 
      location: formData.location, 
      is_active: true 
    });
    
    setIsSubmitting(false);
    if (success) {
      toast.success("Market added successfully");
      setIsModalOpen(false);
      setFormData({ name: "", location: "" });
    } else {
      toast.error("Failed to add market");
    }
  };

  const handleDeleteMarket = async (marketId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will mark it as inactive and it will no longer appear on the main site.`)) return;

    const success = await deleteMarket(marketId);
    if (success) {
      toast.success("Market deleted successfully");
    } else {
      toast.error("Failed to delete market");
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Markets</h1>
          <p className="text-slate-500 font-medium mt-1">Overview of all active market locations</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          Add New Market
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <Store size={24} />
          </div>
          <p className="text-slate-500 text-sm font-bold">Total Markets</p>
          <p className="text-3xl font-black mt-1">{markets.filter(m => m.is_active).length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <p className="text-slate-500 text-sm font-bold">Combined Revenue</p>
          <p className="text-3xl font-black mt-1">{totalRevenue.toLocaleString()} <span className="text-base font-medium text-slate-500">RWF</span></p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">group</span>
          </div>
          <p className="text-slate-500 text-sm font-bold">Total Vendors (Unique Sources)</p>
          <p className="text-3xl font-black mt-1">{marketStats.reduce((s, m) => s + m.active_vendors, 0)}</p>
        </div>
      </div>

      {/* Markets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {marketStats.filter(m => m.is_active).map((market) => (
          <div key={market.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 overflow-hidden group hover:shadow-md transition-shadow">
            {/* Color bar */}
            <div className="h-2 bg-gradient-to-r from-primary to-emerald-400" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">{market.name}</h2>
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-1 font-medium">
                    <MapPin size={14} className="text-slate-400" />
                    {market.location}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full tracking-wider">Active</span>
                  <button 
                    onClick={() => handleDeleteMarket(market.id, market.name)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors bg-slate-50 dark:bg-slate-900 rounded-lg opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm border-t border-slate-100 dark:border-slate-700 pt-4">
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Vendors</p>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-lg">{market.active_vendors}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Products</p>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-lg">{market.total_products}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Orders</p>
                  <p className="font-black text-slate-800 dark:text-slate-100 text-lg">{market.totalOrders}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pending</p>
                  <p className={`font-black text-lg ${market.pendingCount > 0 ? "text-amber-500" : "text-slate-400"}`}>
                    {market.pendingCount}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Revenue Generated</p>
                <p className="text-xl font-black text-primary">{market.revenue.toLocaleString()} <span className="text-sm font-medium text-slate-500 uppercase">RWF</span></p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Market Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-3xl shadow-2xl border border-primary/10 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Add New Market</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddMarket} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Market Name</label>
                <input 
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Kimironko Market"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Location / Neighborhood</label>
                <input 
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Kimironko, Kigali"
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : <Check size={20} />}
                  Add Market
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
