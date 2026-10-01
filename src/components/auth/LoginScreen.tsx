import React, { useState } from 'react';
import {
  SunMedium,
  Lock,
  User,
  Shield,
  Briefcase,
  PhoneCall,
  Compass,
  ArrowRight,
  KeyRound,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

export const LoginScreen: React.FC = () => {
  const { login, changePassword, realUser } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forced password change modal state
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const res = await login(username, password);
    setIsLoading(false);

    if (!res.success) {
      setErrorMsg(res.message || 'Invalid login credentials');
    }
  };

  // Quick Demo Login Helper
  const handleQuickLogin = async (userRole: Role) => {
    setErrorMsg(null);
    setIsLoading(true);

    let u = 'admin';
    let p = 'admin123';

    if (userRole === 'backoffice') {
      u = 'backoffice';
      p = 'admin123';
    } else if (userRole === 'telecaller') {
      u = 'ananya';
      p = 'admin123';
    } else if (userRole === 'surveyor') {
      u = 'rajesh';
      p = 'admin123';
    }

    const res = await login(u, p);
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Quick login failed');
    }
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    const res = await changePassword(newPassword);
    if (res.success) {
      setShowPasswordChange(false);
    } else {
      setPasswordError(res.message || 'Failed to update password');
    }
  };

  // If realUser is logged in but mustChangePassword is true
  if (realUser && realUser.mustChangePassword) {
    return (
      <div className="min-h-screen bg-[#F8FAF9] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Change Default Password</h2>
            <p className="text-xs text-slate-500">
              For security, please update your initial administrator password before continuing.
            </p>
          </div>

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">New Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            {passwordError && (
              <p className="text-rose-600 font-semibold">{passwordError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition"
            >
              Set New Password & Enter CRM
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1B7A4E] to-[#2E9D6B] flex items-center justify-center text-white mx-auto shadow-md">
            <SunMedium className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Green View Agrotech
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-700">
              Greening Your Life · Rooftop Solar CRM
            </p>
            <span className="inline-block mt-1 text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
              PM Surya Ghar Yojana
            </span>
          </div>
        </div>

        {/* Login Form Box */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. admin"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl transition"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition min-h-[44px] flex items-center justify-center gap-1.5"
            >
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 text-center uppercase tracking-wider">
              Quick Test Logins (1-Click)
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold border border-purple-200 flex items-center gap-2 transition"
              >
                <Shield className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('backoffice')}
                className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-semibold border border-amber-200 flex items-center gap-2 transition"
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Back Office</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('telecaller')}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold border border-emerald-200 flex items-center gap-2 transition"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Telecaller</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('surveyor')}
                className="p-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-900 font-semibold border border-sky-200 flex items-center gap-2 transition"
              >
                <Compass className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                <span>Surveyor</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Green View Agrotech © 2026 · Confidential Internal CRM System
        </p>
      </div>
    </div>
  );
};
