'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../utils/api';
import { Activity, Lock, Mail, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      router.replace('/dashboard');
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

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
        await api.login(email, password);
      } else {
        await api.register(name, email, password);
      }
      setName('');
      setEmail('');
      setPassword('');
      router.push('/dashboard');
    } catch (err) {
      setAuthError(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setAuthLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-darkBg text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
            <span className="gradient-title">FinGPT</span>
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

          {isLogin && (
            <div className="mt-6 pt-4 border-t border-white/5 text-center text-[10px] text-gray-500 leading-relaxed">
              💡 **Clean Slate Mode**: Register a new account to begin tracking your personal finances from Rs. 0.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
