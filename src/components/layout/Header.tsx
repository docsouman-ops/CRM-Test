import React, { useState } from 'react';
import {
  RefreshCw,
  LogOut,
  UserCheck,
  Eye,
  X,
  Database,
  SunMedium,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCRM } from '../../context/CRMContext';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { Role } from '../../types';

export const Header: React.FC = () => {
  const { currentUser, realUser, effectiveRole, viewAsRole, setViewAs, logout, users } = useAuth();
  const { isSyncing, lastSynced, syncWithSheets, loadDemoData } = useCRM();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isAdmin = realUser?.role === 'admin';

  const roleLabels: Record<Role, string> = {
    admin: 'Administrator',
    backoffice: 'Back Office',
    telecaller: 'Telecaller',
    surveyor: 'Site Surveyor',
  };

  const formatLastSyncTime = (date: Date | null) => {
    if (!date) return 'Not synced';
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 10) return 'Synced just now';
    if (seconds < 60) return `Synced ${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `Synced ${minutes}m ago`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-xs">
      {/* View As Indicator Banner (when active) */}
      {viewAsRole && isAdmin && (
        <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between shadow-inner">
          <div className="flex items-center gap-1.5 truncate">
            <Eye className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              Viewing app as <strong>{roleLabels[viewAsRole]}</strong> ({currentUser?.name})
            </span>
          </div>
          <button
            onClick={() => setViewAs(null)}
            className="flex items-center gap-1 bg-amber-600/70 hover:bg-amber-600 px-2 py-0.5 rounded text-[11px] font-bold text-white transition active:scale-95 shrink-0 ml-2"
          >
            <span>Exit View</span>
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-[#1B7A4E] to-[#2E9D6B] flex items-center justify-center text-white shadow-xs shrink-0">
            <SunMedium className="w-5 h-5 text-amber-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate leading-tight">
                Green View Agrotech
              </span>
              <span className="hidden sm:inline-block text-[10px] bg-emerald-50 text-emerald-800 font-semibold px-1.5 py-0.5 rounded border border-emerald-200">
                PM Surya Ghar
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate leading-tight">
              Greening Your Life · CRM
            </p>
          </div>
        </div>

        {/* Right: Actions, Sync, View-as & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Sync indicator button */}
          <button
            onClick={() => syncWithSheets()}
            disabled={isSyncing}
            title="Click to sync now"
            className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 active:scale-95 transition text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`}
            />
            <span className="hidden md:inline font-medium text-[11px]">
              {isSyncing ? 'Syncing...' : formatLastSyncTime(lastSynced)}
            </span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton compact />

          {/* Admin "View As" Dropdown */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu((prev) => !prev)}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-medium border transition ${
                  viewAsRole
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title="Preview role view"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="hidden sm:inline">View as</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRoleMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                    <div className="px-3 py-1.5 border-b border-slate-100 font-semibold text-slate-500 text-[11px]">
                      SWITCH TEST VIEW
                    </div>

                    <button
                      onClick={() => {
                        setViewAs(null);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                        !viewAsRole ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>Admin (Full Access)</span>
                      {!viewAsRole && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>

                    <button
                      onClick={() => {
                        setViewAs('backoffice');
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                        viewAsRole === 'backoffice'
                          ? 'font-bold text-emerald-700 bg-emerald-50/50'
                          : 'text-slate-700'
                      }`}
                    >
                      <span>Back Office (Priyanka Sen)</span>
                      {viewAsRole === 'backoffice' && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                    </button>

                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                      Telecallers
                    </div>
                    {users
                      .filter((u) => u.role === 'telecaller')
                      .map((tc) => (
                        <button
                          key={tc.id}
                          onClick={() => {
                            setViewAs('telecaller', tc.id);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                            currentUser?.id === tc.id && viewAsRole === 'telecaller'
                              ? 'font-bold text-emerald-700 bg-emerald-50/50'
                              : 'text-slate-700'
                          }`}
                        >
                          <span className="truncate">{tc.name}</span>
                          {currentUser?.id === tc.id && viewAsRole === 'telecaller' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      ))}

                    <div className="px-3 py-1 text-[10px] font-semibold text-slate-400 uppercase">
                      Surveyors
                    </div>
                    {users
                      .filter((u) => u.role === 'surveyor')
                      .map((sv) => (
                        <button
                          key={sv.id}
                          onClick={() => {
                            setViewAs('surveyor', sv.id);
                            setShowRoleMenu(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-50 ${
                            currentUser?.id === sv.id && viewAsRole === 'surveyor'
                              ? 'font-bold text-emerald-700 bg-emerald-50/50'
                              : 'text-slate-700'
                          }`}
                        >
                          <span className="truncate">{sv.name}</span>
                          {currentUser?.id === sv.id && viewAsRole === 'surveyor' && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                        </button>
                      ))}

                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        loadDemoData();
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-emerald-700 font-semibold hover:bg-emerald-50 flex items-center gap-1.5"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>Reload Demo Data</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* User Profile / Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="flex items-center gap-1.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100/80 hover:bg-slate-100 transition active:scale-95"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[100px]">
                  {currentUser?.name || 'User'}
                </p>
                <p className="text-[10px] text-slate-500 capitalize leading-tight">
                  {roleLabels[effectiveRole] || effectiveRole}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <p className="font-bold text-slate-800 truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-slate-500">@{currentUser?.username}</p>
                    <p className="text-[10px] text-emerald-700 font-semibold capitalize mt-0.5">
                      {roleLabels[effectiveRole]}
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => {
                        loadDemoData();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Reset Demo Data</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-rose-600 font-medium hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
