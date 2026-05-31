'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Coins, Calendar, 
  Percent, ArrowRight, Flame, CheckCircle, AlertCircle, AlertTriangle, 
  Sparkles, Gauge, RefreshCw, BarChart2, Clock, Zap, 
  ArrowUpRight, ArrowDownRight, Award, Compass, ShieldAlert, Laptop
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

export default function InsightsPage() {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localRefresh, setLocalRefresh] = useState(0);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');

  // Scenario Simulator State
  const [extraMonthlySavings, setExtraMonthlySavings] = useState(5000);

  // Digital Twin Simulator State
  const [simulateItem, setSimulateItem] = useState('');
  const [simulatePrice, setSimulatePrice] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [localRefresh]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalyticsDashboard();
      setAnalytics(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load analytics intelligence.');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedData = async () => {
    if (!window.confirm("Seeding will reset your current vault data and replace it with a 3-month demo history to showcase all levels of analytics. Proceed?")) return;
    try {
      setSeedLoading(true);
      setSeedMessage('Clearing previous data and seeding vault...');
      const res = await api.seedMockData();
      setSeedMessage(res.message || 'Successfully seeded!');
      setTimeout(() => setSeedMessage(''), 4000);
      setLocalRefresh(prev => prev + 1);
    } catch (err) {
      alert(err.message || 'Failed to seed demo data.');
      setSeedMessage('');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleSimulatePurchase = (e) => {
    e.preventDefault();
    if (!simulatePrice || isNaN(simulatePrice) || parseFloat(simulatePrice) <= 0) {
      alert("Please enter a valid purchase price.");
      return;
    }

    const price = parseFloat(simulatePrice);
    const item = simulateItem.trim() || "Unspecified Item";
    const budgetRemaining = analytics?.basicAnalytics?.budgetRemaining || 0;
    const totalIncome = analytics?.basicAnalytics?.totalIncome || 0;
    const totalExpenses = analytics?.basicAnalytics?.totalExpenses || 0;
    const currentHealthScore = analytics?.budgetIntelligence?.healthScore || 100;
    const safeDailyLimit = analytics?.budgetIntelligence?.safeDailyLimit || 0;
    const remainingDays = analytics?.basicAnalytics?.remainingDays || 30;

    // Simulation logic
    let recommendation = "Approved";
    let riskStatus = "Safe";
    let statusClass = "text-green-400 border-green-500/20 bg-green-500/10";
    let advice = `Approved: This purchase fits within your remaining spending budget of Rs. ${budgetRemaining.toLocaleString()}. Your daily limit remains safe.`;
    let simulatedHealthScore = currentHealthScore;

    if (budgetRemaining >= price) {
      recommendation = "Approved";
      riskStatus = "Safe";
      simulatedHealthScore = Math.max(0, currentHealthScore - 2); // minor hit
    } else if (totalIncome - totalExpenses - price >= 0) {
      // Exceeds budget, cuts into savings target
      recommendation = "Warning (Savings at Risk)";
      riskStatus = "At Risk";
      statusClass = "text-amber-400 border-amber-500/20 bg-amber-500/10";
      const impact = price - budgetRemaining;
      advice = `Warning: This purchase exceeds your monthly spending allowance by Rs. ${impact.toLocaleString()}. Buying this will reduce your reserved savings target.`;
      simulatedHealthScore = Math.max(0, currentHealthScore - 15);
    } else {
      // Exceeds total monthly income (causes deficit)
      recommendation = "Denied (Budget Deficit)";
      riskStatus = "Critically At Risk";
      statusClass = "text-red-400 border-red-500/20 bg-red-500/10";
      const deficit = price - (totalIncome - totalExpenses);
      advice = `Denied: This purchase creates a deficit of Rs. ${deficit.toLocaleString()}. Purchasing this will require dipping into emergency savings or borrowing funds.`;
      simulatedHealthScore = Math.max(0, currentHealthScore - 35);
    }

    const simulatedBudgetRemaining = budgetRemaining - price;
    const simulatedDailyLimit = Math.max(0, simulatedBudgetRemaining) / remainingDays;

    setSimulationResult({
      item,
      price,
      recommendation,
      riskStatus,
      statusClass,
      advice,
      simulatedHealthScore,
      healthScoreDelta: simulatedHealthScore - currentHealthScore,
      simulatedDailyLimit: parseFloat(simulatedDailyLimit.toFixed(2)),
      dailyLimitDelta: simulatedDailyLimit - safeDailyLimit
    });
  };

  const getHealthScoreColor = (score) => {
    if (score >= 80) return { border: 'border-green-500/30', text: 'text-green-400', bg: 'bg-green-500/10', glow: 'shadow-glow-green', grade: 'A' };
    if (score >= 60) return { border: 'border-amber-500/30', text: 'text-amber-400', bg: 'bg-amber-500/10', glow: 'shadow-glow-amber', grade: 'B' };
    return { border: 'border-red-500/30', text: 'text-red-400', bg: 'bg-red-500/10', glow: 'shadow-glow-red', grade: 'C' };
  };

  if (loading && !analytics) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-sm text-gray-400">Analyzing financial patterns...</p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="glass-card p-6 text-center text-red-400 space-y-4">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <p className="font-semibold">{error}</p>
        <div className="flex justify-center gap-4">
          <button onClick={fetchAnalyticsData} className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all font-bold text-sm cursor-pointer">Retry</button>
          <button onClick={handleSeedData} className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-all font-bold text-sm cursor-pointer">Seed Demo Data</button>
        </div>
      </div>
    );
  }

  // Ensure safe fallback objects for empty DB states
  const basic = analytics?.basicAnalytics || { totalIncome: 0, totalExpenses: 0, netSavings: 0, savingsRate: 0, budgetRemaining: 0, availableBudget: 0, savingsTarget: 0, todaySpending: 0, dailyAverage: 0, highestSpendingDay: { date: 'N/A', amount: 0 }, lowestSpendingDay: { date: 'N/A', amount: 0 }, last15DaysData: [] };
  const categoriesData = analytics?.categoryAnalytics || [];
  const timeBased = analytics?.timeBasedAnalytics || { weeklySpending: [0, 0, 0, 0], weeklyAverage: 0, highestSpendingWeek: 0, lowestSpendingWeek: 0, last4Months: [], growthRates: { spendingGrowth: 0, savingsGrowth: 0, incomeGrowth: 0 }, yearlyData: [] };
  const budgetIntel = analytics?.budgetIntelligence || { monthProgressPct: 0, budgetUsedPct: 0, burnRateWarning: 'Stable', burnRateStatus: 'success', safeDailyLimit: 0, healthScore: 100, deductions: [] };
  const patterns = analytics?.patternDetection || { dayPatternMessage: 'No patterns', timePatternMessage: 'No patterns', categoryPatternList: [], recurringSuggestions: [] };
  const behavior = analytics?.behavioralAnalytics || { impulseAlerts: [], lifestyleCreepWarning: null, savingBehaviorSummary: 'Stable' };
  const predictions = analytics?.predictiveAnalytics || { expectedExpenses: 0, expectedSavings: 0, expectedBudgetLeft: 0, goalCompletionPredictions: [], overspendingRisk: 'Low', overspendingProbability: 0 };
  const personality = analytics?.financialPersonality || { archetype: 'Balanced', archetypeDescription: 'Steady saver.', styleBreakdown: { needs: 40, wants: 30, savings: 20, education: 10 } };
  const healthStyle = getHealthScoreColor(budgetIntel.healthScore);

  return (
    <div className="space-y-6">
      {/* Seed Demo Data Banner */}
      <div className="glass-card p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-500/20 bg-gradient-to-r from-blue-950/20 to-purple-950/20">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
            <Sparkles className="h-4.5 w-4.5 text-blue-400 animate-float" />
            FinPilot Financial Intelligence Suite
          </h3>
          <p className="text-xs text-gray-400">
            {basic.totalIncome === 0 
              ? "Your financial vault is currently empty. Seed demo data to see time analysis, recurring bills, and Digital Twin simulators!"
              : "Demo mode is active. You can clear and re-seed the vault data at any time."
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {seedMessage && <span className="text-xs text-blue-400 font-semibold animate-pulse">{seedMessage}</span>}
          <button 
            onClick={handleSeedData}
            disabled={seedLoading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-gray-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-glow-blue cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${seedLoading ? 'animate-spin' : ''}`} />
            Seed Demo Vault
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10 overflow-x-auto gap-2">
        <button 
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'overview' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Gauge className="h-4 w-4" />
          Intelligence Overview
        </button>
        <button 
          onClick={() => setActiveSubTab('trends')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'trends' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <BarChart2 className="h-4 w-4" />
          Trends & Timeframes
        </button>
        <button 
          onClick={() => setActiveSubTab('patterns')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'patterns' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Compass className="h-4 w-4" />
          Behavior & Patterns
        </button>
        <button 
          onClick={() => setActiveSubTab('simulator')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 shrink-0 ${
            activeSubTab === 'simulator' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          <Zap className="h-4 w-4" />
          Digital Twin Simulator
        </button>
      </div>

      {/* RENDER ACTIVE SUBTAB */}

      {/* 1. OVERVIEW SUBTAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Health Score Circular Dial */}
            <div className="glass-card p-6 rounded-xl border border-white/5 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-slate-900/10 flex flex-col items-center justify-between min-h-64">
              <div className="text-center w-full">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Award className="h-4 w-4 text-purple-400" />
                  Financial Health Score
                </span>
              </div>
              <div className="relative my-4 flex items-center justify-center">
                <div className={`w-32 h-32 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center ${healthStyle.glow}`}>
                  <span className="text-4xl font-black text-white leading-none">{budgetIntel.healthScore}</span>
                  <span className={`text-xs font-bold mt-1 px-2 py-0.5 rounded ${healthStyle.bg} ${healthStyle.text}`}>
                    Grade {healthStyle.grade}
                  </span>
                </div>
                <div className="absolute -inset-0.5 rounded-full border border-dashed border-white/10 animate-spin [animation-duration:15s] pointer-events-none"></div>
              </div>
              <div className="text-center text-xs">
                {budgetIntel.deductions.length === 0 
                  ? <p className="text-green-400 font-bold">✨ Perfect Budget Discipline Score! Keep it up.</p>
                  : <p className="text-gray-400 italic">Adjusted for {budgetIntel.deductions.length} budget violations.</p>
                }
              </div>
            </div>

            {/* Daily Spending Limit Glow Banner */}
            <div className="glass-card p-6 rounded-xl border border-white/5 bg-gradient-to-br from-slate-900/40 via-blue-950/15 to-slate-900/10 flex flex-col justify-between min-h-64">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Flame className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
                  Safe Daily spending limit
                </span>
                <div className="space-y-1">
                  <h2 className="text-4xl font-black text-white">
                    Rs. {budgetIntel.safeDailyLimit.toLocaleString()} <span className="text-sm font-semibold text-gray-400">/ day</span>
                  </h2>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    This dynamically updates daily based on your remaining budget of 
                    <span className="text-white font-semibold"> Rs. {basic.budgetRemaining.toLocaleString()}</span> and 
                    <span className="text-white font-semibold"> {basic.remainingDays} days</span> left in this month.
                  </p>
                </div>
              </div>
              <div className="p-3 bg-slate-900/60 rounded-lg border border-white/5 text-[11px] leading-relaxed text-gray-400 italic">
                💡 **Digital Twin Tip:** Exceeding this limit will drag down your overall Financial Health Score.
              </div>
            </div>

            {/* Budget Burn Rate Gauge */}
            <div className="glass-card p-6 rounded-xl border border-white/5 bg-gradient-to-br from-slate-900/40 via-slate-950/20 to-slate-900/10 flex flex-col justify-between min-h-64">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Budget Burn Rate</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-${budgetIntel.burnRateStatus === 'success' ? 'green' : (budgetIntel.burnRateStatus === 'warning' ? 'amber' : 'red')}-500/20 text-${budgetIntel.burnRateStatus === 'success' ? 'green' : (budgetIntel.burnRateStatus === 'warning' ? 'amber' : 'red')}-400 border border-${budgetIntel.burnRateStatus === 'success' ? 'green' : (budgetIntel.burnRateStatus === 'warning' ? 'amber' : 'red')}-500/30`}>
                    {budgetIntel.burnRateStatus === 'success' ? 'Sustainable' : (budgetIntel.burnRateStatus === 'warning' ? 'Paced' : 'Burn Warning')}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-400">Month Progress</span>
                    <span className="text-white">{budgetIntel.monthProgressPct}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${budgetIntel.monthProgressPct}%` }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-gray-400">Budget Spent</span>
                    <span className="text-white">{budgetIntel.budgetUsedPct}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${budgetIntel.burnRateStatus === 'danger' ? 'bg-red-500 shadow-glow-red' : (budgetIntel.burnRateStatus === 'warning' ? 'bg-amber-500 shadow-glow-amber' : 'bg-green-500 shadow-glow-green')}`} 
                      style={{ width: `${Math.min(100, budgetIntel.budgetUsedPct)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 italic text-center mt-3">
                "{budgetIntel.burnRateWarning}"
              </p>
            </div>
          </div>

          {/* L1 Basic Financial Summary and L8 Personality card */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 glass-card p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Coins className="h-4.5 w-4.5 text-blue-400" />
                Monthly Financial Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 bg-slate-900/40 rounded-lg border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total Income</span>
                  <h4 className="text-lg font-black text-white mt-1">Rs. {basic.totalIncome.toLocaleString()}</h4>
                </div>
                <div className="p-3.5 bg-slate-900/40 rounded-lg border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Expenses logged</span>
                  <h4 className="text-lg font-black text-white mt-1">Rs. {basic.totalExpenses.toLocaleString()}</h4>
                </div>
                <div className="p-3.5 bg-slate-900/40 rounded-lg border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Total Savings</span>
                  <h4 className="text-lg font-black text-white mt-1">Rs. {basic.netSavings.toLocaleString()}</h4>
                </div>
                <div className="p-3.5 bg-slate-900/40 rounded-lg border border-white/5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Savings Rate</span>
                  <h4 className="text-lg font-black text-purple-400 mt-1">{basic.savingsRate}%</h4>
                </div>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full shadow-glow-purple" style={{ width: `${basic.savingsRate}%` }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 italic">
                <span>Reserved savings target: Rs. {basic.savingsTarget.toLocaleString()}</span>
                <span>Available spending allowance: Rs. {basic.availableBudget.toLocaleString()}</span>
              </div>
            </div>

            {/* L8 Personality card */}
            <div className="glass-card p-6 rounded-xl space-y-4 bg-gradient-to-br from-slate-900/40 to-purple-950/15">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Compass className="h-4.5 w-4.5 text-purple-400 animate-float" />
                Financial Personality Profile
              </h3>
              <div className="space-y-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-black uppercase tracking-wider">
                  {personality.archetype}
                </span>
                <p className="text-xs text-gray-300 leading-relaxed italic">
                  "{personality.archetypeDescription}"
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Spending Style Breakdown:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>🍔 Needs: <span className="text-white font-bold">{personality.styleBreakdown.needs}%</span></div>
                  <div>🎁 Wants: <span className="text-white font-bold">{personality.styleBreakdown.wants}%</span></div>
                  <div>📈 Savings: <span className="text-white font-bold">{personality.styleBreakdown.savings}%</span></div>
                  <div>🎓 Education: <span className="text-white font-bold">{personality.styleBreakdown.education}%</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. TRENDS & TIME-BASED SUBTAB */}
      {activeSubTab === 'trends' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Weekly Analysis (L2) */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Calendar className="h-4.5 w-4.5 text-blue-400" />
                  Weekly Spending Analysis
                </h3>
                <p className="text-xs text-gray-400 mt-1">Comparing spending across 7-day calendar intervals.</p>
              </div>

              <div className="h-60">
                {timeBased.weeklySpending.reduce((s,v)=>s+v, 0) === 0 ? (
                  <div className="h-full flex justify-center items-center text-xs text-gray-500">No transactions recorded this month</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { week: 'Week 1', Amount: timeBased.weeklySpending[0] },
                      { week: 'Week 2', Amount: timeBased.weeklySpending[1] },
                      { week: 'Week 3', Amount: timeBased.weeklySpending[2] },
                      { week: 'Week 4', Amount: timeBased.weeklySpending[3] }
                    ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(21, 28, 44, 0.95)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }}
                        formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Amount Spent']}
                      />
                      <Bar dataKey="Amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Highest Week</span>
                  <span className="text-white font-bold">Week {timeBased.highestSpendingWeek}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Lowest Week</span>
                  <span className="text-white font-bold">Week {timeBased.lowestSpendingWeek}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Weekly Average</span>
                  <span className="text-white font-bold">Rs. {Math.round(timeBased.weeklyAverage).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Monthly Comparison Graph (L2) */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-blue-400" />
                  Monthly Cash Flow Trends
                </h3>
                <p className="text-xs text-gray-400 mt-1">Comparing Income, Expenses, and general Savings over time.</p>
              </div>

              <div className="h-60">
                {timeBased.last4Months.length === 0 ? (
                  <div className="h-full flex justify-center items-center text-xs text-gray-500 font-semibold">No data available</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timeBased.last4Months} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(21, 28, 44, 0.95)', borderColor: 'rgba(255,255,255,0.1)', color: 'white' }} />
                      <Legend verticalAlign="top" height={36} iconSize={8} formatter={(value) => <span className="text-xs text-gray-400">{value}</span>} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                      <Line type="monotone" dataKey="savings" stroke="#8b5cf6" strokeWidth={2} name="Savings" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Income Growth MoM</span>
                  <span className={`font-bold flex items-center justify-center gap-0.5 ${timeBased.growthRates.incomeGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {timeBased.growthRates.incomeGrowth >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {Math.abs(timeBased.growthRates.incomeGrowth)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Expenses Change</span>
                  <span className={`font-bold flex items-center justify-center gap-0.5 ${timeBased.growthRates.spendingGrowth <= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {timeBased.growthRates.spendingGrowth > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {Math.abs(timeBased.growthRates.spendingGrowth)}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 block uppercase">Savings Growth</span>
                  <span className={`font-bold flex items-center justify-center gap-0.5 ${timeBased.growthRates.savingsGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {timeBased.growthRates.savingsGrowth >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                    {Math.abs(timeBased.growthRates.savingsGrowth)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* L7 MoM Category breakdown and L2 Yearly Analysis */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Category MoM breakdown */}
            <div className="md:col-span-2 glass-card p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Percent className="h-4.5 w-4.5 text-blue-400" />
                Category Growth & MoM Change
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {categoriesData.filter(c => c.amount > 0).map(cat => (
                  <div key={cat.category} className="p-3 bg-slate-900/40 rounded-lg border border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-gray-300">{cat.category}</span>
                      <span 
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded flex items-center ${
                          cat.trendDirection === 'up' 
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                            : (cat.trendDirection === 'down' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-gray-400')
                        }`}
                      >
                        {cat.trendDirection === 'up' ? '↑' : (cat.trendDirection === 'down' ? '↓' : '•')} {Math.abs(cat.trendPct)}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <span className="text-lg font-black text-white">Rs. {cat.amount.toLocaleString()}</span>
                      <span className="text-[10px] text-gray-400 block">{cat.percentage}% of month budget</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* L2 Yearly Analysis */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5 text-purple-400" />
                Annual Financial Summary
              </h3>
              {timeBased.yearlyData.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500">No annual logs available</div>
              ) : (
                <div className="space-y-4">
                  {timeBased.yearlyData.map(yr => (
                    <div key={yr.year} className="space-y-2 text-xs">
                      <span className="font-black text-sm text-blue-400 block">{yr.year} Fiscal Year</span>
                      <div className="grid grid-cols-2 gap-2 text-gray-300">
                        <div>Income: <span className="text-white font-bold">Rs. {yr.income.toLocaleString()}</span></div>
                        <div>Expenses: <span className="text-white font-bold text-red-400">Rs. {yr.expenses.toLocaleString()}</span></div>
                        <div className="col-span-2 pt-1 border-t border-white/5">
                          Net Saved: <span className="text-green-400 font-bold">Rs. {yr.savings.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="mt-2 text-[10px] text-gray-400 space-y-0.5">
                        <div>🏆 Best Month: <span className="text-green-300 font-semibold">{yr.bestMonth}</span></div>
                        <div>⚠️ Worst Month: <span className="text-red-300 font-semibold">{yr.worstMonth}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. PATTERNS & BEHAVIOR SUBTAB */}
      {activeSubTab === 'patterns' && (
        <div className="space-y-6">
          {/* Dynamic AI Insights alerts */}
          <div className="glass-card p-6 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Sparkles className="h-5 w-5 text-amber-400 animate-float" />
              Dynamic Spending Spending Insights & Patterns
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {analytics?.aiInsights.map((insight, idx) => (
                <div key={idx} className="p-3 bg-slate-900/50 rounded-lg border border-white/5 flex gap-3 items-start">
                  <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded">
                    <Zap className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed font-semibold">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* L4 Patterns: Day and Time patterns */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
                <Clock className="h-4.5 w-4.5 text-blue-400" />
                Spending Habit Patterns
              </h3>
              
              <div className="space-y-4">
                {/* Day pattern */}
                <div className="p-4 bg-slate-900/40 rounded-lg border border-white/5 space-y-2">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Weekly Day Pattern</span>
                  <p className="text-xs text-white font-semibold leading-relaxed">
                    {patterns.dayPatternMessage}
                  </p>
                </div>

                {/* Time pattern */}
                <div className="p-4 bg-slate-900/40 rounded-lg border border-white/5 space-y-2">
                  <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Time of Day Pattern</span>
                  <p className="text-xs text-white font-semibold leading-relaxed">
                    {patterns.timePatternMessage}
                  </p>
                </div>
              </div>
            </div>

            {/* L5 Impulse Spending Detector */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5 text-red-400 animate-pulse" />
                Spontaneous & Impulse Purchases
              </h3>
              {behavior.impulseAlerts.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 italic">
                  No abnormal impulse spending spikes detected this month. Nice work!
                </div>
              ) : (
                <div className="space-y-3">
                  {behavior.impulseAlerts.map((alert, idx) => (
                    <div key={idx} className="p-4 bg-red-950/10 border border-red-500/20 text-red-300 rounded-lg text-xs leading-relaxed flex gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-white">Spontaneous {alert.item} logged</span>
                        <p className="mt-1">{alert.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* L4 Recurring Expense Detector */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
                <RefreshCw className="h-4.5 w-4.5 text-blue-400" />
                Recurring Bills & Subscriptions Detector
              </h3>
              {patterns.recurringSuggestions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-500 italic">
                  Analyzing consecutive monthly charges. No new recurring candidates identified yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {patterns.recurringSuggestions.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/60 rounded-lg border border-white/5 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <h4 className="font-bold text-white">{rec.description}</h4>
                        <span className="text-[10px] text-gray-400 block">{rec.category} • Around day {rec.typicalDay} of month</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-white block">Rs. {rec.averageAmount.toLocaleString()}</span>
                        <button 
                          onClick={() => alert(`Subscribed ${rec.description} to monthly recurring list!`)} 
                          className="px-2 py-0.5 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white rounded border border-blue-500/30 text-[10px] transition-all font-bold mt-1 cursor-pointer"
                        >
                          Add recurring?
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* L5 Lifestyle Creep and Saving behavior */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2 flex items-center gap-1.5">
                <TrendingDown className="h-4.5 w-4.5 text-purple-400" />
                Behavioral Anomalies
              </h3>

              <div className="space-y-4">
                {/* Saving consistency */}
                <div className="p-3.5 bg-slate-900/40 rounded-lg border border-white/5 space-y-1">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Saving Velocity Profile</span>
                  <p className="text-xs text-white leading-relaxed font-semibold">{behavior.savingBehaviorSummary}</p>
                </div>

                {/* Lifestyle inflation creep */}
                {behavior.lifestyleCreepWarning ? (
                  <div className="p-4 bg-amber-950/10 border border-amber-500/20 text-amber-300 rounded-lg text-xs leading-relaxed flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-white">Lifestyle Creep Warning</span>
                      <p className="mt-1">{behavior.lifestyleCreepWarning.message}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-900/40 rounded-lg border border-white/5 text-xs text-green-400 font-bold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    No lifestyle creep detected. Expenditure is well aligned with income levels.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DIGITAL TWIN SIMULATOR SUBTAB */}
      {activeSubTab === 'simulator' && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6 animate-fadeIn">
            {/* L10 Scenario Simulation slider */}
            <div className="glass-card p-6 rounded-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Compass className="h-4.5 w-4.5 text-purple-400 animate-float" />
                  What-If Savings Scenario Simulator
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Adjust the slider below to simulate saving more money per month and see how it speeds up your savings goal achievements.
                </p>
              </div>

              {/* Slider controls */}
              <div className="p-4 bg-slate-900/60 rounded-lg border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold">
                  <span className="text-gray-400 uppercase">Extra Monthly Savings</span>
                  <span className="text-purple-400 text-sm font-bold">Rs. {extraMonthlySavings.toLocaleString()} PKR</span>
                </div>
                <input 
                  type="range" 
                  min="-20000" 
                  max="50000" 
                  step="1000"
                  value={extraMonthlySavings} 
                  onChange={(e) => setExtraMonthlySavings(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>-20,000 PKR</span>
                  <span>0 PKR</span>
                  <span>+50,000 PKR</span>
                </div>
              </div>

              {/* Simulation outcomes for goals */}
              <div className="space-y-3 pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block">Estimated Timeline Adjustment:</span>
                {predictions.goalCompletionPredictions.length === 0 ? (
                  <div className="text-center py-4 text-xs text-gray-500 italic">No active savings goals found to simulate timelines.</div>
                ) : (
                  <div className="space-y-2">
                    {predictions.goalCompletionPredictions.map(g => {
                      // Calculate velocity adjustment
                      const baseVelocity = Math.max(2000, basic.netSavings);
                      const baseMonths = Math.ceil(g.remainingAmount / baseVelocity);
                      
                      const simulatedVelocity = Math.max(1000, baseVelocity + extraMonthlySavings);
                      const simulatedMonths = Math.ceil(g.remainingAmount / simulatedVelocity);
                      
                      const deltaMonths = baseMonths - simulatedMonths;
                      
                      return (
                        <div key={g.goalId} className="p-3 bg-slate-900/40 rounded-lg border border-white/5 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">{g.goalName}</span>
                            <span className="text-[10px] text-gray-400 block">Remaining: Rs. {g.remainingAmount.toLocaleString()}</span>
                          </div>
                          <div className="text-right">
                            {deltaMonths > 0 ? (
                              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded font-black">
                                Achieved {deltaMonths} months earlier!
                              </span>
                            ) : deltaMonths < 0 ? (
                              <span className="px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded font-black">
                                Delayed by {Math.abs(deltaMonths)} months
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-800 text-gray-300 rounded">
                                No timeline change
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* L10 Financial Digital Twin (Purchase Impact Simulator) */}
            <div className="glass-card p-6 rounded-xl space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Laptop className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
                  Financial Digital Twin Simulator
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Model a hypothetical large purchase (e.g. buying a phone, car, game) to simulate impact on your health score and daily spending limits.
                </p>
              </div>

              <form onSubmit={handleSimulatePurchase} className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Purchase Description</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Sony PS5, iPhone..." 
                      value={simulateItem}
                      onChange={(e) => setSimulateItem(e.target.value)}
                      className="w-full glass-input px-3 py-2 text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Price (PKR)</label>
                    <input 
                      type="number" 
                      placeholder="Price in Rs." 
                      value={simulatePrice}
                      onChange={(e) => setSimulatePrice(e.target.value)}
                      className="w-full glass-input px-3 py-2 text-xs"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-lg text-xs font-bold transition-all shadow-glow-blue cursor-pointer"
                >
                  Simulate Purchase Outcome
                </button>
              </form>

              {/* Simulation Result Output */}
              {simulationResult ? (
                <div className="p-4 bg-slate-900/70 border border-white/10 rounded-lg space-y-3 mt-2 animate-fadeIn">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs font-bold text-white">Simulated Output: {simulationResult.item}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase ${simulationResult.statusClass}`}>
                      {simulationResult.recommendation}
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed italic">
                    "{simulationResult.advice}"
                  </p>

                  <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                    <div className="p-2.5 bg-slate-950/40 rounded border border-white/5">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Simulated Health Score</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-lg font-black text-white">{simulationResult.simulatedHealthScore}</span>
                        <span className={`text-[10px] font-bold ${simulationResult.healthScoreDelta < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          ({simulationResult.healthScoreDelta >= 0 ? '+' : ''}{simulationResult.healthScoreDelta} pts)
                        </span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-950/40 rounded border border-white/5">
                      <span className="text-[10px] text-gray-400 block uppercase font-bold">Simulated Daily Limit</span>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-lg font-black text-white">Rs. {simulationResult.simulatedDailyLimit.toLocaleString()}</span>
                        <span className={`text-[10px] font-bold ${simulationResult.dailyLimitDelta < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          (Rs. {simulationResult.dailyLimitDelta.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed border-white/10 rounded-lg py-8 text-center text-xs text-gray-500 italic">
                  Run simulation to view projected results
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
