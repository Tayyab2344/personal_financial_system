import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Target, PiggyBank, PlusCircle, Calendar, ArrowRight, ChevronRight, CheckCircle, Sparkles, TrendingUp } from 'lucide-react';

export default function SavingsDashboard({ triggerRefresh, refreshCount }) {
  const [goals, setGoals] = useState([]);
  const [contributions, setContributions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Goal creation Form
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');

  // Contribution Form
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [contribAmount, setContribAmount] = useState('');
  const [contribDate, setContribDate] = useState('');

  // Selected Goal for detailed logs
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [activeContribs, setActiveContribs] = useState([]);

  useEffect(() => {
    fetchGoals();
  }, [refreshCount]);

  useEffect(() => {
    if (activeGoalId) {
      fetchContributions(activeGoalId);
    }
  }, [activeGoalId, refreshCount]);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const data = await api.getSavingGoals();
      setGoals(data);
      if (data.length > 0 && !selectedGoalId) {
        setSelectedGoalId(data[0].id.toString());
      }
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load savings goals');
    } finally {
      setLoading(false);
    }
  };

  const fetchContributions = async (goalId) => {
    try {
      const data = await api.getGoalContributions(goalId);
      setContributions(prev => ({ ...prev, [goalId]: data }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    if (!goalName || !targetAmount || !targetDate) return;
    try {
      await api.addSavingGoal(goalName, targetAmount, currentAmount || 0, targetDate);
      setGoalName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      triggerRefresh();
    } catch (err) {
      alert(err.message || 'Failed to create goal');
    }
  };

  const handleAddContribution = async (e) => {
    e.preventDefault();
    if (!selectedGoalId || !contribAmount) return;
    try {
      const result = await api.addGoalContribution(selectedGoalId, contribAmount, contribDate || null);
      setContribAmount('');
      setContribDate('');
      triggerRefresh();
      // If we are currently viewing contributions for this goal, refresh that list too
      if (parseInt(selectedGoalId, 10) === activeGoalId) {
        fetchContributions(selectedGoalId);
      }
    } catch (err) {
      alert(err.message || 'Failed to record contribution');
    }
  };

  const getPrediction = (goal) => {
    const remaining = goal.target_amount - goal.current_amount;
    if (remaining <= 0) return "Goal Achieved! 🎉";
    
    // Estimate date difference
    const today = new Date();
    const target = new Date(goal.target_date);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "Target date has passed.";
    
    const dailySavingNeeded = remaining / diffDays;
    const monthlySavingNeeded = dailySavingNeeded * 30;

    return `Need Rs. ${Math.round(monthlySavingNeeded).toLocaleString()} / month for ${diffDays} days to finish.`;
  };

  if (loading && goals.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top row: Goal summary & contribution logger */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Create goal */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <PlusCircle className="text-purple-400 h-5 w-5" />
            <h3 className="text-lg font-bold text-white">Create Savings Goal</h3>
          </div>
          <form onSubmit={handleCreateGoal} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Goal Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. New Laptop, Vacation..." 
                  value={goalName}
                  onChange={(e) => setGoalName(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Target Amount (PKR)</label>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Initial Deposit (PKR)</label>
                <input 
                  type="number" 
                  placeholder="0" 
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Target Date</label>
                <input 
                  type="date" 
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm text-gray-400"
                  required
                />
              </div>
            </div>
            <button 
              type="submit" 
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-bold transition-all"
            >
              Create Savings Goal
            </button>
          </form>
        </div>

        {/* Add Contribution */}
        <div className="glass-card p-6 rounded-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <PiggyBank className="text-green-400 h-5 w-5" />
            <h3 className="text-lg font-bold text-white">Record Contribution</h3>
          </div>
          {goals.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">Create a savings goal first to log contributions.</p>
          ) : (
            <form onSubmit={handleAddContribution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">Select Goal</label>
                <select 
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="w-full glass-input px-3 py-2 text-sm"
                >
                  {goals.map(g => (
                    <option key={g.id} value={g.id}>{g.goal_name} (Rs. {g.target_amount.toLocaleString()})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Contribution Amount (PKR)</label>
                  <input 
                    type="number" 
                    placeholder="Amount" 
                    value={contribAmount}
                    onChange={(e) => setContribAmount(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1">Date (Optional)</label>
                  <input 
                    type="date" 
                    value={contribDate}
                    onChange={(e) => setContribDate(e.target.value)}
                    className="w-full glass-input px-3 py-2 text-sm text-gray-400"
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="w-full py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition-all"
              >
                Log Saving Contribution
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Goals Display grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-extrabold text-white">Active Savings Goals</h3>
        
        {goals.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-400">
            <Target className="mx-auto mb-2 h-12 w-12 text-gray-600" />
            <p>You have no active savings goals set up.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {goals.map(goal => {
              const pct = goal.target_amount > 0 ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100)) : 0;
              const isSelected = activeGoalId === goal.id;
              
              return (
                <div 
                  key={goal.id} 
                  className={`glass-card p-6 rounded-xl flex flex-col justify-between border transition-all ${
                    isSelected ? 'border-purple-500 shadow-glow-purple bg-purple-950/10' : 'border-white/5'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-white">{goal.goal_name}</h4>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-800 text-purple-400 border border-purple-500/20 flex items-center gap-1 w-fit">
                          <Calendar className="h-3 w-3" />
                          Target: {new Date(goal.target_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                      <span className="text-2xl font-black text-purple-400">{pct}%</span>
                    </div>

                    {/* Progress Slider */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-900 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full shadow-glow-purple" 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs font-semibold text-gray-400">
                        <span>Saved: Rs. {goal.current_amount.toLocaleString()}</span>
                        <span>Goal: Rs. {goal.target_amount.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Prediction text */}
                    <div className="bg-slate-950/40 border border-white/5 p-3 rounded-lg flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-400 animate-pulse flex-shrink-0" />
                      <p className="text-xs text-amber-300 font-semibold leading-relaxed">
                        {getPrediction(goal)}
                      </p>
                    </div>
                  </div>

                  {/* Toggle contributions history */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <button 
                      onClick={() => setActiveGoalId(isSelected ? null : goal.id)}
                      className="text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-all"
                    >
                      {isSelected ? "Hide History" : "View Contributions"} 
                      <ChevronRight className={`h-4 w-4 transform transition-all ${isSelected ? 'rotate-90' : ''}`} />
                    </button>
                    {pct >= 100 && (
                      <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                        <CheckCircle className="h-4 w-4" /> Goal Completed!
                      </span>
                    )}
                  </div>

                  {/* Nested Contributions list */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-purple-500/20 space-y-2">
                      <h5 className="text-xs font-bold uppercase text-purple-400 tracking-wider">Contribution History</h5>
                      {(!contributions[goal.id] || contributions[goal.id].length === 0) ? (
                        <p className="text-xs text-gray-500">No contributions logged yet.</p>
                      ) : (
                        <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                          {contributions[goal.id].map(c => (
                            <div key={c.id} className="flex justify-between items-center text-xs p-2 bg-slate-900/60 rounded border border-white/5">
                              <span className="text-gray-400">{new Date(c.contribution_date).toLocaleDateString()}</span>
                              <span className="font-bold text-green-400">+ Rs. {c.amount.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
