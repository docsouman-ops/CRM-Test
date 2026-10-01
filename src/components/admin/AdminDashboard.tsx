import React, { useState, useMemo } from 'react';
import {
  Users,
  PhoneCall,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
  Flame,
  ArrowRight,
  SunMedium,
  Globe,
  Database,
  BarChart3,
  Calendar,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { DateRangeBar } from '../common/DateRangeBar';
import { DateRangeFilterState, isDateWithinRange } from '../../utils/dateFilter';
import { AllCallStatusesBreakdown } from './AllCallStatusesBreakdown';

export const AdminDashboard: React.FC<{
  onNavigate: (tabId: string, filterParams?: any) => void;
}> = ({ onNavigate }) => {
  const { leads, users, campaigns, getTelecallerStats } = useCRM();

  // Date Range Filter State
  const [dateRange, setDateRange] = useState<DateRangeFilterState>({
    preset: 'all',
    startDate: '',
    endDate: '',
  });

  // Campaign Filter State
  const [selectedCampaign, setSelectedCampaign] = useState<string>('ALL');

  // Filter leads based on selected date range and campaign
  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (!isDateWithinRange(l.createdAt, dateRange)) return false;
      if (selectedCampaign !== 'ALL') {
        const matches = l.campaignId === selectedCampaign || l.campaign === selectedCampaign;
        if (!matches) return false;
      }
      return true;
    });
  }, [leads, dateRange, selectedCampaign]);

  // Metrics based on filtered leads
  const totalLeads = filteredLeads.length;

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLeads = useMemo(() => {
    return filteredLeads.filter((l) => l.createdAt.startsWith(todayStr)).length;
  }, [filteredLeads, todayStr]);

  // By Source
  const sourceBreakdown = useMemo(() => {
    const meta = filteredLeads.filter((l) => l.source === 'Meta').length;
    const google = filteredLeads.filter((l) => l.source === 'Google').length;
    const manual = filteredLeads.filter((l) => l.source === 'Manual').length;
    return { meta, google, manual };
  }, [filteredLeads]);

  // Conversion Funnel: New > Called > Confirmed > Survey Done
  const funnel = useMemo(() => {
    const step1New = filteredLeads.length;
    const step2Called = filteredLeads.filter((l) => (l.callAttempts || 0) > 0 || l.callHistory?.length).length;
    const step3Confirmed = filteredLeads.filter((l) => l.status === 'CONFIRMED').length;
    const step4SurveyDone = filteredLeads.filter((l) => l.surveyStatus === 'Completed').length;

    const rateCalled = step1New > 0 ? Math.round((step2Called / step1New) * 100) : 0;
    const rateConfirmed = step1New > 0 ? Math.round((step3Confirmed / step1New) * 100) : 0;
    const rateSurveyDone = step1New > 0 ? Math.round((step4SurveyDone / step1New) * 100) : 0;

    return {
      step1New,
      step2Called,
      step3Confirmed,
      step4SurveyDone,
      rateCalled,
      rateConfirmed,
      rateSurveyDone,
    };
  }, [filteredLeads]);

  // Telecaller Leaderboard
  const telecallerLeaderboard = useMemo(() => {
    const tcs = users.filter((u) => u.role === 'telecaller');
    return tcs
      .map((tc) => getTelecallerStats(tc.id, 'all'))
      .sort((a, b) => b.confirmedCount - a.confirmedCount);
  }, [users, getTelecallerStats]);

  const handleStatusCardClick = (status: string) => {
    onNavigate('leads');
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Date Range Filter Bar */}
      <DateRangeBar value={dateRange} onChange={setDateRange} />

      {/* Campaign Filter Selector */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">Campaign Filter:</span>
          {selectedCampaign !== 'ALL' && (
            <button
              onClick={() => setSelectedCampaign('ALL')}
              className="text-[11px] text-emerald-700 font-bold hover:underline"
            >
              Reset to All
            </button>
          )}
        </div>

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
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition flex items-center gap-1.5 ${
                selectedCampaign === c.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="truncate max-w-[150px]">{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Total Leads</span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900">{totalLeads}</p>
          <span className="text-[10px] text-slate-400">In selected period</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Today's Leads</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-700">{todayLeads}</p>
          <span className="text-[10px] text-amber-600 font-medium">New enquiries today</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Confirmed Surveys</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-800">{funnel.step3Confirmed}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Ready for site survey</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">Surveys Done</span>
            <CalendarCheck className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-800">{funnel.step4SurveyDone}</p>
          <span className="text-[10px] text-sky-600 font-medium">Verified feasibility</span>
        </div>
      </div>

      {/* ALL CALL STATUSES (19 STATUSES) OVERVIEW */}
      <AllCallStatusesBreakdown
        leads={filteredLeads}
        onSelectStatus={handleStatusCardClick}
      />

      {/* LEAD SOURCE BREAKDOWN (Meta vs Google) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Lead Source Channels
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Meta Ads vs Google Ads
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-900">Meta (Facebook / Instagram)</p>
              <p className="text-2xl font-bold text-blue-950 mt-0.5">{sourceBreakdown.meta}</p>
              <p className="text-[10px] text-blue-700 font-medium">
                {totalLeads > 0 ? Math.round((sourceBreakdown.meta / totalLeads) * 100) : 0}% of total leads
              </p>
            </div>
            <Globe className="w-8 h-8 text-blue-500/30" />
          </div>

          <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-900">Google Search Ads</p>
              <p className="text-2xl font-bold text-rose-950 mt-0.5">{sourceBreakdown.google}</p>
              <p className="text-[10px] text-rose-700 font-medium">
                {totalLeads > 0 ? Math.round((sourceBreakdown.google / totalLeads) * 100) : 0}% of total leads
              </p>
            </div>
            <Globe className="w-8 h-8 text-rose-500/30" />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-700">Direct / Manual Entry</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{sourceBreakdown.manual}</p>
              <p className="text-[10px] text-slate-500 font-medium">Walk-ins & references</p>
            </div>
            <SunMedium className="w-8 h-8 text-slate-400/30" />
          </div>
        </div>
      </div>

      {/* CONVERSION FUNNEL (New > Called > Confirmed > Survey Done) */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Sales & Survey Conversion Funnel
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
          {/* Step 1: New */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-semibold">1. Total New</span>
                <span className="text-[11px] font-bold">100%</span>
              </div>
              <p className="text-xl font-bold text-slate-900">{funnel.step1New}</p>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-slate-700 h-full w-full" />
            </div>
          </div>

          {/* Step 2: Called */}
          <div className="p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-sky-800 mb-1">
                <span className="font-semibold">2. Called</span>
                <span className="text-[11px] font-bold">{funnel.rateCalled}%</span>
              </div>
              <p className="text-xl font-bold text-sky-950">{funnel.step2Called}</p>
            </div>
            <div className="w-full bg-sky-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-sky-600 h-full rounded-full transition-all"
                style={{ width: `${funnel.rateCalled}%` }}
              />
            </div>
          </div>

          {/* Step 3: Confirmed */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-amber-800 mb-1">
                <span className="font-semibold">3. Confirmed</span>
                <span className="text-[11px] font-bold">{funnel.rateConfirmed}%</span>
              </div>
              <p className="text-xl font-bold text-amber-950">{funnel.step3Confirmed}</p>
            </div>
            <div className="w-full bg-amber-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full transition-all"
                style={{ width: `${funnel.rateConfirmed}%` }}
              />
            </div>
          </div>

          {/* Step 4: Survey Done */}
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-emerald-800 mb-1">
                <span className="font-semibold">4. Survey Done</span>
                <span className="text-[11px] font-bold">{funnel.rateSurveyDone}%</span>
              </div>
              <p className="text-xl font-bold text-emerald-950">{funnel.step4SurveyDone}</p>
            </div>
            <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all"
                style={{ width: `${funnel.rateSurveyDone}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TELECALLER LEADERBOARD */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Telecaller Leaderboard
          </h2>
          <button
            onClick={() => onNavigate('performance')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
          >
            <span>Full Comparisons</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {telecallerLeaderboard.map((tc, idx) => (
            <div
              key={tc.telecallerId}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 h-6 rounded-full font-bold flex items-center justify-center text-xs ${
                    idx === 0
                      ? 'bg-amber-400 text-amber-950'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {idx + 1}
                </span>
                <div>
                  <p className="font-bold text-slate-800">{tc.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {tc.calledCount} calls made · {tc.connectedRate}% connected
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-bold text-emerald-800 text-sm">
                  {tc.confirmedCount} Confirmed
                </span>
                <p className="text-[11px] text-slate-500 font-medium">
                  {tc.conversionRate}% conversion
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
