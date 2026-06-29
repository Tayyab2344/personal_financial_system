'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../../utils/api';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area, LineChart, Line
} from 'recharts';
import {
  CalendarDays, TrendingUp, TrendingDown, Coins, ArrowUpDown,
  ChevronLeft, ChevronRight, AlertCircle, Download, Wallet,
  PiggyBank, ArrowRightLeft, Search, Filter, Calendar,
  BarChart3, FileSpreadsheet, Eye
} from 'lucide-react';

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

const ACCOUNT_COLORS = {
  Cash: '#f59e0b',
  EasyPaisa: '#10b981',
  JazzCash: '#ef4444',
  Bank: '#8b5cf6'
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TOOLTIP_STYLE = {
  backgroundColor: 'rgba(15, 23, 42, 0.95)',
  borderColor: 'rgba(255,255,255,0.08)',
  color: '#e2e8f0',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 600,
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  backdropFilter: 'blur(12px)'
};

export default function MonthlyReportPage() {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-indexed
  const [activeView, setActiveView] = useState('overview'); // 'overview' | 'spreadsheet'

  const [summary, setSummary] = useState(null);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Spreadsheet sub-tab
  const [sheetTab, setSheetTab] = useState('expenses');
  const [search, setSearch] = useState('');

  const monthKey = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}`;
  const isCurrentMonth = selectedYear === now.getFullYear() && selectedMonth === now.getMonth();

  useEffect(() => {
    fetchMonthData();
  }, [monthKey]);

  const fetchMonthData = async () => {
    try {
      setLoading(true);
      setError('');
      const [summaryData, incomeData, expenseData, transferData] = await Promise.all([
        api.getDashboardSummary(monthKey),
        api.getIncomes(monthKey),
        api.getExpenses(monthKey),
        api.getTransfers(monthKey),
      ]);
      setSummary(summaryData);
      setIncomes(incomeData);
      setExpenses(expenseData);
      setTransfers(transferData);
    } catch (err) {
      setError(err.message || 'Failed to load monthly data');
    } finally {
      setLoading(false);
    }
  };

  // Navigate months
  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    // Don't allow navigating beyond current month
    if (isCurrentMonth) return;
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  // ──── COMPUTED DATA ────

  const totalIncome = useMemo(() => incomes.reduce((s, i) => s + i.amount, 0), [incomes]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalTransfers = useMemo(() => transfers.reduce((s, t) => s + t.amount, 0), [transfers]);
  const netSavings = totalIncome - totalExpenses;

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const totals = {};
    expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Account breakdown for pie chart
  const accountExpenseData = useMemo(() => {
    const totals = {};
    expenses.forEach(e => {
      const acc = e.account_type || 'Cash';
      totals[acc] = (totals[acc] || 0) + e.amount;
    });
    return Object.entries(totals).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  // Daily spending trend for area chart
  const dailySpendingData = useMemo(() => {
    const daily = {};
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    // Initialize all days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      daily[dateStr] = { expense: 0, income: 0 };
    }
    expenses.forEach(e => {
      const d = e.date?.substring(0, 10);
      if (daily[d]) daily[d].expense += e.amount;
    });
    incomes.forEach(i => {
      const d = i.date?.substring(0, 10);
      if (daily[d]) daily[d].income += i.amount;
    });
    return Object.entries(daily).map(([date, vals]) => ({
      day: parseInt(date.split('-')[2]),
      expense: vals.expense,
      income: vals.income,
    }));
  }, [expenses, incomes, selectedYear, selectedMonth]);

  // Top expenses
  const topExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [expenses]);

  // Income sources breakdown
  const incomeSourceData = useMemo(() => {
    const totals = {};
    incomes.forEach(i => {
      totals[i.source] = (totals[i.source] || 0) + i.amount;
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [incomes]);

  // Cumulative spending over the month
  const cumulativeData = useMemo(() => {
    let cumExpense = 0;
    let cumIncome = 0;
    return dailySpendingData.map(d => {
      cumExpense += d.expense;
      cumIncome += d.income;
      return { day: d.day, expense: cumExpense, income: cumIncome };
    });
  }, [dailySpendingData]);

  // Spreadsheet filtered data
  const getFilteredSheetData = () => {
    const list = sheetTab === 'expenses' ? expenses : sheetTab === 'incomes' ? incomes : transfers;
    if (!search) return list;
    return list.filter(item => {
      const searchLower = search.toLowerCase();
      if (sheetTab === 'expenses') {
        return (item.description?.toLowerCase().includes(searchLower) || item.category?.toLowerCase().includes(searchLower));
      } else if (sheetTab === 'incomes') {
        return item.source?.toLowerCase().includes(searchLower);
      } else {
        return (item.description?.toLowerCase().includes(searchLower) || item.from_account?.toLowerCase().includes(searchLower) || item.to_account?.toLowerCase().includes(searchLower));
      }
    });
  };

  const filteredSheetData = getFilteredSheetData();

  // ──── LOADING / ERROR ────

  if (loading && !summary) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-6 text-center text-red-400">
        <AlertCircle className="mx-auto mb-2 h-12 w-12" />
        <p className="font-semibold">{error}</p>
        <button onClick={fetchMonthData} className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 cursor-pointer">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════ HEADER ══════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
            <CalendarDays className="h-7 w-7 text-blue-400" />
            Monthly Report
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Complete financial overview for any month. Current month shows live data.
          </p>
        </div>

        {/* Month Navigator */}
        <div className="flex items-center gap-3">
          <button
            onClick={goToPreviousMonth}
            className="p-2.5 bg-slate-900/60 border border-white/5 rounded-xl hover:bg-slate-800/60 hover:border-white/10 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 text-gray-300" />
          </button>

          <div className="px-6 py-3 bg-gradient-to-r from-slate-900/80 to-slate-950/80 border border-white/10 rounded-xl text-center min-w-[200px] shadow-lg">
            <p className="text-lg font-black text-white leading-none">
              {MONTH_NAMES[selectedMonth]}
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
              {selectedYear}
            </p>
          </div>

          <button
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={`p-2.5 bg-slate-900/60 border border-white/5 rounded-xl transition-all cursor-pointer ${
              isCurrentMonth
                ? 'opacity-30 cursor-not-allowed'
                : 'hover:bg-slate-800/60 hover:border-white/10'
            }`}
          >
            <ChevronRight className="h-4 w-4 text-gray-300" />
          </button>

          {isCurrentMonth && (
            <span className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse shadow-glow-green">
              Live
            </span>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════ VIEW TOGGLE ══════════════════════════════════ */}
      <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 w-fit">
        <button
          onClick={() => setActiveView('overview')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeView === 'overview'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glow-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Charts & Overview
        </button>
        <button
          onClick={() => setActiveView('spreadsheet')}
          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeView === 'spreadsheet'
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-glow-blue'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" /> Full Spreadsheet
        </button>
      </div>

      {/* ══════════════════════════════════ SUMMARY CARDS ══════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Income */}
        <div className="glass-card-green p-5 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform duration-300">
          <div className="p-2.5 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20 shadow-glow-green">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Income</p>
            <h3 className="text-xl font-black text-white mt-0.5">Rs. {totalIncome.toLocaleString()}</h3>
            <p className="text-[9px] text-gray-500">{incomes.length} entries</p>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card-red p-5 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform duration-300">
          <div className="p-2.5 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 shadow-glow-red">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Expenses</p>
            <h3 className="text-xl font-black text-white mt-0.5">Rs. {totalExpenses.toLocaleString()}</h3>
            <p className="text-[9px] text-gray-500">{expenses.length} entries</p>
          </div>
        </div>

        {/* Net Savings */}
        <div className={`glass-card p-5 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform duration-300 border ${
          netSavings >= 0 ? 'border-green-500/20' : 'border-red-500/20'
        }`}>
          <div className={`p-2.5 rounded-xl border ${
            netSavings >= 0
              ? 'bg-green-500/10 text-green-400 border-green-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            <PiggyBank className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Net Savings</p>
            <h3 className={`text-xl font-black mt-0.5 ${netSavings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {netSavings >= 0 ? '+' : ''}Rs. {netSavings.toLocaleString()}
            </h3>
            <p className="text-[9px] text-gray-500">{((netSavings / (totalIncome || 1)) * 100).toFixed(1)}% of income</p>
          </div>
        </div>

        {/* Transfers */}
        <div className="glass-card-purple p-5 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform duration-300">
          <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shadow-glow-purple">
            <ArrowRightLeft className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Transfers</p>
            <h3 className="text-xl font-black text-white mt-0.5">Rs. {totalTransfers.toLocaleString()}</h3>
            <p className="text-[9px] text-gray-500">{transfers.length} moves</p>
          </div>
        </div>

        {/* Avg Daily Spend */}
        <div className="glass-card-blue p-5 rounded-2xl flex items-center gap-3 hover:scale-[1.02] transition-transform duration-300">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20 shadow-glow-blue">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Avg/Day</p>
            <h3 className="text-xl font-black text-white mt-0.5">
              Rs. {(totalExpenses / (new Date(selectedYear, selectedMonth + 1, 0).getDate())).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            </h3>
            <p className="text-[9px] text-gray-500">{new Date(selectedYear, selectedMonth + 1, 0).getDate()} days</p>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════ OVERVIEW VIEW ══════════════════════════════════ */}
      {activeView === 'overview' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Row 1: Daily Trend + Category Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Income vs Expense Area Chart */}
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-400" /> Daily Income vs Expenses
              </h3>
              <div className="h-72">
                {dailySpendingData.every(d => d.expense === 0 && d.income === 0) ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                    <AlertCircle className="h-5 w-5 mr-2" /> No transactions this month
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailySpendingData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        itemStyle={{ color: '#f1f5f9' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value, name) => [`Rs. ${value.toLocaleString()}`, name === 'income' ? 'Income' : 'Expense']}
                        labelFormatter={(val) => `Day ${val}`}
                      />
                      <Area type="monotone" dataKey="income" stroke="#10b981" fill="url(#gradIncome)" strokeWidth={2} />
                      <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#gradExpense)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Category Breakdown Pie */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Expense by Category</h3>
              <div className="h-72">
                {categoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">No expenses</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, idx) => (
                          <Cell key={idx} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        itemStyle={{ color: '#f1f5f9' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Spent']}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconSize={8}
                        formatter={(value) => <span className="text-[10px] text-gray-400 font-semibold">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Row 2: Cumulative Chart + Account Breakdown + Income Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cumulative line chart */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Cumulative Spending</h3>
              <div className="h-64">
                {cumulativeData.every(d => d.expense === 0 && d.income === 0) ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={cumulativeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="day" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        itemStyle={{ color: '#f1f5f9' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value, name) => [`Rs. ${value.toLocaleString()}`, name === 'income' ? 'Cum. Income' : 'Cum. Expense']}
                        labelFormatter={(val) => `Day ${val}`}
                      />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Account Breakdown Pie */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Expense by Account</h3>
              <div className="h-64">
                {accountExpenseData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={accountExpenseData}
                        cx="50%"
                        cy="45%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {accountExpenseData.map((entry, idx) => (
                          <Cell key={idx} fill={ACCOUNT_COLORS[entry.name] || '#64748b'} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        itemStyle={{ color: '#f1f5f9' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Spent']}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        iconSize={8}
                        formatter={(value) => <span className="text-[10px] text-gray-400 font-semibold">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Income Sources Bar */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Income Sources</h3>
              <div className="h-64">
                {incomeSourceData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">No income</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeSourceData} layout="vertical" margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                      <XAxis type="number" stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="name" stroke="#475569" tick={{ fontSize: 10, fill: '#94a3b8' }} width={80} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        itemStyle={{ color: '#f1f5f9' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Amount']}
                      />
                      <Bar dataKey="value" fill="#10b981" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Row 3: Top 5 Expenses + Category Bar Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top 5 Expenses */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-400" /> Top 5 Biggest Expenses
              </h3>
              {topExpenses.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No expenses recorded</p>
              ) : (
                <div className="space-y-3">
                  {topExpenses.map((exp, idx) => (
                    <div key={exp.id} className="flex items-center gap-3 p-3 bg-slate-950/40 rounded-xl border border-white/5 hover:border-white/10 transition-all">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center text-red-400 font-black text-sm border border-red-500/20">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: `${CATEGORY_COLORS[exp.category]}15`,
                              color: CATEGORY_COLORS[exp.category],
                              border: `1px solid ${CATEGORY_COLORS[exp.category]}30`
                            }}
                          >
                            {exp.category}
                          </span>
                          <span className="text-[10px] text-gray-500 truncate">{exp.description || '-'}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          {new Date(exp.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <span className="text-sm font-black text-white">Rs. {exp.amount.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Category Bar Chart */}
            <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Category Spending Comparison</h3>
              <div className="h-72">
                {categoryData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-500 text-sm">No data</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 9, fill: '#64748b' }} />
                      <YAxis stroke="#475569" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        itemStyle={{ color: '#f1f5f9' }}
                        labelStyle={{ color: '#94a3b8' }}
                        formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Spent']}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {categoryData.map((entry, idx) => (
                          <Cell key={idx} fill={CATEGORY_COLORS[entry.name] || '#64748b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ SPREADSHEET VIEW ══════════════════════════════════ */}
      {activeView === 'spreadsheet' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Spreadsheet Header */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Sub-tabs */}
              <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 w-fit">
                <button
                  onClick={() => { setSheetTab('expenses'); setSearch(''); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sheetTab === 'expenses'
                      ? 'bg-red-600/20 text-red-400 border border-red-500/20 shadow-glow-red'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" /> Expenses ({expenses.length})
                </button>
                <button
                  onClick={() => { setSheetTab('incomes'); setSearch(''); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sheetTab === 'incomes'
                      ? 'bg-green-600/20 text-green-400 border border-green-500/20 shadow-glow-green'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" /> Incomes ({incomes.length})
                </button>
                <button
                  onClick={() => { setSheetTab('transfers'); setSearch(''); }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    sheetTab === 'transfers'
                      ? 'bg-purple-600/20 text-purple-400 border border-purple-500/20 shadow-glow-purple'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" /> Transfers ({transfers.length})
                </button>
              </div>

              {/* Search + Count */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search entries..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="glass-input pl-9 pr-3 py-2 text-xs w-56"
                  />
                </div>
                <span className="text-xs text-gray-400 font-semibold">
                  <span className="text-white font-bold">{filteredSheetData.length}</span> records
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950/40">
              {filteredSheetData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <AlertCircle className="mx-auto mb-2.5 h-10 w-10 text-gray-600" />
                  <p className="text-sm">No records found for {MONTH_NAMES[selectedMonth]} {selectedYear}.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="border-b border-white/5 bg-slate-900/40 text-gray-400 text-xs uppercase font-bold tracking-wider select-none">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Date</th>
                      {sheetTab === 'expenses' && (
                        <>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Description</th>
                          <th className="py-3 px-4">Account</th>
                        </>
                      )}
                      {sheetTab === 'incomes' && (
                        <>
                          <th className="py-3 px-4">Source</th>
                          <th className="py-3 px-4">Account</th>
                        </>
                      )}
                      {sheetTab === 'transfers' && (
                        <>
                          <th className="py-3 px-4">From</th>
                          <th className="py-3 px-4">To</th>
                          <th className="py-3 px-4">Description</th>
                        </>
                      )}
                      <th className="py-3 px-4 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm text-gray-300 font-medium">
                    {filteredSheetData.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-white/[0.02] transition-all">
                        <td className="py-3 px-4 text-xs text-gray-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4 text-xs">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </td>
                        {sheetTab === 'expenses' && (
                          <>
                            <td className="py-3 px-4">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                style={{
                                  backgroundColor: `${CATEGORY_COLORS[item.category]}15`,
                                  color: CATEGORY_COLORS[item.category],
                                  border: `1px solid ${CATEGORY_COLORS[item.category]}30`
                                }}
                              >
                                {item.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 italic text-gray-400 max-w-[200px] truncate">{item.description || '-'}</td>
                            <td className="py-3 px-4">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${ACCOUNT_COLORS[item.account_type || 'Cash']}10`,
                                  color: ACCOUNT_COLORS[item.account_type || 'Cash'],
                                  border: `1px solid ${ACCOUNT_COLORS[item.account_type || 'Cash']}25`
                                }}
                              >
                                {item.account_type || 'Cash'}
                              </span>
                            </td>
                          </>
                        )}
                        {sheetTab === 'incomes' && (
                          <>
                            <td className="py-3 px-4 text-white font-bold">{item.source}</td>
                            <td className="py-3 px-4">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${ACCOUNT_COLORS[item.account_type || 'Cash']}10`,
                                  color: ACCOUNT_COLORS[item.account_type || 'Cash'],
                                  border: `1px solid ${ACCOUNT_COLORS[item.account_type || 'Cash']}25`
                                }}
                              >
                                {item.account_type || 'Cash'}
                              </span>
                            </td>
                          </>
                        )}
                        {sheetTab === 'transfers' && (
                          <>
                            <td className="py-3 px-4">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${ACCOUNT_COLORS[item.from_account || 'Cash']}10`,
                                  color: ACCOUNT_COLORS[item.from_account || 'Cash'],
                                  border: `1px solid ${ACCOUNT_COLORS[item.from_account || 'Cash']}25`
                                }}
                              >
                                {item.from_account || 'Cash'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                                style={{
                                  backgroundColor: `${ACCOUNT_COLORS[item.to_account || 'Cash']}10`,
                                  color: ACCOUNT_COLORS[item.to_account || 'Cash'],
                                  border: `1px solid ${ACCOUNT_COLORS[item.to_account || 'Cash']}25`
                                }}
                              >
                                {item.to_account || 'Cash'}
                              </span>
                            </td>
                            <td className="py-3 px-4 italic text-gray-400 max-w-[200px] truncate">{item.description || '-'}</td>
                          </>
                        )}
                        <td className="py-3 px-4 text-right">
                          <span className={`font-bold ${
                            sheetTab === 'expenses' ? 'text-red-400' : sheetTab === 'incomes' ? 'text-green-400' : 'text-purple-400'
                          }`}>
                            {sheetTab === 'expenses' ? '-' : sheetTab === 'incomes' ? '+' : '⇄'} Rs. {item.amount.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr className="border-t-2 border-white/10 bg-slate-900/60">
                      <td colSpan={sheetTab === 'transfers' ? 4 : sheetTab === 'incomes' ? 3 : 4} className="py-3 px-4 text-xs font-black text-gray-400 uppercase tracking-widest">
                        Month Total
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-black text-lg ${
                          sheetTab === 'expenses' ? 'text-red-400' : sheetTab === 'incomes' ? 'text-green-400' : 'text-purple-400'
                        }`}>
                          Rs. {(sheetTab === 'expenses' ? totalExpenses : sheetTab === 'incomes' ? totalIncome : totalTransfers).toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
