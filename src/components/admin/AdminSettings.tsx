import React, { useState } from 'react';
import {
  Database,
  Link,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  Code,
  Building,
  Megaphone,
  ArrowRight,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { SheetsApiClient, getAppsScriptTemplateCode } from '../../services/api';
import { convertToGoogleSheetCsvUrl, parseCsv } from '../../services/csvParser';
import { DEFAULT_STATUSES } from '../../constants/statusConfig';
import { ChecklistQuestion, ColumnMapping } from '../../types';

export const AdminSettings: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const {
    settings,
    updateSettings,
    syncAdLeads,
    isSyncing,
    checklistQuestions,
    updateChecklistQuestions,
  } = useCRM();

  const [activeSection, setActiveSection] = useState<'database' | 'adsheet' | 'autoassign' | 'checklist' | 'branding'>('database');

  // Database Connection State
  const [webAppUrl, setWebAppUrl] = useState(settings.webAppUrl || '');
  const [secretKey, setSecretKey] = useState(settings.secretKey || 'GVA_SOLAR_SECRET_2026');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Ad Sheet State
  const [adSheetUrl, setAdSheetUrl] = useState(settings.adSheetUrl || '');
  const [adAutoSync, setAdAutoSync] = useState(settings.adSheetAutoSync || false);
  const [adSyncInterval, setAdSyncInterval] = useState(settings.adSheetSyncInterval || 5);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>(
    settings.adSheetColumnMapping || {
      name: 'Full Name',
      phone: 'Phone Number',
      email: 'Email',
      campaign: 'Campaign Name',
      source: 'Platform',
    }
  );
  const [adSyncFeedback, setAdSyncFeedback] = useState<string | null>(null);

  // Auto-Assign State
  const [autoAssign, setAutoAssign] = useState(settings.autoAssignEnabled ?? true);

  // Branding State
  const [companyName, setCompanyName] = useState(settings.companyName || 'Green View Agrotech');
  const [tagline, setTagline] = useState(settings.tagline || 'Greening Your Life');

  // Checklist Questions Editor State
  const [questionsList, setQuestionsList] = useState<ChecklistQuestion[]>(checklistQuestions);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionSection, setNewQuestionSection] = useState<ChecklistQuestion['sectionKey']>('A');

  // Test Database Connection
  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    const client = new SheetsApiClient(webAppUrl, secretKey);
    const result = await client.testConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  // Save Database Settings
  const handleSaveDatabaseSettings = async () => {
    await updateSettings({
      webAppUrl: webAppUrl.trim(),
      secretKey: secretKey.trim(),
    });
  };

  // Copy Apps Script template code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(getAppsScriptTemplateCode(secretKey));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  // Fetch & Detect Columns from Ad Sheet Link
  const handleFetchColumns = async () => {
    if (!adSheetUrl) {
      alert('Please enter a Google Sheet URL.');
      return;
    }

    try {
      const csvUrl = convertToGoogleSheetCsvUrl(adSheetUrl);
      const res = await fetch(csvUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csvText = await res.text();
      const { headers } = parseCsv(csvText);

      if (headers.length === 0) {
        alert('Could not find columns in this sheet. Ensure it has headers.');
        return;
      }

      setDetectedColumns(headers);

      // Auto-detect matching column names
      const autoMap = { ...mapping };
      headers.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes('name')) autoMap.name = h;
        if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact')) autoMap.phone = h;
        if (lower.includes('email') || lower.includes('mail')) autoMap.email = h;
        if (lower.includes('campaign') || lower.includes('city') || lower.includes('location')) autoMap.campaign = h;
        if (lower.includes('source') || lower.includes('platform')) autoMap.source = h;
      });
      setMapping(autoMap);
      alert(`Detected ${headers.length} columns! Match them below.`);
    } catch (e: any) {
      alert(`Failed to load sheet: ${e.message}. Ensure the sheet is public or published as CSV (File > Share > Publish to web).`);
    }
  };

  // Save Ad Sheet Settings
  const handleSaveAdSheetSettings = async () => {
    await updateSettings({
      adSheetUrl: adSheetUrl.trim(),
      adSheetAutoSync: adAutoSync,
      adSheetSyncInterval: adSyncInterval,
      adSheetColumnMapping: mapping,
    });
  };

  // Trigger Ad Lead Sync
  const handleSyncAdLeadsNow = async () => {
    setAdSyncFeedback(null);
    const result = await syncAdLeads();
    setAdSyncFeedback(result.message || 'Sync completed');
  };

  // Save Auto Assign Settings
  const handleSaveAutoAssign = async () => {
    await updateSettings({ autoAssignEnabled: autoAssign });
  };

  // Save Branding
  const handleSaveBranding = async () => {
    await updateSettings({
      companyName: companyName.trim(),
      tagline: tagline.trim(),
    });
  };

  // Checklist Questions Handlers
  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const nextOrder = questionsList.length + 1;
    const newQ: ChecklistQuestion = {
      id: `q_${Date.now()}`,
      sectionKey: newQuestionSection,
      sectionTitle:
        newQuestionSection === 'A'
          ? 'Genuine Customer'
          : newQuestionSection === 'B'
          ? 'House and Roof'
          : newQuestionSection === 'C'
          ? 'Electricity Connection'
          : newQuestionSection === 'D'
          ? 'Documents'
          : newQuestionSection === 'E'
          ? 'Size, Brand and Price'
          : newQuestionSection === 'F'
          ? 'Money and Decision'
          : 'Proof and Visit',
      questionText: newQuestionText.trim(),
      order: nextOrder,
    };

    const updated = [...questionsList, newQ];
    setQuestionsList(updated);
    updateChecklistQuestions(updated);
    setNewQuestionText('');
  };

  const handleDeleteQuestion = (id: string) => {
    const updated = questionsList.filter((q) => q.id !== id);
    setQuestionsList(updated);
    updateChecklistQuestions(updated);
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Header */}
      <div>
        <h2 className="text-sm sm:text-base font-bold text-slate-800">
          Admin Settings & Integrations
        </h2>
        <p className="text-xs text-slate-500">
          Configure Google Sheets backend, Ad leads pipeline, and CRM rules
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-white p-1.5 rounded-2xl border border-slate-200">
        <button
          onClick={() => setActiveSection('database')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition min-h-[44px] flex items-center gap-1.5 ${
            activeSection === 'database'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Google Sheets Database</span>
        </button>

        <button
          onClick={() => setActiveSection('adsheet')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition min-h-[44px] flex items-center gap-1.5 ${
            activeSection === 'adsheet'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>Campaigns Pipeline</span>
        </button>

        <button
          onClick={() => setActiveSection('autoassign')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition min-h-[44px] flex items-center gap-1.5 ${
            activeSection === 'autoassign'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Auto-Assignment</span>
        </button>

        <button
          onClick={() => setActiveSection('checklist')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition min-h-[44px] flex items-center gap-1.5 ${
            activeSection === 'checklist'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Checklist Editor</span>
        </button>

        <button
          onClick={() => setActiveSection('branding')}
          className={`px-3 py-2 rounded-xl text-xs font-semibold shrink-0 transition min-h-[44px] flex items-center gap-1.5 ${
            activeSection === 'branding'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Company Branding</span>
        </button>
      </div>

      {/* SECTION 1: GOOGLE SHEETS DATABASE SETTINGS */}
      {activeSection === 'database' && (
        <div className="space-y-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Google Apps Script Web App Connection
                </h3>
                <p className="text-xs text-slate-500">
                  Google Sheets serves as your live database. Enter your deployed Web App URL and Secret Key below.
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Google Apps Script Web App URL
                </label>
                <input
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Must end with <code className="bg-slate-100 px-1 py-0.5 rounded">/exec</code> and have access set to "Anyone".
                </span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Secret Key
                </label>
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="GVA_SOLAR_SECRET_2026"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <p className="text-xs">{testResult.message}</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition min-h-[44px]"
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>

                <button
                  type="button"
                  onClick={handleSaveDatabaseSettings}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition min-h-[44px]"
                >
                  Save Database Settings
                </button>
              </div>
            </div>
          </div>

          {/* Copy-Paste Google Apps Script Code Accordion */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold">Google Apps Script Code Template</h3>
                  <p className="text-xs text-slate-400">
                    Paste this into Extensions &gt; Apps Script in your Google Sheet
                  </p>
                </div>
              </div>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition active:scale-95 min-h-[44px]"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Script Code'}</span>
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto">
              <pre>{getAppsScriptTemplateCode(secretKey)}</pre>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: AD-LEADS IMPORT REPLACED BY CAMPAIGNS TAB */}
      {activeSection === 'adsheet' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Ad-Leads Import Replaced by Campaigns Tab
              </h3>
              <p className="text-xs text-slate-500">
                Single-sheet ad lead pipeline has been upgraded to multi-campaign feeds with dedicated round-robin & sync.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700 leading-relaxed">
            <p>
              In accordance with your CRM workflow, all Meta and Google ad sheets are now centrally created, synced, and assigned under the dedicated <strong>Campaigns</strong> tab in the navigation bar.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-900 block mb-1">🎯 Multi-Campaign Management</span>
                <span className="text-slate-500 text-[11px]">Connect individual Google Sheets for Meta, Google, or other ad sets.</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-900 block mb-1">👥 Dedicated Telecaller Splits</span>
                <span className="text-slate-500 text-[11px]">Select specific telecallers per campaign with equal round-robin or manual review.</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-900 block mb-1">⚡ Auto-Sync Intervals</span>
                <span className="text-slate-500 text-[11px]">1, 5, or 15-minute background polling intervals per campaign with instant "Sync now".</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-900 block mb-1">🛡️ Phone Deduplication</span>
                <span className="text-slate-500 text-[11px]">Automatic deduplication across all campaigns with skipped duplicate notices.</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate?.('campaigns')}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs transition shadow-xs min-h-[44px]"
            >
              <Megaphone className="w-4 h-4" />
              <span>Go to Campaigns Tab</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3: AUTO-ASSIGNMENT CONFIG */}
      {activeSection === 'autoassign' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Round-Robin Auto-Assignment
              </h3>
              <p className="text-xs text-slate-500">
                Equally distribute incoming ad leads among active telecallers
              </p>
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 text-xs">
                  Auto-Assign New Leads to Active Telecallers
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  When enabled, incoming leads are assigned evenly across available telecallers.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setAutoAssign(!autoAssign)}
                className="text-2xl text-emerald-600 focus:outline-none"
              >
                {autoAssign ? (
                  <ToggleRight className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleSaveAutoAssign}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition min-h-[44px]"
            >
              Save Auto-Assign Setting
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4: CHECKLIST QUESTIONS EDITOR */}
      {activeSection === 'checklist' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Verification Checklist Questions ({questionsList.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Customise the Yes/No solar verification questions
                </p>
              </div>
            </div>
          </div>

          {/* Add New Question */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <h4 className="font-bold text-slate-800">Add New Question</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <select
                value={newQuestionSection}
                onChange={(e) => setNewQuestionSection(e.target.value as any)}
                className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
              >
                <option value="A">Section A: Genuine Customer</option>
                <option value="B">Section B: House and Roof</option>
                <option value="C">Section C: Electricity Connection</option>
                <option value="D">Section D: Documents</option>
                <option value="E">Section E: Size & Price</option>
                <option value="F">Section F: Money & Decision</option>
                <option value="G">Section G: Proof & Visit</option>
              </select>

              <input
                type="text"
                value={newQuestionText}
                onChange={(e) => setNewQuestionText(e.target.value)}
                placeholder="Question text..."
                className="sm:col-span-2 p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />

              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1 min-h-[44px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Question</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-2 max-h-96 overflow-y-auto text-xs">
            {questionsList.map((q) => (
              <div
                key={q.id}
                className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-slate-100 font-bold text-[10px] text-slate-600 flex items-center justify-center shrink-0">
                    {q.order}
                  </span>
                  <div className="truncate">
                    <p className="font-medium text-slate-800 truncate">{q.questionText}</p>
                    <span className="text-[10px] text-slate-400">
                      Section {q.sectionKey}: {q.sectionTitle}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 5: BRANDING */}
      {activeSection === 'branding' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Company Details & Branding
              </h3>
              <p className="text-xs text-slate-500">
                Update organization name and slogan
              </p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Brand Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
              />
            </div>

            <button
              type="button"
              onClick={handleSaveBranding}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition min-h-[44px]"
            >
              Save Branding
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
