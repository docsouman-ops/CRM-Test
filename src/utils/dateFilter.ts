export type DateRangePreset = 'today' | 'yesterday' | 'week' | 'month' | 'last30' | 'all' | 'custom';

export interface DateRangeFilterState {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export function getDateRangeBounds(state: DateRangeFilterState): { start: Date; end: Date } | null {
  const now = new Date();

  if (state.preset === 'all') {
    return null;
  }

  if (state.preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  if (state.preset === 'yesterday') {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
    const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  if (state.preset === 'week') {
    const past7 = new Date(now);
    past7.setDate(now.getDate() - 7);
    const start = new Date(past7.getFullYear(), past7.getMonth(), past7.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  if (state.preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  if (state.preset === 'last30') {
    const past30 = new Date(now);
    past30.setDate(now.getDate() - 30);
    const start = new Date(past30.getFullYear(), past30.getMonth(), past30.getDate(), 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return { start, end };
  }

  if (state.preset === 'custom') {
    if (!state.startDate && !state.endDate) return null;
    const start = state.startDate
      ? new Date(`${state.startDate}T00:00:00`)
      : new Date(2020, 0, 1);
    const end = state.endDate
      ? new Date(`${state.endDate}T23:59:59.999`)
      : new Date();
    return { start, end };
  }

  return null;
}

export function isDateWithinRange(dateStr: string, state: DateRangeFilterState): boolean {
  if (state.preset === 'all') return true;
  const bounds = getDateRangeBounds(state);
  if (!bounds) return true;

  const targetDate = new Date(dateStr);
  if (isNaN(targetDate.getTime())) return true;

  return targetDate >= bounds.start && targetDate <= bounds.end;
}
