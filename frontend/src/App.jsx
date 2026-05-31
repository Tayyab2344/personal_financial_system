import React, { useState, useEffect } from 'react';
import { api } from './utils/api';
import DashboardHome from './components/DashboardHome';
import ExpenseAnalytics from './components/ExpenseAnalytics';
import SavingsDashboard from './components/SavingsDashboard';
import InsightsDashboard from './components/InsightsDashboard';
import Chatbot from './components/Chatbot';
import { 
  LayoutDashboard, 
  PieChart, 
  PiggyBank, 
  Sparkles, 
  MessageSquare, 
  LogOut, 
  User,
  Activity,
  Lock,
  Mail,
  UserCheck
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(api.getUser());
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Auth Form State
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Global Refresh State to sync charts when chatbot logs a transaction
  const [refreshCount, setRefreshCount] = useState(0);

  const triggerRefresh = () => {
    setRefreshCount(prev => prev + 1);
  };

  useEffect(() => {
    if (token) {
      setUser(api.getUser());
    }
  }, [token]);

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setAuthError("Please fill out all required fields.");
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(email, password);
        setToken(data.token);
      } else {
        const data = await api.register(name, email, password);
        setToken(data.token);
      }
      // Reset fields
      setName('');
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    api.logout();
    setToken(null);
    setUser(null);
    setActiveTab('dashboard');
  };

  // Auth Screen
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-darkBg text-gray-100">
        {/* Colorful visual backdrop spots */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -z-10 animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 animate-float [animation-delay:2s]"></div>

        <div className="w-full max-w-md space-y-6">
          {/* Logo Title */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center justify-center gap-2">
              <span className="p-2.5 bg-blue-600 rounded-xl text-white shadow-glow-blue"><Activity className="h-6 w-6" /></span>
              <span className="gradient-title">Antigravity Finance</span>
            </h1>
            <p className="text-gray-400 text-sm">AI-Powered Personal Finance Assistant</p>
          </div>

          {/* Form Card */}
          <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
            
            <h2 className="text-xl font-bold text-white text-center mb-6">
              {isLogin ? "Sign In to Your Vault" : "Create Your Account"}
            </h2>

            {authError && (
              <div className="p-3 bg-red-950/20 border border-red-800/30 text-red-400 text-xs rounded-lg text-center mb-4 font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-400">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full glass-input pl-10 pr-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-500" />
                  <input 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input pl-10 pr-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-500" />
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full glass-input pl-10 pr-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={authLoading}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-gray-500 text-white rounded-xl font-bold text-sm transition-all shadow-glow-blue mt-4"
              >
                {authLoading ? "Authenticating..." : (isLogin ? "Sign In" : "Register Account")}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-400">
              {isLogin ? "New to the platform?" : "Already have an account?"}{" "}
              <button 
                onClick={() => { setIsLogin(!isLogin); setAuthError(''); }}
                className="text-blue-400 font-bold hover:underline"
              >
                {isLogin ? "Register Now" : "Sign In"}
              </button>
            </div>

            {/* Quick Demo tip (WOW feature) */}
            {isLogin && (
              <div className="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-gray-500 leading-relaxed">
                💡 **Demo Mode Active**: Use credentials <br/>
                <span className="text-blue-400 font-bold bg-slate-900/60 px-1 py-0.5 rounded border border-white/5">demo@finance.com</span> and password <span className="text-blue-400 font-bold bg-slate-900/60 px-1 py-0.5 rounded border border-white/5">password123</span><br/>
                to log in with rich mock financial history seeded instantly!
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-darkBg text-gray-100 relative">
      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 glass-card border-r border-white/10 flex flex-col justify-between p-5 md:fixed md:h-screen md:top-0 md:left-0 z-20">
        <div className="space-y-8">
          {/* Logo banner */}
          <div className="flex items-center gap-2 pb-4 border-b border-white/5">
            <span className="p-2 bg-blue-600 rounded-lg text-white shadow-glow-blue"><Activity className="h-5 w-5 animate-pulse" /></span>
            <span className="font-black text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Antigravity Fin</span>
          </div>

          {/* User profile card */}
          <div className="p-3 bg-slate-900/50 rounded-xl border border-white/5 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg">
              <User className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">{user?.name || "Member User"}</h4>
              <p className="text-[10px] text-gray-500 truncate">{user?.email || "user@mail.com"}</p>
            </div>
          </div>

          {/* Nav Tabs list */}
          <nav className="space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-glow-blue' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-glow-blue' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <PieChart className="h-4 w-4" />
              Expense Analytics
            </button>
            <button 
              onClick={() => setActiveTab('savings')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'savings' 
                  ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-glow-blue' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <PiggyBank className="h-4 w-4" />
              Savings Goals
            </button>
            <button 
              onClick={() => setActiveTab('insights')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'insights' 
                  ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-glow-blue' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              AI Insights
            </button>
            <button 
              onClick={() => setActiveTab('chatbot')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === 'chatbot' 
                  ? 'bg-blue-600/10 border border-blue-500/30 text-blue-400 shadow-glow-blue' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              Conversational AI
              <span className="absolute right-3 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
            </button>
          </nav>
        </div>

        {/* Logout button */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 mt-8 border border-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-950/20 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Disconnect Session
        </button>
      </aside>

      {/* Main page content area */}
      <main className="flex-1 p-6 md:p-8 md:pl-72 space-y-6">
        {/* Render Active view tab */}
        {activeTab === 'dashboard' && (
          <DashboardHome triggerRefresh={triggerRefresh} refreshCount={refreshCount} />
        )}
        {activeTab === 'analytics' && (
          <ExpenseAnalytics triggerRefresh={triggerRefresh} refreshCount={refreshCount} />
        )}
        {activeTab === 'savings' && (
          <SavingsDashboard triggerRefresh={triggerRefresh} refreshCount={refreshCount} />
        )}
        {activeTab === 'insights' && (
          <InsightsDashboard refreshCount={refreshCount} />
        )}
        {activeTab === 'chatbot' && (
          <div className="max-w-3xl mx-auto">
            <Chatbot triggerRefresh={triggerRefresh} refreshCount={refreshCount} />
          </div>
        )}
      </main>
    </div>
  );
}
