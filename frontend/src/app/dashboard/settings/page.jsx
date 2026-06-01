'use client';

import React, { useState } from 'react';
import { api } from '../../../utils/api';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle,
  Activity
} from 'lucide-react';

export default function SystemSettings() {
  // Password States
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ text: '', type: '' }); // success or danger

  // Reset Data States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStatus, setResetStatus] = useState({ text: '', type: '' });

  const handlePasswordChangeSubmit = async (e) => {
    e.preventDefault();
    setPasswordStatus({ text: '', type: '' });

    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordStatus({ text: 'All fields are required.', type: 'danger' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordStatus({ text: 'New password must be at least 6 characters long.', type: 'danger' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ text: 'New passwords do not match.', type: 'danger' });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(oldPassword, newPassword);
      setPasswordStatus({ text: 'Password changed successfully!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordStatus({ text: err.message || 'Failed to update password. Verify your current password.', type: 'danger' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResetDataSubmit = async () => {
    if (resetConfirmationText.toLowerCase() !== 'reset') {
      setResetStatus({ text: 'Please type "RESET" to confirm.', type: 'danger' });
      return;
    }

    setResetStatus({ text: '', type: '' });
    setResetLoading(true);
    try {
      await api.resetData();
      setResetStatus({ text: 'All financial data successfully cleared.', type: 'success' });
      setShowResetModal(false);
      setResetConfirmationText('');
      // Trigger a session refresh or redirect
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setResetStatus({ text: err.message || 'Failed to reset all financial data.', type: 'danger' });
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">System Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your account credentials and personal financial records</p>
      </div>

      {/* Grid of panels */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Change Password Card */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-white/5">
            <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Change Password</h3>
              <p className="text-xs text-gray-400">Secure your digital vault with a new secret key</p>
            </div>
          </div>

          {passwordStatus.text && (
            <div className={`p-3 rounded-lg flex items-start gap-2 border text-xs font-semibold ${
              passwordStatus.type === 'success' 
                ? 'bg-green-950/20 border-green-800/30 text-green-400' 
                : 'bg-red-950/20 border-red-800/30 text-red-400'
            }`}>
              {passwordStatus.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>{passwordStatus.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
            {/* Old Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input 
                  type={showOldPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full glass-input pl-10 pr-10 py-2 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input 
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full glass-input pl-10 pr-10 py-2 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">Confirm New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input 
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full glass-input pl-10 pr-10 py-2 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={passwordLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-gray-500 text-white rounded-xl font-bold text-sm transition-all shadow-glow-blue flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {passwordLoading && <Activity className="h-4 w-4 animate-spin" />}
              {passwordLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* Danger Zone Card */}
        <div className="glass-card p-6 rounded-2xl border border-red-500/10 space-y-4 bg-gradient-to-br from-slate-900/60 via-red-950/5 to-slate-900/40">
          <div className="flex items-center gap-2.5 pb-3 border-b border-red-500/15">
            <div className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-400">Danger Zone</h3>
              <p className="text-xs text-gray-400">Permanent and destructive operations</p>
            </div>
          </div>

          <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-300 rounded-lg text-xs leading-relaxed flex gap-2">
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <span>
              Wiping your financial vault removes all incomes, expenses, budgets, saving goals, and chat history. This action **cannot be undone**. Your account details will remain active.
            </span>
          </div>

          {resetStatus.text && (
            <div className={`p-3 rounded-lg flex items-start gap-2 border text-xs font-semibold ${
              resetStatus.type === 'success' 
                ? 'bg-green-950/20 border-green-800/30 text-green-400' 
                : 'bg-red-950/20 border-red-800/30 text-red-400'
            }`}>
              {resetStatus.type === 'success' ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <span>{resetStatus.text}</span>
            </div>
          )}

          <div className="pt-2">
            <button 
              type="button" 
              onClick={() => setShowResetModal(true)}
              className="w-full py-2.5 bg-red-700/20 hover:bg-red-700/35 border border-red-500/40 text-red-300 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="h-4.5 w-4.5" />
              Reset All Financial Data
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-filter backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="glass-card max-w-md w-full p-6 rounded-2xl border border-red-500/20 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="h-8 w-8 text-red-400 animate-bounce" />
              <div>
                <h3 className="text-xl font-black text-white">Confirm Total Reset</h3>
                <p className="text-xs text-gray-400">Irreversible Action Required</p>
              </div>
            </div>

            <p className="text-sm text-gray-300 leading-relaxed">
              Are you absolutely sure you want to delete all transaction records, budgets, and savings goals? All charts will be reset to Rs. 0.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-400">Type <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded font-mono">RESET</span> to confirm:</label>
              <input 
                type="text" 
                placeholder="RESET"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                className="w-full glass-input px-3 py-2 text-sm text-center tracking-widest font-bold uppercase"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => { setShowResetModal(false); setResetConfirmationText(''); setResetStatus({ text: '', type: '' }); }}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-xl text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleResetDataSubmit}
                disabled={resetLoading || resetConfirmationText.toLowerCase() !== 'reset'}
                className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-900 disabled:text-gray-600 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {resetLoading && <Activity className="h-3.5 w-3.5 animate-spin" />}
                Wipe Vault Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
