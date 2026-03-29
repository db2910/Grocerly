"use client";

import { useEffect, useState } from "react";
import { useAdminStore } from "@/lib/store/adminStore";
import { Search } from "lucide-react";

export default function CustomersPage() {
  const { orders } = useAdminStore();
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Derive unique customers from orders
  const uniqueCustomersMap = new Map();
  orders.forEach((o) => {
    // using phone as unique identifier for now
    if (!uniqueCustomersMap.has(o.customer_phone)) {
      uniqueCustomersMap.set(o.customer_phone, {
        id: o.customer_phone,
        name: o.customer_name,
        phone: o.customer_phone,
        email: "No email provided",
        address: o.delivery_location || "No address",
        realOrders: 0,
        realSpent: 0,
      });
    }
    const customer = uniqueCustomersMap.get(o.customer_phone);
    customer.realOrders += 1;
    if (o.status !== "cancelled") {
      customer.realSpent += o.total_amount;
    }
  });

  const allCustomers = Array.from(uniqueCustomersMap.values());

  const enriched = allCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.address.toLowerCase().includes(search.toLowerCase())
  );

  const topSpender = [...enriched].sort((a, b) => b.realSpent - a.realSpent)[0];

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full bg-slate-50 dark:bg-slate-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">Customers</h1>
          <p className="text-slate-500 font-medium mt-1">{allCustomers.length} registered customers</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">group</span>
          </div>
          <p className="text-slate-500 text-sm font-bold">Total Customers</p>
          <p className="text-3xl font-black mt-1">{allCustomers.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">shopping_cart</span>
          </div>
          <p className="text-slate-500 text-sm font-bold">Orders Placed</p>
          <p className="text-3xl font-black mt-1">{orders.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/5">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined">star</span>
          </div>
          <p className="text-slate-500 text-sm font-bold">Top Customer</p>
          <p className="text-lg font-black mt-1 truncate">{topSpender?.name ?? "—"}</p>
          <p className="text-xs text-slate-500">{topSpender?.realSpent.toLocaleString()} RWF spent</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-primary/5 mb-6 flex items-center gap-3">
        <Search size={18} className="text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, phone, email, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-sm"
        />
        {search && (
          <button onClick={() => setSearch("")} className="text-slate-400 hover:text-slate-600">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900/50 text-xs font-bold uppercase text-slate-500">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4 text-center">Orders</th>
                <th className="px-6 py-4 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary/5 text-sm">
              {enriched.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <span className="material-symbols-outlined text-4xl block mb-2">search_off</span>
                    No customers found
                  </td>
                </tr>
              ) : enriched.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-primary font-black text-sm">
                          {customer.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{customer.name}</p>
                        <p className="text-xs text-slate-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{customer.phone}</td>
                  <td className="px-6 py-4 text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>
                      {customer.address}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-primary/10 text-primary rounded-full font-black text-sm">
                      {customer.realOrders}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-slate-800 dark:text-slate-100">
                    {customer.realSpent.toLocaleString()}
                    <span className="text-xs font-normal text-slate-500 ml-1">RWF</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
