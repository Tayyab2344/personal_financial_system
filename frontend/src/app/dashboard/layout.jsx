'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../utils/api';
import { 
  LayoutDashboard, 
  PieChart, 
  PiggyBank, 
  Sparkles, 
  MessageSquare, 
  LogOut, 
  User,
  Activity,
  Settings,
  Table2
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/');
    } else {
      setUser(api.getUser());
      setLoading(false);
    }
  }, [router, pathname]);

  const handleLogout = () => {
    api.logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/analytics', label: 'Expense Analytics', icon: PieChart },
    { href: '/dashboard/ledger', label: 'Spreadsheet Ledger', icon: Table2 },
    { href: '/dashboard/savings', label: 'Savings Goals', icon: PiggyBank },
    { href: '/dashboard/insights', label: 'AI Insights', icon: Sparkles },
    { href: '/dashboard/chatbot', label: 'Conversational AI', icon: MessageSquare, hasPing: true },
    { href: '/dashboard/settings', label: 'System Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-darkBg text-gray-100 relative">
      {/* Sidebar Panel */}
      <aside className="w-full md:w-64 glass-card border-r border-white/10 flex flex-col justify-between p-5 md:fixed md:h-screen md:top-0 md:left-0 z-20">
        <div className="space-y-8">
          {/* Logo banner */}
          <Link href="/dashboard" className="flex items-center gap-2 pb-4 border-b border-white/5 cursor-pointer">
            <span className="p-2 bg-blue-600 rounded-lg text-white shadow-glow-blue"><Activity className="h-5 w-5 animate-pulse" /></span>
            <span className="font-black text-lg bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">FinGPT</span>
          </Link>

          {/* User profile card */}
          <div className="p-3 bg-gradient-to-br from-slate-900/80 to-slate-950/80 rounded-xl border border-white/5 flex items-center gap-3 shadow-md hover:border-purple-500/20 transition-all duration-300">
            <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/10 text-purple-400 border border-purple-500/30 rounded-lg shadow-inner">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-black text-white truncate">{user?.name || "Tayyab Atiq"}</h4>
              <p className="text-[10px] text-gray-400 font-semibold truncate leading-none mt-0.5">{user?.email || "ranatayyab941@gmail.com"}</p>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider font-black transition-all relative ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-600/15 to-purple-600/5 border border-blue-500/20 text-blue-400 shadow-glow-blue' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-md shadow-glow-blue"></span>
                  )}
                  <Icon className={`h-4.5 w-4.5 transition-transform duration-300 ${isActive ? 'scale-110 text-blue-400' : 'text-gray-500'}`} />
                  {item.label}
                  {item.hasPing && (
                    <span className="absolute right-3 w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping"></span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout button */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 mt-8 border border-red-500/20 text-red-400 rounded-xl text-xs uppercase tracking-wider font-black hover:bg-red-950/20 hover:border-red-500/40 transition-all cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5" />
          Disconnect Session
        </button>
      </aside>

      {/* Main page content area */}
      <main className="flex-1 p-6 md:p-8 md:pl-72 space-y-6">
        <div className="animate-fadeIn">
          {children}
        </div>
      </main>
    </div>
  );
}
