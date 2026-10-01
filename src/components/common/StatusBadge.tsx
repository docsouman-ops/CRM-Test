import React from 'react';
import { DEFAULT_STATUSES } from '../../constants/statusConfig';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', showDot = true }) => {
  const config = DEFAULT_STATUSES.find((s) => s.code === status) || {
    code: status,
    label: status.replace(/_/g, ' '),
    category: 'positive',
    color: '#15803D',
    bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    textColor: 'text-emerald-700',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors ${config.bgColor} ${sizeClasses[size]}`}
    >
      {showDot && (
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: config.color }}
        />
      )}
      <span className="truncate">{config.label}</span>
    </span>
  );
};
