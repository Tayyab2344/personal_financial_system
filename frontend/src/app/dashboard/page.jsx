'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  PlusCircle, 
  PiggyBank,
  Flame,
  CheckCircle,
  AlertCircle,
  Wallet,
  CreditCard,
  Smartphone,
  Landmark
} from 'lucide-react';

export default function DashboardOverview() {
  const [refreshCount, setRefreshCount] = useState(0);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Transaction Forms
  const [incomeSource, setIncomeSource] = useState('');
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState('');
  
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  const [incomeAccount, setIncomeAccount] = useState('Cash');
  const [expenseAccount, setExpenseAccount] = useState('Cash');
  
  const [savingsTarget, setSavingsTarget] = useState(0);
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });

  const triggerRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchSummary();
  }, [refreshCount]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.getDashboardSummary();
      setSummary(data);
      setSavingsTarget(data.savingsTarget);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!incomeSource || !incomeAmount) return;
    try {
      await api.addIncome(incomeSource, incomeAmount, incomeDate || null, incomeAccount);
      setIncomeSource('');
      setIncomeAmount('');
      setIncomeDate('');
      setIncomeAccount('Cash');
      showFeedback('Income added successfully!', 'success');
      triggerRefresh();
    } catch (err) {
      showFeedback(err.message || 'Failed to add income', 'danger');
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseAmount) return;
    try {
      await api.addExpense(expenseCategory, expenseAmount, expenseDescription, expenseDate || null, expenseAccount);
      setExpenseAmount('');
      setExpenseDescription('');
      setExpenseDate('');
      setExpenseAccount('Cash');
      showFeedback('Expense added successfully!', 'success');
      triggerRefresh();
    } catch (err) {
      showFeedback(err.message || 'Failed to add expense', 'danger');
    }
  };

  const handleUpdateSavingsTarget = async () => {
    try {
      setIsUpdatingTarget(true);
      const today = new Date();
      const month = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
      await api.upsertBudget(month, savingsTarget);
      showFeedback('Savings target updated!', 'success');
      triggerRefresh();
    } catch (err) {
      showFeedback(err.message || 'Failed to update target', 'danger');
    } finally {
      setIsUpdatingTarget(false);
    }
  };

  const showFeedback = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

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
        <button onClick={fetchSummary} className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700">Retry</button>
      </div>
    );
  }

  const isDeficit = summary ? (summary.totalExpenses > summary.availableBudget) : false;
  const deficitAmount = summary ? Math.max(0, summary.totalExpenses - summary.availableBudget) : 0;

  return (
    <div className="space-y-6">
      {/* Alert Notification */}
      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-2 border transition-all ${
          message.type === 'success' 
            ? 'bg-green-950/40 border-green-800 text-green-300' 
            : 'bg-red-950/40 border-red-800 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Allowance banner (WOW factor) */}
      <div className={`glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden transition-all duration-300 ${
        isDeficit 
          ? 'bg-gradient-to-br from-slate-900/60 via-red-950/20 to-orange-950/20 border-red-950/20' 
          : 'bg-gradient-to-br from-slate-900/60 via-blue-950/20 to-purple-950/20'
      }`}>
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -z-10 animate-float ${
          isDeficit ? 'bg-red-500/10' : 'bg-blue-500/10'
        }`}></div>
        <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl -z-10 animate-float [animation-delay:2s] ${
          isDeficit ? 'bg-orange-500/5' : 'bg-purple-500/5'
        }`}></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            {isDeficit ? (
              <span className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                <AlertCircle className="h-3.5 w-3.5" /> Budget Deficit
              </span>
            ) : (
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 w-fit">
                <Flame className="h-3.5 w-3.5" /> Daily Allowance
              </span>
            )}
            <h1 className="text-3xl md:text-5xl font-black text-white leading-none">
              Rs. {Math.max(0, summary?.dailySpendingAllowance || 0).toLocaleString()} <span className="text-lg font-medium text-gray-400">/ day</span>
            </h1>
            {isDeficit ? (
              <p className="text-gray-400 text-sm max-w-lg">
                You have exceeded your available spending budget by 
                <span className="text-red-400 font-semibold mx-1">Rs. {deficitAmount.toLocaleString()}</span> 
                with <span className="text-white font-semibold">{summary?.remainingDays} days</span> left in this month. Consider reducing non-essential expenses.
              </p>
            ) : (
              <p className="text-gray-400 text-sm max-w-lg">
                This is your safe daily limit based on your remaining budget of 
                <span className="text-white font-semibold mx-1">Rs. {summary?.budgetRemaining?.toLocaleString()}</span> 
                and <span className="text-white font-semibold">{summary?.remainingDays} days</span> left in this month.
              </p>
            )}
          </div>
          
          {/* Target adjustment slider */}
          <div className="glass-card p-4 rounded-xl border border-white/5 space-y-3 w-full md:w-80">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-gray-400 uppercase">Savings Target</span>
              <span className="text-blue-400">Rs. {savingsTarget?.toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max={summary?.totalIncome || 100000} 
              step="1000"
              value={savingsTarget} 
              onChange={(e) => setSavingsTarget(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <button 
              onClick={handleUpdateSavingsTarget}
              disabled={isUpdatingTarget || savingsTarget === summary?.savingsTarget}
              className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-gray-500 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              Update Target
            </button>
          </div>
        </div>
      </div>

      {/* Grid Summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="glass-card p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-300 uppercase tracking-wide">Total Income</p>
            <h3 className="text-2xl font-black text-white mt-1">Rs. {summary?.totalIncome?.toLocaleString()}</h3>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-300 uppercase tracking-wide">Expenses Logged</p>
            <h3 className="text-2xl font-black text-white mt-1">Rs. {summary?.totalExpenses?.toLocaleString()}</h3>
          </div>
        </div>

        {/* Budget Remaining */}
        <div className="glass-card p-5 rounded-xl flex items-center gap-4">
          <div className={`p-3 rounded-lg border transition-all duration-300 ${
            isDeficit 
              ? 'bg-red-500/10 text-red-400 border-red-500/20' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
          }`}>
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-300 uppercase tracking-wide">Spending Budget Left</p>
            <h3 className={`text-2xl font-black mt-1 transition-all duration-300 ${
              isDeficit ? 'text-red-400' : 'text-white'
            }`}>
              Rs. {Math.max(0, summary?.budgetRemaining || 0).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Current Savings Progress */}
        <div className="glass-card p-5 rounded-xl flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div className="w-full pr-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm font-bold text-gray-300 uppercase tracking-wide">Goal Progress</p>
              <span className="text-2xl font-black text-purple-400">{summary?.savingsProgress}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
              <div 
                className="bg-purple-500 h-1.5 rounded-full shadow-glow-purple" 
                style={{ width: `${summary?.savingsProgress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Accounts Section */}
      <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-400" /> Wallet Accounts
            </h2>
            <p className="text-gray-400 text-xs">Real-time balances across your payment methods</p>
          </div>
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl w-fit">
            <span className="text-xs text-gray-400 font-semibold block uppercase">Total Balance</span>
            <span className="text-xl font-black text-white">Rs. {summary?.totalBalance?.toLocaleString() || '0'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Cash */}
          <div className="glass-card p-4 rounded-xl border border-white/5 hover:border-amber-500/30 transition-all flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              <Coins className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Cash</p>
              <h4 className="text-lg font-black text-white mt-0.5">Rs. {summary?.accountBalances?.Cash?.toLocaleString() || '0'}</h4>
            </div>
          </div>

          {/* EasyPaisa */}
          <div className="glass-card p-4 rounded-xl border border-white/5 hover:border-green-500/30 transition-all flex items-center gap-3">
            <div className="p-2.5 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">EasyPaisa</p>
              <h4 className="text-lg font-black text-white mt-0.5">Rs. {summary?.accountBalances?.EasyPaisa?.toLocaleString() || '0'}</h4>
            </div>
          </div>

          {/* JazzCash */}
          <div className="glass-card p-4 rounded-xl border border-white/5 hover:border-red-500/30 transition-all flex items-center gap-3">
            <div className="p-2.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">JazzCash</p>
              <h4 className="text-lg font-black text-white mt-0.5">Rs. {summary?.accountBalances?.JazzCash?.toLocaleString() || '0'}</h4>
            </div>
          </div>

          {/* Bank */}
          <div className="glass-card p-4 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-lg border border-purple-500/20">
              <Landmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Bank</p>
              <h4 className="text-lg font-black text-white mt-0.5">Rs. {summary?.accountBalances?.Bank?.toLocaleString() || '0'}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Entry Section */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Income form */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <PlusCircle className="text-green-400 h-5 w-5" />
            <h3 className="text-lg font-bold text-white">Add Income Source</h3>
          </div>
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Source Name</label>
                <input 
                  type="text" 
                  placeholder="Salary, freelancing, business..." 
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Amount (PKR)</label>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Date (Optional)</label>
                <input 
                  type="date" 
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Deposit To</label>
                <select 
                  value={incomeAccount}
                  onChange={(e) => setIncomeAccount(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm text-gray-400"
                >
                  <option value="Cash">Cash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
            >
              Add Income Record
            </button>
          </form>
        </div>

        {/* Expense form */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <PlusCircle className="text-red-400 h-5 w-5" />
            <h3 className="text-lg font-bold text-white">Log New Expense</h3>
          </div>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Category</label>
                <select 
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm"
                >
                  <option value="Food">Food</option>
                  <option value="Fuel">Fuel</option>
                  <option value="Transport">Transport</option>
                  <option value="Education">Education</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Bills">Bills</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Health">Health</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Amount (PKR)</label>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-400 mb-1">Paid From</label>
                <select 
                  value={expenseAccount}
                  onChange={(e) => setExpenseAccount(e.target.value)}
                  className="w-full glass-input px-2.5 py-2 text-sm text-gray-400"
                >
                  <option value="Cash">Cash</option>
                  <option value="EasyPaisa">EasyPaisa</option>
                  <option value="JazzCash">JazzCash</option>
                  <option value="Bank">Bank Account</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-400 mb-1">Description (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Dinner..." 
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full glass-input px-2.5 py-2 text-sm"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-400 mb-1">Date (Optional)</label>
                <input 
                  type="date" 
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full glass-input px-2.5 py-2 text-sm text-gray-400"
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-all cursor-pointer"
            >
              Add Expense Record
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
