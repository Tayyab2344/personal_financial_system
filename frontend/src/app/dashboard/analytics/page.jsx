'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { 
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Search, Filter, Trash2, Calendar, AlertCircle } from 'lucide-react';

const CATEGORY_COLORS = {
  Food: '#ef4444',
  Fuel: '#f59e0b',
  Transport: '#3b82f6',
  Education: '#8b5cf6',
  Shopping: '#ec4899',
  Bills: '#10b981',
  Entertainment: '#06b6d4',
  Health: '#14b8a6',
  Other: '#64748b'
};

export default function ExpenseAnalyticsPage() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const triggerRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchExpenses();
  }, [refreshCount]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const data = await api.getExpenses();
      setExpenses(data);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.deleteExpense(id);
      triggerRefresh();
    } catch (err) {
      alert(err.message || 'Failed to delete expense');
    }
  };

  // Group by category for Pie Chart
  const getCategoryData = () => {
    const totals = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.keys(totals).map(name => ({
      name,
      value: totals[name]
    }));
  };

  // Group by day for Bar Chart
  const getDailyData = () => {
    const daily = {};
    // Last 15 days of transactions
    const sorted = [...expenses].sort((a, b) => a.date.localeCompare(b.date));
    sorted.forEach(e => {
      // Short date format e.g. "May 15"
      const dateLabel = new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      daily[dateLabel] = (daily[dateLabel] || 0) + e.amount;
    });
    
    return Object.keys(daily).map(date => ({
      date,
      Amount: daily[date]
    })).slice(-10); // last 10 days
  };

  const filteredExpenses = expenses.filter(e => {
    const matchSearch = e.description?.toLowerCase().includes(search.toLowerCase()) || 
                        e.category.toLowerCase().includes(search.toLowerCase());
    const matchCategory = selectedCategory === 'All' || e.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const categoryData = getCategoryData();
  const dailyData = getDailyData();

  if (loading && expenses.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Category Breakdown (Pie) */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">Category Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            {categoryData.length === 0 ? (
              <p className="text-gray-400 text-sm">No expense data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(21, 28, 44, 0.95)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} 
                    formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Total']}
                  />
                  <Legend 
                    layout="horizontal" 
                    verticalAlign="bottom" 
                    align="center"
                    iconSize={10}
                    formatter={(value) => <span className="text-xs text-gray-400 font-semibold">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Daily Spending Trend (Bar) */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-white/5 pb-2">Daily Spending Trend</h3>
          <div className="h-64 flex items-center justify-center">
            {dailyData.length === 0 ? (
              <p className="text-gray-400 text-sm">No trend data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(21, 28, 44, 0.95)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                    formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Amount']}
                  />
                  <Bar dataKey="Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Expenses Log */}
      <div className="glass-card p-6 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <h3 className="text-lg font-bold text-white">Expenses History Log</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search description..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-9 pr-3 py-1.5 text-xs w-48"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="glass-input px-3 py-1.5 text-xs"
              >
                <option value="All">All Categories</option>
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* List table */}
        <div className="overflow-x-auto">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="mx-auto mb-2 h-8 w-8" />
              <p className="text-sm">No transactions match your criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-xs uppercase font-semibold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                {filteredExpenses.map(item => (
                  <tr key={item.id} className="hover:bg-white/5 transition-all">
                    <td className="py-3 px-4 flex items-center gap-2 text-xs font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-3 px-4">
                      <span 
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ 
                          backgroundColor: `${CATEGORY_COLORS[item.category]}20`, 
                          color: CATEGORY_COLORS[item.category],
                          border: `1px solid ${CATEGORY_COLORS[item.category]}40`
                        }}
                      >
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 italic text-gray-400 max-w-xs truncate">{item.description || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-white">Rs. {item.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-red-950/20 text-red-400 border border-red-800/20 rounded hover:bg-red-900/40 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
