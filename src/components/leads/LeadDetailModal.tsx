import React, { useState } from 'react';
import {
  X,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  MapPin,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  User,
  History,
  Volume2,
  ExternalLink,
} from 'lucide-react';
import { Lead, ChecklistQuestion, User as UserType } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { ChecklistSummaryView } from './ChecklistSummaryView';
import { formatCallDuration } from '../../services/telephony';

interface LeadDetailModalProps {
  lead: Lead;
  questions?: ChecklistQuestion[];
  users?: UserType[];
  isOpen: boolean;
  onClose: () => void;
  onStartCall?: (lead: Lead) => void;
  onOpenChecklist?: (lead: Lead) => void;
  onReassign?: (leadIds: string[], telecallerId: string, telecallerName: string) => Promise<boolean>;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  questions = [],
  users = [],
  isOpen,
  onClose,
  onStartCall,
  onOpenChecklist,
  onReassign,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'calls' | 'timeline'>('details');
  const [reassignTelecallerId, setReassignTelecallerId] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  if (!isOpen) return null;

  const cleanPhone = lead.phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hello ${lead.name}, regarding your PM Surya Ghar Rooftop Solar enquiry with Green View Agrotech.`
  )}`;

  const telecallers = users.filter((u) => u.role === 'telecaller' && u.active !== false);

  const handleReassignSubmit = async () => {
    if (!onReassign || !reassignTelecallerId) return;
    const targetUser = users.find((u) => u.id === reassignTelecallerId);
    if (!targetUser) return;
    setIsReassigning(true);
    await onReassign([lead.id], targetUser.id, targetUser.name);
    setIsReassigning(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Top Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
              {lead.name.charAt(0)}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold truncate leading-tight">{lead.name}</h2>
                <StatusBadge status={lead.status} size="sm" />
              </div>
              <p className="text-xs text-slate-300 truncate">
                +91 {lead.phone} · {lead.campaign ? `${lead.campaign} · ` : ''}{lead.source}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Actions Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {onStartCall ? (
              <button
                onClick={() => {
                  onClose();
                  onStartCall(lead);
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition min-h-[44px]"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </button>
            ) : (
              <a
                href={`tel:+91${cleanPhone}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs active:scale-95 transition min-h-[44px]"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>
            )}

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition min-h-[44px]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          </div>

          {onOpenChecklist ? (
            <button
              onClick={() => {
                onClose();
                onOpenChecklist(lead);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-semibold rounded-xl transition min-h-[44px]"
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
              <span>Fill Checklist</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('checklist')}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-semibold rounded-xl transition min-h-[44px]"
            >
              <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
              <span>View Checklist</span>
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 shrink-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition ${
              activeTab === 'checklist'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Checklist (23 Questions)
          </button>
          <button
            onClick={() => setActiveTab('calls')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition ${
              activeTab === 'calls'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Call History ({lead.callHistory?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-2.5 px-3 border-b-2 font-semibold transition ${
              activeTab === 'timeline'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Status History
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'details' && (
            <div className="space-y-4 text-xs">
              {/* Primary Info Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Assigned Telecaller</span>
                  <span className="font-semibold text-slate-800 text-sm">
                    {lead.assignedTelecallerName || 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Campaign</span>
                  <span className="font-semibold text-slate-800">{lead.campaign || 'Direct / Offline Entry'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Lead Source</span>
                  <span className="font-semibold text-slate-800">{lead.source}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Date Created</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(lead.createdAt).toLocaleString()}
                  </span>
                </div>
                {lead.addedByName && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Added by: <strong className="text-slate-800 font-semibold">{lead.addedByName}</strong></span>
                    {lead.addedAt && (
                      <span className="text-slate-400">{new Date(lead.addedAt).toLocaleString()}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Reassign Telecaller Card if enabled */}
              {onReassign && telecallers.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div>
                    <span className="text-[11px] font-bold text-slate-700 block">Reassign Telecaller</span>
                    <span className="text-[10px] text-slate-500">Transfer this lead to another active telecaller</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={reassignTelecallerId}
                      onChange={(e) => setReassignTelecallerId(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-800"
                    >
                      <option value="">Select Telecaller...</option>
                      {telecallers.map((tc) => (
                        <option key={tc.id} value={tc.id}>
                          {tc.name} {tc.id === lead.assignedTelecallerId ? '(Current)' : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!reassignTelecallerId || isReassigning}
                      onClick={handleReassignSubmit}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition"
                    >
                      {isReassigning ? 'Saving...' : 'Reassign'}
                    </button>
                  </div>
                </div>
              )}

              {/* Callback Info if present */}
              {lead.callbackDate && (
                <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200">
                  <div className="flex items-center gap-2 text-blue-900 font-bold mb-1">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Scheduled Callback</span>
                  </div>
                  <p className="text-slate-700">
                    Date: <strong>{lead.callbackDate}</strong> at <strong>{lead.callbackTime || '10:00 AM'}</strong>
                  </p>
                </div>
              )}

              {/* Site Survey Details if present */}
              {(lead.surveyDate || lead.address || lead.assignedSurveyorName) && (
                <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      <span>Site Survey Details</span>
                    </div>
                    {lead.surveyStatus && (
                      <span className="px-2 py-0.5 rounded bg-emerald-200/70 text-emerald-900 font-bold text-[10px]">
                        {lead.surveyStatus}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Survey Appointment</span>
                      <span className="font-semibold text-slate-900">
                        {lead.surveyDate || 'Not fixed'} at {lead.surveyTime || ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 block">Assigned Surveyor</span>
                      <span className="font-semibold text-slate-900">
                        {lead.assignedSurveyorName || 'Pending Back Office Assignment'}
                      </span>
                    </div>
                  </div>

                  {lead.address && (
                    <div>
                      <span className="text-[11px] text-slate-500 block">Address & PIN</span>
                      <p className="text-slate-800 font-medium">
                        {lead.address} {lead.pinCode ? `— PIN: ${lead.pinCode}` : ''}
                      </p>
                    </div>
                  )}

                  {lead.surveyNotes && (
                    <div className="pt-1 border-t border-emerald-200/60">
                      <span className="text-[11px] text-slate-500 block">Surveyor Notes</span>
                      <p className="text-slate-800 italic">{lead.surveyNotes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Telecaller Notes
                </span>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed min-h-[60px]">
                  {lead.notes || <span className="text-slate-400 italic">No notes recorded yet.</span>}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <ChecklistSummaryView answers={lead.checklistAnswers} questions={questions} />
          )}

          {activeTab === 'calls' && (
            <div className="space-y-3">
              {(!lead.callHistory || lead.callHistory.length === 0) ? (
                <div className="p-6 text-center text-slate-400">
                  <Phone className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">No calls logged for this customer yet.</p>
                </div>
              ) : (
                lead.callHistory.map((call) => (
                  <div
                    key={call.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={call.status} size="sm" />
                        <span className="text-slate-500 font-mono">
                          Duration: {formatCallDuration(call.duration)}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {new Date(call.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      <span className="text-slate-400">Caller: </span>
                      <span className="font-semibold text-slate-800">{call.telecallerName}</span>
                    </div>

                    {call.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg italic">
                        "{call.notes}"
                      </p>
                    )}

                    {call.recordingUrl && (
                      <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <Volume2 className="w-3.5 h-3.5" /> Call Recording
                        </span>
                        <audio controls src={call.recordingUrl} className="h-7 max-w-[200px]" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-3">
              {(!lead.statusHistory || lead.statusHistory.length === 0) ? (
                <div className="p-6 text-center text-slate-400">
                  <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-medium">No previous status updates recorded.</p>
                </div>
              ) : (
                lead.statusHistory.map((hist, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{hist.status}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(hist.changedAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Changed by: {hist.changedByName || hist.changedBy}
                      </p>
                      {hist.notes && <p className="text-slate-700 italic mt-1">{hist.notes}</p>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
