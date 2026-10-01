import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Clock,
  Calendar,
  MapPin,
  FileText,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';
import { Lead } from '../../types';
import { DEFAULT_STATUSES, CATEGORY_LABELS } from '../../constants/statusConfig';
import { formatCallDuration, telephonyService } from '../../services/telephony';

interface CallTimerSheetProps {
  lead: Lead;
  initialDuration?: number;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    status: string;
    duration: number;
    notes?: string;
    callbackDate?: string;
    callbackTime?: string;
    surveyDate?: string;
    surveyTime?: string;
    address?: string;
    pinCode?: string;
    recordingUrl?: string;
  }) => void;
}

export const CallTimerSheet: React.FC<CallTimerSheetProps> = ({
  lead,
  initialDuration = 0,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [duration, setDuration] = useState<number>(initialDuration);
  const [isManualDuration, setIsManualDuration] = useState(false);
  const [manualMinutes, setManualMinutes] = useState(Math.floor(initialDuration / 60));
  const [manualSeconds, setManualSeconds] = useState(initialDuration % 60);

  const [selectedStatus, setSelectedStatus] = useState<string>(lead.status || 'CONFIRMED');
  const [notes, setNotes] = useState<string>(lead.notes || '');
  const [callbackDate, setCallbackDate] = useState<string>(
    lead.callbackDate || new Date().toISOString().split('T')[0]
  );
  const [callbackTime, setCallbackTime] = useState<string>(lead.callbackTime || '10:00 AM');
  const [surveyDate, setSurveyDate] = useState<string>(
    lead.surveyDate || new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [surveyTime, setSurveyTime] = useState<string>(lead.surveyTime || '11:00 AM');
  const [address, setAddress] = useState<string>(lead.address || '');
  const [pinCode, setPinCode] = useState<string>(lead.pinCode || '');
  const [recordingUrl, setRecordingUrl] = useState<string | undefined>(undefined);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    setDuration(initialDuration);
    setManualMinutes(Math.floor(initialDuration / 60));
    setManualSeconds(initialDuration % 60);
    setSelectedStatus(lead.status || 'CONFIRMED');
    setNotes(lead.notes || '');
    setAddress(lead.address || '');
    setPinCode(lead.pinCode || '');
  }, [initialDuration, lead]);

  if (!isOpen) return null;

  const currentDurationInSeconds = isManualDuration
    ? Math.max(0, manualMinutes * 60 + manualSeconds)
    : duration;

  const isConfirmed = selectedStatus === 'CONFIRMED';
  const isCallback = selectedStatus === 'FOLLOW_UP' || selectedStatus === 'CALL_LATER';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate pin code if entered (must be 6 digits if provided)
    if (pinCode && !/^\d{6}$/.test(pinCode.trim())) {
      alert('Please enter a valid 6-digit PIN code or leave it blank.');
      return;
    }

    onSubmit({
      status: selectedStatus,
      duration: currentDurationInSeconds,
      notes: notes.trim(),
      callbackDate: isCallback ? callbackDate : undefined,
      callbackTime: isCallback ? callbackTime : undefined,
      surveyDate: isConfirmed ? surveyDate : undefined,
      surveyTime: isConfirmed ? surveyTime : undefined,
      address: isConfirmed ? address.trim() : undefined,
      pinCode: isConfirmed ? pinCode.trim() : undefined,
      recordingUrl,
    });

    onClose();
  };

  // Group statuses by category
  const categories: Array<keyof typeof CATEGORY_LABELS> = [
    'positive',
    'callback',
    'not_reached',
    'closed_lost',
    'bad_lead',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-xl max-h-[92vh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-4 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h2 className="text-sm sm:text-base font-bold truncate leading-tight">
                Log Call: {lead.name}
              </h2>
              <p className="text-xs text-slate-300 truncate">
                +91 {lead.phone} · {lead.campaign}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Call Duration Counter & Telephony Ready */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-700">Call Duration</p>
                {!isManualDuration ? (
                  <p className="text-lg font-bold text-slate-900 font-mono">
                    {formatCallDuration(duration)}
                  </p>
                ) : (
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      value={manualMinutes}
                      onChange={(e) => setManualMinutes(parseInt(e.target.value) || 0)}
                      className="w-14 p-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-center"
                    />
                    <span className="text-xs text-slate-500">m</span>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={manualSeconds}
                      onChange={(e) => setManualSeconds(parseInt(e.target.value) || 0)}
                      className="w-14 p-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded text-center"
                    />
                    <span className="text-xs text-slate-500">s</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsManualDuration((prev) => !prev)}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-medium underline underline-offset-2"
              >
                {isManualDuration ? 'Use Timer' : 'Edit Duration'}
              </button>

              {/* Cloud Telephony Mock Recording inject button */}
              <button
                type="button"
                onClick={() => {
                  setRecordingUrl('https://actions.google.com/sounds/v1/telephones/telephone_touch_tone.ogg');
                  setDuration(195);
                  setIsManualDuration(false);
                }}
                className="text-[11px] bg-slate-200/80 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-medium"
                title="Simulate cloud recording from Exotel / Knowlarity API"
              >
                Cloud Call Audio
              </button>
            </div>
          </div>

          {/* Recording Player (if available) */}
          {recordingUrl && (
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-xs text-emerald-900 font-semibold">
                <Volume2 className="w-4 h-4 text-emerald-700" />
                <span>Call Recording Available (Exotel / Knowlarity Cloud)</span>
              </div>
              <audio
                controls
                src={recordingUrl}
                className="h-8 max-w-[200px]"
                onPlay={() => setIsPlayingAudio(true)}
                onPause={() => setIsPlayingAudio(false)}
              />
            </div>
          )}

          {/* Call Status Selector (All 19 statuses grouped by category) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Call Status <span className="text-rose-500">*</span>
            </label>

            <div className="space-y-3">
              {categories.map((catKey) => {
                const statusesInCat = DEFAULT_STATUSES.filter((s) => s.category === catKey);
                const catMeta = CATEGORY_LABELS[catKey];

                return (
                  <div key={catKey} className="space-y-1">
                    <p className="text-[11px] font-semibold text-slate-400 capitalize">
                      {catMeta.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {statusesInCat.map((st) => {
                        const isSelected = selectedStatus === st.code;
                        return (
                          <button
                            key={st.code}
                            type="button"
                            onClick={() => setSelectedStatus(st.code)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all text-left flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-102 font-semibold'
                                : `${st.bgColor} hover:brightness-95`
                            }`}
                          >
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: st.color }}
                            />
                            <span>{st.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conditional: Callback on (for FOLLOW_UP / CALL_LATER) */}
          {isCallback && (
            <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Schedule Callback</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Callback Date
                  </label>
                  <input
                    type="date"
                    value={callbackDate}
                    onChange={(e) => setCallbackDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Preferred Time
                  </label>
                  <input
                    type="text"
                    value={callbackTime}
                    onChange={(e) => setCallbackTime(e.target.value)}
                    placeholder="e.g. 04:30 PM"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Conditional: Site Survey Details (for CONFIRMED) */}
          {isConfirmed && (
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Site Survey Details (Optional)</span>
                </div>
                <span className="text-[10px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-medium">
                  Sent to Back Office
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Survey Date
                  </label>
                  <input
                    type="date"
                    value={surveyDate}
                    onChange={(e) => setSurveyDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Survey Time
                  </label>
                  <input
                    type="text"
                    value={surveyTime}
                    onChange={(e) => setSurveyTime(e.target.value)}
                    placeholder="e.g. 11:30 AM"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Full Customer Address
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House/Plot no, Street, Landmark, City..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  PIN Code (6 digits)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 700091"
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 font-mono"
                />
              </div>
            </div>
          )}

          {/* Notes (Optional) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Call Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Key points from the conversation, customer queries, roof size mentioned, electricity bill..."
              className="w-full px-3 py-2.5 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-slate-800 transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition min-h-[44px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-xl shadow-sm transition min-h-[44px]"
            >
              Save & Log Call
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
