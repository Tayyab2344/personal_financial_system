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

  // Transfer Form States
  const [transferFromAccount, setTransferFromAccount] = useState('Bank');
  const [transferToAccount, setTransferToAccount] = useState('Cash');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDescription, setTransferDescription] = useState('');
  const [transferDate, setTransferDate] = useState('');
  
  const [savingsTarget, setSavingsTarget] = useState(0);
  const [isUpdatingTarget, setIsUpdatingTarget] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [user, setUser] = useState(null);

  const triggerRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  useEffect(() => {
    fetchSummary();
    setUser(api.getUser());
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

  const handleAddTransfer = async (e) => {
    e.preventDefault();
    if (!transferAmount) return;
    if (transferFromAccount === transferToAccount) {
      showFeedback('Source and destination accounts must be different!', 'danger');
      return;
    }
    try {
      await api.addTransfer(transferFromAccount, transferToAccount, transferAmount, transferDate || null, transferDescription);
      setTransferAmount('');
      setTransferDescription('');
      setTransferDate('');
      setTransferFromAccount('Bank');
      setTransferToAccount('Cash');
      showFeedback('Transfer recorded successfully!', 'success');
      triggerRefresh();
    } catch (err) {
      showFeedback(err.message || 'Failed to record transfer', 'danger');
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
    <div className="space-y-8">
      {/* Alert Notification */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border transition-all animate-float ${
          message.type === 'success' 
            ? 'bg-green-950/40 border-green-800/40 text-green-300 shadow-glow-green' 
            : 'bg-red-950/40 border-red-800/40 text-red-300 shadow-glow-red'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5 text-green-400" /> : <AlertCircle className="h-5 w-5 text-red-400" />}
          <span className="text-xs font-bold uppercase tracking-wider">{message.text}</span>
        </div>
      )}

      {/* Main Allowance banner (WOW factor) */}
      <div className={`glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden transition-all duration-500 ${
        isDeficit 
          ? 'bg-gradient-to-br from-slate-900/80 via-red-950/20 to-orange-950/20 border border-red-500/20 shadow-glow-red' 
          : 'bg-gradient-to-br from-slate-900/80 via-blue-950/20 to-purple-950/20 border border-blue-500/20 shadow-glow-blue'
      }`}>
        <div className={`absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl -z-10 animate-float ${
          isDeficit ? 'bg-red-500/10' : 'bg-blue-500/15'
        }`}></div>
        <div className={`absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl -z-10 animate-float [animation-delay:2s] ${
          isDeficit ? 'bg-orange-500/5' : 'bg-purple-500/10'
        }`}></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4">
            {isDeficit ? (
              <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit shadow-glow-red">
                <AlertCircle className="h-3.5 w-3.5" /> Budget Deficit
              </span>
            ) : (
              <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit shadow-glow-blue">
                <Flame className="h-3.5 w-3.5 animate-pulse" /> Daily Spending Allowance
              </span>
            )}
            <div className="space-y-1">
              <h1 className="text-4xl md:text-6xl font-black text-white leading-none tracking-tight">
                Rs. {Math.max(0, summary?.dailySpendingAllowance || 0).toLocaleString()} <span className="text-sm font-semibold text-gray-400 uppercase tracking-widest">/ day</span>
              </h1>
              {isDeficit ? (
                <p className="text-gray-400 text-xs max-w-xl leading-relaxed">
                  You have exceeded your available spending budget by 
                  <span className="text-red-400 font-bold mx-1">Rs. {deficitAmount.toLocaleString()}</span> 
                  with <span className="text-white font-bold">{summary?.remainingDays} days</span> left in this month. Consider reducing non-essential expenses.
                </p>
              ) : (
                <p className="text-gray-400 text-xs max-w-xl leading-relaxed">
                  This is your safe daily limit based on your remaining budget of 
                  <span className="text-white font-bold mx-1">Rs. {summary?.budgetRemaining?.toLocaleString()}</span> 
                  and <span className="text-white font-bold">{summary?.remainingDays} days</span> left in this month.
                </p>
              )}
            </div>
          </div>
          
          {/* Target adjustment slider */}
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4 w-full lg:w-96 shadow-lg bg-slate-950/40">
            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
              <span className="text-gray-400">Monthly Savings Target</span>
              <span className="text-blue-400 text-xs font-bold">Rs. {savingsTarget?.toLocaleString()}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max={summary?.totalIncome || 100000} 
              step="1000"
              value={savingsTarget} 
              onChange={(e) => setSavingsTarget(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 border border-white/5"
            />
            <button 
              onClick={handleUpdateSavingsTarget}
              disabled={isUpdatingTarget || savingsTarget === summary?.savingsTarget}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-gray-500 text-white rounded-xl text-xs uppercase tracking-wider font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              Update Target Settings
            </button>
          </div>
        </div>
      </div>

      {/* Grid Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <div className="glass-card-green p-6 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-xl border border-green-500/20 shadow-glow-green">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Income</p>
            <h3 className="text-2xl font-black text-white mt-1">Rs. {summary?.totalIncome?.toLocaleString()}</h3>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="glass-card-red p-6 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl border border-red-500/20 shadow-glow-red">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expenses Logged</p>
            <h3 className="text-2xl font-black text-white mt-1">Rs. {summary?.totalExpenses?.toLocaleString()}</h3>
          </div>
        </div>

        {/* Budget Remaining */}
        <div className="glass-card-blue p-6 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className={`p-3 rounded-xl border transition-all duration-300 ${
            isDeficit 
              ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-glow-red' 
              : 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-glow-blue'
          }`}>
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Spending Budget Left</p>
            <h3 className={`text-2xl font-black mt-1 transition-all duration-300 ${
              isDeficit ? 'text-red-400' : 'text-white'
            }`}>
              Rs. {Math.max(0, summary?.budgetRemaining || 0).toLocaleString()}
            </h3>
          </div>
        </div>

        {/* Current Savings Progress */}
        <div className="glass-card-purple p-6 rounded-2xl flex items-center gap-4 hover:scale-[1.02] transition-transform duration-300">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 shadow-glow-purple">
            <PiggyBank className="h-6 w-6" />
          </div>
          <div className="w-full pr-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Goal Progress</p>
              <span className="text-lg font-black text-purple-400">{summary?.savingsProgress}%</span>
            </div>
            <div className="w-full bg-slate-950 rounded-full h-2 mt-1.5 border border-white/5">
              <div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full shadow-[0_0_10px_rgba(139,92,246,0.5)]" 
                style={{ width: `${summary?.savingsProgress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Wallet Accounts Section */}
      <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Wallet className="h-5 w-5 text-blue-400" /> Wallet Accounts
            </h2>
            <p className="text-gray-400 text-xs">Real-time balances across your payment methods</p>
          </div>
          <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl w-fit shadow-glow-blue flex items-center gap-3">
            <div>
              <span className="text-[9px] text-gray-400 font-bold block uppercase tracking-widest leading-none">Total Net Balance</span>
              <span className="text-xl font-black text-white mt-0.5 block leading-none">Rs. {summary?.totalBalance?.toLocaleString() || '0'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Cash */}
          <div className="wallet-card card-gradient-cash p-5 min-h-[160px] flex flex-col justify-between text-white relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/60 font-black">Cash Wallet</p>
                <h4 className="text-xl font-black mt-1">Rs. {summary?.accountBalances?.Cash?.toLocaleString() || '0'}</h4>
              </div>
              <Coins className="h-6 w-6 text-white/40" />
            </div>
            <div className="space-y-3">
              <div className="wallet-card-chip"></div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-mono text-white/70 tracking-widest">PHYSICAL ASSET</span>
                <span className="text-[9px] uppercase tracking-wider text-white/50 font-black truncate max-w-[120px]">{user?.name || "Tayyab Atiq"}</span>
              </div>
            </div>
          </div>

          {/* EasyPaisa */}
          <div className="wallet-card card-gradient-easypaisa p-5 min-h-[160px] flex flex-col justify-between text-white relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/60 font-black">EasyPaisa</p>
                <h4 className="text-xl font-black mt-1">Rs. {summary?.accountBalances?.EasyPaisa?.toLocaleString() || '0'}</h4>
              </div>
              <Smartphone className="h-6 w-6 text-white/40" />
            </div>
            <div className="space-y-3">
              <div className="wallet-card-chip"></div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-mono text-white/70 tracking-widest">•••• •••• •••• 0789</span>
                <span className="text-[9px] uppercase tracking-wider text-white/50 font-black truncate max-w-[120px]">{user?.name || "Tayyab Atiq"}</span>
              </div>
            </div>
          </div>

          {/* JazzCash */}
          <div className="wallet-card card-gradient-jazzcash p-5 min-h-[160px] flex flex-col justify-between text-white relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/60 font-black">JazzCash</p>
                <h4 className="text-xl font-black mt-1">Rs. {summary?.accountBalances?.JazzCash?.toLocaleString() || '0'}</h4>
              </div>
              <CreditCard className="h-6 w-6 text-white/40" />
            </div>
            <div className="space-y-3">
              <div className="wallet-card-chip"></div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-mono text-white/70 tracking-widest">•••• •••• •••• 4812</span>
                <span className="text-[9px] uppercase tracking-wider text-white/50 font-black truncate max-w-[120px]">{user?.name || "Tayyab Atiq"}</span>
              </div>
            </div>
          </div>

          {/* Bank */}
          <div className="wallet-card card-gradient-bank p-5 min-h-[160px] flex flex-col justify-between text-white relative">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/60 font-black">Bank Account</p>
                <h4 className="text-xl font-black mt-1">Rs. {summary?.accountBalances?.Bank?.toLocaleString() || '0'}</h4>
              </div>
              <Landmark className="h-6 w-6 text-white/40" />
            </div>
            <div className="space-y-3">
              <div className="wallet-card-chip"></div>
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-mono text-white/70 tracking-widest">•••• •••• •••• 9642</span>
                <span className="text-[9px] uppercase tracking-wider text-white/50 font-black truncate max-w-[120px]">{user?.name || "Tayyab Atiq"}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Entry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Income form */}
        <div className="glass-card p-6 rounded-2xl space-y-6 bg-slate-950/20">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <div className="p-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg shadow-glow-green">
              <PlusCircle className="h-5 w-5 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Add Income Source</h3>
          </div>
          <form onSubmit={handleAddIncome} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Source Name</label>
                <input 
                  type="text" 
                  placeholder="Salary, freelancing, business..." 
                  value={incomeSource}
                  onChange={(e) => setIncomeSource(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount (PKR)</label>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 text-xs font-semibold"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Deposit To Wallet</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/60 rounded-xl border border-white/5">
                  {['Cash', 'EasyPaisa', 'JazzCash', 'Bank'].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setIncomeAccount(acc)}
                      className={`py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                        incomeAccount === acc
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-glow-blue font-extrabold'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date (Optional)</label>
                <input 
                  type="date" 
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 text-xs text-gray-300 bg-slate-950/20"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl text-xs uppercase tracking-wider font-black transition-all cursor-pointer shadow-md mt-4 shadow-glow-green"
            >
              Add Income Record
            </button>
          </form>
        </div>

        {/* Expense form */}
        <div className="glass-card p-6 rounded-2xl space-y-6 bg-slate-950/20">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <div className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg shadow-glow-red">
              <PlusCircle className="h-5 w-5 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Log New Expense</h3>
          </div>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                <select 
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className="w-full glass-input px-3 py-2.5 text-xs text-gray-300 bg-slate-950 cursor-pointer"
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
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount (PKR)</label>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 text-xs font-semibold"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Paid From Wallet</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/60 rounded-xl border border-white/5">
                  {['Cash', 'EasyPaisa', 'JazzCash', 'Bank'].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setExpenseAccount(acc)}
                      className={`py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                        expenseAccount === acc
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-glow-blue font-extrabold'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Desc (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Dinner..." 
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    className="w-full glass-input px-3 py-2.5 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date (Optional)</label>
                  <input 
                    type="date" 
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full glass-input px-2 py-2.5 text-xs text-gray-300 bg-slate-950/20"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs uppercase tracking-wider font-black transition-all cursor-pointer shadow-md mt-4 shadow-glow-blue"
            >
              Add Expense Record
            </button>
          </form>
        </div>

        {/* Transfer form */}
        <div className="glass-card p-6 rounded-2xl space-y-6 bg-slate-950/20">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-lg shadow-glow-purple">
              <PlusCircle className="h-5 w-5 animate-pulse" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Record Wallet Transfer</h3>
          </div>
          <form onSubmit={handleAddTransfer} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">From Account</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/60 rounded-xl border border-white/5">
                  {['Cash', 'EasyPaisa', 'JazzCash', 'Bank'].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setTransferFromAccount(acc)}
                      className={`py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                        transferFromAccount === acc
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-glow-blue font-extrabold'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">To Account</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/60 rounded-xl border border-white/5">
                  {['Cash', 'EasyPaisa', 'JazzCash', 'Bank'].map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => setTransferToAccount(acc)}
                      className={`py-1.5 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                        transferToAccount === acc
                          ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20 shadow-glow-blue font-extrabold'
                          : 'text-gray-500 hover:text-gray-300'
                      }`}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Amount (PKR)</label>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 text-xs font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Date (Optional)</label>
                <input 
                  type="date" 
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 text-xs text-gray-300 bg-slate-950/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Description (Optional)</label>
              <input 
                type="text" 
                placeholder="ATM Withdrawal, friend payback..." 
                value={transferDescription}
                onChange={(e) => setTransferDescription(e.target.value)}
                className="w-full glass-input px-3.5 py-2.5 text-xs"
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs uppercase tracking-wider font-black transition-all cursor-pointer shadow-md mt-4 shadow-glow-purple"
            >
              Record Transfer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
