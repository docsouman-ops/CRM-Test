import React, { useState } from 'react';
import {
  BarChart3,
  PhoneCall,
  CheckCircle2,
  Clock,
  TrendingUp,
  Percent,
  Calendar,
  Flame,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { formatCallDuration } from '../../services/telephony';

export const TelecallerPerformance: React.FC = () => {
  const { currentUser } = useAuth();
  const { getTelecallerStats, calls } = useCRM();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');

  const stats = currentUser ? getTelecallerStats(currentUser.id, timeFilter) : null;

  if (!stats) return null;

  const timeFilterLabels = {
    today: 'Today',
    week: 'Last 7 Days',
    month: 'This Month',
    all: 'All Time',
  };

  // Recent calls made by current user
  const recentCalls = calls
    .filter((c) => c.telecallerId === currentUser?.id)
    .slice(0, 10);

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Time Filter Tabs */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200/90 shadow-2xs">
        <span className="text-xs font-bold text-slate-700 px-2">Time Period:</span>
        <div className="flex items-center gap-1">
          {(['today', 'week', 'month', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition min-h-[44px] ${
                timeFilter === t
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {timeFilterLabels[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Calls Made */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Calls Made</span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.calledCount}</p>
          <span className="text-[10px] text-slate-400">Total dials logged</span>
        </div>

        {/* Connected Rate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Connected Rate</span>
            <TrendingUp className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-800">{stats.connectedRate}%</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.connectedRate}%` }}
            />
          </div>
        </div>

        {/* Confirmations */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Confirmations</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-800">{stats.confirmedCount}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Site surveys booked</span>
        </div>

        {/* Conversion Rate */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-semibold">Conversion %</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-800">{stats.conversionRate}%</p>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.conversionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Average Call Duration & Quality Metrics */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Call Time & Efficiency
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Average Talk Time</p>
              <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                {formatCallDuration(stats.avgCallDuration)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-emerald-600/30" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Total Talk Time</p>
              <p className="text-xl font-bold text-slate-900 font-mono mt-0.5">
                {Math.round(stats.totalCallTime / 60)} mins
              </p>
            </div>
            <PhoneCall className="w-8 h-8 text-sky-600/30" />
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Recent Call Logs ({recentCalls.length})
        </h3>

        {recentCalls.length === 0 ? (
          <p className="text-xs text-slate-400 py-3 text-center">No recent calls recorded.</p>
        ) : (
          <div className="space-y-2">
            {recentCalls.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-slate-800">{c.leadName || 'Customer'}</p>
                  <p className="text-[11px] text-slate-500 font-mono">+91 {c.phone}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded text-[11px]">
                    {c.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatCallDuration(c.duration)} · {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
