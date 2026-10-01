import React, { useState, useMemo, useEffect } from 'react';
import {
  UserPlus,
  FileSpreadsheet,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  MapPin,
  Building,
  RotateCcw,
  Sparkles,
  ArrowRight,
  ClipboardPaste,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Lead, LeadSource, CampaignAssignmentMode } from '../../types';
import {
  normalizePhone,
  parseCsv,
  mapCampaignCsvRowsToLeads,
  getSampleCsvContent,
  SkippedRowInfo,
} from '../../services/csvParser';
import { useToast } from '../../context/ToastContext';

export const AddLeadsView: React.FC<{ onNavigateToLead?: (leadId: string) => void }> = ({
  onNavigateToLead,
}) => {
  const { leads, users, campaigns, addLeadManual, bulkAddManualLeads } = useCRM();
  const { currentUser } = useAuth();
  const { success, error, info } = useToast();

  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // Single Lead Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [source, setSource] = useState<LeadSource>('Inbound Call');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [assignMode, setAssignMode] = useState<'round_robin' | 'specific'>('round_robin');
  const [selectedTelecallerId, setSelectedTelecallerId] = useState('');

  // Status after single save
  const [justSavedLead, setJustSavedLead] = useState<Lead | null>(null);
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  // Bulk Upload State
  const [bulkSource, setBulkSource] = useState<LeadSource>('Inbound Call');
  const [bulkCampaignId, setBulkCampaignId] = useState('');
  const [bulkAssignMode, setBulkAssignMode] = useState<'round_robin' | 'specific' | 'manual'>('round_robin');
  const [bulkTelecallerId, setBulkTelecallerId] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);

  // Bulk Column Mappings
  const [bColName, setBColName] = useState('Full Name');
  const [bColPhone, setBColPhone] = useState('Phone Number');
  const [bColEmail, setBColEmail] = useState('Email');
  const [bColCity, setBColCity] = useState('City');
  const [bColAddress, setBColAddress] = useState('Address');
  const [bColPinCode, setBColPinCode] = useState('Postal Code');
  const [bColNotes, setBColNotes] = useState('Notes');

  const [bulkAnalysis, setBulkAnalysis] = useState<{
    validCount: number;
    duplicateCount: number;
    invalidCount: number;
    skippedRows: SkippedRowInfo[];
  } | null>(null);

  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // Active telecallers
  const telecallers = useMemo(() => {
    return users.filter((u) => u.role === 'telecaller' && u.active);
  }, [users]);

  // Live duplicate check on single phone
  const duplicateLead = useMemo(() => {
    const clean = normalizePhone(phone);
    if (!clean || clean.length < 10) return null;
    return leads.find((l) => normalizePhone(l.phone) === clean) || null;
  }, [phone, leads]);

  // Single Lead Submit
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      error('Phone required', 'Please enter a 10-digit phone number.');
      return;
    }

    if (duplicateLead) {
      error('Duplicate Phone', `A lead already exists for +91 ${normalizePhone(phone)}.`);
      return;
    }

    setIsSubmittingSingle(true);
    try {
      const selectedCamp = campaigns.find((c) => c.id === selectedCampaignId);
      const res = await addLeadManual(
        {
          name: name.trim() || 'Direct Inquiry',
          phone: normalizePhone(phone),
          email: email.trim() || undefined,
          city: city.trim() || undefined,
          address: address.trim() || undefined,
          pinCode: pinCode.trim() || undefined,
          source,
          campaignId: selectedCampaignId || undefined,
          campaign: selectedCamp ? selectedCamp.name : 'Direct Entry',
          notes: notes.trim(),
        },
        {
          assignMode: assignMode === 'specific' ? 'specific' : 'round_robin',
          telecallerId: selectedTelecallerId,
        }
      );

      if (res.success && res.lead) {
        setJustSavedLead(res.lead);
      }
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  const handleAddAnother = () => {
    setName('');
    setPhone('');
    setEmail('');
    setCity('');
    setAddress('');
    setPinCode('');
    setNotes('');
    setJustSavedLead(null);
  };

  // Bulk CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        processRawText(content);
      }
    };
    reader.readAsText(file);
  };

  // Process raw text (from file or paste)
  const processRawText = (text: string) => {
    try {
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0 || rows.length === 0) {
        error('Invalid CSV', 'Could not find any rows in the input text.');
        return;
      }

      setParsedHeaders(headers);
      setParsedRows(rows);

      // Auto-detect columns
      headers.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes('name')) setBColName(h);
        else if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) setBColPhone(h);
        else if (lower.includes('email') || lower.includes('mail')) setBColEmail(h);
        else if (lower.includes('city') || lower.includes('district')) setBColCity(h);
        else if (lower.includes('address') || lower.includes('location')) setBColAddress(h);
        else if (lower.includes('pin') || lower.includes('postal')) setBColPinCode(h);
        else if (lower.includes('note') || lower.includes('bill')) setBColNotes(h);
      });

      info('Rows Loaded', `Parsed ${rows.length} rows and ${headers.length} columns.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      error('Failed to parse rows', msg);
    }
  };

  // Re-run analysis whenever mapping or parsed rows change
  useEffect(() => {
    if (parsedRows.length === 0) {
      setBulkAnalysis(null);
      return;
    }

    const existingPhones = new Set(
      leads.map((l) => normalizePhone(l.phone)).filter((p) => p.length >= 10)
    );

    const mapping = {
      nameCol: bColName,
      phoneCol: bColPhone,
      emailCol: bColEmail,
      cityCol: bColCity,
      addressCol: bColAddress,
      pinCodeCol: bColPinCode,
      notesCol: bColNotes,
    };

    const result = mapCampaignCsvRowsToLeads(
      parsedRows,
      mapping,
      existingPhones,
      bulkCampaignId,
      'Bulk Upload',
      'Other'
    );

    setBulkAnalysis({
      validCount: result.validLeads.length,
      duplicateCount: result.duplicateCount,
      invalidCount: result.invalidCount,
      skippedRows: result.skippedRows,
    });
  }, [parsedRows, bColName, bColPhone, bColEmail, bColCity, bColAddress, bColPinCode, bColNotes, leads, bulkCampaignId]);

  // Download Sample CSV
  const handleDownloadSampleCsv = () => {
    const content = getSampleCsvContent();
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'green_view_sample_leads.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download Error Report for Skipped Rows
  const handleDownloadErrorReport = () => {
    if (!bulkAnalysis || bulkAnalysis.skippedRows.length === 0) return;

    let csv = 'Row Number,Prospect Name,Phone Number,Skip Reason,Details\n';
    bulkAnalysis.skippedRows.forEach((s) => {
      csv += `"${s.rowNumber}","${s.name.replace(/"/g, '""')}","${s.phone}","${s.reason}","${s.details.replace(/"/g, '""')}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lead_import_errors_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Confirm Bulk Import
  const handleConfirmBulkImport = async () => {
    if (!bulkAnalysis || bulkAnalysis.validCount === 0) {
      error('No valid rows', 'There are no valid, non-duplicate rows to import.');
      return;
    }

    setIsSubmittingBulk(true);
    try {
      const selectedCamp = campaigns.find((c) => c.id === bulkCampaignId);
      const rowsToImport = parsedRows.map((r) => ({
        name: bColName ? r[bColName] : undefined,
        phone: bColPhone ? r[bColPhone] : undefined,
        email: bColEmail ? r[bColEmail] : undefined,
        city: bColCity ? r[bColCity] : undefined,
        address: bColAddress ? r[bColAddress] : undefined,
        pinCode: bColPinCode ? r[bColPinCode] : undefined,
        notes: bColNotes ? r[bColNotes] : undefined,
      }));

      await bulkAddManualLeads(rowsToImport, {
        source: bulkSource,
        campaignId: bulkCampaignId || undefined,
        campaignName: selectedCamp ? selectedCamp.name : undefined,
        assignmentMode: bulkAssignMode,
        specificTelecallerId: bulkTelecallerId,
      });

      // Reset
      setPastedText('');
      setParsedRows([]);
      setParsedHeaders([]);
      setFileName('');
      setBulkAnalysis(null);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Header with Sub-tabs */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Add Offline & Incoming Leads
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter customer inquiries from phone calls, walk-ins, or bulk spreadsheet uploads
            </p>
          </div>

          {/* Sub-tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'single'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Add One Lead</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'bulk'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
              <span>Bulk Upload (CSV / Paste)</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: ADD ONE LEAD */}
      {activeTab === 'single' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
          {justSavedLead ? (
            <div className="p-6 text-center bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3 animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-emerald-950">
                  Lead Added Successfully!
                </h3>
                <p className="text-xs text-emerald-800 mt-1 font-medium">
                  {justSavedLead.name} (+91 {justSavedLead.phone}) has been registered and assigned to{' '}
                  <strong>{justSavedLead.assignedTelecallerName || 'Unassigned'}</strong>.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddAnother}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 min-h-[44px]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Another Lead</span>
                </button>
                {onNavigateToLead && (
                  <button
                    type="button"
                    onClick={() => onNavigateToLead(justSavedLead.id)}
                    className="px-4 py-2.5 bg-white border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold hover:bg-emerald-100 transition min-h-[44px]"
                  >
                    View in Leads List
                  </button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              {/* Live Duplicate Warning Banner */}
              {duplicateLead && (
                <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-in slide-in-from-top-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">
                      Duplicate Detected: +91 {normalizePhone(phone)} already exists in CRM!
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Customer: <strong>{duplicateLead.name}</strong> · Status: <strong>{duplicateLead.status}</strong> · Assigned: <strong>{duplicateLead.assignedTelecallerName}</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Customer Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Suman Mukherjee"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 focus:border-emerald-500 rounded-xl text-xs sm:text-sm font-semibold text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Mobile Phone Number <span className="text-rose-500">* (10 digits)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      placeholder="9830112233"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full pl-11 pr-3 py-2 bg-slate-50 focus:bg-white border rounded-xl text-xs sm:text-sm font-bold font-mono ${
                        duplicateLead
                          ? 'border-amber-400 bg-amber-50/50 text-amber-950 focus:border-amber-500'
                          : 'border-slate-300 focus:border-emerald-500 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Email & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="customer@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">City / District</label>
                  <input
                    type="text"
                    placeholder="e.g. Kolkata, Howrah, Durgapur"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
                  />
                </div>
              </div>

              {/* Address & Pin Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Premises Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 14/B Gariahat Road, South Kolkata"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">PIN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 700019"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Source & Campaign */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Inquiry Source</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value as LeadSource)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
                  >
                    <option value="Inbound Call">Inbound Call (Incoming Phone Call)</option>
                    <option value="Walk-in">Walk-in (Office Visit)</option>
                    <option value="Referral">Referral (Existing Customer Ref)</option>
                    <option value="Other">Other / Offline Event</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Link to Campaign (Optional)</label>
                  <select
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold"
                  >
                    <option value="">-- Direct Entry (No Campaign) --</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.source})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignment Mode */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="text-xs font-bold text-slate-800 block">
                  Assign Lead To Telecaller
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 ${
                      assignMode === 'round_robin'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="singleAssign"
                      checked={assignMode === 'round_robin'}
                      onChange={() => setAssignMode('round_robin')}
                      className="text-emerald-600"
                    />
                    <span>Auto Round-Robin (Equally to Active Telecaller)</span>
                  </label>

                  <label
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 ${
                      assignMode === 'specific'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="singleAssign"
                      checked={assignMode === 'specific'}
                      onChange={() => setAssignMode('specific')}
                      className="text-emerald-600"
                    />
                    <span>Assign Specific Telecaller</span>
                  </label>
                </div>

                {assignMode === 'specific' && (
                  <div className="pt-2 animate-in fade-in">
                    <select
                      value={selectedTelecallerId}
                      onChange={(e) => setSelectedTelecallerId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                    >
                      <option value="">-- Choose Telecaller --</option>
                      {telecallers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Initial Notes / Requirements</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Inquired about 3kW On-Grid subsidy scheme; monthly bill is ₹3,800. Needs callback tomorrow at 11 AM."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingSingle || Boolean(duplicateLead)}
                  className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center justify-center gap-2 min-h-[48px]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{isSubmittingSingle ? 'Saving Lead...' : 'Save & Register Lead'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* VIEW 2: BULK UPLOAD (CSV / PASTE) */}
      {activeTab === 'bulk' && (
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Bulk Lead Import & Deduplication
              </h2>
              <p className="text-xs text-slate-500">
                Upload a CSV file or paste tabular rows directly from Excel or Google Sheets.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition min-h-[40px] shrink-0 self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Upload or Paste Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option A: File Upload */}
            <div className="p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-2">
              <Upload className="w-8 h-8 text-emerald-600 mb-1" />
              <p className="text-xs font-bold text-slate-800">
                {fileName ? `Loaded: ${fileName}` : 'Choose CSV file to upload'}
              </p>
              <p className="text-[11px] text-slate-400">Drag and drop or browse from device</p>
              <label className="mt-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition">
                Browse Files
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Option B: Direct Paste */}
            <div className="space-y-1.5 flex flex-col">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Or Paste Rows from Spreadsheet</span>
                {pastedText && (
                  <button
                    type="button"
                    onClick={() => {
                      setPastedText('');
                      setParsedRows([]);
                    }}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    Clear text
                  </button>
                )}
              </label>
              <textarea
                rows={4}
                placeholder="Full Name, Phone Number, Email, City..."
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  processRawText(e.target.value);
                }}
                className="w-full flex-1 p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800"
              />
            </div>
          </div>

          {/* If Rows Parsed: Column Mapping & Validation Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in">
              {/* Validation Summary Banner */}
              {bulkAnalysis && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">
                        Valid for Import
                      </span>
                      <p className="text-xl font-bold text-emerald-950 font-mono">
                        {bulkAnalysis.validCount}
                      </p>
                    </div>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase">
                        Duplicates Skipped
                      </span>
                      <p className="text-xl font-bold text-amber-950 font-mono">
                        {bulkAnalysis.duplicateCount}
                      </p>
                    </div>
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-rose-700 uppercase">
                        Invalid (Bad Phone)
                      </span>
                      <p className="text-xl font-bold text-rose-950 font-mono">
                        {bulkAnalysis.invalidCount}
                      </p>
                    </div>
                    <XCircle className="w-6 h-6 text-rose-600" />
                  </div>
                </div>
              )}

              {/* Column Mapping Selector */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">
                  Verify Column Mapping
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 block">Name Column</label>
                    <select
                      value={bColName}
                      onChange={(e) => setBColName(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      {parsedHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block font-bold">Phone Column *</label>
                    <select
                      value={bColPhone}
                      onChange={(e) => setBColPhone(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                    >
                      {parsedHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block">Email Column</label>
                    <select
                      value={bColEmail}
                      onChange={(e) => setBColEmail(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- None --</option>
                      {parsedHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block">City Column</label>
                    <select
                      value={bColCity}
                      onChange={(e) => setBColCity(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- None --</option>
                      {parsedHeaders.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Import Options: Source, Campaign, Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tag Source</label>
                  <select
                    value={bulkSource}
                    onChange={(e) => setBulkSource(e.target.value as LeadSource)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Inbound Call">Inbound Call</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Referral">Referral</option>
                    <option value="Other">Other / Offline Campaign</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Link to Campaign</label>
                  <select
                    value={bulkCampaignId}
                    onChange={(e) => setBulkCampaignId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="">-- No Specific Campaign --</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Assignment</label>
                  <select
                    value={bulkAssignMode}
                    onChange={(e) => setBulkAssignMode(e.target.value as any)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="round_robin">Auto Round-Robin (All Telecallers)</option>
                    <option value="specific">Assign to Specific Telecaller</option>
                    <option value="manual">Leave Unassigned</option>
                  </select>
                </div>
              </div>

              {bulkAssignMode === 'specific' && (
                <div className="max-w-xs space-y-1 text-xs">
                  <label className="font-bold text-slate-700">Choose Telecaller</label>
                  <select
                    value={bulkTelecallerId}
                    onChange={(e) => setBulkTelecallerId(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-xl"
                  >
                    <option value="">-- Pick Telecaller --</option>
                    {telecallers.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Skipped Rows Download & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div>
                  {bulkAnalysis && bulkAnalysis.skippedRows.length > 0 && (
                    <button
                      type="button"
                      onClick={handleDownloadErrorReport}
                      className="text-xs font-semibold text-rose-700 hover:underline flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Error Report ({bulkAnalysis.skippedRows.length} skipped rows)</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setParsedRows([]);
                      setFileName('');
                      setPastedText('');
                    }}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition min-h-[44px]"
                  >
                    Reset
                  </button>

                  <button
                    type="button"
                    disabled={isSubmittingBulk || !bulkAnalysis || bulkAnalysis.validCount === 0}
                    onClick={handleConfirmBulkImport}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-2 min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {isSubmittingBulk
                        ? 'Importing...'
                        : `Import ${bulkAnalysis?.validCount || 0} Valid Leads`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
