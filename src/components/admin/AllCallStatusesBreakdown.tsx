import React from 'react';
import { PhoneCall, CheckCircle2, Clock, PhoneOff, XCircle, AlertTriangle } from 'lucide-react';
import { Lead } from '../../types';
import { DEFAULT_STATUSES, CATEGORY_LABELS } from '../../constants/statusConfig';

interface AllCallStatusesBreakdownProps {
  leads: Lead[];
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
}

export const AllCallStatusesBreakdown: React.FC<AllCallStatusesBreakdownProps> = ({
  leads,
  selectedStatus,
  onSelectStatus,
}) => {
  const total = leads.length;

  // Calculate counts per status
  const countsByStatus: Record<string, number> = {};
  DEFAULT_STATUSES.forEach((s) => {
    countsByStatus[s.code] = 0;
  });

  leads.forEach((l) => {
    if (l.status && countsByStatus[l.status] !== undefined) {
      countsByStatus[l.status] += 1;
    }
  });

  const categories: Array<keyof typeof CATEGORY_LABELS> = [
    'positive',
    'callback',
    'not_reached',
    'closed_lost',
    'bad_lead',
  ];

  const categoryIcons: Record<string, React.ElementType> = {
    positive: CheckCircle2,
    callback: Clock,
    not_reached: PhoneOff,
    closed_lost: XCircle,
    bad_lead: AlertTriangle,
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <PhoneCall className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              All Call Statuses Overview (19 Statuses)
            </h3>
            <p className="text-xs text-slate-500">
              Live count of leads across all call disposition categories
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">
            Total Leads: <strong className="text-slate-900 text-sm">{total}</strong>
          </span>
          {selectedStatus && selectedStatus !== 'ALL' && onSelectStatus && (
            <button
              onClick={() => onSelectStatus('ALL')}
              className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
            >
              Clear Filter
            </button>
          )}
        </div>
      </div>

      {/* Categories Grouping */}
      <div className="space-y-4">
        {categories.map((catKey) => {
          const catMeta = CATEGORY_LABELS[catKey];
          const Icon = categoryIcons[catKey] || PhoneCall;
          const statusesInCat = DEFAULT_STATUSES.filter((s) => s.category === catKey);
          const totalInCat = statusesInCat.reduce((acc, s) => acc + (countsByStatus[s.code] || 0), 0);
          const pctInCat = total > 0 ? ((totalInCat / total) * 100).toFixed(1) : '0';

          return (
            <div key={catKey} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    {catMeta.label}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                  {totalInCat} leads ({pctInCat}%)
                </span>
              </div>

              {/* Status Grid Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {statusesInCat.map((st) => {
                  const count = countsByStatus[st.code] || 0;
                  const pct = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
                  const isSelected = selectedStatus === st.code;

                  return (
                    <div
                      key={st.code}
                      onClick={() => onSelectStatus && onSelectStatus(isSelected ? 'ALL' : st.code)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                        isSelected
                          ? 'ring-2 ring-emerald-600 bg-emerald-50/70 border-emerald-400 shadow-sm'
                          : 'bg-slate-50/60 hover:bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: st.color }}
                          />
                          <span className="text-xs font-semibold text-slate-800 truncate">
                            {st.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between pt-1 border-t border-slate-100">
                        <span className="text-lg font-bold text-slate-900 font-mono leading-none">
                          {count}
                        </span>
                        <span className="text-[10px] text-slate-500 font-medium">
                          {pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
