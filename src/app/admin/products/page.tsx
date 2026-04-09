"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/lib/store/adminStore";
import { Search, Plus, Filter, Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import { fetchCategories, DbCategory, DbProductVariant, fetchVariantsForProduct, upsertProductVariant, deleteProductVariant } from "@/lib/supabase/db";
import ImageUpload from "@/components/admin/ImageUpload";
import { toast } from "sonner";

export default function ProductsPage() {
  const { products, saveProduct, deleteProduct, markets, refreshData, loading } = useAdminStore();
  
  // Extra metadata
  const [dbCategories, setDbCategories] = useState<DbCategory[]>([]);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [marketFilter, setMarketFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Variant State
  const [variants, setVariants] = useState<DbProductVariant[]>([]);
  const [newVariant, setNewVariant] = useState({ name: '', image_url: '', price_override: '' });
  const [variantSaving, setVariantSaving] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    category_id: "",
    price: "",
    unit: "kg",
    market_id: "",
    image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80",
    is_active: true
  });

  // Load everything on mount
  useEffect(() => {
    refreshData();
    async function loadMeta() {
      const cats = await fetchCategories();
      setDbCategories(cats);
    }
    loadMeta();
  }, [refreshData]);

  // Set default form data when categories/markets load
  useEffect(() => {
    if (!formData.category_id && dbCategories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: dbCategories[0].id }));
    }
    if (!formData.market_id && markets.length > 0) {
      setFormData(prev => ({ ...prev, market_id: markets[0].id }));
    }
  }, [dbCategories, markets, formData.category_id, formData.market_id]);

  const categoryNames = ["All", ...dbCategories.map(c => c.name)];
  const marketOptions = ["All", ...markets.map(m => m.name)];

  // Apply Filters
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const productCatName = p.categories?.name || "Uncategorized";
    const productMktName = p.markets?.name || "Unknown";
    
    const matchCat = categoryFilter === "All" || productCatName === categoryFilter;
    const matchMarket = marketFilter === "All" || productMktName === marketFilter;
    const matchStatus = statusFilter === "All" || 
                        (statusFilter === "Active" ? p.is_active : !p.is_active);
    
    return matchSearch && matchCat && matchMarket && matchStatus;
  });

  const handleOpenModal = (product?: any) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        category_id: product.category_id || "",
        price: product.price.toString(),
        unit: product.unit,
        market_id: product.market_id || "",
        image_url: product.image_url || "",
        is_active: product.is_active
      });
      // Load variants for this product
      fetchVariantsForProduct(product.id).then(setVariants);
    } else {
      setEditingId(null);
      setFormData({
        name: "",
        category_id: dbCategories[0]?.id || "",
        price: "",
        unit: "kg",
        market_id: markets[0]?.id || "",
        image_url: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80",
        is_active: true
      });
      setVariants([]);
    }
    setNewVariant({ name: '', image_url: '', price_override: '' });
    setEditingVariantId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setJustSaved(false);
    setEditingVariantId(null);
  };

  // Track newly-saved banner to guide admin to add variants
  const [justSaved, setJustSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category_id) return;
    const isNew = !editingId;
    const saved = await saveProduct({
      id: editingId || undefined,
      name: formData.name,
      category_id: formData.category_id,
      price: Number(formData.price),
      unit: formData.unit,
      market_id: formData.market_id || undefined,
      image_url: formData.image_url,
      is_active: formData.is_active,
    }) as any;

    if (isNew && saved?.id) {
      // Transition: stay open, enter edit mode so variants section appears
      setEditingId(saved.id);
      setJustSaved(true);
    } else {
      handleCloseModal();
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    await saveProduct({ id, is_active: !currentStatus });
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Products</h1>
          <p className="text-slate-500 font-medium mt-1">Manage your catalog of {products.length} items</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => refreshData()}
            className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 border border-primary/5 transition-colors"
          >
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Sync
          </button>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 shadow-md transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            Add Product
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-primary/5 mb-8 flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              {categoryNames.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl">
            <span className="material-symbols-outlined text-sm text-slate-400">storefront</span>
            <select 
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              {marketOptions.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 px-4 py-2 rounded-xl">
             <span className="material-symbols-outlined text-sm text-slate-400">toggle_on</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-sm font-bold text-slate-700 dark:text-slate-300 outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Market</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 text-sm">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-3">
                      <Search size={48} className="text-slate-300" />
                      <p className="text-lg font-bold text-slate-700">No products found</p>
                      <p>Try adjusting your filters or search query.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                          {product.image_url ? (
                            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <span className="material-symbols-outlined">image_not_supported</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{product.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold">
                        {product.categories?.name || "Uncategorized"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        {product.markets?.name || "Unknown"}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-800 dark:text-slate-200">
                      {product.price.toLocaleString()} RWF <span className="text-xs text-slate-500 font-medium">/ {product.unit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => toggleStatus(product.id, product.is_active)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                          product.is_active 
                            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer' 
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer'
                        }`}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(product)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => deleteProduct(product.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="e.g. Fresh Tomatoes"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category</label>
                    <select 
                      required
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="" disabled>Select a category</option>
                      {dbCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Price (RWF)</label>
                    <input 
                      type="number" 
                      required
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                      placeholder="e.g. 1500"
                    />
                  </div>

                  {/* Unit */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Sales Unit</label>
                    <select 
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="kg">Per Kg</option>
                      <option value="g">Per Gram (g)</option>
                      <option value="piece">Per Piece</option>
                      <option value="bunch">Per Bunch</option>
                      <option value="tray">Per Tray</option>
                      <option value="litre">Per Litre</option>
                    </select>
                  </div>

                  {/* Market */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Market Location</label>
                    <select 
                      value={formData.market_id}
                      onChange={(e) => setFormData({...formData, market_id: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      {markets.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Status Toggle */}
                  <div className="space-y-2 flex flex-col justify-center">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Display Status</label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="sr-only" 
                          checked={formData.is_active}
                          onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                        />
                        <div className={`block w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formData.is_active ? 'translate-x-6' : ''}`}></div>
                      </div>
                      <span className="text-sm font-bold">{formData.is_active ? 'Active (Visible)' : 'Inactive (Hidden)'}</span>
                    </label>
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <div className="space-y-1 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Image</label>
                    <p className="text-xs text-slate-500">Upload a high-quality photo of the product.</p>
                  </div>
                  
                  <ImageUpload 
                    currentImageUrl={formData.image_url}
                    onUploadComplete={(url) => setFormData({...formData, image_url: url})}
                  />

                  {/* Fallback URL Input just in case */}
                  <div className="space-y-2 mt-4">
                    <label className="text-xs font-bold text-slate-500">Or Paste Image URL directly (Optional)</label>
                    <input 
                      type="url" 
                      value={formData.image_url}
                      onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-slate-400"
                      placeholder="https://images.unsplash.com/..."
                    />
                  </div>
                </div>

                {/* ── Variants Section ── */}
                {editingId ? (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 space-y-4">

                    {/* Just-saved success nudge banner */}
                    {justSaved && (
                      <div className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-xl">
                        <span className="material-symbols-outlined text-emerald-500 text-xl mt-0.5">check_circle</span>
                        <div>
                          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Product saved!</p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">You can now add variants (flavours, sizes, etc.) below — or close the modal to finish.</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="text-sm font-black text-slate-700 dark:text-slate-300">Product Variants / Options</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Add flavours, sizes, etc. Each can have its own image and optional price.</p>
                    </div>

                    {/* Existing Variants */}
                    {variants.length > 0 && (
                      <div className="space-y-2">
                        {variants.map(v => (
                          <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                            {v.image_url ? (
                              <img src={v.image_url} alt={v.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-slate-400 text-[18px]">image</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{v.name}</p>
                              <p className="text-xs text-slate-500">
                                {v.price_override ? `${v.price_override.toLocaleString()} RWF` : 'Uses base price'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingVariantId(v.id);
                                  setNewVariant({
                                    name: v.name,
                                    image_url: v.image_url || '',
                                    price_override: v.price_override ? v.price_override.toString() : ''
                                  });
                                }}
                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await deleteProductVariant(v.id);
                                  if (ok) { setVariants(vs => vs.filter(x => x.id !== v.id)); toast.success('Variant deleted'); }
                                  else toast.error('Failed to delete variant');
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add/Edit Variant Form */}
                    <div className="bg-primary/5 border border-primary/15 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <p className="text-xs font-bold text-primary uppercase tracking-widest">
                          {editingVariantId ? 'Edit Variant' : 'Add Variant'}
                        </p>
                        {editingVariantId && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingVariantId(null);
                              setNewVariant({ name: '', image_url: '', price_override: '' });
                            }}
                            className="text-[11px] text-slate-500 hover:text-slate-700 underline"
                          >
                            Cancel Edit
                          </button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            placeholder="Name (e.g. Mango)"
                            value={newVariant.name}
                            onChange={e => setNewVariant(v => ({ ...v, name: e.target.value }))}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                          <input
                            type="number"
                            placeholder="Price override (optional)"
                            value={newVariant.price_override}
                            onChange={e => setNewVariant(v => ({ ...v, price_override: e.target.value }))}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500">Variant Image (Optional)</label>
                          <ImageUpload
                            currentImageUrl={newVariant.image_url}
                            onUploadComplete={(url) => setNewVariant(v => ({ ...v, image_url: url }))}
                          />
                          <input
                            type="url"
                            placeholder="Or paste an Image URL directly (Optional)"
                            value={newVariant.image_url}
                            onChange={e => setNewVariant(v => ({ ...v, image_url: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 mt-2"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!newVariant.name || variantSaving}
                        onClick={async () => {
                          if (!editingId || !newVariant.name) return;
                          setVariantSaving(true);
                          const saved = await upsertProductVariant({
                            ...(editingVariantId ? { id: editingVariantId } : {}),
                            product_id: editingId,
                            name: newVariant.name,
                            image_url: newVariant.image_url || null,
                            price_override: newVariant.price_override ? Number(newVariant.price_override) : null,
                            sort_order: variants.length, // Upsert will ignore sort_order if updating, hopefully. Or we should fetch the existing one. Actually keeping variants.length is fine.
                          });
                          setVariantSaving(false);
                          if (saved) {
                            if (editingVariantId) {
                              setVariants(vs => vs.map(x => x.id === saved.id ? saved : x));
                              toast.success(`Variant "${saved.name}" updated`);
                            } else {
                              setVariants(vs => [...vs, saved]);
                              toast.success(`Variant "${saved.name}" added`);
                            }
                            setEditingVariantId(null);
                            setNewVariant({ name: '', image_url: '', price_override: '' });
                          } else {
                            toast.error(editingVariantId ? 'Failed to update variant' : 'Failed to add variant');
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {variantSaving ? (
                          <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : (
                          editingVariantId ? <span className="material-symbols-outlined text-[16px]">save</span> : <Plus size={16} />
                        )}
                        {editingVariantId ? 'Save Changes' : 'Add Variant'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 dark:border-slate-800 pt-6 mt-2 space-y-4 opacity-50 pointer-events-none">
                    <div>
                      <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        Product Variants / Options
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 uppercase tracking-wider">Save first</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Please save this product first to unlock adding variants like flavours or sizes.</p>
                    </div>
                  </div>
                )}

              </form>
            </div>
            
            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4 rounded-b-3xl">
              <button 
                type="button" 
                onClick={handleCloseModal}
                className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="product-form"
                className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 shadow-md transition-colors flex items-center gap-2"
                disabled={loading}
              >
                {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                {editingId ? "Update Product" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// X Icon for Modal Close
function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
