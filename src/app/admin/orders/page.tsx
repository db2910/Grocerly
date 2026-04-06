"use client";

import { useState, useEffect } from "react";
import { useAdminStore } from "@/lib/store/adminStore";
import { DbOrder } from "@/lib/supabase/db";

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:   { color: "text-amber-600",  bg: "bg-amber-50",     label: "Pending" },
  confirmed: { color: "text-blue-600",   bg: "bg-blue-50",      label: "Confirmed" },
  delivered: { color: "text-emerald-600", bg: "bg-emerald-50",   label: "Delivered" },
  cancelled: { color: "text-red-500",    bg: "bg-red-50",       label: "Cancelled" },
  out_for_delivery: { color: "text-indigo-600", bg: "bg-indigo-50", label: "Out for Delivery" },
};

export default function OrdersPage() {
  const { orders, settings, updateOrderStatus, refreshData, loading } = useAdminStore();
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DbOrder | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    refreshData();
  }, [refreshData]);

  if (!mounted) return null;

  const filtered = orders
    .filter((o) => statusFilter === "All" || o.status === statusFilter)
    .filter((o) =>
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.delivery_location || "").toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getCount = (status: string) => 
    status === "All" ? orders.length : orders.filter(o => o.status === status).length;

  // Revenue: only confirmed + delivered orders
  const totalRevenue = orders
    .filter((o) => o.status === "confirmed" || o.status === "delivered")
    .reduce((s, o) => s + o.total_amount, 0);

  const confirmedCount = orders.filter(o => o.status === "confirmed" || o.status === "delivered").length;

  const formatId = (id: string) => `#${id.slice(0, 8)}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleStatusAction = async (orderId: string, newStatus: DbOrder["status"]) => {
    setConfirmingId(orderId);
    await updateOrderStatus(orderId, newStatus);
    setConfirmingId(null);
    // Update the selected order in the modal if it's open
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Orders</h1>
          <p className="text-slate-500 font-medium mt-1">
            {orders.length} total orders •{" "}
            <span className="text-emerald-600 font-bold">{confirmedCount} confirmed</span> •{" "}
            {totalRevenue.toLocaleString()} RWF confirmed revenue
          </p>
        </div>
        <button 
          onClick={() => refreshData()}
          className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 border border-primary/5 transition-colors"
          disabled={loading}
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
          Sync Orders
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["All", "pending", "confirmed", "delivered", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${
              statusFilter === s
                ? "bg-primary text-white shadow-md underline decoration-white/30 underline-offset-4"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary/10 hover:text-primary border border-slate-200 dark:border-slate-700 font-medium"
            }`}
          >
            <span className="capitalize">{s === "pending" ? "New" : s}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${statusFilter === s ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
              {getCount(s)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-primary/5 mb-6 flex items-center gap-3">
        <span className="material-symbols-outlined text-slate-400">search</span>
        <input
          type="text"
          placeholder="Search orders by customer, UUID, or location..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm font-medium"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto text-slate-800 dark:text-slate-100">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-black uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="px-6 py-5">Order</th>
                <th className="px-6 py-5">Customer</th>
                <th className="px-6 py-5">Type</th>
                <th className="px-6 py-5">Location</th>
                <th className="px-6 py-5">Date</th>
                <th className="px-6 py-5">Amount</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 text-sm">
              {loading && orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-4xl block mb-2 opacity-50">inbox</span>
                    No orders found
                  </td>
                </tr>
              ) : filtered.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
                const isConfirming = confirmingId === order.id;
                return (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{formatId(order.id)}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">UUID: {order.id.slice(0, 4)}...{order.id.slice(-4)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100">{order.customer_name}</p>
                      <p className="text-xs text-slate-500 font-medium">{order.customer_phone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] font-black uppercase tracking-wider">
                        {order.order_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 max-w-[150px] truncate">
                        <span className="material-symbols-outlined text-[14px] shrink-0">location_on</span>
                        <span className="truncate">{order.delivery_location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{formatDate(order.created_at)}</td>
                    <td className="px-6 py-4 font-black">
                      {order.total_amount.toLocaleString()} <span className="text-[10px] font-bold text-slate-500">RWF</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-black capitalize ${cfg.color} ${cfg.bg}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* View Details — opens the modal */}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="px-3 py-1.5 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          Details
                        </button>
                        {/* Quick action shortcuts */}
                        {order.status === "pending" && (
                          <button
                            onClick={() => handleStatusAction(order.id, "confirmed")}
                            disabled={isConfirming}
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                          >
                            {isConfirming ? "..." : "Confirm"}
                          </button>
                        )}
                        {order.status === "confirmed" && (
                          <button
                            onClick={() => handleStatusAction(order.id, "delivered")}
                            disabled={isConfirming}
                            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                          >
                            {isConfirming ? "..." : "Deliver"}
                          </button>
                        )}
                        {["pending", "confirmed"].includes(order.status) && (
                          <button
                            onClick={() => handleStatusAction(order.id, "cancelled")}
                            disabled={isConfirming}
                            className="px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          settings={settings}
          onClose={() => setSelectedOrder(null)}
          onStatusChange={handleStatusAction}
          confirmingId={confirmingId}
        />
      )}
    </div>
  );
}

// ── Order Detail Modal ────────────────────────────────────────────────────────
function OrderDetailModal({
  order,
  settings,
  onClose,
  onStatusChange,
  confirmingId,
}: {
  order: DbOrder;
  settings: any; // Using any for brevity or import AppSettings
  onClose: () => void;
  onStatusChange: (id: string, status: DbOrder["status"]) => Promise<void>;
  confirmingId: string | null;
}) {
  const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const isConfirming = confirmingId === order.id;

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-RW", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    }) + " at " + new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const itemsTotal = order.items?.reduce((s, i) => s + (i.subtotal ?? i.price_at_time * i.quantity), 0) ?? order.total_amount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-700">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Order #{order.id.slice(0, 8)}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-black capitalize ${cfg.color} ${cfg.bg}`}>
                {order.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-sm text-slate-500">{formatDate(order.created_at)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Modal Body — scrollable */}
        <div className="overflow-y-auto flex-1">
          {/* Customer Info */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Customer</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">person</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{order.customer_name}</p>
                  <p className="text-xs text-slate-500">{order.customer_phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">location_on</span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{order.delivery_location}</p>
                  <p className="text-xs text-slate-500">{order.express_delivery ? "⚡ Express Delivery" : "Standard Delivery"}</p>
                </div>
              </div>
            </div>

            {/* Gift info */}
            {order.is_gift && (
              <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-xl">🎁</span>
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Gift Delivery</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Recipient: <strong>{order.recipient_name}</strong> · {order.recipient_phone}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">
              Order Items {order.items && `(${order.items.length})`}
            </p>

            {(!order.items || order.items.length === 0) ? (
              <div className="text-center py-8 text-slate-400">
                <span className="material-symbols-outlined text-3xl block mb-2 opacity-50">inventory_2</span>
                <p className="text-sm font-medium">No item details available</p>
                {order.custom_items && (
                  <div className="mt-3 text-left bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                    <p className="text-xs font-bold text-slate-500 mb-1">Custom List:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{order.custom_items}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-3 px-4 bg-slate-50 dark:bg-slate-700/40 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">{item.quantity} {item.unit}</p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs text-slate-400">{item.price_at_time.toLocaleString()} × {item.quantity}</p>
                      <p className="font-black text-slate-800 dark:text-slate-100 text-sm">
                        {(item.subtotal ?? item.price_at_time * item.quantity).toLocaleString()} RWF
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="p-6">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Summary</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Items Subtotal</span>
                <span>{itemsTotal.toLocaleString()} RWF</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Delivery Fee {order.express_delivery && <span className="text-xs text-primary ml-1">(Express)</span>}</span>
                <span>
                  {(order.express_delivery 
                    ? settings.standardDeliveryFee + settings.expressDeliveryFee 
                    : settings.standardDeliveryFee
                  ).toLocaleString()} RWF
                </span>
              </div>
              <div className="flex justify-between font-black text-lg text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Total</span>
                <span className="text-primary">{order.total_amount.toLocaleString()} RWF</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
              <span className="material-symbols-outlined text-[14px]">
                {order.whatsapp_sent ? "check_circle" : "cancel"}
              </span>
              {order.whatsapp_sent
                ? `WhatsApp sent at ${new Date(order.whatsapp_sent_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "WhatsApp not sent"}
            </div>
          </div>
        </div>

        {/* Modal Footer — Action Buttons */}
        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-b-3xl flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {order.status === "pending" && (
              <>
                <button
                  onClick={() => onStatusChange(order.id, "cancelled")}
                  disabled={isConfirming}
                  className="px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  Cancel Order
                </button>
                <button
                  onClick={() => onStatusChange(order.id, "confirmed")}
                  disabled={isConfirming}
                  className="px-6 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-bold transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isConfirming ? (
                    <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Confirming...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">check_circle</span> Confirm Order</>
                  )}
                </button>
              </>
            )}

            {order.status === "confirmed" && (
              <>
                <button
                  onClick={() => onStatusChange(order.id, "cancelled")}
                  disabled={isConfirming}
                  className="px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => onStatusChange(order.id, "delivered")}
                  disabled={isConfirming}
                  className="px-6 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-sm font-bold transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
                >
                  {isConfirming ? (
                    <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> Updating...</>
                  ) : (
                    <><span className="material-symbols-outlined text-sm">local_shipping</span> Mark Delivered</>
                  )}
                </button>
              </>
            )}

            {(order.status === "delivered" || order.status === "cancelled") && (
              <span className={`px-4 py-2 rounded-xl text-sm font-bold ${cfg.color} ${cfg.bg}`}>
                {cfg.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
