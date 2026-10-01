import React, { useState } from 'react';
import {
  BarChart3,
  PhoneCall,
  Compass,
  CheckCircle2,
  Clock,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCallDuration } from '../../services/telephony';

export const AdminPerformance: React.FC = () => {
  const { users, campaigns, getTelecallerStats, getSurveyorStats } = useCRM();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('ALL');

  const telecallers = users.filter((u) => u.role === 'telecaller');
  const surveyors = users.filter((u) => u.role === 'surveyor');

  const timeFilterLabels = {
    today: 'Today',
    week: 'Last 7 Days',
    month: 'This Month',
    all: 'All Time',
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Header and Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            Performance Comparisons
          </h2>
          <p className="text-xs text-slate-500">
            Compare telecaller conversion and surveyor completion metrics
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          {(['today', 'week', 'month', 'all'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
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

      {/* Campaign Filter Pill Selector */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-800">Campaign Filter:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          <button
            onClick={() => setSelectedCampaign('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
              selectedCampaign === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Campaigns
          </button>
          {campaigns.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCampaign(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition ${
                selectedCampaign === c.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* TELECALLERS COMPARISON TABLE */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Telecallers Leaderboard & Quality Metrics
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Telecaller</th>
                <th className="py-2.5 px-3">Assigned</th>
                <th className="py-2.5 px-3">Calls Made</th>
                <th className="py-2.5 px-3">Connected %</th>
                <th className="py-2.5 px-3">Confirmed</th>
                <th className="py-2.5 px-3">Conversion %</th>
                <th className="py-2.5 px-3">Avg Talk Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {telecallers.map((tc) => {
                const stats = getTelecallerStats(tc.id, timeFilter, selectedCampaign);
                return (
                  <tr key={tc.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{tc.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">@{tc.username}</p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{stats.assignedCount}</td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{stats.calledCount}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-sky-700">{stats.connectedRate}%</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {stats.confirmedCount}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-amber-700">{stats.conversionRate}%</span>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {formatCallDuration(stats.avgCallDuration)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SURVEYORS COMPARISON TABLE */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-sky-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            Field Surveyors Productivity
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-3">Surveyor</th>
                <th className="py-2.5 px-3">Assigned Visits</th>
                <th className="py-2.5 px-3">Completed</th>
                <th className="py-2.5 px-3">Currently Scheduled</th>
                <th className="py-2.5 px-3">Completion Ratio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {surveyors.map((sv) => {
                const stats = getSurveyorStats(sv.id, selectedCampaign);
                return (
                  <tr key={sv.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-900">{sv.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">@{sv.username}</p>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700">{stats.assignedCount}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {stats.completedCount}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-sky-700">{stats.scheduledCount}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-amber-700">{stats.completionRate}%</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
