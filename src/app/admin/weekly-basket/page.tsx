"use client";

import { useState, useEffect, useMemo } from "react";
import { useAdminStore } from "@/lib/store/adminStore";
import { DbWeeklyBasket, DbWeeklyBasketItem } from "@/lib/supabase/db";
import { Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { toast } from "sonner";

export default function WeeklyBasketManagerPage() {
  const {
    weeklyBaskets,
    saveBasket,
    saveBasketItem,
    removeBasketItem,
    toggleBasketActive,
    refreshData,
    loading,
    deleteBasket
  } = useAdminStore();

  const [selectedBasketId, setSelectedBasketId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set default selected basket once loaded
  useEffect(() => {
    if (!selectedBasketId && weeklyBaskets.length > 0) {
      setSelectedBasketId(weeklyBaskets[0].id);
    } else if (selectedBasketId && !weeklyBaskets.some(b => b.id === selectedBasketId)) {
      // If the currently selected basket was deleted, select the first available or null
      setSelectedBasketId(weeklyBaskets.length > 0 ? weeklyBaskets[0].id : null);
    }
  }, [weeklyBaskets, selectedBasketId]);

  // New item form state
  const [newItem, setNewItem] = useState<Partial<DbWeeklyBasketItem>>({
    name: "",
    quantity: 1,
    unit: "kg",
    price_at_time: 0,
  });

  const basket = useMemo(
    () => weeklyBaskets.find((b) => b.id === selectedBasketId),
    [weeklyBaskets, selectedBasketId]
  );

  const handleDeleteBasket = async () => {
    if (!basket) return;
    if (!window.confirm(`Are you sure you want to delete "${basket.name}"? This action cannot be undone.`)) return;

    const success = await deleteBasket(basket.id);
    if (success) {
      toast.success("Basket deleted successfully");
      // selection logic is handled in the useEffect
    } else {
      toast.error("Failed to delete basket");
    }
  };

  const startEdit = (field: string, value: string | number) => {
    setEditingField(field);
    setEditValue(String(value));
  };

  const commitEdit = async (field: string) => {
    if (!basket) return;
    const val = (field === "total_price" || field === "price_at_time") ? Number(editValue) : editValue;
    const success = await saveBasket({ id: basket.id, [field]: val });
    if (success) {
      toast.success(`${field.replace('_', ' ')} updated`);
      setEditingField(null);
    } else {
      toast.error(`Failed to update ${field.replace('_', ' ')}`);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !basket) return;
    const success = await saveBasketItem({ 
      ...newItem, 
      basket_id: basket.id 
    });
    if (success) {
      toast.success("Item added to basket");
      setNewItem({ name: "", quantity: 1, unit: "kg", price_at_time: 0 });
      setShowAddItem(false);
    } else {
      toast.error("Failed to add item");
    }
  };

  const handleCreateBasket = async () => {
    const newBasket = await saveBasket({
      name: "New Weekly Basket",
      description: "Description of the new basket",
      total_price: 15000,
      is_active: false,
      week_label: "Upcoming Week"
    });
    if (newBasket) {
      toast.success("New basket created");
      setSelectedBasketId(newBasket.id);
    } else {
      toast.error("Failed to create new basket");
    }
  };

  const unitLabel = (unit: string, qty: number) => {
    if (unit === "kg") return `${qty} kg`;
    if (unit === "piece") return `${qty} pc`;
    if (unit === "litre") return `${qty}L`;
    if (unit === "bunch") return `${qty} bunch`;
    if (unit === "tray") return `${qty} tray`;
    return `${qty} ${unit}`;
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Weekly Basket Manager</h1>
          <p className="text-slate-500 mt-1 font-medium">Control what's in each basket that users can order.</p>
        </div>
        <button 
          onClick={() => refreshData()}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 border border-primary/5 transition-colors"
          disabled={loading}
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Sync Baskets
        </button>
      </div>

      {loading && weeklyBaskets.length === 0 ? (
         <div className="flex items-center justify-center py-20">
           <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
         </div>
      ) : (
        <>
          {/* Basket Tabs */}
          <div className="flex gap-3 mb-8 flex-wrap">
            {weeklyBaskets.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBasketId(b.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-colors text-sm ${
                  selectedBasketId === b.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary border border-slate-200 dark:border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
                {b.name}
                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-black ${b.is_active ? "bg-emerald-500 text-white" : "bg-slate-300 text-slate-600"}`}>
                  {b.is_active ? "LIVE" : "OFF"}
                </span>
              </button>
            ))}
            <button 
              onClick={handleCreateBasket}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-dashed border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 hover:border-primary hover:text-primary transition-all"
            >
              <Plus size={18} />
              New Basket
            </button>
          </div>

          {basket ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left: Basket Settings */}
              <div className="xl:col-span-1 space-y-6">
                {/* Basket Info Card */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 p-6 space-y-5">
                  <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-700 pb-4">
                    Basket Details
                  </h2>

                  {/* Name */}
                  <EditableField
                    label="Basket Name"
                    field="name"
                    value={basket.name}
                    editingField={editingField}
                    editValue={editValue}
                    onEdit={startEdit}
                    onSave={() => commitEdit("name")}
                    onCancel={() => setEditingField(null)}
                    onChange={setEditValue}
                  />

                  {/* Description */}
                  <EditableField
                    label="Description"
                    field="description"
                    value={basket.description || ""}
                    editingField={editingField}
                    editValue={editValue}
                    onEdit={startEdit}
                    onSave={() => commitEdit("description")}
                    onCancel={() => setEditingField(null)}
                    onChange={setEditValue}
                    multiline
                  />

                  {/* Price */}
                  <EditableField
                    label="Basket Price (RWF)"
                    field="total_price"
                    value={basket.total_price}
                    editingField={editingField}
                    editValue={editValue}
                    onEdit={startEdit}
                    onSave={() => commitEdit("total_price")}
                    onCancel={() => setEditingField(null)}
                    onChange={setEditValue}
                    type="number"
                    displayValue={`${basket.total_price.toLocaleString()} RWF`}
                  />

                  {/* Week Label */}
                  <EditableField
                    label="Week/Schedule Label"
                    field="week_label"
                    value={basket.week_label || ""}
                    editingField={editingField}
                    editValue={editValue}
                    onEdit={startEdit}
                    onSave={() => commitEdit("week_label")}
                    onCancel={() => setEditingField(null)}
                    onChange={setEditValue}
                    placeholder="e.g. Week of Oct 12"
                  />

                  <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={handleDeleteBasket}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      <Trash2 size={18} />
                      Delete This Basket
                    </button>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Basket Status</p>
                      <p className="text-xs text-slate-500 mt-0.5">Visible to customers when Active</p>
                    </div>
                    <button
                      onClick={async () => {
                        const ok = await toggleBasketActive(basket.id);
                        if (ok) toast.success("Basket status updated");
                        else toast.error("Failed to update status");
                      }}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        basket.is_active
                          ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      }`}
                    >
                      <div className={`w-10 h-5 rounded-full transition-colors relative ${basket.is_active ? "bg-emerald-400" : "bg-slate-300"}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${basket.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                      {basket.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                </div>

                {/* Summary stats */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 p-6">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Basket Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Total Items</span>
                      <span className="font-bold">{basket.items.length}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-500">Items Value</span>
                      <span className="font-bold">
                        {basket.items.reduce((s, i) => s + i.price_at_time * i.quantity, 0).toLocaleString()} RWF
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-100 dark:border-slate-700 pt-3">
                      <span className="text-slate-500 font-medium">Listed Price</span>
                      <span className="font-black text-primary">{basket.total_price.toLocaleString()} RWF</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Items Manager */}
              <div className="xl:col-span-2">
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      Basket Items
                      <span className="ml-2 text-sm font-medium text-slate-400">({basket.items.length})</span>
                    </h2>
                    <button
                      onClick={() => setShowAddItem(true)}
                      className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-md"
                    >
                      <Plus size={18} />
                      Add Item
                    </button>
                  </div>

                  {/* Items List */}
                  <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {basket.items.length === 0 ? (
                      <div className="p-12 text-center text-slate-400">
                        <span className="material-symbols-outlined text-5xl mb-3 block">shopping_basket</span>
                        <p className="font-medium">No items yet. Add some!</p>
                      </div>
                    ) : basket.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 group">
                        <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined">inventory_2</span>
                        </div>

                        {/* Name & unit */}
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 uppercase text-xs tracking-tight">{item.name}</p>
                          <p className="text-sm text-slate-500 font-medium">{unitLabel(item.unit, item.quantity)}</p>
                        </div>

                        {/* Price */}
                        <div className="text-sm text-slate-600 dark:text-slate-400 font-black whitespace-nowrap">
                          {item.price_at_time.toLocaleString()} RWF <span className="text-[10px] font-bold text-slate-400">/ {item.unit}</span>
                        </div>

                        {/* Qty Controls */}
                        {editingItemId === item.id ? (
                          <div className="flex items-center gap-2">
                             <input 
                               type="number" 
                               step="0.1"
                               defaultValue={item.quantity}
                               onBlur={(e) => {
                                 saveBasketItem({ ...item, quantity: Number(e.target.value) });
                                 setEditingItemId(null);
                               }}
                               autoFocus
                               className="w-16 bg-slate-50 dark:bg-slate-900 border border-primary/20 rounded px-2 py-1 text-xs font-bold"
                             />
                            <button onClick={() => setEditingItemId(null)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg">
                              <Check size={16} />
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingItemId(item.id)} className="opacity-0 group-hover:opacity-100 p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-all">
                            <Edit3 size={16} />
                          </button>
                        )}

                        {/* Remove */}
                        <button
                          onClick={() => removeBasketItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Item Inline Form */}
                  {showAddItem && (
                    <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 border-t border-emerald-200 dark:border-emerald-700/50">
                      <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-4">Add New Basket Item</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="col-span-2">
                          <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 block">Item Name</label>
                          <input
                            type="text"
                            value={newItem.name}
                            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                            placeholder="e.g. Tomatoes"
                            className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 block">Quantity</label>
                          <input
                            type="number"
                            min="0.5"
                            step="0.1"
                            value={newItem.quantity}
                            onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 block">Unit</label>
                          <select
                            value={newItem.unit}
                            onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                            className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                          >
                            <option value="kg">kg</option>
                            <option value="piece">piece</option>
                            <option value="bunch">bunch</option>
                            <option value="tray">tray</option>
                            <option value="litre">litre</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 block">Price / unit (RWF)</label>
                          <input
                            type="number"
                            min="0"
                            value={newItem.price_at_time}
                            onChange={(e) => setNewItem({ ...newItem, price_at_time: Number(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-800 border border-emerald-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={handleAddItem}
                          disabled={!newItem.name}
                          className="px-5 py-2 bg-emerald-600 disabled:opacity-40 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
                        >
                          Add to Basket
                        </button>
                        <button
                          onClick={() => setShowAddItem(false)}
                          className="px-5 py-2 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors border border-slate-200 dark:border-slate-600"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200">
              <span className="material-symbols-outlined text-6xl text-slate-300 block mb-4">shopping_basket</span>
              <p className="font-bold text-slate-500">Select or create a basket to manage it</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Reusable inline editable field ── */
function EditableField({
  label, field, value, editingField, editValue, onEdit, onSave, onCancel, onChange,
  multiline = false, type = "text", displayValue, placeholder = ""
}: {
  label: string; field: string; value: string | number; editingField: string | null; editValue: string;
  onEdit: (field: string, value: string | number) => void; onSave: () => void; onCancel: () => void;
  onChange: (v: string) => void; multiline?: boolean; type?: string; displayValue?: string; placeholder?: string;
}) {
  const isEditing = editingField === field;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
        {!isEditing && (
          <button onClick={() => onEdit(field, value)} className="text-xs font-bold text-primary hover:underline">
            Edit
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="flex gap-2">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              autoFocus
              rows={3}
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-primary/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none font-medium"
            />
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => onChange(e.target.value)}
              autoFocus
              className="flex-1 bg-slate-50 dark:bg-slate-900 border border-primary/30 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 font-bold"
            />
          )}
          <div className="flex flex-col gap-1">
            <button onClick={onSave} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"><Check size={16} /></button>
            <button onClick={onCancel} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><X size={16} /></button>
          </div>
        </div>
      ) : (
        <p className="text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-xl px-3 py-2 min-h-[40px] flex items-center">
          {displayValue ?? (value || <span className="text-slate-400 font-normal italic">{placeholder || "Not set"}</span>)}
        </p>
      )}
    </div>
  );
}
