import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Edit3,
  PhoneCall,
  CheckCircle2,
  CalendarCheck,
  Users,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Download,
  Share2,
  Globe,
  Clock,
  Square,
  CheckSquare,
} from 'lucide-react';
import { Campaign, Lead, User } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { AllCallStatusesBreakdown } from '../admin/AllCallStatusesBreakdown';
import { LeadDetailModal } from '../leads/LeadDetailModal';

interface CampaignDetailViewProps {
  campaign: Campaign;
  leads: Lead[];
  users: User[];
  onBack: () => void;
  onEdit: () => void;
  onSync: () => Promise<void>;
  onBulkReassign: (leadIds: string[], telecallerId: string, telecallerName: string) => Promise<boolean>;
}

export const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({
  campaign,
  leads,
  users,
  onBack,
  onEdit,
  onSync,
  onBulkReassign,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [targetTelecallerId, setTargetTelecallerId] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);

  // Leads belonging to this campaign
  const campaignLeads = useMemo(() => {
    return leads.filter((l) => l.campaignId === campaign.id || l.campaign === campaign.name);
  }, [leads, campaign]);

  // Active telecallers
  const telecallers = useMemo(() => {
    return users.filter((u) => u.role === 'telecaller' && u.active);
  }, [users]);

  // Metrics
  const total = campaignLeads.length;
  const called = campaignLeads.filter((l) => (l.callAttempts || 0) > 0 || l.callHistory?.length).length;
  const confirmed = campaignLeads.filter((l) => l.status === 'CONFIRMED').length;
  const surveysDone = campaignLeads.filter((l) => l.surveyStatus === 'Completed').length;
  const calledRate = total > 0 ? Math.round((called / total) * 100) : 0;
  const confirmedRate = total > 0 ? Math.round((confirmed / total) * 100) : 0;

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return campaignLeads.filter((lead) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = lead.name.toLowerCase().includes(q);
        const mPhone = lead.phone.includes(q);
        if (!mName && !mPhone) return false;
      }
      if (selectedStatus !== 'ALL' && lead.status !== selectedStatus) {
        return false;
      }
      return true;
    });
  }, [campaignLeads, searchQuery, selectedStatus]);

  // Per-telecaller breakdown in this campaign
  const telecallerPerformance = useMemo(() => {
    const list = telecallers.map((tc) => {
      const tcLeads = campaignLeads.filter((l) => l.assignedTelecallerId === tc.id);
      const tcCalled = tcLeads.filter((l) => (l.callAttempts || 0) > 0).length;
      const tcConfirmed = tcLeads.filter((l) => l.status === 'CONFIRMED').length;
      const convRate = tcLeads.length > 0 ? Math.round((tcConfirmed / tcLeads.length) * 100) : 0;
      return {
        id: tc.id,
        name: tc.name,
        assigned: tcLeads.length,
        called: tcCalled,
        confirmed: tcConfirmed,
        convRate,
      };
    });

    const unassignedCount = campaignLeads.filter((l) => !l.assignedTelecallerId).length;

    return { list, unassignedCount };
  }, [telecallers, campaignLeads]);

  // Sync button handler
  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await onSync();
    } finally {
      setIsSyncing(false);
    }
  };

  // Reassignment
  const handleBulkReassignSubmit = async () => {
    if (!targetTelecallerId || selectedLeadIds.length === 0) return;
    const targetUser = users.find((u) => u.id === targetTelecallerId);
    if (!targetUser) return;

    await onBulkReassign(selectedLeadIds, targetUser.id, targetUser.name);
    setSelectedLeadIds([]);
    setShowReassignModal(false);
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.length === filteredLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(filteredLeads.map((l) => l.id));
    }
  };

  const toggleSelectLead = (id: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {campaign.name}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  campaign.source === 'Meta'
                    ? 'bg-blue-100 text-blue-900'
                    : campaign.source === 'Google'
                    ? 'bg-rose-100 text-rose-900'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {campaign.source}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  campaign.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-900'
                    : campaign.status === 'Paused'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {campaign.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assignment: {campaign.assignmentMode === 'round_robin' ? 'Auto Round-Robin' : 'Manual'} · Last Synced: {campaign.lastSyncedAt ? new Date(campaign.lastSyncedAt).toLocaleString() : 'Never'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {campaign.sheetUrl && (
            <button
              onClick={handleSyncClick}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition min-h-[44px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Sheet'}</span>
            </button>
          )}

          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition min-h-[44px]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        </div>
      </div>

      {/* 4 KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Total Leads</span>
            <PhoneCall className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-slate-900">{total}</p>
          <span className="text-[10px] text-slate-400">Captured in campaign</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Leads Called</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-sky-950">{called}</p>
          <span className="text-[10px] text-sky-700 font-medium">{calledRate}% reach rate</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Confirmed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-800">{confirmed}</p>
          <span className="text-[10px] text-emerald-600 font-medium">{confirmedRate}% conversion</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-semibold">Surveys Done</span>
            <CalendarCheck className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-800">{surveysDone}</p>
          <span className="text-[10px] text-amber-600 font-medium">Passed site check</span>
        </div>
      </div>

      {/* Per-Telecaller Performance in this Campaign */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Per-Telecaller Performance (This Campaign)
            </h2>
          </div>
          {telecallerPerformance.unassignedCount > 0 && (
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {telecallerPerformance.unassignedCount} Unassigned Leads
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {telecallerPerformance.list.map((tc) => (
            <div
              key={tc.id}
              className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{tc.name}</span>
                <span className="font-bold text-emerald-800">{tc.convRate}% Conv.</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <span>{tc.assigned} Assigned</span>
                <span>{tc.called} Called</span>
                <span className="font-semibold text-emerald-700">{tc.confirmed} Confirmed</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status Breakdown for this Campaign */}
      <AllCallStatusesBreakdown
        leads={campaignLeads}
        selectedStatus={selectedStatus}
        onSelectStatus={(st) => setSelectedStatus(st)}
      />

      {/* Campaign Leads Table & Reassign Action */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Leads from this Campaign ({filteredLeads.length})
            </h2>
            <p className="text-xs text-slate-500">
              Select leads to reassign among telecallers or update details
            </p>
          </div>

          <div className="flex items-center gap-2">
            {selectedLeadIds.length > 0 && (
              <button
                type="button"
                onClick={() => setShowReassignModal(true)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-2xs min-h-[44px]"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Reassign ({selectedLeadIds.length}) Leads</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Bulk Select Toolbar */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads by name or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 rounded-xl border border-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition min-h-[40px]"
            >
              {selectedLeadIds.length === filteredLeads.length && filteredLeads.length > 0 ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Square className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Select All</span>
            </button>
          </div>
        </div>

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <PhoneCall className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No leads match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try syncing the sheet or clearing your search filter.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLeads.map((lead) => {
              const isSelected = selectedLeadIds.includes(lead.id);
              return (
                <div
                  key={lead.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-400 shadow-2xs'
                      : 'bg-white border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleSelectLead(lead.id)}
                      className="text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>

                    <div
                      className="cursor-pointer min-w-0"
                      onClick={() => setSelectedLeadForDetail(lead)}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-bold text-slate-900 hover:text-emerald-700 truncate">
                          {lead.name}
                        </p>
                        <span className="font-mono text-xs text-slate-500">+91 {lead.phone}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        Assigned: <strong>{lead.assignedTelecallerName || 'Unassigned'}</strong> · City: {lead.city || 'N/A'} · Added {new Date(lead.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={lead.status} />
                    <button
                      type="button"
                      onClick={() => setSelectedLeadForDetail(lead)}
                      className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reassign Modal */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-slate-900 text-base">
              Reassign {selectedLeadIds.length} Selected Leads
            </h3>
            <p className="text-xs text-slate-500">
              Move these leads to a different telecaller in this campaign.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Select Target Telecaller</label>
              <select
                value={targetTelecallerId}
                onChange={(e) => setTargetTelecallerId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold"
              >
                <option value="">-- Choose Telecaller --</option>
                {telecallers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="px-3 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!targetTelecallerId}
                onClick={handleBulkReassignSubmit}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLeadForDetail && (
        <LeadDetailModal
          lead={selectedLeadForDetail}
          questions={[]}
          users={users}
          isOpen={Boolean(selectedLeadForDetail)}
          onClose={() => setSelectedLeadForDetail(null)}
          onReassign={onBulkReassign}
        />
      )}
    </div>
  );
};
