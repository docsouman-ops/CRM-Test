import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  RefreshCw,
  Sheet,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  HelpCircle,
  AlertCircle,
  Archive,
  Pause,
  Play,
} from 'lucide-react';
import {
  Campaign,
  CampaignSource,
  CampaignStatus,
  CampaignAssignmentMode,
  CampaignColumnMapping,
  User,
} from '../../types';
import { convertToGoogleSheetCsvUrl, parseCsv } from '../../services/csvParser';
import { useToast } from '../../context/ToastContext';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  onSave: (campaignData: Omit<Campaign, 'id' | 'createdAt'>) => Promise<void>;
  onSyncNow?: (campaignId: string) => Promise<void>;
  telecallers: User[];
}

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onSave,
  onSyncNow,
  telecallers,
}) => {
  const { error, info } = useToast();

  const [name, setName] = useState('');
  const [source, setSource] = useState<CampaignSource>('Meta');
  const [status, setStatus] = useState<CampaignStatus>('Active');
  const [sheetUrl, setSheetUrl] = useState('');
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  // Column Mapping
  const [colName, setColName] = useState('Full Name');
  const [colPhone, setColPhone] = useState('Phone Number');
  const [colEmail, setColEmail] = useState('Email');
  const [colCity, setColCity] = useState('City');
  const [colAddress, setColAddress] = useState('Address');
  const [colPinCode, setColPinCode] = useState('Postal Code');
  const [colNotes, setColNotes] = useState('Notes');

  // Telecallers multi-select
  const [assignedTelecallers, setAssignedTelecallers] = useState<string[]>([]);
  const [assignmentMode, setAssignmentMode] = useState<CampaignAssignmentMode>('round_robin');

  // Auto-sync
  const [autoSync, setAutoSync] = useState(false);
  const [syncInterval, setSyncInterval] = useState<number>(5);

  // Dates
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate data when editing
  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setSource(campaign.source);
      setStatus(campaign.status);
      setSheetUrl(campaign.sheetUrl || '');
      setAssignedTelecallers(campaign.assignedTelecallerIds || []);
      setAssignmentMode(campaign.assignmentMode || 'round_robin');
      setAutoSync(campaign.autoSync || false);
      setSyncInterval(campaign.syncInterval || 5);
      setStartDate(campaign.startDate || '');
      setEndDate(campaign.endDate || '');

      if (campaign.columnMapping) {
        setColName(campaign.columnMapping.name || 'Full Name');
        setColPhone(campaign.columnMapping.phone || 'Phone Number');
        setColEmail(campaign.columnMapping.email || '');
        setColCity(campaign.columnMapping.city || '');
        setColAddress(campaign.columnMapping.address || '');
        setColPinCode(campaign.columnMapping.pinCode || '');
        setColNotes(campaign.columnMapping.notes || '');
      }
    } else {
      // Defaults for new campaign
      setName('');
      setSource('Meta');
      setStatus('Active');
      setSheetUrl('');
      // Default select all active telecallers
      setAssignedTelecallers(telecallers.filter((t) => t.active).map((t) => t.id));
      setAssignmentMode('round_robin');
      setAutoSync(false);
      setSyncInterval(5);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setColName('Full Name');
      setColPhone('Phone Number');
      setColEmail('Email');
      setColCity('City');
      setColAddress('Address');
      setColPinCode('Postal Code');
      setColNotes('Notes');
      setDetectedColumns([]);
    }
  }, [campaign, telecallers, isOpen]);

  if (!isOpen) return null;

  // Toggle telecaller
  const toggleTelecaller = (id: string) => {
    setAssignedTelecallers((prev) =>
      prev.includes(id) ? prev.filter((tId) => tId !== id) : [...prev, id]
    );
  };

  const selectAllTelecallers = () => {
    setAssignedTelecallers(telecallers.filter((t) => t.active).map((t) => t.id));
  };

  const deselectAllTelecallers = () => {
    setAssignedTelecallers([]);
  };

  // Load columns from sheetUrl
  const handleLoadColumns = async () => {
    if (!sheetUrl.trim()) {
      error('Sheet URL Required', 'Please paste the Google Sheet URL first.');
      return;
    }

    setIsLoadingColumns(true);
    try {
      const csvUrl = convertToGoogleSheetCsvUrl(sheetUrl);
      const res = await fetch(csvUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}. Make sure the sheet is shared ("Anyone with the link can view").`);
      }
      const text = await res.text();
      const { headers } = parseCsv(text);
      if (headers.length === 0) {
        throw new Error('No column headers found in sheet.');
      }

      setDetectedColumns(headers);
      info('Columns Loaded', `Detected ${headers.length} columns from sheet.`);

      // Auto-match common names
      headers.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes('name') || lower.includes('full name') || lower.includes('customer')) {
          setColName(h);
        } else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact') || lower.includes('number')) {
          setColPhone(h);
        } else if (lower.includes('mail')) {
          setColEmail(h);
        } else if (lower.includes('city') || lower.includes('district') || lower.includes('town')) {
          setColCity(h);
        } else if (lower.includes('address') || lower.includes('location')) {
          setColAddress(h);
        } else if (lower.includes('pin') || lower.includes('postal') || lower.includes('zip')) {
          setColPinCode(h);
        } else if (lower.includes('note') || lower.includes('bill') || lower.includes('requirement')) {
          setColNotes(h);
        }
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      error('Failed to load columns', msg);
    } finally {
      setIsLoadingColumns(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error('Name Required', 'Please enter a campaign name.');
      return;
    }
    if (!colPhone.trim()) {
      error('Phone Column Required', 'Phone column mapping is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const columnMapping: CampaignColumnMapping = {
        name: colName,
        phone: colPhone,
        email: colEmail || undefined,
        city: colCity || undefined,
        address: colAddress || undefined,
        pinCode: colPinCode || undefined,
        notes: colNotes || undefined,
      };

      await onSave({
        name: name.trim(),
        source,
        status,
        sheetUrl: sheetUrl.trim() || undefined,
        columnMapping,
        assignedTelecallerIds: assignedTelecallers,
        assignmentMode,
        autoSync,
        syncInterval,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      error('Error saving campaign', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {campaign ? 'Edit Campaign' : 'Create New Ad Campaign'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure sheet integration, column mappings, and auto-distribution
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form id="campaign-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Campaign Name & Source */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Campaign Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. PM Surya Ghar Kolkata Phase 2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Source Platform</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as CampaignSource)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
              >
                <option value="Meta">Meta (FB / IG)</option>
                <option value="Google">Google Ads</option>
                <option value="Other">Other Channel</option>
              </select>
            </div>
          </div>

          {/* Status Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Campaign Status</label>
            <div className="flex flex-wrap items-center gap-2">
              {(['Active', 'Paused', 'Completed', 'Archived'] as CampaignStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    status === st
                      ? st === 'Active'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : st === 'Paused'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {st === 'Active' && <Play className="w-3 h-3 fill-current" />}
                  {st === 'Paused' && <Pause className="w-3 h-3 fill-current" />}
                  {st === 'Archived' && <Archive className="w-3 h-3" />}
                  <span>{st}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Google Sheet Integration Section */}
          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sheet className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                  Google Sheet Lead Feed
                </span>
              </div>
              <span className="text-[11px] text-emerald-700 font-medium">Shared link or CSV export</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Google Sheet Link
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit#gid=0"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={handleLoadColumns}
                  disabled={isLoadingColumns || !sheetUrl.trim()}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingColumns ? 'animate-spin' : ''}`} />
                  <span>{isLoadingColumns ? 'Reading...' : 'Load Columns'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Ensure sharing is set to <strong>"Anyone with the link can view"</strong> or published to web as CSV.
              </p>
            </div>

            {/* Column Mapping Grid */}
            <div className="pt-2 border-t border-emerald-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Column Mapping {detectedColumns.length > 0 && `(${detectedColumns.length} detected)`}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Saved for future syncs</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* Name */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Customer Name Column
                  </label>
                  {detectedColumns.length > 0 ? (
                    <select
                      value={colName}
                      onChange={(e) => setColName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      {detectedColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={colName}
                      onChange={(e) => setColName(e.target.value)}
                      placeholder="e.g. Full Name"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Phone Number Column <span className="text-rose-500">*</span>
                  </label>
                  {detectedColumns.length > 0 ? (
                    <select
                      value={colPhone}
                      onChange={(e) => setColPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      {detectedColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      required
                      value={colPhone}
                      onChange={(e) => setColPhone(e.target.value)}
                      placeholder="e.g. Phone Number"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    />
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Email Column (Optional)
                  </label>
                  {detectedColumns.length > 0 ? (
                    <select
                      value={colEmail}
                      onChange={(e) => setColEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- None --</option>
                      {detectedColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={colEmail}
                      onChange={(e) => setColEmail(e.target.value)}
                      placeholder="e.g. Email"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    City / District Column
                  </label>
                  {detectedColumns.length > 0 ? (
                    <select
                      value={colCity}
                      onChange={(e) => setColCity(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- None --</option>
                      {detectedColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={colCity}
                      onChange={(e) => setColCity(e.target.value)}
                      placeholder="e.g. City"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Address Column
                  </label>
                  {detectedColumns.length > 0 ? (
                    <select
                      value={colAddress}
                      onChange={(e) => setColAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- None --</option>
                      {detectedColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={colAddress}
                      onChange={(e) => setColAddress(e.target.value)}
                      placeholder="e.g. Address"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Pin Code Column
                  </label>
                  {detectedColumns.length > 0 ? (
                    <select
                      value={colPinCode}
                      onChange={(e) => setColPinCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- None --</option>
                      {detectedColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={colPinCode}
                      onChange={(e) => setColPinCode(e.target.value)}
                      placeholder="e.g. Postal Code"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  )}
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Notes / Monthly Bill / Requirement Column
                  </label>
                  {detectedColumns.length > 0 ? (
                    <select
                      value={colNotes}
                      onChange={(e) => setColNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- None --</option>
                      {detectedColumns.map((col) => (
                        <option key={col} value={col}>{col}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={colNotes}
                      onChange={(e) => setColNotes(e.target.value)}
                      placeholder="e.g. Monthly Electricity Bill"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Auto-Sync Configuration */}
            <div className="pt-2 border-t border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Enable Background Auto-Sync</span>
              </label>

              {autoSync && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-600">Interval:</span>
                  <select
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(Number(e.target.value))}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value={1}>Every 1 min</option>
                    <option value={5}>Every 5 min</option>
                    <option value={15}>Every 15 min</option>
                  </select>
                </div>
              )}

              {campaign && onSyncNow && (
                <button
                  type="button"
                  onClick={() => onSyncNow(campaign.id)}
                  className="px-3 py-1.5 bg-white border border-emerald-600 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold transition flex items-center gap-1 self-start sm:self-auto"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Now</span>
                </button>
              )}
            </div>
          </div>

          {/* Telecallers Assignment & Mode */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Telecaller Assignment for this Campaign
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={selectAllTelecallers}
                  className="text-emerald-700 hover:underline font-semibold"
                >
                  Select All
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={deselectAllTelecallers}
                  className="text-slate-500 hover:underline"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Assignment Mode Radio */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  assignmentMode === 'round_robin'
                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="assignMode"
                  value="round_robin"
                  checked={assignmentMode === 'round_robin'}
                  onChange={() => setAssignmentMode('round_robin')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <p className="leading-tight">Auto Round-Robin (Equal Split)</p>
                  <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                    Evenly distributes imported leads among selected telecallers.
                  </p>
                </div>
              </label>

              <label
                className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                  assignmentMode === 'manual'
                    ? 'bg-emerald-50/80 border-emerald-400 text-emerald-950 font-bold'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="assignMode"
                  value="manual"
                  checked={assignmentMode === 'manual'}
                  onChange={() => setAssignmentMode('manual')}
                  className="mt-0.5 text-emerald-600"
                />
                <div>
                  <p className="leading-tight">Manual Assignment</p>
                  <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                    Leads stay Unassigned until admin manually assigns them.
                  </p>
                </div>
              </label>
            </div>

            {/* Active Telecallers Checkbox Grid */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-600">
                Selected Telecallers ({assignedTelecallers.length} of {telecallers.length})
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {telecallers.map((t) => {
                  const isChecked = assignedTelecallers.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleTelecaller(t.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between gap-1 transition ${
                        isChecked
                          ? 'bg-white border-emerald-500 text-slate-900 font-bold shadow-2xs'
                          : 'bg-slate-100/70 border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="truncate">{t.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-emerald-600 shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-slate-700">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs rounded-xl transition min-h-[44px]"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="campaign-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : campaign ? 'Update Campaign' : 'Create Campaign'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
