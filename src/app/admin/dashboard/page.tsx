"use client";

import Link from "next/link";
import { useAdminStore } from "@/lib/store/adminStore";
import { useEffect, useState, useMemo } from "react";
import { startOfDay, startOfWeek, startOfMonth, parseISO, isAfter, format } from "date-fns";

export default function AdminDashboard() {
  const { 
    getTodayOrdersCount, 
    getTodayRevenue, 
    getActiveProductsCount,
    orders,
    updateOrderStatus,
    refreshData,
    loading
  } = useAdminStore();

  const [isMounted, setIsMounted] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  useEffect(() => {
    setIsMounted(true);
    refreshData(); // Fetch real data from Supabase
  }, [refreshData]);

  const filteredOrders = useMemo(() => {
    if (timeFilter === 'all') return orders;
    
    const now = new Date();
    let thresholdDate: Date;
    
    if (timeFilter === 'today') {
      const today = format(now, 'yyyy-MM-dd');
      return orders.filter(o => format(parseISO(o.created_at), 'yyyy-MM-dd') === today);
    }
    else if (timeFilter === 'week') thresholdDate = startOfWeek(now, { weekStartsOn: 1 });
    else thresholdDate = startOfMonth(now);
    
    return orders.filter(o => isAfter(parseISO(o.created_at), thresholdDate));
  }, [orders, timeFilter]);

  if (!isMounted) return null;

  const filteredOrdersCount = filteredOrders.length;
  const filteredRevenue = filteredOrders.reduce((acc, o) => {
    const s = (o.status || '').toLowerCase();
    if (s === 'confirmed' || s === 'delivered') return acc + o.total_amount;
    return acc;
  }, 0);
  
  const activeProductsCount = getActiveProductsCount();

  // Sort orders by newest first and take the latest 5 for the dashboard
  const sortedOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-amber-500 bg-amber-50';
      case 'confirmed': return 'text-blue-500 bg-blue-50';
      case 'delivered': return 'text-emerald-500 bg-emerald-50';
      case 'cancelled': return 'text-red-500 bg-red-50';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  const handleStatusChange = async (orderId: string, currentStatus: string) => {
    const s = currentStatus.toLowerCase();
    if (s === 'pending') await updateOrderStatus(orderId, 'confirmed');
    else if (s === 'confirmed') await updateOrderStatus(orderId, 'delivered');
  };

  const handleCancelOrder = async (orderId: string) => {
    await updateOrderStatus(orderId, 'cancelled');
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Overview</h1>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Time Filter Toggle */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex overflow-hidden shadow-sm">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'Week' },
              { id: 'month', label: 'Month' },
              { id: 'all', label: 'All Time' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTimeFilter(t.id as any)}
                className={`px-4 py-2 text-sm font-bold transition-colors ${
                  timeFilter === t.id 
                    ? 'bg-primary text-white' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => refreshData()}
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              disabled={loading}
            >
              <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>refresh</span>
              Refresh
            </button>
            <Link href="/admin/products" className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 shadow-md">
              <span className="material-symbols-outlined">add</span>
              Add Product
            </Link>
          </div>
        </div>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5 flex flex-col gap-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">shopping_cart_checkout</span>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold">Total Orders ({timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)})</p>
                <p className="text-3xl font-black mt-1">{filteredOrdersCount}</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5 flex flex-col gap-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold">Confirmed Revenue ({timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)})</p>
                <p className="text-3xl font-black mt-1">{filteredRevenue.toLocaleString()} RWF</p>
                <p className="text-[10px] font-bold text-amber-500 mt-1">Confirmed &amp; Delivered only</p>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5 flex flex-col gap-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div>
                <p className="text-slate-500 text-sm font-bold">Active Products</p>
                <p className="text-3xl font-black mt-1">{activeProductsCount}</p>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
            <div className="p-6 border-b border-primary/5 flex justify-between items-center">
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <Link href="/admin/orders" className="text-sm font-bold text-primary hover:underline">View All</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Order ID</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/5 text-sm">
                  {sortedOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">No recent orders found.</td>
                    </tr>
                  ) : (
                    sortedOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                          <span className="text-[10px] opacity-50 block font-normal">#{order.id.slice(0, 8)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold">{order.customer_name}</p>
                          <p className="text-xs text-slate-500">{order.customer_phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="capitalize">{order.order_type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold">{order.total_amount.toLocaleString()} RWF</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            {order.status === 'pending' && (
                              <button 
                                onClick={() => handleStatusChange(order.id, order.status)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors"
                              >
                                Confirm
                              </button>
                            )}
                            {order.status === 'confirmed' && (
                              <button 
                                onClick={() => handleStatusChange(order.id, order.status)}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
                              >
                                Deliver
                              </button>
                            )}
                            {['pending', 'confirmed'].includes(order.status) && (
                              <button 
                                onClick={() => handleCancelOrder(order.id)}
                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-xs font-bold transition-colors"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
