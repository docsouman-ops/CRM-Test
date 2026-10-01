import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Save,
  Check,
} from 'lucide-react';
import { Lead, ChecklistQuestion } from '../../types';
import { CHECKLIST_SECTIONS, ChecklistSection } from '../../constants/defaultChecklist';

interface ChecklistModalProps {
  lead: Lead;
  questions: ChecklistQuestion[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (answers: Record<string, boolean>) => void;
}

export const ChecklistModal: React.FC<ChecklistModalProps> = ({
  lead,
  questions,
  isOpen,
  onClose,
  onSave,
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>(() => {
    return lead.checklistAnswers || {};
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setAnswers(lead.checklistAnswers || {});
    setCurrentSectionIndex(0);
    setHasUnsavedChanges(false);
  }, [lead]);

  if (!isOpen) return null;

  // Filter sections that actually have questions
  const availableSections = CHECKLIST_SECTIONS.filter((sec) =>
    questions.some((q) => q.sectionKey === sec.key)
  );

  const activeSection = availableSections[currentSectionIndex] || availableSections[0];
  const sectionQuestions = questions
    .filter((q) => q.sectionKey === activeSection?.key)
    .sort((a, b) => a.order - b.order);

  // Stats
  const answeredCount = Object.keys(answers).length;
  const yesCount = Object.values(answers).filter(Boolean).length;
  const noCount = Object.values(answers).filter((v) => v === false).length;

  const handleToggle = (questionId: string, value: boolean) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    setHasUnsavedChanges(true);
    // Autosave immediately into lead object
    onSave(updated);
  };

  const handleNextSection = () => {
    if (currentSectionIndex < availableSections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1);
    }
  };

  const handlePrevSection = () => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1);
    }
  };

  const handleFinalSubmit = () => {
    onSave(answers);
    onClose();
  };

  const progressPercentage = Math.round(
    ((currentSectionIndex + 1) / availableSections.length) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-2xl max-h-[92vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold truncate leading-tight">
                Solar Verification Checklist
              </h2>
              <p className="text-xs text-slate-300 truncate">
                Customer: <strong>{lead.name}</strong> · {lead.phone}
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

        {/* Progress bar & Section indicator */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-4 py-2.5 shrink-0">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-bold text-slate-800">
              Section {currentSectionIndex + 1} of {availableSections.length}:{' '}
              <span className="text-emerald-700">{activeSection?.title}</span>
            </span>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
              <span className="text-emerald-700 font-semibold">{yesCount} Yes</span>
              <span>·</span>
              <span className="text-rose-700 font-semibold">{noCount} No</span>
              <span>·</span>
              <span>{questions.length - answeredCount} Pending</span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{activeSection?.subtitle}</p>
        </div>

        {/* Question List for Current Section */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {sectionQuestions.map((q, idx) => {
            const currentAnswer = answers[q.id];
            const isYes = currentAnswer === true;
            const isNo = currentAnswer === false;

            return (
              <div
                key={q.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-2xs"
              >
                <div className="flex items-start gap-2.5 mb-3">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-bold text-xs mt-0.5">
                    {q.order}
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                    {q.questionText}
                  </p>
                </div>

                {/* Two Large Toggle Buttons (Yes / No only) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(q.id, true)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] active:scale-98 ${
                      isYes
                        ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                        : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <CheckCircle className={`w-4 h-4 ${isYes ? 'text-white' : 'text-emerald-600'}`} />
                    <span>YES</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggle(q.id, false)}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all min-h-[44px] active:scale-98 ${
                      isNo
                        ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                        : 'bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-800 border border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    <XCircle className={`w-4 h-4 ${isNo ? 'text-white' : 'text-rose-600'}`} />
                    <span>NO</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Navigation */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handlePrevSection}
            disabled={currentSectionIndex === 0}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition min-h-[44px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous Section</span>
            <span className="sm:hidden">Prev</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-xl transition min-h-[44px]"
            >
              <Save className="w-3.5 h-3.5 text-emerald-700" />
              <span>Save & Close</span>
            </button>

            {currentSectionIndex < availableSections.length - 1 ? (
              <button
                type="button"
                onClick={handleNextSection}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition min-h-[44px] active:scale-95"
              >
                <span>Next Section</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition min-h-[44px] active:scale-95 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Complete Checklist</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
