import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { 
  Sparkles, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  Info,
  Zap,
  Gauge
} from 'lucide-react';

export default function InsightsDashboard({ refreshCount }) {
  const [predictions, setPredictions] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInsightsData();
  }, [refreshCount]);

  const fetchInsightsData = async () => {
    try {
      setLoading(true);
      const predData = await api.getPredictions();
      const insData = await api.getInsights();
      setPredictions(predData);
      setInsights(insData);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load insights data');
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      case 'danger': return <AlertCircle className="h-5 w-5 text-red-400" />;
      default: return <Info className="h-5 w-5 text-blue-400" />;
    }
  };

  const getAlertBg = (type) => {
    switch (type) {
      case 'success': return 'bg-green-950/20 border-green-800/30 text-green-300';
      case 'warning': return 'bg-amber-950/20 border-amber-800/30 text-amber-300';
      case 'danger': return 'bg-red-950/20 border-red-800/30 text-red-300';
      default: return 'bg-blue-950/20 border-blue-800/30 text-blue-300';
    }
  };

  if (loading) {
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
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top row: Predictions summary cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* End of month forecast */}
        <div className="glass-card p-6 rounded-xl space-y-4 bg-gradient-to-br from-slate-900/40 to-blue-950/15">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase">EOM Expense Forecast</span>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-3xl font-black text-white">Rs. {predictions?.forecastedExpenses?.toLocaleString()}</h4>
            <p className="text-xs text-gray-400">
              Projected end-of-month spending based on your daily rate of 
              <span className="text-white font-semibold"> Rs. {predictions?.avgDailySpend?.toLocaleString()} / day</span>.
            </p>
          </div>
          <div className="pt-2">
            <div className="flex justify-between text-xs font-semibold text-gray-400 mb-1">
              <span>Budget Limit: Rs. {predictions?.availableBudget?.toLocaleString()}</span>
              <span className={predictions?.forecastedExpenses > predictions?.availableBudget ? "text-red-400" : "text-green-400"}>
                {predictions?.forecastedExpenses > predictions?.availableBudget ? "Overspending" : "Within Budget"}
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full ${predictions?.forecastedExpenses > predictions?.availableBudget ? "bg-red-500 shadow-glow-red" : "bg-blue-500 shadow-glow-blue"}`}
                style={{ width: `${Math.min(100, (predictions?.forecastedExpenses / (predictions?.availableBudget || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Budget Risk Assessor */}
        <div className="glass-card p-6 rounded-xl space-y-4 bg-gradient-to-br from-slate-900/40 to-red-950/10">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase">Budget Risk Profile</span>
            <AlertTriangle className={`h-4 w-4 ${
              predictions?.riskLevel === 'High' ? 'text-red-400 animate-pulse' : (predictions?.riskLevel === 'Medium' ? 'text-amber-400' : 'text-green-400')
            }`} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                predictions?.riskLevel === 'High' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 
                (predictions?.riskLevel === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30')
              }`}>
                {predictions?.riskLevel} Risk
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed italic">
              "{predictions?.warning}"
            </p>
          </div>
        </div>

        {/* Savings Target Predictor */}
        <div className="glass-card p-6 rounded-xl space-y-4 bg-gradient-to-br from-slate-900/40 to-purple-950/10">
          <div className="flex justify-between items-center border-b border-white/5 pb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase">Savings target projection</span>
            <Gauge className="h-4 w-4 text-purple-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xl font-bold text-white">Projected Savings: Rs. {predictions?.predictedSavings?.toLocaleString()}</h4>
            <p className="text-xs text-gray-400">
              Target this month: <span className="text-white font-semibold">Rs. {predictions?.savingsTarget?.toLocaleString()}</span>.
            </p>
          </div>
          <p className={`text-xs font-semibold ${predictions?.savingsTargetMet ? "text-green-400" : "text-amber-400"}`}>
            {predictions?.savingsStatusMessage}
          </p>
        </div>
      </div>

      {/* Financial insights list */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400 animate-float" />
          <h3 className="text-xl font-extrabold text-white">Personalized AI Financial Insights</h3>
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <div 
              key={idx} 
              className={`p-5 rounded-xl border flex gap-4 items-start shadow-sm transition-all hover:translate-x-1 ${getAlertBg(insight.type)}`}
            >
              <div className="p-2.5 bg-slate-900/60 rounded-lg border border-white/5 flex-shrink-0">
                {getAlertIcon(insight.type)}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">{insight.title}</h4>
                <p className="text-xs leading-relaxed text-gray-300">{insight.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
