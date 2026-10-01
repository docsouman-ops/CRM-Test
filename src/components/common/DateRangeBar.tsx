import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateRangePreset, DateRangeFilterState } from '../../utils/dateFilter';

interface DateRangeBarProps {
  value: DateRangeFilterState;
  onChange: (newState: DateRangeFilterState) => void;
}

export const DateRangeBar: React.FC<DateRangeBarProps> = ({ value, onChange }) => {
  const presets: { id: DateRangePreset; label: string }[] = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'week', label: 'Last 7 Days' },
    { id: 'month', label: 'This Month' },
    { id: 'last30', label: 'Last 30 Days' },
    { id: 'custom', label: 'Custom Range' },
  ];

  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>Date Range Filter:</span>
        </div>

        {/* Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange({ ...value, preset: p.id })}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition min-h-[36px] ${
                value.preset === p.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {value.preset === 'custom' && (
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs animate-in fade-in">
          <span className="text-slate-500 font-medium">From:</span>
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => onChange({ ...value, startDate: e.target.value })}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
          />
          <span className="text-slate-500 font-medium">To:</span>
          <input
            type="date"
            value={value.endDate}
            onChange={(e) => onChange({ ...value, endDate: e.target.value })}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-800"
          />
          {(value.startDate || value.endDate) && (
            <button
              type="button"
              onClick={() => onChange({ ...value, startDate: '', endDate: '' })}
              className="text-slate-400 hover:text-slate-600 text-[11px] underline"
            >
              Clear dates
            </button>
          )}
        </div>
      )}
    </div>
  );
};
