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
  Eye,
  EyeOff,
  Sparkles,
  Database,
  Check,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface LoginScreenProps {
  onOpenSetup?: () => void;
}

interface DemoAccount {
  role: Role;
  label: string;
  name: string;
  username: string;
  password: string;
  badge: string;
  colorClass: string;
  borderClass: string;
  bgLightClass: string;
  icon: React.ElementType;
  keyFeatures: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: 'admin',
    label: 'Administrator',
    name: 'Debashis Mukherjee',
    username: 'admin',
    password: 'admin123',
    badge: 'Full Access',
    colorClass: 'text-purple-700',
    borderClass: 'border-purple-200 hover:border-purple-400',
    bgLightClass: 'bg-purple-50/70',
    icon: Shield,
    keyFeatures: 'Campaigns sheet feeds, Add leads, Team passwords, Settings, Analytics',
  },
  {
    role: 'backoffice',
    label: 'Back Office (Ops)',
    name: 'Priyanka Sen',
    username: 'backoffice',
    password: 'admin123',
    badge: 'Operations',
    colorClass: 'text-amber-700',
    borderClass: 'border-amber-200 hover:border-amber-400',
    bgLightClass: 'bg-amber-50/70',
    icon: Briefcase,
    keyFeatures: 'Assign surveyors to confirmed leads, Track visit schedules, Add leads',
  },
  {
    role: 'telecaller',
    label: 'Telecaller',
    name: 'Ananya Roy',
    username: 'ananya',
    password: 'admin123',
    badge: 'Calling Queue',
    colorClass: 'text-emerald-700',
    borderClass: 'border-emerald-200 hover:border-emerald-400',
    bgLightClass: 'bg-emerald-50/70',
    icon: PhoneCall,
    keyFeatures: '1-Click call button, 23-point Solar checklist, Scheduled follow-ups',
  },
  {
    role: 'surveyor',
    label: 'Site Surveyor',
    name: 'Rajesh Karmakar',
    username: 'rajesh',
    password: 'admin123',
    badge: 'Field Visits',
    colorClass: 'text-sky-700',
    borderClass: 'border-sky-200 hover:border-sky-400',
    bgLightClass: 'bg-sky-50/70',
    icon: Compass,
    keyFeatures: 'Assigned customer locations, 23-point Solar checklist review, Feasibility',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onOpenSetup }) => {
  const { login, changePassword, realUser } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedUser, setCopiedUser] = useState<string | null>(null);

  // Forced password change modal state
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

  // Instant 1-Tap Login
  const handleQuickLogin = async (acc: DemoAccount) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setErrorMsg(null);
    setIsLoading(true);

    const res = await login(acc.username, acc.password);
    setIsLoading(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Quick login failed');
    }
  };

  const handleCopyCredentials = (u: string, p: string) => {
    navigator.clipboard.writeText(`User: ${u}\nPass: ${p}`);
    setCopiedUser(u);
    setTimeout(() => setCopiedUser(null), 2500);
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
    if (!res.success) {
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
            <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
            <p className="text-xs text-slate-500">
              Please enter your new password to enter the CRM.
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
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-lg space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1B7A4E] to-[#2E9D6B] flex items-center justify-center text-white mx-auto shadow-md">
            <SunMedium className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              Green View Agrotech
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-700">
              Greening Your Life · Rooftop Solar CRM
            </p>
            <div className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>PM Surya Ghar Muft Bijli Yojana</span>
            </div>
          </div>
        </div>

        {/* 1-Tap Quick Demo Logins Section */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80 space-y-3.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Client Demo: 1-Tap Role Login</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Tap any role to immediately evaluate its specific dashboard and tools
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const IconComp = acc.icon;
              return (
                <div
                  key={acc.role}
                  className={`p-3 rounded-2xl border transition-all duration-150 flex flex-col justify-between gap-2.5 ${acc.borderClass} ${acc.bgLightClass} hover:shadow-xs`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white shadow-2xs flex items-center justify-center shrink-0">
                        <IconComp className={`w-4 h-4 ${acc.colorClass}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 leading-tight truncate">
                          {acc.label}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{acc.name}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/90 text-slate-600 border border-slate-200/60 shrink-0">
                      {acc.badge}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-600 leading-tight">
                    {acc.keyFeatures}
                  </p>

                  <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/50">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickLogin(acc)}
                      className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs min-h-[36px]"
                    >
                      <span>Login as {acc.role.toUpperCase()}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      title="Copy credentials"
                      onClick={() => handleCopyCredentials(acc.username, acc.password)}
                      className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 transition shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      {copiedUser === acc.username ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Manual Login Form */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Manual Sign In
            </h3>
            <span className="text-[11px] text-slate-400">Default Password: <strong>admin123</strong></span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username / ID</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin, backoffice, ananya, rajesh"
                  className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
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
              <span>{isLoading ? 'Signing In...' : 'Sign In to Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Optional Database Setup Link */}
          {onOpenSetup && (
            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={onOpenSetup}
                className="text-[11px] text-slate-500 hover:text-emerald-700 font-semibold inline-flex items-center gap-1.5 transition"
              >
                <Database className="w-3.5 h-3.5 text-emerald-600" />
                <span>Connect Google Sheets Database (Optional)</span>
              </button>
            </div>
          )}
        </div>

        {/* Credentials Cheatsheet for Client Review */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 text-[11px] text-slate-600 space-y-2">
          <p className="font-bold text-slate-800 flex items-center justify-between">
            <span>Demo Credentials Summary</span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">All passwords: admin123</span>
          </p>
          <div className="divide-y divide-slate-100 text-[10px]">
            <div className="py-1 flex items-center justify-between">
              <span><strong>Admin:</strong> ID: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">admin</code></span>
              <span className="text-slate-500">Campaigns, Add Leads, Team, Leaderboard</span>
            </div>
            <div className="py-1 flex items-center justify-between">
              <span><strong>Back Office:</strong> ID: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">backoffice</code></span>
              <span className="text-slate-500">Confirmed Queue, Surveyor Assignment</span>
            </div>
            <div className="py-1 flex items-center justify-between">
              <span><strong>Telecaller:</strong> ID: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">ananya</code></span>
              <span className="text-slate-500">Lead Queue, 1-Click Call, 23 Questions</span>
            </div>
            <div className="py-1 flex items-center justify-between">
              <span><strong>Surveyor:</strong> ID: <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">rajesh</code></span>
              <span className="text-slate-500">Today's Visits, Solar Feasibility</span>
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
