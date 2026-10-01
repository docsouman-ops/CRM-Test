import React, { useState } from 'react';
import {
  X,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Save,
  Compass,
} from 'lucide-react';
import { Lead, ChecklistQuestion, SurveyStatus } from '../../types';
import { ChecklistSummaryView } from '../leads/ChecklistSummaryView';

interface SurveyDetailModalProps {
  lead: Lead;
  questions: ChecklistQuestion[];
  isOpen: boolean;
  initialTab?: 'info' | 'checklist';
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: SurveyStatus, surveyNotes?: string) => void;
}

export const SurveyDetailModal: React.FC<SurveyDetailModalProps> = ({
  lead,
  questions,
  isOpen,
  initialTab = 'info',
  onClose,
  onUpdateStatus,
}) => {
  const [surveyStatus, setSurveyStatus] = useState<SurveyStatus>(
    lead.surveyStatus || 'Scheduled'
  );
  const [surveyNotes, setSurveyNotes] = useState<string>(lead.surveyNotes || '');
  const [activeTab, setActiveTab] = useState<'info' | 'checklist'>(initialTab);

  if (!isOpen) return null;

  const cleanPhone = lead.phone.replace(/\D/g, '');
  const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
    `${lead.address || ''} ${lead.pinCode || ''}`
  )}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(lead.id, surveyStatus, surveyNotes);
    onClose();
  };

  const statusOptions: SurveyStatus[] = [
    'Scheduled',
    'Reached',
    'Completed',
    'Rescheduled',
    'Cancelled',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-base font-bold truncate leading-tight">
                Site Survey: {lead.name}
              </h2>
              <p className="text-xs text-slate-300 truncate">
                {lead.address || 'Address pending'}
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

        {/* Quick Action Navigation Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <a
              href={`tel:+91${cleanPhone}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95 min-h-[44px]"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call Customer</span>
            </a>

            {lead.address && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-800 hover:bg-slate-100 text-xs font-semibold rounded-xl transition min-h-[44px]"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>Open in Maps</span>
              </a>
            )}
          </div>

          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'info'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Survey Info
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'checklist'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Telecaller Checklist
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === 'info' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Customer & Address Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Customer</span>
                    <p className="font-bold text-slate-900 text-sm">{lead.name}</p>
                    <p className="font-mono text-slate-600 mt-0.5">+91 {lead.phone}</p>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Appointment</span>
                    <p className="font-bold text-slate-900">
                      {lead.surveyDate || 'Not fixed'} at {lead.surveyTime || ''}
                    </p>
                    <p className="text-slate-500 mt-0.5">Assigned by Back Office</p>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block font-medium">Full Address & PIN</span>
                  <p className="font-semibold text-slate-800 text-xs">
                    {lead.address || 'Address pending'} {lead.pinCode ? `(PIN: ${lead.pinCode})` : ''}
                  </p>
                </div>

                {lead.notes && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[11px] text-slate-400 block font-medium">Telecaller Notes</span>
                    <p className="text-slate-700 italic bg-white p-2 rounded-lg border border-slate-200/60 mt-1">
                      "{lead.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Update Survey Status Section */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <label className="block text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Update Site Survey Status <span className="text-rose-500">*</span>
                </label>

                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSurveyStatus(st)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition min-h-[44px] ${
                        surveyStatus === st
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Surveyor Site Inspection Notes
                  </label>
                  <textarea
                    rows={3}
                    value={surveyNotes}
                    onChange={(e) => setSurveyNotes(e.target.value)}
                    placeholder="RCC roof condition, shadow analysis, sanction load, WBSEDCL meter details, recommended kW size..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-emerald-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-98 min-h-[44px] flex items-center justify-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Survey Update</span>
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-xs text-slate-500 mb-3">
                Read-only verification checklist answers provided by the telecaller. Critical 'NO' items are sorted to the top.
              </p>
              <ChecklistSummaryView answers={lead.checklistAnswers} questions={questions} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
