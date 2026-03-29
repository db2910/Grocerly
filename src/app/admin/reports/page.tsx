"use client";

import { useAdminStore } from "@/lib/store/adminStore";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

import { useState, useMemo } from "react";
import { startOfDay, startOfWeek, startOfMonth, parseISO, isAfter, format, eachDayOfInterval, subDays } from "date-fns";

export default function ReportsPage() {
  const { orders, products } = useAdminStore();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // --- Data Processing for Charts ---
  const filteredOrders = useMemo(() => {
    if (timeFilter === 'all') return orders;
    
    const now = new Date();
    let thresholdDate: Date;
    
    if (timeFilter === 'today') thresholdDate = startOfDay(now);
    else if (timeFilter === 'week') thresholdDate = startOfWeek(now, { weekStartsOn: 1 });
    else thresholdDate = startOfMonth(now);
    
    return orders.filter(o => isAfter(parseISO(o.created_at), thresholdDate));
  }, [orders, timeFilter]);

  // 1. Orders & Revenue per Day
  const dailyStats = useMemo(() => {
    const statsMap: Record<string, { date: string, orders: number, revenue: number }> = {};
    const end = new Date();
    let start = end;
    
    if (timeFilter === 'today') start = subDays(end, 6); // Show last 7 days for trend
    else if (timeFilter === 'week') start = startOfWeek(end, { weekStartsOn: 1 });
    else if (timeFilter === 'month') start = startOfMonth(end);
    else if (timeFilter === 'all') {
      start = orders.length > 0 
        ? new Date(Math.min(...orders.map(o => parseISO(o.created_at).getTime()))) 
        : subDays(end, 30);
      
      // Ensure at least 2 days for a line
      if (format(start, 'yyyy-MM-dd') === format(end, 'yyyy-MM-dd')) {
        start = subDays(start, 1);
      }
    }
    
    // Fill empty days with zeros
    const days = eachDayOfInterval({ start, end });
    days.forEach(d => {
      const dStr = format(d, 'yyyy-MM-dd');
      statsMap[dStr] = { date: dStr, orders: 0, revenue: 0 };
    });

    // Populate actual data
    filteredOrders.forEach(order => {
      const dateStr = format(parseISO(order.created_at), 'yyyy-MM-dd');
      if (!statsMap[dateStr]) {
        statsMap[dateStr] = { date: dateStr, orders: 0, revenue: 0 };
      }
      statsMap[dateStr].orders += 1;
      if ((order.status || '').toLowerCase() !== 'cancelled') {
        statsMap[dateStr].revenue += order.total_amount;
      }
    });

    return Object.values(statsMap).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredOrders, timeFilter, orders]);

  // 2. Items Sold by Market & Top Products
  const marketStatsMap: Record<string, number> = {};
  const productSalesMap: Record<string, number> = {};

  filteredOrders.forEach(order => {
    if ((order.status || '').toLowerCase() === 'cancelled') return;
    
    (order.items || []).forEach(item => {
      // Top Products
      if (!productSalesMap[item.name]) productSalesMap[item.name] = 0;
      productSalesMap[item.name] += item.quantity;
      
      // Market (need to find the product to get its market)
      const product = products.find(p => p.id === item.product_id);
      const marketName = product?.markets?.name || 'Unknown Market';
      
      if (!marketStatsMap[marketName]) marketStatsMap[marketName] = 0;
      marketStatsMap[marketName] += item.quantity;
    });
  });

  const marketStats = Object.entries(marketStatsMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const topProducts = Object.entries(productSalesMap)
    .map(([name, sales]) => ({ name, sales }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5); // top 5

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900 min-h-screen">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Reports</h1>
        
        <div className="flex items-center gap-4">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex overflow-hidden shadow-sm">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
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
          
          <button className="flex items-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm transition-colors">
            <span className="material-symbols-outlined">download</span>
            Export CSV
          </button>
        </div>
      </div>

      {/* Primary Line Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Revenue Per Day Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5 flex flex-col min-h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Revenue Per Day</h2>
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  tickFormatter={(val) => `${val / 1000}k`}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString()} RWF`, 'Revenue']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Per Day Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5 flex flex-col min-h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Orders Volume</h2>
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyStats} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip 
                  formatter={(value: any) => [value, 'Orders']}
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        
        {/* Top Selling Products Bar Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5 flex flex-col min-h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Top Selling Products</h2>
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis 
                   type="number" 
                   tick={{ fill: '#64748b', fontSize: 12 }}
                   axisLine={false}
                   tickLine={false}
                />
                <YAxis 
                   dataKey="name" 
                   type="category" 
                   tick={{ fill: '#475569', fontSize: 13, fontWeight: 600 }}
                   axisLine={false}
                   tickLine={false}
                   dx={-10}
                />
                <Tooltip 
                   cursor={{ fill: 'transparent' }}
                   contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[0, 6, 6, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Items Sold By Market Pie Chart */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5 flex flex-col min-h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-6">Items Sold by Market</h2>
          <div className="flex-1 w-full h-full min-h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={marketStats}
                  cx="50%"
                  cy="45%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {marketStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Legend 
                   verticalAlign="bottom" 
                   height={36} 
                   iconType="circle" 
                   wrapperStyle={{ paddingTop: '20px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
