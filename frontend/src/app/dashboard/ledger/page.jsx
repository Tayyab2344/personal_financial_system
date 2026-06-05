'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { 
  Search, Filter, Edit2, Trash2, Save, X, Calendar, 
  TrendingUp, TrendingDown, Check, AlertCircle, ArrowUpDown, ChevronRight
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

export default function SpreadsheetLedgerPage() {
  const [activeTab, setActiveTab] = useState('expenses'); // 'expenses' | 'incomes' | 'transfers'
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCount, setRefreshCount] = useState(0);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterAccount, setFilterAccount] = useState('All');

  // Sorting
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'

  // Inline Editing State
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const triggerRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  useEffect(() => {
    loadData();
  }, [refreshCount]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expenseData, incomeData, transferData] = await Promise.all([
        api.getExpenses(),
        api.getIncomes(),
        api.getTransfers()
      ]);
      setExpenses(expenseData);
      setIncomes(incomeData);
      setTransfers(transferData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load ledger data.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Handlers
  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.deleteExpense(id);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to delete expense.");
    }
  };

  const handleDeleteIncome = async (id) => {
    if (!window.confirm("Are you sure you want to delete this income?")) return;
    try {
      await api.deleteIncome(id);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to delete income.");
    }
  };

  const handleDeleteTransfer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this transfer?")) return;
    try {
      await api.deleteTransfer(id);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to delete transfer.");
    }
  };

  // Start Edit Mode
  const startEditExpense = (item) => {
    setEditingId(item.id);
    setEditForm({
      category: item.category,
      amount: item.amount,
      description: item.description,
      date: item.date,
      account_type: item.account_type || 'Cash'
    });
  };

  const startEditIncome = (item) => {
    setEditingId(item.id);
    setEditForm({
      source: item.source,
      amount: item.amount,
      date: item.date,
      account_type: item.account_type || 'Cash'
    });
  };

  const startEditTransfer = (item) => {
    setEditingId(item.id);
    setEditForm({
      from_account: item.from_account || 'Bank',
      to_account: item.to_account || 'Cash',
      amount: item.amount,
      date: item.date,
      description: item.description || ''
    });
  };

  // Save Handlers
  const handleSaveExpense = async (id) => {
    try {
      await api.updateExpense(
        id, 
        editForm.category, 
        editForm.amount, 
        editForm.description, 
        editForm.date, 
        editForm.account_type
      );
      setEditingId(null);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to update expense.");
    }
  };

  const handleSaveIncome = async (id) => {
    try {
      await api.updateIncome(
        id, 
        editForm.source, 
        editForm.amount, 
        editForm.date, 
        editForm.account_type
      );
      setEditingId(null);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to update income.");
    }
  };

  const handleSaveTransfer = async (id) => {
    try {
      await api.updateTransfer(
        id,
        editForm.from_account,
        editForm.to_account,
        editForm.amount,
        editForm.date,
        editForm.description
      );
      setEditingId(null);
      triggerRefresh();
    } catch (err) {
      alert(err.message || "Failed to update transfer.");
    }
  };

  // Sorting helper
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Filter & Search Logic
  const getProcessedData = () => {
    const list = activeTab === 'expenses' ? expenses : (activeTab === 'incomes' ? incomes : transfers);
    
    let processed = list.filter(item => {
      const matchSearch = activeTab === 'expenses'
        ? (item.description?.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase()))
        : activeTab === 'incomes'
        ? (item.source?.toLowerCase().includes(search.toLowerCase()) || item.account_type?.toLowerCase().includes(search.toLowerCase()))
        : (item.description?.toLowerCase().includes(search.toLowerCase()) || item.from_account?.toLowerCase().includes(search.toLowerCase()) || item.to_account?.toLowerCase().includes(search.toLowerCase()));

      const matchCategory = activeTab === 'expenses'
        ? (filterCategory === 'All' || item.category === filterCategory)
        : true;

      const matchAccount = filterAccount === 'All'
        ? true
        : activeTab === 'transfers'
        ? (item.from_account === filterAccount || item.to_account === filterAccount)
        : (item.account_type || 'Cash') === filterAccount;

      return matchSearch && matchCategory && matchAccount;
    });

    // Sort
    processed.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle undefined/nulls
      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (typeof aVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      } else {
        return sortDirection === 'asc'
          ? aVal - bVal
          : bVal - aVal;
      }
    });

    return processed;
  };

  const processedData = getProcessedData();

  if (loading && expenses.length === 0 && incomes.length === 0 && transfers.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white">Financial Ledger Sheets</h1>
          <p className="text-gray-400 text-xs mt-1">Spreadsheet ledger for editing and deleting logged transactions.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 w-fit">
          <button 
            onClick={() => { setActiveTab('expenses'); setSearch(''); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'expenses' 
                ? 'bg-blue-600 text-white shadow-glow-blue' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingDown className="h-3.5 w-3.5" /> Expenses Log
          </button>
          <button 
            onClick={() => { setActiveTab('incomes'); setSearch(''); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'incomes' 
                ? 'bg-green-600 text-white shadow-glow-green' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" /> Incomes Log
          </button>
          <button 
            onClick={() => { setActiveTab('transfers'); setSearch(''); setEditingId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'transfers' 
                ? 'bg-blue-600 text-white shadow-glow-blue' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" /> Transfers Log
          </button>
        </div>
      </div>

      {/* Spreadsheet Control Panel */}
      <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder={
                  activeTab === 'expenses' 
                    ? "Search category or description..." 
                    : activeTab === 'incomes' 
                    ? "Search source or method..." 
                    : "Search description or account..."
                }
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="glass-input pl-9 pr-3 py-1.8 text-xs w-full"
              />
            </div>
            
            {/* Expense Category Filter */}
            {activeTab === 'expenses' && (
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <span className="text-xs text-gray-400 font-semibold flex-shrink-0">Category:</span>
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="glass-input px-3 py-1.8 text-xs w-full sm:w-auto"
                >
                  <option value="All">All</option>
                  {Object.keys(CATEGORY_COLORS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Account Type Filter */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <span className="text-xs text-gray-400 font-semibold flex-shrink-0">Account:</span>
              <select 
                value={filterAccount} 
                onChange={(e) => setFilterAccount(e.target.value)}
                className="glass-input px-3 py-1.8 text-xs w-full sm:w-auto"
              >
                <option value="All">All</option>
                {Object.keys(ACCOUNT_COLORS).map(acc => (
                  <option key={acc} value={acc}>{acc}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-gray-400 font-semibold flex-shrink-0 self-end md:self-center">
            Found: <span className="text-white font-bold">{processedData.length}</span> entries
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto border border-white/5 rounded-xl bg-slate-950/40">
          {processedData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="mx-auto mb-2.5 h-10 w-10 text-gray-600" />
              <p className="text-sm">No transaction entries matched your search filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-white/5 bg-slate-900/40 text-gray-400 text-xs uppercase font-bold tracking-wider select-none">
                  <th onClick={() => handleSort('date')} className="py-3 px-4 cursor-pointer hover:text-white transition-all w-40">
                    <div className="flex items-center gap-1">
                      Date <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  
                  {activeTab === 'expenses' ? (
                    <th onClick={() => handleSort('category')} className="py-3 px-4 cursor-pointer hover:text-white transition-all w-44">
                      <div className="flex items-center gap-1">
                        Category <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  ) : activeTab === 'incomes' ? (
                    <th onClick={() => handleSort('source')} className="py-3 px-4 cursor-pointer hover:text-white transition-all w-48">
                      <div className="flex items-center gap-1">
                        Income Source <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  ) : (
                    <th onClick={() => handleSort('from_account')} className="py-3 px-4 cursor-pointer hover:text-white transition-all w-44">
                      <div className="flex items-center gap-1">
                        From Account <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}

                  {activeTab === 'transfers' && (
                    <th onClick={() => handleSort('to_account')} className="py-3 px-4 cursor-pointer hover:text-white transition-all w-44">
                      <div className="flex items-center gap-1">
                        To Account <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}

                  {(activeTab === 'expenses' || activeTab === 'transfers') && (
                    <th onClick={() => handleSort('description')} className="py-3 px-4 cursor-pointer hover:text-white transition-all">
                      <div className="flex items-center gap-1">
                        Description <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}

                  {activeTab !== 'transfers' && (
                    <th onClick={() => handleSort('account_type')} className="py-3 px-4 cursor-pointer hover:text-white transition-all w-40">
                      <div className="flex items-center gap-1">
                        Account <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                  )}

                  <th onClick={() => handleSort('amount')} className="py-3 px-4 cursor-pointer hover:text-white transition-all text-right w-36">
                    <div className="flex items-center justify-end gap-1">
                      Amount <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>

                  <th className="py-3 px-4 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm text-gray-300 font-medium">
                {processedData.map((item) => {
                  const isEditing = editingId === item.id;
                  
                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-all ${
                        isEditing 
                          ? 'bg-blue-950/15 border-y border-blue-500/20' 
                          : 'hover:bg-white/3'
                      }`}
                    >
                      {/* DATE FIELD */}
                      <td className="py-3 px-4 text-xs">
                        {isEditing ? (
                          <input 
                            type="date" 
                            value={editForm.date} 
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            className="glass-input px-2 py-1 text-xs w-full text-gray-400"
                          />
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-blue-500" />
                            {new Date(item.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </td>

                      {/* CATEGORY / SOURCE / FROM ACCOUNT FIELD */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          activeTab === 'expenses' ? (
                            <select 
                              value={editForm.category} 
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="glass-input px-2 py-1 text-xs w-full"
                            >
                              {Object.keys(CATEGORY_COLORS).map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </select>
                          ) : activeTab === 'incomes' ? (
                            <input 
                              type="text" 
                              value={editForm.source} 
                              onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                              className="glass-input px-2 py-1 text-xs w-full"
                              required
                            />
                          ) : (
                            <select 
                              value={editForm.from_account} 
                              onChange={(e) => setEditForm({ ...editForm, from_account: e.target.value })}
                              className="glass-input px-2 py-1 text-xs w-full"
                            >
                              {Object.keys(ACCOUNT_COLORS).map(acc => (
                                <option key={acc} value={acc}>{acc}</option>
                              ))}
                            </select>
                          )
                        ) : (
                          activeTab === 'expenses' ? (
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
                          ) : activeTab === 'incomes' ? (
                            <span className="text-white font-bold">{item.source}</span>
                          ) : (
                            <span 
                              className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                              style={{ 
                                backgroundColor: `${ACCOUNT_COLORS[item.from_account || 'Cash']}10`, 
                                color: ACCOUNT_COLORS[item.from_account || 'Cash'],
                                border: `1px solid ${ACCOUNT_COLORS[item.from_account || 'Cash']}25`
                              }}
                            >
                              {item.from_account || 'Cash'}
                            </span>
                          )
                        )}
                      </td>

                      {/* TO ACCOUNT FIELD */}
                      {activeTab === 'transfers' && (
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select 
                              value={editForm.to_account} 
                              onChange={(e) => setEditForm({ ...editForm, to_account: e.target.value })}
                              className="glass-input px-2 py-1 text-xs w-full"
                            >
                              {Object.keys(ACCOUNT_COLORS).map(acc => (
                                <option key={acc} value={acc}>{acc}</option>
                              ))}
                            </select>
                          ) : (
                            <span 
                              className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                              style={{ 
                                backgroundColor: `${ACCOUNT_COLORS[item.to_account || 'Cash']}10`, 
                                color: ACCOUNT_COLORS[item.to_account || 'Cash'],
                                border: `1px solid ${ACCOUNT_COLORS[item.to_account || 'Cash']}25`
                              }}
                            >
                              {item.to_account || 'Cash'}
                            </span>
                          )}
                        </td>
                      )}

                      {/* DESCRIPTION FIELD */}
                      {(activeTab === 'expenses' || activeTab === 'transfers') && (
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <input 
                              type="text" 
                              value={editForm.description} 
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="glass-input px-2 py-1 text-xs w-full"
                              placeholder="ATM withdrawal, friend payback..."
                            />
                          ) : (
                            <span className="italic text-gray-400">{item.description || '-'}</span>
                          )}
                        </td>
                      )}

                      {/* ACCOUNT TYPE FIELD */}
                      {activeTab !== 'transfers' && (
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <select 
                              value={editForm.account_type} 
                              onChange={(e) => setEditForm({ ...editForm, account_type: e.target.value })}
                              className="glass-input px-2 py-1 text-xs w-full"
                            >
                              {Object.keys(ACCOUNT_COLORS).map(acc => (
                                <option key={acc} value={acc}>{acc}</option>
                              ))}
                            </select>
                          ) : (
                            <span 
                              className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider"
                              style={{ 
                                backgroundColor: `${ACCOUNT_COLORS[item.account_type || 'Cash']}10`, 
                                color: ACCOUNT_COLORS[item.account_type || 'Cash'],
                                border: `1px solid ${ACCOUNT_COLORS[item.account_type || 'Cash']}25`
                              }}
                            >
                              {item.account_type || 'Cash'}
                            </span>
                          )}
                        </td>
                      )}

                      {/* AMOUNT FIELD */}
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <input 
                            type="number" 
                            value={editForm.amount} 
                            onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                            className="glass-input px-2 py-1 text-xs w-28 text-right font-bold"
                            required
                          />
                        ) : (
                          <span className={`font-bold ${activeTab === 'expenses' ? 'text-white' : activeTab === 'incomes' ? 'text-green-400' : 'text-blue-400'}`}>
                            {activeTab === 'expenses' ? '-' : activeTab === 'incomes' ? '+' : '⇄'} Rs. {item.amount.toLocaleString()}
                          </span>
                        )}
                      </td>

                      {/* ACTIONS FIELD */}
                      <td className="py-3 px-4 text-center">
                        {isEditing ? (
                          <div className="flex justify-center gap-1.5">
                            {/* Save Button */}
                            <button 
                              onClick={() => {
                                if (activeTab === 'expenses') handleSaveExpense(item.id);
                                else if (activeTab === 'incomes') handleSaveIncome(item.id);
                                else handleSaveTransfer(item.id);
                              }}
                              className="p-1.5 bg-green-500/10 text-green-400 border border-green-800/20 rounded hover:bg-green-600 hover:text-white transition-all cursor-pointer"
                              title="Save changes"
                            >
                              <Save className="h-3.5 w-3.5" />
                            </button>
                            {/* Cancel Button */}
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-1.5 bg-red-500/10 text-red-400 border border-red-800/20 rounded hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                              title="Discard edits"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-center gap-1.5">
                            {/* Edit Button */}
                            <button 
                              onClick={() => {
                                if (activeTab === 'expenses') startEditExpense(item);
                                else if (activeTab === 'incomes') startEditIncome(item);
                                else startEditTransfer(item);
                              }}
                              className="p-1.5 bg-blue-500/10 text-blue-400 border border-blue-800/10 rounded hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                              title="Edit transaction inline"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {/* Delete Button */}
                            <button 
                              onClick={() => {
                                if (activeTab === 'expenses') handleDeleteExpense(item.id);
                                else if (activeTab === 'incomes') handleDeleteIncome(item.id);
                                else handleDeleteTransfer(item.id);
                              }}
                              className="p-1.5 bg-red-500/10 text-red-400 border border-red-850/10 rounded hover:bg-red-600 hover:text-white transition-all cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
