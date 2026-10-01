import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  RefreshCw,
  PhoneCall,
  CheckCircle2,
  CalendarCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  Sheet,
  Users,
  AlertCircle,
  MoreVertical,
  Play,
  Pause,
  Archive,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Campaign, CampaignStatus } from '../../types';
import { CampaignModal } from './CampaignModal';
import { CampaignDetailView } from './CampaignDetailView';

export const CampaignsView: React.FC = () => {
  const {
    campaigns,
    leads,
    users,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    syncCampaignSheet,
    bulkReassignLeads,
  } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CampaignStatus>('ALL');

  // Modal / Detail state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [syncingMap, setSyncingMap] = useState<Record<string, boolean>>({});

  // Active telecallers
  const telecallers = useMemo(() => {
    return users.filter((u) => u.role === 'telecaller' && u.active);
  }, [users]);

  // Compute lead counts per campaign
  const campaignStats = useMemo(() => {
    const stats: Record<
      string,
      { total: number; called: number; confirmed: number; completedSurveys: number }
    > = {};

    campaigns.forEach((c) => {
      stats[c.id] = { total: 0, called: 0, confirmed: 0, completedSurveys: 0 };
    });

    leads.forEach((l) => {
      // match by campaignId or campaign name
      let campId = l.campaignId;
      if (!campId) {
        const matched = campaigns.find((c) => c.name === l.campaign);
        if (matched) campId = matched.id;
      }

      if (campId && stats[campId]) {
        stats[campId].total += 1;
        if ((l.callAttempts || 0) > 0 || l.callHistory?.length) stats[campId].called += 1;
        if (l.status === 'CONFIRMED') stats[campId].confirmed += 1;
        if (l.surveyStatus === 'Completed') stats[campId].completedSurveys += 1;
      }
    });

    return stats;
  }, [campaigns, leads]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mName = c.name.toLowerCase().includes(q);
        const mSource = c.source.toLowerCase().includes(q);
        if (!mName && !mSource) return false;
      }
      if (statusFilter !== 'ALL' && c.status !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [campaigns, searchQuery, statusFilter]);

  // Handlers
  const handleOpenNew = () => {
    setEditingCampaign(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Campaign) => {
    setEditingCampaign(c);
    setIsModalOpen(true);
  };

  const handleSaveCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt'>) => {
    if (editingCampaign) {
      await updateCampaign(editingCampaign.id, campaignData);
    } else {
      await createCampaign(campaignData);
    }
  };

  const handleSyncNow = async (campaignId: string) => {
    setSyncingMap((prev) => ({ ...prev, [campaignId]: true }));
    try {
      await syncCampaignSheet(campaignId);
    } finally {
      setSyncingMap((prev) => ({ ...prev, [campaignId]: false }));
    }
  };

  // If a campaign detail is open, render the detail view
  if (selectedCampaignId) {
    const activeCamp = campaigns.find((c) => c.id === selectedCampaignId);
    if (activeCamp) {
      return (
        <CampaignDetailView
          campaign={activeCamp}
          leads={leads}
          users={users}
          onBack={() => setSelectedCampaignId(null)}
          onEdit={() => handleOpenEdit(activeCamp)}
          onSync={() => handleSyncNow(activeCamp.id)}
          onBulkReassign={bulkReassignLeads}
        />
      );
    }
  }

  return (
    <div className="space-y-4 pb-20 sm:pb-8">
      {/* Top Header & New Campaign Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Megaphone className="w-4 h-4" />
            </div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Ad Campaigns ({campaigns.length})
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage Meta & Google sheets, auto round-robin assignments, and deduplicated syncing
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search campaigns by name or platform..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 focus:bg-white border border-slate-200 focus:border-emerald-500 rounded-xl"
          />
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
          {(['ALL', 'Active', 'Paused', 'Completed', 'Archived'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition min-h-[36px] ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Campaigns' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Campaign Cards List */}
      {filteredCampaigns.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No campaigns found</p>
          <p className="text-xs text-slate-400 mt-1">
            Click "+ New Campaign" to connect a Meta or Google Sheet lead source.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredCampaigns.map((camp) => {
            const stats = campaignStats[camp.id] || { total: 0, called: 0, confirmed: 0, completedSurveys: 0 };
            const isSyncing = syncingMap[camp.id] || false;
            const convRate = stats.total > 0 ? Math.round((stats.confirmed / stats.total) * 100) : 0;
            const calledRate = stats.total > 0 ? Math.round((stats.called / stats.total) * 100) : 0;

            return (
              <div
                key={camp.id}
                className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-sm transition space-y-3.5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Name, Source & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="cursor-pointer flex-1 min-w-0"
                      onClick={() => setSelectedCampaignId(camp.id)}
                    >
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base hover:text-emerald-700 transition truncate">
                        {camp.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {camp.assignmentMode === 'round_robin' ? 'Auto Round-Robin' : 'Manual Assignment'} · {camp.assignedTelecallerIds.length} Telecallers
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          camp.source === 'Meta'
                            ? 'bg-blue-100 text-blue-900'
                            : camp.source === 'Google'
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {camp.source}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          camp.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-900'
                            : camp.status === 'Paused'
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {camp.status}
                      </span>
                    </div>
                  </div>

                  {/* 4 Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-3">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total Leads</span>
                      <p className="text-base font-bold text-slate-900 font-mono">{stats.total}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Called</span>
                      <p className="text-base font-bold text-sky-900 font-mono">
                        {stats.called} <span className="text-[10px] font-normal text-sky-600">({calledRate}%)</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Confirmed</span>
                      <p className="text-base font-bold text-emerald-900 font-mono">
                        {stats.confirmed} <span className="text-[10px] font-normal text-emerald-600">({convRate}%)</span>
                      </p>
                    </div>
                  </div>

                  {/* Sync status & auto sync pill */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 px-0.5">
                    <span className="truncate">
                      Last Synced: {camp.lastSyncedAt ? new Date(camp.lastSyncedAt).toLocaleTimeString() : 'Never'}
                    </span>
                    {camp.autoSync && (
                      <span className="text-emerald-700 font-bold shrink-0 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Auto-sync {camp.syncInterval}m
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    {camp.sheetUrl && (
                      <button
                        type="button"
                        onClick={() => handleSyncNow(camp.id)}
                        disabled={isSyncing}
                        className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition min-h-[38px]"
                      >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(camp)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold transition min-h-[38px]"
                    >
                      Edit
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCampaignId(camp.id)}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition min-h-[38px]"
                  >
                    <span>View Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Campaign Modal */}
      {isModalOpen && (
        <CampaignModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          campaign={editingCampaign}
          onSave={handleSaveCampaign}
          onSyncNow={handleSyncNow}
          telecallers={telecallers}
        />
      )}
    </div>
  );
};
