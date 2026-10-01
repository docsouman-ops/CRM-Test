import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  BarChart3,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ClipboardCheck,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types';
import { SurveyDetailModal } from './SurveyDetailModal';
import { ChecklistSummaryView } from '../leads/ChecklistSummaryView';

export const SurveyorHome: React.FC<{ activeSubTab?: string }> = ({
  activeSubTab = 'surveys',
}) => {
  const { currentUser } = useAuth();
  const { leads, checklistQuestions, updateSurveyStatus, getSurveyorStats } = useCRM();

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalTab, setModalTab] = useState<'info' | 'checklist'>('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [checklistSearchQuery, setChecklistSearchQuery] = useState('');
  const [selectedLeadForChecklistCard, setSelectedLeadForChecklistCard] = useState<string | null>(null);

  // Surveys assigned to this surveyor
  const mySurveys = useMemo(() => {
    if (!currentUser) return [];
    return leads.filter((l) => l.assignedSurveyorId === currentUser.id);
  }, [leads, currentUser]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Today's surveys
  const todaySurveys = useMemo(() => {
    return mySurveys
      .filter((s) => s.surveyDate === todayStr)
      .sort((a, b) => (a.surveyTime || '').localeCompare(b.surveyTime || ''));
  }, [mySurveys, todayStr]);

  // Upcoming surveys
  const upcomingSurveys = useMemo(() => {
    return mySurveys
      .filter((s) => !s.surveyDate || s.surveyDate > todayStr)
      .sort((a, b) => (a.surveyDate || '').localeCompare(b.surveyDate || ''));
  }, [mySurveys, todayStr]);

  // Completed surveys
  const completedSurveys = useMemo(() => {
    return mySurveys.filter((s) => s.surveyStatus === 'Completed');
  }, [mySurveys]);

  // Surveyor stats
  const stats = currentUser ? getSurveyorStats(currentUser.id) : null;

  const openDetailModal = (lead: Lead, tab: 'info' | 'checklist' = 'info') => {
    setModalTab(tab);
    setSelectedLead(lead);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Surveyor KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Today's Visits</span>
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{todaySurveys.length}</p>
          <span className="text-[10px] text-slate-400">Scheduled for today</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Upcoming</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{upcomingSurveys.length}</p>
          <span className="text-[10px] text-slate-400">Future bookings</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Completed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-800">
            {stats?.completedCount || 0}
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">Passed inspections</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Completion %</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-800">
            {stats?.completionRate || 0}%
          </p>
          <span className="text-[10px] text-amber-600 font-medium">Success rate</span>
        </div>
      </div>

      {/* SUB-TAB: TODAY'S SURVEYS */}
      {activeSubTab === 'surveys' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">
              Today's Field Visits ({todaySurveys.length})
            </h2>
            <span className="text-xs text-slate-500 font-medium">{todayStr}</span>
          </div>

          {todaySurveys.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <CalendarCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No visits scheduled for today</p>
              <p className="text-xs text-slate-400 mt-1">Check the Upcoming tab for future assignments.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySurveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onSelect={() => openDetailModal(survey, 'info')}
                  onViewChecklist={() => openDetailModal(survey, 'checklist')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: ALL CHECKLISTS OF ASSIGNED LEADS */}
      {activeSubTab === 'checklists' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Assigned Lead Checklists ({mySurveys.length})
              </h2>
              <p className="text-xs text-slate-500">
                Review 23-question verification checklists submitted by telecallers
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search lead by name or phone..."
                value={checklistSearchQuery}
                onChange={(e) => setChecklistSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          {mySurveys.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No assigned leads found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mySurveys
                .filter((l) =>
                  checklistSearchQuery
                    ? l.name.toLowerCase().includes(checklistSearchQuery.toLowerCase()) ||
                      l.phone.includes(checklistSearchQuery)
                    : true
                )
                .map((lead) => {
                  const isExpanded = selectedLeadForChecklistCard === lead.id;
                  const yesCount = lead.checklistAnswers
                    ? Object.values(lead.checklistAnswers).filter(Boolean).length
                    : 0;
                  const noCount = lead.checklistAnswers
                    ? Object.values(lead.checklistAnswers).filter((v) => v === false).length
                    : 0;

                  return (
                    <div
                      key={lead.id}
                      className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                              {lead.name}
                            </h3>
                            <span className="font-mono text-xs text-slate-500">+91 {lead.phone}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {lead.surveyStatus || 'Scheduled'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Survey: <strong>{lead.surveyDate || 'Date pending'}</strong> ({lead.surveyTime || 'Time pending'}) · {lead.address || 'Address pending'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{yesCount} Yes</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>{noCount} No</span>
                          </span>
                        </div>
                      </div>

                      {/* Expand / Collapse Checklist button */}
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSelectedLeadForChecklistCard(isExpanded ? null : lead.id)}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                        >
                          <ClipboardCheck className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Hide Detailed Checklist' : 'View Full 23 Questions Checklist'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openDetailModal(lead, 'info')}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
                        >
                          Update Status
                        </button>
                      </div>

                      {/* Expanded Checklist View */}
                      {isExpanded && (
                        <div className="pt-2 border-t border-slate-100 animate-in fade-in">
                          <ChecklistSummaryView answers={lead.checklistAnswers} questions={checklistQuestions} />
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: UPCOMING SURVEYS */}
      {activeSubTab === 'upcoming' && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">
            Upcoming Surveys ({upcomingSurveys.length})
          </h2>

          {upcomingSurveys.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No upcoming surveys</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSurveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onSelect={() => openDetailModal(survey, 'info')}
                  onViewChecklist={() => openDetailModal(survey, 'checklist')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: COMPLETED SURVEYS */}
      {activeSubTab === 'completed' && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">
            Completed Visits ({completedSurveys.length})
          </h2>

          {completedSurveys.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No surveys completed yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedSurveys.map((survey) => (
                <SurveyCard
                  key={survey.id}
                  survey={survey}
                  onSelect={() => openDetailModal(survey, 'info')}
                  onViewChecklist={() => openDetailModal(survey, 'checklist')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: SURVEYOR PERFORMANCE */}
      {activeSubTab === 'performance' && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">My Field Performance</h2>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-600">Total Surveys Assigned</span>
              <span className="font-bold text-slate-900 text-base">{stats?.assignedCount}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-600">Surveys Completed</span>
              <span className="font-bold text-emerald-800 text-base">{stats?.completedCount}</span>
            </div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-semibold text-slate-600">Currently Scheduled</span>
              <span className="font-bold text-sky-800 text-base">{stats?.scheduledCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-600">Completion Ratio</span>
              <span className="font-bold text-amber-800 text-base">{stats?.completionRate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedLead && (
        <SurveyDetailModal
          lead={selectedLead}
          questions={checklistQuestions}
          isOpen={Boolean(selectedLead)}
          initialTab={modalTab}
          onClose={() => setSelectedLead(null)}
          onUpdateStatus={updateSurveyStatus}
        />
      )}
    </div>
  );
};

const SurveyCard: React.FC<{
  survey: Lead;
  onSelect: () => void;
  onViewChecklist: () => void;
}> = ({ survey, onSelect, onViewChecklist }) => {
  const cleanPhone = survey.phone.replace(/\D/g, '');
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
    `${survey.address || ''} ${survey.pinCode || ''}`
  )}`;

  const isCompleted = survey.surveyStatus === 'Completed';

  // Checklist counts
  const yesCount = survey.checklistAnswers
    ? Object.values(survey.checklistAnswers).filter(Boolean).length
    : 0;
  const noCount = survey.checklistAnswers
    ? Object.values(survey.checklistAnswers).filter((v) => v === false).length
    : 0;
  const hasChecklist = survey.checklistAnswers && Object.keys(survey.checklistAnswers).length > 0;

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="cursor-pointer flex-1 min-w-0" onClick={onSelect}>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base hover:text-emerald-700 transition truncate">
            {survey.name}
          </h3>
          <p className="text-xs font-mono text-slate-500 mt-0.5">+91 {survey.phone}</p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2.5 py-1 rounded-xl text-xs font-bold ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                : 'bg-sky-100 text-sky-900 border border-sky-200'
            }`}
          >
            {survey.surveyStatus || 'Scheduled'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
        <div>
          <span className="text-slate-400 block text-[11px] font-medium">Date & Time</span>
          <p className="font-bold text-slate-800">
            {survey.surveyDate || 'Pending'} ({survey.surveyTime || 'Pending'})
          </p>
        </div>
        <div>
          <span className="text-slate-400 block text-[11px] font-medium">Address & PIN</span>
          <p className="font-medium text-slate-800 truncate">
            {survey.address || 'Address pending'} {survey.pinCode ? `· ${survey.pinCode}` : ''}
          </p>
        </div>
      </div>

      {/* Checklist Preview Bar */}
      <div className="flex items-center justify-between text-xs bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-emerald-700" />
          <span className="font-bold text-emerald-950 text-xs">Customer Checklist:</span>
          {hasChecklist ? (
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span className="text-emerald-700">{yesCount} Yes</span>
              <span>·</span>
              <span className="text-rose-700">{noCount} No</span>
            </div>
          ) : (
            <span className="text-slate-400 text-xs font-normal">Pending Telecaller Response</span>
          )}
        </div>

        <button
          type="button"
          onClick={onViewChecklist}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
        >
          View 23 Questions
        </button>
      </div>

      {survey.notes && (
        <p className="text-xs text-slate-600 italic bg-amber-50/50 p-2 rounded-lg">
          Telecaller: "{survey.notes}"
        </p>
      )}

      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <a
            href={`tel:+91${cleanPhone}`}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs min-h-[44px]"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </a>

          {survey.address && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold min-h-[44px]"
            >
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              <span>Google Maps</span>
            </a>
          )}
        </div>

        <button
          onClick={onSelect}
          className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 min-h-[44px]"
        >
          <span>Update Status</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
