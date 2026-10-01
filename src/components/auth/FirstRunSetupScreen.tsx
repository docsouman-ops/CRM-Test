import React, { useState } from 'react';
import {
  Database,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  SunMedium,
  ArrowRight,
  Code,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { SheetsApiClient, getAppsScriptTemplateCode } from '../../services/api';
import { useCRM } from '../../context/CRMContext';

interface FirstRunSetupScreenProps {
  onComplete: () => void;
}

export const FirstRunSetupScreen: React.FC<FirstRunSetupScreenProps> = ({ onComplete }) => {
  const { settings, updateSettings, syncWithSheets } = useCRM();

  const [webAppUrl, setWebAppUrl] = useState(settings.webAppUrl || '');
  const [secretKey, setSecretKey] = useState(settings.secretKey || 'GVA_SOLAR_SECRET_2026');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCodeGuide, setShowCodeGuide] = useState(false);

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setTestResult({
        success: false,
        message: 'Please enter your Apps Script Web App URL first.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const client = new SheetsApiClient(webAppUrl, secretKey);
    const result = await client.testConnection();
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSaveAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();

    await updateSettings({
      webAppUrl: webAppUrl.trim(),
      secretKey: secretKey.trim(),
    });

    if (webAppUrl.trim()) {
      await syncWithSheets();
    }

    localStorage.setItem('gva_crm_setup_completed', 'true');
    onComplete();
  };

  const handleSkipDemo = () => {
    localStorage.setItem('gva_crm_setup_completed', 'true');
    onComplete();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getAppsScriptTemplateCode(secretKey));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#1B7A4E] to-[#2E9D6B] flex items-center justify-center text-white mx-auto shadow-md">
            <SunMedium className="w-8 h-8 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Green View Agrotech CRM
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-emerald-700">
              Greening Your Life · Rooftop Solar (PM Surya Ghar)
            </p>
          </div>
        </div>

        {/* Setup Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-100 space-y-5">
          <div className="flex items-start gap-3 pb-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Database Setup (Google Sheets via Apps Script)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Google Sheets is the single database for your CRM. Paste your deployed Google Apps Script Web App URL and Secret Key.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAndContinue} className="space-y-4 text-xs">
            {/* Field 1: Web App URL */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Apps Script Web App URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                value={webAppUrl}
                onChange={(e) => setWebAppUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl font-mono text-xs transition"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Must end with <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">/exec</code>.
              </span>
            </div>

            {/* Field 2: Secret Key */}
            <div>
              <label className="block text-slate-800 font-bold mb-1">
                Secret Key <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder="GVA_SOLAR_SECRET_2026"
                  className="w-full pl-9 pr-3 py-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl font-mono text-xs transition"
                />
              </div>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold text-xs">{testResult.success ? 'Connection Successful!' : 'Connection Failed'}</p>
                  <p className="text-[11px] mt-0.5 leading-relaxed">{testResult.message}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full sm:w-auto px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition min-h-[44px]"
              >
                {isTesting ? 'Testing Connection...' : 'Test Connection'}
              </button>

              <button
                type="submit"
                className="flex-1 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl text-xs shadow-xs transition flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <span>Save & Continue to CRM</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Quick Demo Mode fallback button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Testing locally without Google Sheet?</span>
            <button
              type="button"
              onClick={handleSkipDemo}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
            >
              Continue with Demo Data
            </button>
          </div>

          {/* Collapsible Step-by-Step Setup Guide & Script Code */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowCodeGuide(!showCodeGuide)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>View Google Apps Script Setup Guide & Code</span>
              </div>
              <span className="text-emerald-700">{showCodeGuide ? 'Hide' : 'Show'}</span>
            </button>

            {showCodeGuide && (
              <div className="mt-3 p-4 rounded-2xl bg-slate-900 text-white space-y-3 text-xs animate-in fade-in">
                <div className="space-y-1.5 text-slate-300">
                  <p className="font-bold text-white text-xs">Steps to create your Google Sheets backend:</p>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300">
                    <li>Create a new spreadsheet in Google Sheets.</li>
                    <li>Click <strong>Extensions &gt; Apps Script</strong>.</li>
                    <li>Paste the code below, replacing any existing code.</li>
                    <li>Click <strong>Deploy &gt; New deployment</strong>.</li>
                    <li>Select type: <strong>Web app</strong>.</li>
                    <li>Set <em>Execute as</em>: <strong>Me</strong>.</li>
                    <li>Set <em>Who has access</em>: <strong>Anyone</strong>.</li>
                    <li>Click <strong>Deploy</strong> and copy the Web App URL (ends in <code className="text-emerald-300">/exec</code>).</li>
                  </ol>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-semibold text-slate-400">Apps Script Code Template:</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 max-h-48 overflow-y-auto">
                  <pre>{getAppsScriptTemplateCode(secretKey)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Green View Agrotech · Rooftop Solar CRM (PM Surya Ghar) · Greening Your Life
        </p>
      </div>
    </div>
  );
};
