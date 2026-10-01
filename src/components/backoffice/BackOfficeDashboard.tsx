import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  CalendarCheck,
  UserCheck,
  Compass,
  PhoneCall,
  Clock,
  MapPin,
  ClipboardList,
  AlertCircle,
  Search,
  ExternalLink,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types';
import { LeadDetailModal } from '../leads/LeadDetailModal';

export const BackOfficeDashboard: React.FC<{ activeSubTab?: string }> = ({
  activeSubTab = 'confirmed',
}) => {
  const { leads, users } = useCRM();
  const { assignSurveyor, checklistQuestions, getTelecallerStats, getSurveyorStats } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [assigningLeadId, setAssigningLeadId] = useState<string | null>(null);
  const [selectedSurveyorId, setSelectedSurveyorId] = useState<string>('');

  // Active surveyors
  const surveyors = useMemo(() => {
    return users.filter((u) => u.role === 'surveyor' && u.active);
  }, [users]);

  // Active telecallers
  const telecallers = useMemo(() => {
    return users.filter((u) => u.role === 'telecaller' && u.active);
  }, [users]);

  // Compute workload (# of currently scheduled/pending surveys) for each surveyor
  const surveyorWorkloadMap = useMemo(() => {
    const map: Record<string, number> = {};
    surveyors.forEach((s) => (map[s.id] = 0));
    leads.forEach((l) => {
      if (l.assignedSurveyorId && (l.surveyStatus === 'Scheduled' || l.surveyStatus === 'Pending')) {
        map[l.assignedSurveyorId] = (map[l.assignedSurveyorId] || 0) + 1;
      }
    });
    return map;
  }, [leads, surveyors]);

  // Confirmed leads
  const confirmedLeads = useMemo(() => {
    return leads.filter((l) => l.status === 'CONFIRMED');
  }, [leads]);

  // Awaiting assignment (no assigned surveyor or surveyStatus === 'Pending')
  const awaitingAssignment = useMemo(() => {
    return confirmedLeads.filter((l) => !l.assignedSurveyorId || l.surveyStatus === 'Pending');
  }, [confirmedLeads]);

  // Already assigned surveys
  const assignedSurveys = useMemo(() => {
    return confirmedLeads.filter((l) => l.assignedSurveyorId && l.surveyStatus !== 'Completed');
  }, [confirmedLeads]);

  // Completed surveys
  const completedSurveys = useMemo(() => {
    return confirmedLeads.filter((l) => l.surveyStatus === 'Completed');
  }, [confirmedLeads]);

  // Handle assigning surveyor
  const handleAssignSubmit = async (leadId: string) => {
    if (!selectedSurveyorId) return;
    const surveyor = surveyors.find((s) => s.id === selectedSurveyorId);
    if (!surveyor) return;

    await assignSurveyor(leadId, surveyor.id, surveyor.name);
    setAssigningLeadId(null);
    setSelectedSurveyorId('');
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Awaiting Surveyor</span>
            <AlertCircle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-amber-950">{awaitingAssignment.length}</p>
          <span className="text-[11px] text-amber-700 font-medium">Needs assignment</span>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-sky-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Assigned / In Progress</span>
            <CalendarCheck className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-bold text-sky-950">{assignedSurveys.length}</p>
          <span className="text-[11px] text-sky-700 font-medium">Scheduled visits</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/90 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Completed Surveys</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-emerald-950">{completedSurveys.length}</p>
          <span className="text-[11px] text-emerald-700 font-medium">Verified sites</span>
        </div>
      </div>

      {/* SUB-TAB 1: CONFIRMED LEADS LIST */}
      {activeSubTab === 'confirmed' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-800">
              Confirmed Leads ({confirmedLeads.length})
            </h2>
            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search confirmed customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-3">
            {confirmedLeads
              .filter((l) =>
                searchQuery
                  ? l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    l.phone.includes(searchQuery)
                  : true
              )
              .map((lead) => {
                const isAssigned = Boolean(lead.assignedSurveyorId);
                const isAssigningThis = assigningLeadId === lead.id;

                // Checklist summary
                const yesCount = lead.checklistAnswers
                  ? Object.values(lead.checklistAnswers).filter(Boolean).length
                  : 0;
                const noCount = lead.checklistAnswers
                  ? Object.values(lead.checklistAnswers).filter((v) => v === false).length
                  : 0;

                return (
                  <div
                    key={lead.id}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-sm transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div
                        className="cursor-pointer"
                        onClick={() => setSelectedLeadForDetail(lead)}
                      >
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 hover:text-emerald-700 transition">
                            {lead.name}
                          </h3>
                          <span className="text-xs font-mono font-medium text-slate-500">
                            +91 {lead.phone}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Telecaller: <strong>{lead.assignedTelecallerName}</strong> · Campaign: {lead.campaign}
                        </p>
                      </div>

                      {/* Status / Surveyor info */}
                      <div className="flex items-center gap-2">
                        {lead.assignedSurveyorName ? (
                          <span className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Surveyor: {lead.assignedSurveyorName}</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Unassigned</span>
                          </span>
                        )}

                        <button
                          onClick={() => {
                            setAssigningLeadId(isAssigningThis ? null : lead.id);
                            setSelectedSurveyorId(lead.assignedSurveyorId || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition min-h-[44px] flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>{isAssigned ? 'Reassign' : 'Assign'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Telecaller Notes & Survey Date/Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Appointment</span>
                        <p className="font-semibold text-slate-800">
                          {lead.surveyDate || 'Date not fixed'} ({lead.surveyTime || 'Time pending'})
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Address & PIN</span>
                        <p className="font-semibold text-slate-800 truncate">
                          {lead.address || 'Address pending'} {lead.pinCode ? `(PIN: ${lead.pinCode})` : ''}
                        </p>
                      </div>
                    </div>

                    {lead.notes && (
                      <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2.5 rounded-xl border border-amber-100/60">
                        Telecaller note: "{lead.notes}"
                      </p>
                    )}

                    {/* Checklist summary bar */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 font-medium">Checklist:</span>
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {yesCount} Yes
                        </span>
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          {noCount} No
                        </span>
                      </div>

                      <button
                        onClick={() => setSelectedLeadForDetail(lead)}
                        className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                      >
                        <span>View Full Checklist & Notes</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Assign Surveyor Dropdown Form */}
                    {isAssigningThis && (
                      <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-300 space-y-2.5 animate-in fade-in">
                        <p className="text-xs font-bold text-slate-800">
                          Assign Surveyor for {lead.name}
                        </p>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                          <select
                            value={selectedSurveyorId}
                            onChange={(e) => setSelectedSurveyorId(e.target.value)}
                            className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl text-slate-800 font-medium"
                          >
                            <option value="">-- Select Surveyor (Workload Shown) --</option>
                            {surveyors.map((sv) => (
                              <option key={sv.id} value={sv.id}>
                                {sv.name} — Current Active Workload: {surveyorWorkloadMap[sv.id] || 0} visits
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAssignSubmit(lead.id)}
                              disabled={!selectedSurveyorId}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition min-h-[44px]"
                            >
                              Confirm Assignment
                            </button>
                            <button
                              onClick={() => setAssigningLeadId(null)}
                              className="px-3 py-2 bg-white text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition min-h-[44px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: SURVEYS LIST */}
      {activeSubTab === 'surveys' && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">
            Site Surveys Schedule ({assignedSurveys.length + completedSurveys.length})
          </h2>

          <div className="space-y-2.5">
            {[...assignedSurveys, ...completedSurveys].map((lead) => (
              <div
                key={lead.id}
                className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{lead.name}</span>
                    <span className="text-slate-400 font-mono">+91 {lead.phone}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      lead.surveyStatus === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-sky-100 text-sky-800'
                    }`}>
                      {lead.surveyStatus || 'Scheduled'}
                    </span>
                  </div>
                  <p className="text-slate-500 mt-1">
                    Surveyor: <strong>{lead.assignedSurveyorName || 'Unassigned'}</strong> · Date: {lead.surveyDate} ({lead.surveyTime})
                  </p>
                  <p className="text-slate-600 mt-0.5 truncate">{lead.address}</p>
                </div>

                <button
                  onClick={() => setSelectedLeadForDetail(lead)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-semibold shrink-0"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: TELECALLERS PERFORMANCE OVERVIEW */}
      {activeSubTab === 'telecallers' && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">
            Telecallers Performance ({telecallers.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {telecallers.map((tc) => {
              const stats = getTelecallerStats(tc.id, 'all');
              return (
                <div
                  key={tc.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{tc.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">@{tc.username} · +91 {tc.phone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-50">
                      <span className="text-slate-400 block text-[10px]">Assigned</span>
                      <span className="font-bold text-slate-800 text-base">{stats.assignedCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50">
                      <span className="text-emerald-700 block text-[10px]">Confirmed</span>
                      <span className="font-bold text-emerald-800 text-base">{stats.confirmedCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-sky-50">
                      <span className="text-sky-700 block text-[10px]">Conversion</span>
                      <span className="font-bold text-sky-800 text-base">{stats.conversionRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SURVEYORS WORKLOAD OVERVIEW */}
      {activeSubTab === 'surveyors' && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">
            Field Surveyors ({surveyors.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {surveyors.map((sv) => {
              const stats = getSurveyorStats(sv.id);
              const activeWorkload = surveyorWorkloadMap[sv.id] || 0;

              return (
                <div
                  key={sv.id}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{sv.name}</h3>
                      <p className="text-xs text-slate-400 font-mono">@{sv.username} · +91 {sv.phone}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-amber-50">
                      <span className="text-amber-800 block text-[10px]">Active Queue</span>
                      <span className="font-bold text-amber-900 text-base">{activeWorkload}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-50">
                      <span className="text-emerald-700 block text-[10px]">Completed</span>
                      <span className="font-bold text-emerald-800 text-base">{stats.completedCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-sky-50">
                      <span className="text-sky-700 block text-[10px]">Total Assigned</span>
                      <span className="font-bold text-sky-800 text-base">{stats.assignedCount}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLeadForDetail && (
        <LeadDetailModal
          lead={selectedLeadForDetail}
          questions={checklistQuestions}
          isOpen={Boolean(selectedLeadForDetail)}
          onClose={() => setSelectedLeadForDetail(null)}
          onStartCall={() => {}}
          onOpenChecklist={() => {}}
        />
      )}
    </div>
  );
};
