import React, { useState, useEffect, useMemo } from 'react';
import {
  PhoneCall,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Flame,
  PhoneForwarded,
  Filter,
  Play,
  Square,
  Sparkles,
  ClipboardList,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types';
import { LeadCard } from '../leads/LeadCard';
import { CallTimerSheet } from './CallTimerSheet';
import { ChecklistModal } from './ChecklistModal';
import { LeadDetailModal } from '../leads/LeadDetailModal';
import { telephonyService, formatCallDuration } from '../../services/telephony';

export const TelecallerHome: React.FC<{ activeSubTab?: string }> = ({ activeSubTab = 'myleads' }) => {
  const { currentUser } = useAuth();
  const { leads, checklistQuestions, logCall, updateChecklist } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'followup' | 'confirmed'>('all');

  // Active call tracking state
  const [activeCallingLead, setActiveCallingLead] = useState<Lead | null>(null);
  const [callConnectionState, setCallConnectionState] = useState<'connecting' | 'connected'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [showLogCallSheet, setShowLogCallSheet] = useState(false);
  const [selectedLeadForLog, setSelectedLeadForLog] = useState<Lead | null>(null);

  // Modals
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [selectedLeadForChecklist, setSelectedLeadForChecklist] = useState<Lead | null>(null);

  // Only leads assigned to current telecaller
  const myLeads = useMemo(() => {
    if (!currentUser) return [];
    return leads.filter((l) => l.assignedTelecallerId === currentUser.id);
  }, [leads, currentUser]);

  // Today's Follow-ups
  const todayStr = new Date().toISOString().split('T')[0];
  const todayFollowUps = useMemo(() => {
    return myLeads.filter(
      (l) =>
        (l.status === 'FOLLOW_UP' || l.status === 'CALL_LATER') &&
        (!l.callbackDate || l.callbackDate <= todayStr)
    );
  }, [myLeads, todayStr]);

  // Today's counts
  const todayCounts = useMemo(() => {
    const assigned = myLeads.length;
    const confirmed = myLeads.filter((l) => l.status === 'CONFIRMED').length;
    const followUps = myLeads.filter((l) => l.status === 'FOLLOW_UP' || l.status === 'CALL_LATER').length;
    const called = myLeads.filter((l) => (l.callAttempts || 0) > 0).length;

    return { assigned, called, confirmed, followUps };
  }, [myLeads]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return myLeads.filter((lead) => {
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesPhone = lead.phone.includes(q);
        const matchesCampaign = lead.campaign.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesCampaign) return false;
      }

      // Status chip filter
      if (statusFilter === 'new') {
        return lead.status === 'HOT' || !lead.callAttempts || lead.callAttempts === 0;
      }
      if (statusFilter === 'followup') {
        return lead.status === 'FOLLOW_UP' || lead.status === 'CALL_LATER';
      }
      if (statusFilter === 'confirmed') {
        return lead.status === 'CONFIRMED';
      }

      return true;
    });
  }, [myLeads, searchQuery, statusFilter]);

  // Handle Call Button Tap - Automatically connects and starts call tracking
  const handleInitiateCall = (lead: Lead) => {
    setActiveCallingLead(lead);
    setCallConnectionState('connecting');
    setCallDuration(0);

    // Start in-app call timer
    telephonyService.startCallTracking(lead.id, lead.phone, (seconds) => {
      setCallDuration(seconds);
    });

    // Automatically transition to connected within 1 second
    setTimeout(() => {
      setCallConnectionState('connected');
    }, 1000);

    // Safely trigger phone dialer without breaking iframe/page context
    const cleanPhone = lead.phone.replace(/\D/g, '');
    const telLink = document.createElement('a');
    telLink.href = `tel:+91${cleanPhone}`;
    telLink.rel = 'noopener noreferrer';
    telLink.click();
  };

  // End Call & Open Log Sheet
  const handleEndCall = () => {
    const { elapsedSeconds } = telephonyService.stopCallTracking();
    if (activeCallingLead) {
      setSelectedLeadForLog(activeCallingLead);
      setCallDuration(elapsedSeconds > 0 ? elapsedSeconds : callDuration);
      setShowLogCallSheet(true);
      setActiveCallingLead(null);
      setCallConnectionState('connecting');
    }
  };

  // Handle log call submission
  const handleLogCallSubmit = async (data: any) => {
    if (selectedLeadForLog) {
      await logCall(selectedLeadForLog.id, data);
      setShowLogCallSheet(false);
      setSelectedLeadForLog(null);
    }
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Floating Active Call Banner when in a call */}
      {activeCallingLead && (
        <div className="sticky top-15 sm:top-17 z-30 bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-4 border-2 border-emerald-500">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${callConnectionState === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-ping'}`} />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/40">
                  {callConnectionState === 'connected' ? 'Connected • Talking' : 'Connecting Call...'}
                </span>
                <p className="text-xs sm:text-sm font-bold truncate">
                  {activeCallingLead.name} (+91 {activeCallingLead.phone})
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-300">
                <span className="font-mono font-bold text-emerald-300 text-sm">
                  {formatCallDuration(callDuration)}
                </span>
                <span>·</span>
                <span className="truncate">{activeCallingLead.campaign}</span>
                {activeCallingLead.notes && (
                  <>
                    <span>·</span>
                    <span className="italic truncate max-w-[200px]">"{activeCallingLead.notes}"</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Direct Checklist access during call */}
            <button
              type="button"
              onClick={() => setSelectedLeadForChecklist(activeCallingLead)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/40 font-bold text-xs rounded-xl transition min-h-[44px]"
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Fill Checklist</span>
            </button>

            {/* End Call & Log button */}
            <button
              onClick={handleEndCall}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition shrink-0 min-h-[44px]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>End Call & Log</span>
            </button>
          </div>
        </div>
      )}

      {/* Today's Counts Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Assigned</span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{todayCounts.assigned}</p>
          <span className="text-[10px] text-slate-400">Total in queue</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Called</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{todayCounts.called}</p>
          <span className="text-[10px] text-slate-400">Attempted today</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-800">{todayCounts.confirmed}</p>
          <span className="text-[10px] text-emerald-600 font-medium">Surveys agreed</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Follow-ups</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-800">{todayCounts.followUps}</p>
          <span className="text-[10px] text-blue-600 font-medium">Due callbacks</span>
        </div>
      </div>

      {/* TODAY'S FOLLOW-UPS (Pinned Section at the top as requested) */}
      {todayFollowUps.length > 0 && (
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                {todayFollowUps.length}
              </div>
              <h2 className="text-sm font-bold text-blue-950">Today's Follow-ups</h2>
            </div>
            <span className="text-[11px] text-blue-700 font-medium">Scheduled for today</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {todayFollowUps.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onCall={handleInitiateCall}
                onOpenChecklist={(l) => setSelectedLeadForChecklist(l)}
                onSelect={(l) => setSelectedLeadForDetail(l)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Chips Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer name, phone, or campaign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl transition placeholder:text-slate-400"
          />
        </div>

        {/* Filter Chips (New, Follow-up, Confirmed, All) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition min-h-[44px] ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Leads ({myLeads.length})
          </button>
          <button
            onClick={() => setStatusFilter('new')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition min-h-[44px] ${
              statusFilter === 'new'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            New / Hot Leads
          </button>
          <button
            onClick={() => setStatusFilter('followup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition min-h-[44px] ${
              statusFilter === 'followup'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Follow-up
          </button>
          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition min-h-[44px] ${
              statusFilter === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Confirmed
          </button>
        </div>
      </div>

      {/* Main Leads List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Assigned Queue ({filteredLeads.length})
          </h2>
          <span className="text-[11px] text-slate-400">Tap Call to dial & start timer</span>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <PhoneCall className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No leads match your filter</p>
            <p className="text-xs text-slate-400 mt-1">
              Try switching your filter chip or clearing the search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLeads.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onCall={handleInitiateCall}
                onOpenChecklist={(l) => setSelectedLeadForChecklist(l)}
                onSelect={(l) => setSelectedLeadForDetail(l)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Call Timer Sheet Modal */}
      {selectedLeadForLog && (
        <CallTimerSheet
          lead={selectedLeadForLog}
          initialDuration={callDuration}
          isOpen={showLogCallSheet}
          onClose={() => {
            setShowLogCallSheet(false);
            setSelectedLeadForLog(null);
          }}
          onSubmit={handleLogCallSubmit}
        />
      )}

      {/* 23 Questions Checklist Modal */}
      {selectedLeadForChecklist && (
        <ChecklistModal
          lead={selectedLeadForChecklist}
          questions={checklistQuestions}
          isOpen={Boolean(selectedLeadForChecklist)}
          onClose={() => setSelectedLeadForChecklist(null)}
          onSave={(answers) => {
            updateChecklist(selectedLeadForChecklist.id, answers);
          }}
        />
      )}

      {/* Lead Detail View Modal */}
      {selectedLeadForDetail && (
        <LeadDetailModal
          lead={selectedLeadForDetail}
          questions={checklistQuestions}
          isOpen={Boolean(selectedLeadForDetail)}
          onClose={() => setSelectedLeadForDetail(null)}
          onStartCall={handleInitiateCall}
          onOpenChecklist={(l) => setSelectedLeadForChecklist(l)}
        />
      )}
    </div>
  );
};
