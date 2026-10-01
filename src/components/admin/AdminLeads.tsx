import React, { useState, useMemo } from 'react';
import {
  PhoneCall,
  Search,
  Filter,
  Download,
  Plus,
  Users,
  CheckSquare,
  Square,
  ChevronDown,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Lead } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { DEFAULT_STATUSES } from '../../constants/statusConfig';
import { LeadDetailModal } from '../leads/LeadDetailModal';
import { DateRangeBar } from '../common/DateRangeBar';
import { DateRangeFilterState, isDateWithinRange } from '../../utils/dateFilter';
import { AllCallStatusesBreakdown } from './AllCallStatusesBreakdown';

export const AdminLeads: React.FC = () => {
  const {
    leads,
    users,
    campaigns,
    checklistQuestions,
    reassignLead,
    bulkReassignLeads,
    addLeadManual,
    deleteLead,
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTelecaller, setSelectedTelecaller] = useState<string>('ALL');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('ALL');
  const [showStatusMatrix, setShowStatusMatrix] = useState(true);

  // Date Range Filter
  const [dateRange, setDateRange] = useState<DateRangeFilterState>({
    preset: 'all',
    startDate: '',
    endDate: '',
  });

  // Bulk Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showBulkReassignModal, setShowBulkReassignModal] = useState(false);
  const [targetTelecallerId, setTargetTelecallerId] = useState('');

  // Manual Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCampaign, setNewLeadCampaign] = useState('');
  const [newLeadSource, setNewLeadSource] = useState<'Meta' | 'Google' | 'Manual'>('Manual');
  const [newLeadNotes, setNewLeadNotes] = useState('');

  // Detail Modal
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);

  const telecallers = useMemo(() => {
    return users.filter((u) => u.role === 'telecaller');
  }, [users]);

  // Date-filtered leads (base for status matrix and list)
  const dateFilteredLeads = useMemo(() => {
    return leads.filter((lead) => isDateWithinRange(lead.createdAt, dateRange));
  }, [leads, dateRange]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return dateFilteredLeads.filter((lead) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = lead.name.toLowerCase().includes(q);
        const mPhone = lead.phone.includes(q);
        const mCampaign = lead.campaign.toLowerCase().includes(q);
        if (!mName && !mPhone && !mCampaign) return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && lead.status !== selectedStatus) {
        return false;
      }

      // Telecaller
      if (selectedTelecaller !== 'ALL' && lead.assignedTelecallerId !== selectedTelecaller) {
        return false;
      }

      // Source
      if (selectedSource !== 'ALL' && lead.source !== selectedSource) {
        return false;
      }

      // Campaign
      if (selectedCampaign !== 'ALL') {
        const matchesCamp = lead.campaignId === selectedCampaign || lead.campaign === selectedCampaign;
        if (!matchesCamp) return false;
      }

      return true;
    });
  }, [dateFilteredLeads, searchQuery, selectedStatus, selectedTelecaller, selectedSource, selectedCampaign]);

  // Bulk Select Toggle
  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Reassign Handler
  const handleBulkReassign = async () => {
    if (!targetTelecallerId || selectedLeadIds.length === 0) return;
    const targetTc = telecallers.find((t) => t.id === targetTelecallerId);
    if (!targetTc) return;

    await bulkReassignLeads(selectedLeadIds, targetTc.id, targetTc.name);
    setShowBulkReassignModal(false);
    setSelectedLeadIds([]);
    setTargetTelecallerId('');
  };

  // Export to CSV
  const exportToCsv = () => {
    const headers = [
      'Lead ID',
      'Name',
      'Phone',
      'Email',
      'Campaign',
      'Source',
      'Status',
      'Assigned Telecaller',
      'Survey Date',
      'Survey Time',
      'Address',
      'PIN Code',
      'Assigned Surveyor',
      'Survey Status',
      'Created At',
      'Notes',
    ];

    const rows = filteredLeads.map((l) => [
      l.id,
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      `"${l.email || ''}"`,
      `"${l.campaign.replace(/"/g, '""')}"`,
      l.source,
      l.status,
      `"${l.assignedTelecallerName || 'Unassigned'}"`,
      l.surveyDate || '',
      l.surveyTime || '',
      `"${(l.address || '').replace(/"/g, '""')}"`,
      l.pinCode || '',
      `"${l.assignedSurveyorName || ''}"`,
      l.surveyStatus || '',
      l.createdAt,
      `"${(l.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `green_view_leads_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle Manual Add
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName.trim() || !newLeadPhone.trim()) {
      alert('Name and phone number are required.');
      return;
    }
    const cleanDigits = newLeadPhone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }

    await addLeadManual({
      name: newLeadName.trim(),
      phone: cleanDigits.slice(-10),
      campaign: newLeadCampaign.trim() || 'Direct Inquiry',
      source: newLeadSource,
      notes: newLeadNotes.trim(),
    });

    setShowAddModal(false);
    setNewLeadName('');
    setNewLeadPhone('');
    setNewLeadCampaign('');
    setNewLeadNotes('');
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            All Solar Leads ({filteredLeads.length})
          </h2>
          <p className="text-xs text-slate-500">
            Search, filter, bulk reassign, and export CRM records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStatusMatrix(!showStatusMatrix)}
            className={`px-3 py-2 border rounded-xl text-xs font-bold transition min-h-[44px] ${
              showStatusMatrix
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {showStatusMatrix ? 'Hide Status Breakdown' : 'Show All 19 Statuses'}
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Lead</span>
          </button>

          <button
            onClick={exportToCsv}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition min-h-[44px]"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range Filter Bar */}
      <DateRangeBar value={dateRange} onChange={setDateRange} />

      {/* All Call Statuses Breakdown Matrix (Together) */}
      {showStatusMatrix && (
        <AllCallStatusesBreakdown
          leads={dateFilteredLeads}
          selectedStatus={selectedStatus}
          onSelectStatus={(st) => setSelectedStatus(st)}
        />
      )}

      {/* Filter and Search Toolbar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads by customer name, phone number, or campaign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* Status */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
          >
            <option value="ALL">All Statuses ({leads.length})</option>
            {DEFAULT_STATUSES.map((st) => (
              <option key={st.code} value={st.code}>
                {st.label}
              </option>
            ))}
          </select>

          {/* Campaign Filter */}
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
          >
            <option value="ALL">All Campaigns ({campaigns.length})</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Telecaller */}
          <select
            value={selectedTelecaller}
            onChange={(e) => setSelectedTelecaller(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
          >
            <option value="ALL">All Telecallers</option>
            {telecallers.map((tc) => (
              <option key={tc.id} value={tc.id}>
                {tc.name}
              </option>
            ))}
          </select>

          {/* Source */}
          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-700 font-medium"
          >
            <option value="ALL">All Lead Sources</option>
            <option value="Meta">Meta Ads</option>
            <option value="Google">Google Ads</option>
            <option value="Inbound Call">Inbound Call</option>
            <option value="Walk-in">Walk-in</option>
            <option value="Referral">Referral</option>
            <option value="Other">Other / Offline</option>
            <option value="Manual">Manual Entry</option>
          </select>
        </div>

        {/* Bulk Action Strip (when items selected) */}
        {selectedLeadIds.length > 0 && (
          <div className="p-2.5 rounded-xl bg-slate-900 text-white flex items-center justify-between gap-2 animate-in fade-in">
            <span className="text-xs font-semibold">
              {selectedLeadIds.length} lead{selectedLeadIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkReassignModal(true)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition"
              >
                Reassign Telecaller
              </button>
              <button
                onClick={() => setSelectedLeadIds([])}
                className="text-xs text-slate-300 hover:text-white px-2 py-1"
              >
                Deselect
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table / Responsive Cards */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAll}
              className="p-1 rounded text-slate-400 hover:text-slate-700"
              title="Select all filtered"
            >
              {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
            <span>Showing {filteredLeads.length} records</span>
          </div>
        </div>

        {filteredLeads.map((lead) => {
          const isSelected = selectedLeadIds.includes(lead.id);

          return (
            <div
              key={lead.id}
              className={`p-3.5 rounded-2xl bg-white border transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <button
                  onClick={() => toggleSelectLead(lead.id)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 shrink-0 mt-0.5"
                >
                  {isSelected ? (
                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>

                <div
                  className="min-w-0 cursor-pointer"
                  onClick={() => setSelectedLeadForDetail(lead)}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-slate-900 hover:text-emerald-700 transition truncate">
                      {lead.name}
                    </h3>
                    <span className="font-mono text-xs text-slate-500 font-medium">
                      +91 {lead.phone}
                    </span>
                    <StatusBadge status={lead.status} size="sm" />
                  </div>

                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    Campaign: <strong className="text-emerald-800">{lead.campaign}</strong> · Source: <span className="font-semibold text-slate-700">{lead.source}</span> · TC: {lead.assignedTelecallerName || 'Unassigned'}
                    {lead.city && ` · ${lead.city}`}
                    {lead.addedByName && ` · Added by ${lead.addedByName}`}
                  </p>

                  {lead.notes && (
                    <p className="text-xs text-slate-600 line-clamp-1 italic mt-1">
                      "{lead.notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => setSelectedLeadForDetail(lead)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
                >
                  View Detail
                </button>

                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete lead ${lead.name}?`)) {
                      deleteLead(lead.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                  title="Delete Lead"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bulk Reassign Modal */}
      {showBulkReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Bulk Reassign ({selectedLeadIds.length} Leads)
            </h3>
            <p className="text-xs text-slate-500">
              Select the active telecaller to assign all selected leads to:
            </p>

            <select
              value={targetTelecallerId}
              onChange={(e) => setTargetTelecallerId(e.target.value)}
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 font-medium"
            >
              <option value="">-- Choose Telecaller --</option>
              {telecallers.map((tc) => (
                <option key={tc.id} value={tc.id}>
                  {tc.name} ({tc.username})
                </option>
              ))}
            </select>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowBulkReassignModal(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkReassign}
                disabled={!targetTelecallerId}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-xs"
              >
                Assign Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Add New Customer Lead</h3>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Full Customer Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  placeholder="e.g. Ramesh Chandra Sen"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  10-Digit Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={10}
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9830112233"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Campaign / City
                </label>
                <input
                  type="text"
                  value={newLeadCampaign}
                  onChange={(e) => setNewLeadCampaign(e.target.value)}
                  placeholder="e.g. Kolkata 3kW Rooftop Solar"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Source</label>
                <select
                  value={newLeadSource}
                  onChange={(e) => setNewLeadSource(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                >
                  <option value="Manual">Manual Walk-in / Reference</option>
                  <option value="Meta">Meta (Facebook/Instagram Ads)</option>
                  <option value="Google">Google Ads</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Initial Notes</label>
                <textarea
                  rows={2}
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  placeholder="Customer requirements or roof details..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLeadForDetail && (
        <LeadDetailModal
          lead={selectedLeadForDetail}
          questions={checklistQuestions}
          isOpen={Boolean(selectedLeadForDetail)}
          onClose={() => setSelectedLeadForDetail(null)}
          onStartCall={() => {}}
          onOpenChecklist={() => {}}
        />
      )}
    </div>
  );
};
