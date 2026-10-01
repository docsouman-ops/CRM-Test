import React from 'react';
import {
  Phone,
  MessageSquare,
  ClipboardList,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Lead } from '../../types';
import { StatusBadge } from '../common/StatusBadge';

interface LeadCardProps {
  lead: Lead;
  onCall: (lead: Lead) => void;
  onOpenChecklist: (lead: Lead) => void;
  onSelect: (lead: Lead) => void;
  compact?: boolean;
}

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onCall,
  onOpenChecklist,
  onSelect,
  compact = false,
}) => {
  const cleanPhone = lead.phone.replace(/\D/g, '');
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(
    `Hello ${lead.name}, regarding your PM Surya Ghar Rooftop Solar enquiry with Green View Agrotech.`
  )}`;

  const isConfirmed = lead.status === 'CONFIRMED';
  const isHot = lead.status === 'HOT';
  const isFollowUp = lead.status === 'FOLLOW_UP' || lead.status === 'CALL_LATER';

  // Checklist counts
  const answeredCount = lead.checklistAnswers ? Object.keys(lead.checklistAnswers).length : 0;
  const yesCount = lead.checklistAnswers ? Object.values(lead.checklistAnswers).filter(Boolean).length : 0;

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between gap-3">
      {/* Top row: Name, source & status */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onSelect(lead)}
        >
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate tracking-tight hover:text-emerald-700 transition">
              {lead.name}
            </h3>
            {isHot && (
              <span className="flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                <Flame className="w-3 h-3 text-amber-500 fill-amber-500" /> HOT
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
            <span className="font-mono font-medium text-slate-700">+91 {lead.phone}</span>
            <span aria-hidden="true">·</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80 truncate max-w-[200px]" title={lead.campaign}>
              {lead.campaign || 'Direct Entry'}
            </span>
            {lead.city && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[11px] text-slate-500">{lead.city}</span>
              </>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-end gap-1">
          <StatusBadge status={lead.status} size="sm" />
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
            {lead.source}
          </span>
        </div>
      </div>

      {/* Middle row: Schedule info or notes */}
      {isFollowUp && lead.callbackDate && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50/80 border border-blue-100 text-xs text-blue-900 font-medium">
          <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="truncate">
            Callback: <strong>{lead.callbackDate}</strong> at {lead.callbackTime || '10:00 AM'}
          </span>
        </div>
      )}

      {isConfirmed && lead.surveyDate && (
        <div className="flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-xs text-emerald-900 font-medium">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">
              Survey: <strong>{lead.surveyDate}</strong> ({lead.surveyTime || 'Pending'})
            </span>
          </div>
          {lead.assignedSurveyorName && (
            <span className="text-[10px] text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded font-semibold truncate shrink-0">
              {lead.assignedSurveyorName}
            </span>
          )}
        </div>
      )}

      {lead.notes && !isFollowUp && !isConfirmed && (
        <p className="text-xs text-slate-600 line-clamp-2 italic bg-slate-50 p-2 rounded-lg">
          "{lead.notes}"
        </p>
      )}

      {/* Bottom row: Call button, WhatsApp, Checklist & details */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Big Green Call Button */}
          <button
            onClick={() => onCall(lead)}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs active:scale-95 transition min-h-[44px]"
            title="Dial phone & start call timer"
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>Call</span>
          </button>

          {/* WhatsApp Direct Link */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs active:scale-95 transition min-h-[44px]"
            title="Open WhatsApp chat"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">WhatsApp</span>
          </a>

          {/* Checklist Button with progress indicator */}
          <button
            onClick={() => onOpenChecklist(lead)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition min-h-[44px] ${
              answeredCount > 0
                ? 'bg-slate-50 border-slate-300 text-slate-800 hover:bg-slate-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Fill 23-question verification checklist"
          >
            <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
            <span>Checklist</span>
            {answeredCount > 0 && (
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1 rounded font-bold">
                {yesCount}/23
              </span>
            )}
          </button>
        </div>

        {/* View Details Arrow */}
        <button
          onClick={() => onSelect(lead)}
          className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="View full lead record"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
