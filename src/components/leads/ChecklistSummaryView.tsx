import React from 'react';
import { CheckCircle2, XCircle, HelpCircle, AlertTriangle } from 'lucide-react';
import { ChecklistQuestion } from '../../types';

interface ChecklistSummaryViewProps {
  answers?: Record<string, boolean>;
  questions: ChecklistQuestion[];
}

export const ChecklistSummaryView: React.FC<ChecklistSummaryViewProps> = ({
  answers = {},
  questions,
}) => {
  const answeredKeys = Object.keys(answers);
  const yesList = questions.filter((q) => answers[q.id] === true);
  const noList = questions.filter((q) => answers[q.id] === false);
  const pendingList = questions.filter((q) => answers[q.id] === undefined);

  if (answeredKeys.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
        <HelpCircle className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
        <p className="text-xs font-semibold text-slate-700">Checklist Not Filled Yet</p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          The telecaller has not filled the 23-question verification checklist for this lead.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header Pill Island */}
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
        <div>
          <p className="text-xs font-bold text-slate-900">Checklist Summary</p>
          <p className="text-[11px] text-slate-500">
            {answeredKeys.length} of {questions.length} questions completed
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{yesList.length} Yes</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>{noList.length} No</span>
          </span>
        </div>
      </div>

      {/* "NO" Items shown FIRST (as requested by prompt) */}
      {noList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>Critical "NO" Items ({noList.length}) — Attention Needed</span>
          </div>
          <div className="space-y-1.5">
            {noList.map((q) => (
              <div
                key={q.id}
                className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 flex items-start gap-2 text-xs text-rose-950"
              >
                <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-semibold text-rose-900">Q{q.order}: </span>
                  <span>{q.questionText}</span>
                  <span className="block text-[10px] text-rose-700/80 mt-0.5 font-medium">
                    Section {q.sectionKey} · {q.sectionTitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* "YES" Items */}
      {yesList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Verified "YES" Items ({yesList.length})</span>
          </div>
          <div className="space-y-1.5">
            {yesList.map((q) => (
              <div
                key={q.id}
                className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 flex items-start gap-2 text-xs text-slate-800"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="font-semibold text-slate-900">Q{q.order}: </span>
                  <span>{q.questionText}</span>
                  <span className="block text-[10px] text-slate-500 mt-0.5">
                    Section {q.sectionKey} · {q.sectionTitle}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unanswered items if any */}
      {pendingList.length > 0 && (
        <div className="space-y-1.5 opacity-60">
          <p className="text-[11px] font-semibold text-slate-500">
            Unanswered by Telecaller ({pendingList.length})
          </p>
          <div className="space-y-1">
            {pendingList.map((q) => (
              <div
                key={q.id}
                className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center gap-2 text-xs text-slate-500"
              >
                <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
                <span className="truncate">Q{q.order}: {q.questionText}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
