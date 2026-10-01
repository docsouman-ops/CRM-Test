import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Lead,
  ChecklistQuestion,
  AppSettings,
  CallRecord,
  SurveyStatus,
  TelecallerStats,
  SurveyorStats,
  User,
  Campaign,
  LeadSource,
} from '../types';
import {
  INITIAL_LEADS,
  INITIAL_CALLS,
  INITIAL_SETTINGS,
  getInitialChecklistQuestions,
  INITIAL_USERS,
  INITIAL_CAMPAIGNS,
} from '../services/demoData';
import { SheetsApiClient } from '../services/api';
import {
  convertToGoogleSheetCsvUrl,
  parseCsv,
  mapCsvRowsToLeads,
  mapCampaignCsvRowsToLeads,
  normalizePhone,
  SkippedRowInfo,
} from '../services/csvParser';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface CRMContextType {
  leads: Lead[];
  users: User[];
  calls: CallRecord[];
  checklistQuestions: ChecklistQuestion[];
  settings: AppSettings;
  isSyncing: boolean;
  lastSynced: Date | null;
  syncError: string | null;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<boolean>;
  logCall: (
    leadId: string,
    callData: {
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
    }
  ) => Promise<boolean>;
  updateChecklist: (leadId: string, answers: Record<string, boolean>) => Promise<boolean>;
  assignSurveyor: (leadId: string, surveyorId: string, surveyorName: string) => Promise<boolean>;
  updateSurveyStatus: (leadId: string, status: SurveyStatus, surveyNotes?: string) => Promise<boolean>;
  reassignLead: (leadId: string, telecallerId: string, telecallerName: string) => Promise<boolean>;
  bulkReassignLeads: (leadIds: string[], telecallerId: string, telecallerName: string) => Promise<boolean>;
  syncWithSheets: () => Promise<void>;
  syncAdLeads: () => Promise<{ success: boolean; count: number; duplicates: number; message?: string }>;
  campaigns: Campaign[];
  createCampaign: (campaignData: Omit<Campaign, 'id' | 'createdAt'>) => Promise<Campaign>;
  updateCampaign: (campaignId: string, updates: Partial<Campaign>) => Promise<boolean>;
  deleteCampaign: (campaignId: string) => Promise<boolean>;
  syncCampaignSheet: (campaignId: string) => Promise<{ success: boolean; imported: number; duplicates: number; message?: string }>;
  loadDemoData: () => void;
  addLeadManual: (
    leadData: Partial<Lead>,
    options?: { assignMode?: 'round_robin' | 'specific' | 'manual'; telecallerId?: string }
  ) => Promise<{ success: boolean; lead?: Lead; error?: string }>;
  bulkAddManualLeads: (
    leadsData: Array<Partial<Lead>>,
    options: {
      source: LeadSource;
      campaignId?: string;
      campaignName?: string;
      assignmentMode: 'round_robin' | 'specific' | 'manual';
      specificTelecallerId?: string;
    }
  ) => Promise<{ success: boolean; imported: number; duplicates: number; invalid: number; skippedRows: SkippedRowInfo[] }>;
  deleteLead: (leadId: string) => Promise<boolean>;
  updateChecklistQuestions: (questions: ChecklistQuestion[]) => Promise<boolean>;
  getTelecallerStats: (telecallerId: string, timeFilter?: 'today' | 'week' | 'month' | 'all', campaignId?: string) => TelecallerStats;
  getSurveyorStats: (surveyorId: string, campaignId?: string) => SurveyorStats;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const LEADS_KEY = 'gva_crm_leads';
const CALLS_KEY = 'gva_crm_calls';
const QUESTIONS_KEY = 'gva_crm_questions';
const SETTINGS_KEY = 'gva_crm_settings';
const CAMPAIGNS_KEY = 'gva_crm_campaigns';

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, users, loadDemoUsers } = useAuth();
  const { success, error, info } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>(() => {
    try {
      const stored = localStorage.getItem(CAMPAIGNS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CAMPAIGNS;
  });

  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const stored = localStorage.getItem(LEADS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_LEADS;
  });

  const [calls, setCalls] = useState<CallRecord[]>(() => {
    try {
      const stored = localStorage.getItem(CALLS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_CALLS;
  });

  const [checklistQuestions, setChecklistQuestions] = useState<ChecklistQuestion[]>(() => {
    try {
      const stored = localStorage.getItem(QUESTIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return getInitialChecklistQuestions();
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return INITIAL_SETTINGS;
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(new Date());
  const [syncError, setSyncError] = useState<string | null>(null);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem(LEADS_KEY, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(CALLS_KEY, JSON.stringify(calls));
  }, [calls]);

  useEffect(() => {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(checklistQuestions));
  }, [checklistQuestions]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
  }, [campaigns]);

  // Sheets API Client instance
  const apiClient = useRef<SheetsApiClient>(new SheetsApiClient(settings.webAppUrl, settings.secretKey));
  useEffect(() => {
    apiClient.current = new SheetsApiClient(settings.webAppUrl, settings.secretKey);
  }, [settings.webAppUrl, settings.secretKey]);

  // Campaign-specific round-robin assignment helper
  const assignNextTelecallerForCampaign = useCallback(
    (allowedTelecallerIds: string[] = []): { id: string; name: string } | null => {
      let activeTelecallers = users.filter((u) => u.role === 'telecaller' && u.active);
      if (allowedTelecallerIds && allowedTelecallerIds.length > 0) {
        const allowedSet = new Set(allowedTelecallerIds);
        activeTelecallers = activeTelecallers.filter((u) => allowedSet.has(u.id));
      }
      if (activeTelecallers.length === 0) return null;

      // Count leads currently assigned to each of these telecallers
      const countMap: Record<string, number> = {};
      activeTelecallers.forEach((t) => {
        countMap[t.id] = 0;
      });

      leads.forEach((l) => {
        if (countMap[l.assignedTelecallerId] !== undefined) {
          countMap[l.assignedTelecallerId]++;
        }
      });

      // Find the one with minimum assigned leads
      let minCount = Infinity;
      let selected: User = activeTelecallers[0];

      activeTelecallers.forEach((t) => {
        if (countMap[t.id] < minCount) {
          minCount = countMap[t.id];
          selected = t;
        }
      });

      return { id: selected.id, name: selected.name };
    },
    [leads, users]
  );

  // Round-robin assignment helper
  const assignNextTelecaller = useCallback(
    (currentTelecallers: User[]): { id: string; name: string } | null => {
      const activeTelecallers = currentTelecallers.filter((u) => u.role === 'telecaller' && u.active);
      if (activeTelecallers.length === 0) return null;

      // Count leads currently assigned to each active telecaller
      const countMap: Record<string, number> = {};
      activeTelecallers.forEach((t) => {
        countMap[t.id] = 0;
      });

      leads.forEach((l) => {
        if (countMap[l.assignedTelecallerId] !== undefined) {
          countMap[l.assignedTelecallerId]++;
        }
      });

      // Find the one with minimum assigned leads
      let minCount = Infinity;
      let selected: User = activeTelecallers[0];

      activeTelecallers.forEach((t) => {
        if (countMap[t.id] < minCount) {
          minCount = countMap[t.id];
          selected = t;
        }
      });

      return { id: selected.id, name: selected.name };
    },
    [leads]
  );

  // Full Sheets sync
  const syncWithSheets = useCallback(async () => {
    if (!apiClient.current.isConfigured()) {
      setLastSynced(new Date());
      return;
    }

    setIsSyncing(true);
    setSyncError(null);

    try {
      const remoteLeads = await apiClient.current.fetchTab<Lead>('Leads');
      if (remoteLeads && remoteLeads.length > 0) {
        setLeads(remoteLeads);
      } else if (leads.length > 0) {
        // Push initial leads if remote tab is empty
        await apiClient.current.batchUpsertRows('Leads', leads as unknown as Record<string, unknown>[]);
      }

      const remoteCalls = await apiClient.current.fetchTab<CallRecord>('Calls');
      if (remoteCalls && remoteCalls.length > 0) {
        setCalls(remoteCalls);
      }

      setLastSynced(new Date());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncError(msg);
      console.warn('[CRMContext] Sheets sync error:', msg);
    } finally {
      setIsSyncing(false);
    }
  }, [leads]);

  // Periodic polling every 15 seconds & on window focus / visibility change
  useEffect(() => {
    const interval = setInterval(() => {
      syncWithSheets();
    }, 15000);

    const handleFocus = () => {
      syncWithSheets();
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncWithSheets();
      }
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [syncWithSheets]);

  // Sync ad leads from published Google Sheet
  const syncAdLeads = useCallback(async () => {
    if (!settings.adSheetUrl) {
      return { success: false, count: 0, duplicates: 0, message: 'Ad leads Google Sheet URL is not configured.' };
    }

    try {
      setIsSyncing(true);
      const csvUrl = convertToGoogleSheetCsvUrl(settings.adSheetUrl);
      const res = await fetch(csvUrl, { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`Failed to fetch ad sheet (HTTP ${res.status}). Ensure it is shared or published to web as CSV.`);
      }

      const csvText = await res.text();
      const { rows } = parseCsv(csvText);

      if (rows.length === 0) {
        setIsSyncing(false);
        return { success: true, count: 0, duplicates: 0, message: 'Ad Sheet is empty.' };
      }

      // Existing phone set
      const existingPhones = new Set(leads.map((l) => l.phone.replace(/\D/g, '')));
      const { newLeads, duplicateCount } = mapCsvRowsToLeads(rows, settings.adSheetColumnMapping, existingPhones);

      if (newLeads.length === 0) {
        setIsSyncing(false);
        setSettings((prev) => ({ ...prev, adSheetLastSynced: new Date().toLocaleTimeString() }));
        return {
          success: true,
          count: 0,
          duplicates: duplicateCount,
          message: `Sync complete. ${duplicateCount} duplicate phone numbers ignored. No new leads found.`,
        };
      }

      // Auto-assign new leads if enabled
      const finalLeads: Lead[] = newLeads.map((nl) => {
        let assignedId = '';
        let assignedName = 'Unassigned';

        if (settings.autoAssignEnabled) {
          const next = assignNextTelecaller(users);
          if (next) {
            assignedId = next.id;
            assignedName = next.name;
          }
        }

        return {
          id: nl.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: nl.name || 'Ad Lead',
          phone: nl.phone || '',
          email: nl.email,
          campaign: nl.campaign || 'PM Surya Ghar Campaign',
          source: nl.source || 'Meta',
          createdAt: nl.createdAt || new Date().toISOString(),
          assignedTelecallerId: assignedId,
          assignedTelecallerName: assignedName,
          status: 'HOT',
          callAttempts: 0,
          notes: nl.notes || 'Imported via Ad Leads Sheet',
          statusHistory: [
            {
              status: 'HOT',
              changedBy: 'System (Ad Sync)',
              changedAt: new Date().toISOString(),
              notes: 'Lead captured from ad campaign',
            },
          ],
        } as Lead;
      });

      // Update state
      setLeads((prev) => [...finalLeads, ...prev]);

      // Write batch to Sheets if configured
      if (apiClient.current.isConfigured()) {
        try {
          await apiClient.current.batchUpsertRows('Leads', finalLeads as unknown as Record<string, unknown>[]);
        } catch {
          // optimistic update preserved
        }
      }

      setSettings((prev) => ({ ...prev, adSheetLastSynced: new Date().toLocaleTimeString() }));
      setIsSyncing(false);
      return {
        success: true,
        count: finalLeads.length,
        duplicates: duplicateCount,
        message: `Successfully imported ${finalLeads.length} new lead${finalLeads.length > 1 ? 's' : ''}! (${duplicateCount} duplicate numbers skipped)`,
      };
    } catch (err: unknown) {
      setIsSyncing(false);
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, count: 0, duplicates: 0, message: msg };
    }
  }, [settings.adSheetUrl, settings.adSheetColumnMapping, settings.autoAssignEnabled, leads, users, assignNextTelecaller]);

  // Periodic Ad sheet auto sync if enabled
  useEffect(() => {
    if (!settings.adSheetAutoSync || !settings.adSheetUrl) return;

    const intervalMs = Math.max(1, settings.adSheetSyncInterval || 5) * 60 * 1000;
    const timer = setInterval(() => {
      syncAdLeads();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [settings.adSheetAutoSync, settings.adSheetUrl, settings.adSheetSyncInterval, syncAdLeads]);

  // Update Settings
  const updateSettings = async (newSettings: Partial<AppSettings>): Promise<boolean> => {
    setSettings((prev) => {
      const merged = { ...prev, ...newSettings };
      return merged;
    });

    if (apiClient.current.isConfigured()) {
      try {
        await apiClient.current.upsertRow('Settings', {
          id: 'app_settings',
          key: 'config',
          value: JSON.stringify(newSettings),
        });
      } catch (e) {
        console.warn('Failed to save settings to sheets:', e);
      }
    }

    success('Settings updated', 'Configuration saved.');
    return true;
  };

  // Log Call
  const logCall = async (
    leadId: string,
    callData: {
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
    }
  ): Promise<boolean> => {
    const telecallerId = currentUser?.id || 'usr_unknown';
    const telecallerName = currentUser?.name || 'Telecaller';

    const callRecord: CallRecord = {
      id: `call_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      leadId,
      leadName: '',
      phone: '',
      timestamp: new Date().toISOString(),
      duration: callData.duration || 0,
      status: callData.status,
      notes: callData.notes,
      telecallerId,
      telecallerName,
      recordingUrl: callData.recordingUrl,
    };

    let updatedLead: Lead | null = null;

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          callRecord.leadName = lead.name;
          callRecord.phone = lead.phone;

          const newHistory = [
            ...(lead.statusHistory || []),
            {
              status: callData.status,
              changedBy: telecallerId,
              changedByName: telecallerName,
              changedAt: new Date().toISOString(),
              notes: callData.notes,
            },
          ];

          const newCallHistory = [callRecord, ...(lead.callHistory || [])];

          // If CONFIRMED, surveyStatus is Pending until back office assigns surveyor
          let newSurveyStatus = lead.surveyStatus;
          if (callData.status === 'CONFIRMED' && !lead.assignedSurveyorId) {
            newSurveyStatus = 'Pending';
          }

          updatedLead = {
            ...lead,
            status: callData.status,
            notes: callData.notes !== undefined ? callData.notes : lead.notes,
            callbackDate: callData.callbackDate || lead.callbackDate,
            callbackTime: callData.callbackTime || lead.callbackTime,
            surveyDate: callData.surveyDate || lead.surveyDate,
            surveyTime: callData.surveyTime || lead.surveyTime,
            address: callData.address || lead.address,
            pinCode: callData.pinCode || lead.pinCode,
            surveyStatus: newSurveyStatus,
            callAttempts: (lead.callAttempts || 0) + 1,
            statusHistory: newHistory,
            callHistory: newCallHistory,
          };
          return updatedLead;
        }
        return lead;
      })
    );

    setCalls((prev) => [callRecord, ...prev]);

    // Write to Sheets
    if (apiClient.current.isConfigured() && updatedLead) {
      try {
        await apiClient.current.upsertRow('Leads', updatedLead as unknown as Record<string, unknown>);
        await apiClient.current.upsertRow('Calls', callRecord as unknown as Record<string, unknown>);
      } catch (err) {
        console.warn('Optimistic call logged locally; sheets write error:', err);
      }
    }

    success('Call Logged', `Lead status updated to ${callData.status}.`);
    return true;
  };

  // Update Checklist
  const updateChecklist = async (leadId: string, answers: Record<string, boolean>): Promise<boolean> => {
    let updatedLead: Lead | null = null;

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          updatedLead = {
            ...lead,
            checklistAnswers: answers,
          };
          return updatedLead;
        }
        return lead;
      })
    );

    if (apiClient.current.isConfigured() && updatedLead) {
      try {
        await apiClient.current.upsertRow('Leads', updatedLead as unknown as Record<string, unknown>);
      } catch (err) {
        console.warn('Checklist saved locally; sheets sync failed:', err);
      }
    }

    info('Checklist Saved', 'Checklist responses updated successfully.');
    return true;
  };

  // Assign Surveyor (Back office action)
  const assignSurveyor = async (leadId: string, surveyorId: string, surveyorName: string): Promise<boolean> => {
    let updatedLead: Lead | null = null;

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          updatedLead = {
            ...lead,
            assignedSurveyorId: surveyorId,
            assignedSurveyorName: surveyorName,
            surveyStatus: 'Scheduled',
            statusHistory: [
              ...(lead.statusHistory || []),
              {
                status: lead.status,
                changedBy: currentUser?.id || 'usr_backoffice',
                changedByName: currentUser?.name || 'Back Office',
                changedAt: new Date().toISOString(),
                notes: `Survey assigned to ${surveyorName}`,
              },
            ],
          };
          return updatedLead;
        }
        return lead;
      })
    );

    if (apiClient.current.isConfigured() && updatedLead) {
      try {
        await apiClient.current.upsertRow('Leads', updatedLead as unknown as Record<string, unknown>);
      } catch (err) {
        console.warn('Surveyor assignment saved locally:', err);
      }
    }

    success('Surveyor Assigned', `Lead assigned to ${surveyorName} for site survey.`);
    return true;
  };

  // Update Survey Status (Surveyor action)
  const updateSurveyStatus = async (leadId: string, status: SurveyStatus, surveyNotes?: string): Promise<boolean> => {
    let updatedLead: Lead | null = null;

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          updatedLead = {
            ...lead,
            surveyStatus: status,
            surveyNotes: surveyNotes !== undefined ? surveyNotes : lead.surveyNotes,
            statusHistory: [
              ...(lead.statusHistory || []),
              {
                status: `Survey: ${status}`,
                changedBy: currentUser?.id || 'usr_surveyor',
                changedByName: currentUser?.name || 'Surveyor',
                changedAt: new Date().toISOString(),
                notes: surveyNotes || `Survey marked as ${status}`,
              },
            ],
          };
          return updatedLead;
        }
        return lead;
      })
    );

    if (apiClient.current.isConfigured() && updatedLead) {
      try {
        await apiClient.current.upsertRow('Leads', updatedLead as unknown as Record<string, unknown>);
      } catch (err) {
        console.warn('Survey status saved locally:', err);
      }
    }

    success('Survey Updated', `Site survey marked as ${status}.`);
    return true;
  };

  // Reassign Lead (Admin / Back Office)
  const reassignLead = async (leadId: string, telecallerId: string, telecallerName: string): Promise<boolean> => {
    let updatedLead: Lead | null = null;

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          updatedLead = {
            ...lead,
            assignedTelecallerId: telecallerId,
            assignedTelecallerName: telecallerName,
            statusHistory: [
              ...(lead.statusHistory || []),
              {
                status: lead.status,
                changedBy: currentUser?.id || 'admin',
                changedByName: currentUser?.name || 'Admin',
                changedAt: new Date().toISOString(),
                notes: `Reassigned to telecaller ${telecallerName}`,
              },
            ],
          };
          return updatedLead;
        }
        return lead;
      })
    );

    if (apiClient.current.isConfigured() && updatedLead) {
      try {
        await apiClient.current.upsertRow('Leads', updatedLead as unknown as Record<string, unknown>);
      } catch (err) {
        console.warn('Reassignment saved locally:', err);
      }
    }

    success('Lead Reassigned', `Assigned to ${telecallerName}.`);
    return true;
  };

  // Bulk Reassign Leads
  const bulkReassignLeads = async (leadIds: string[], telecallerId: string, telecallerName: string): Promise<boolean> => {
    const idSet = new Set(leadIds);
    const updatedRows: Lead[] = [];

    setLeads((prev) =>
      prev.map((lead) => {
        if (idSet.has(lead.id)) {
          const modified: Lead = {
            ...lead,
            assignedTelecallerId: telecallerId,
            assignedTelecallerName: telecallerName,
            statusHistory: [
              ...(lead.statusHistory || []),
              {
                status: lead.status,
                changedBy: currentUser?.id || 'admin',
                changedByName: currentUser?.name || 'Admin',
                changedAt: new Date().toISOString(),
                notes: `Bulk reassigned to ${telecallerName}`,
              },
            ],
          };
          updatedRows.push(modified);
          return modified;
        }
        return lead;
      })
    );

    if (apiClient.current.isConfigured() && updatedRows.length > 0) {
      try {
        await apiClient.current.batchUpsertRows('Leads', updatedRows as unknown as Record<string, unknown>[]);
      } catch (err) {
        console.warn('Bulk reassignment saved locally:', err);
      }
    }

    success('Bulk Reassigned', `${leadIds.length} leads assigned to ${telecallerName}.`);
    return true;
  };

  // Create Campaign
  const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt'>): Promise<Campaign> => {
    const newCamp: Campaign = {
      ...campaignData,
      id: `camp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    setCampaigns((prev) => [newCamp, ...prev]);

    if (apiClient.current.isConfigured()) {
      try {
        await apiClient.current.upsertRow('Campaigns', newCamp as unknown as Record<string, unknown>);
      } catch (err) {
        console.warn('Saved campaign locally, sheet write notice:', err);
      }
    }

    success('Campaign Created', `"${newCamp.name}" added successfully.`);
    return newCamp;
  };

  // Update Campaign
  const updateCampaign = async (campaignId: string, updates: Partial<Campaign>): Promise<boolean> => {
    let updatedCampaign: Campaign | null = null;
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === campaignId) {
          updatedCampaign = { ...c, ...updates };
          return updatedCampaign;
        }
        return c;
      })
    );

    if (apiClient.current.isConfigured() && updatedCampaign) {
      try {
        await apiClient.current.upsertRow('Campaigns', updatedCampaign as unknown as Record<string, unknown>);
      } catch (err) {
        console.warn('Updated campaign locally, sheet write notice:', err);
      }
    }

    success('Campaign Updated', 'Campaign settings saved.');
    return true;
  };

  // Delete Campaign
  const deleteCampaign = async (campaignId: string): Promise<boolean> => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));

    if (apiClient.current.isConfigured()) {
      try {
        await apiClient.current.deleteRow('Campaigns', campaignId);
      } catch (err) {
        console.warn('Delete campaign row notice:', err);
      }
    }

    info('Campaign Deleted', 'Campaign removed from CRM.');
    return true;
  };

  // Sync Campaign from its Google Sheet link
  const syncCampaignSheet = useCallback(
    async (campaignId: string): Promise<{ success: boolean; imported: number; duplicates: number; message?: string }> => {
      const campaign = campaigns.find((c) => c.id === campaignId);
      if (!campaign) {
        return { success: false, imported: 0, duplicates: 0, message: 'Campaign not found.' };
      }

      if (!campaign.sheetUrl || !campaign.sheetUrl.trim()) {
        return { success: false, imported: 0, duplicates: 0, message: 'Google Sheet link is not configured for this campaign.' };
      }

      setIsSyncing(true);
      try {
        const csvUrl = convertToGoogleSheetCsvUrl(campaign.sheetUrl);
        const res = await fetch(csvUrl, { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`Failed to fetch sheet (HTTP ${res.status}). Verify link permissions ("Anyone with the link can view").`);
        }

        const csvText = await res.text();
        const { rows } = parseCsv(csvText);

        if (rows.length === 0) {
          setIsSyncing(false);
          return { success: true, imported: 0, duplicates: 0, message: 'The linked Google Sheet is empty.' };
        }

        // Existing phone numbers across ALL CRM leads
        const existingPhones = new Set(
          leads.map((l) => normalizePhone(l.phone)).filter((p) => p.length >= 10)
        );

        const mapping = {
          nameCol: campaign.columnMapping?.name || 'Full Name',
          phoneCol: campaign.columnMapping?.phone || 'Phone Number',
          emailCol: campaign.columnMapping?.email,
          cityCol: campaign.columnMapping?.city,
          addressCol: campaign.columnMapping?.address,
          pinCodeCol: campaign.columnMapping?.pinCode,
          notesCol: campaign.columnMapping?.notes,
        };

        const { validLeads, duplicateCount, invalidCount } = mapCampaignCsvRowsToLeads(
          rows,
          mapping,
          existingPhones,
          campaign.id,
          campaign.name,
          campaign.source
        );

        if (validLeads.length === 0) {
          setIsSyncing(false);
          await updateCampaign(campaign.id, { lastSyncedAt: new Date().toISOString() });
          const msg = `${duplicateCount} duplicates skipped. No new leads found.`;
          info('Sync Complete', msg);
          return { success: true, imported: 0, duplicates: duplicateCount, message: msg };
        }

        // Assign leads according to campaign assignmentMode & selected telecallers
        const finalLeads: Lead[] = validLeads.map((vl) => {
          let assignedId = '';
          let assignedName = 'Unassigned';

          if (campaign.assignmentMode === 'round_robin') {
            const next = assignNextTelecallerForCampaign(campaign.assignedTelecallerIds);
            if (next) {
              assignedId = next.id;
              assignedName = next.name;
            }
          }

          return {
            id: vl.id || `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: vl.name || 'Solar Prospect',
            phone: vl.phone || '',
            email: vl.email,
            city: vl.city,
            address: vl.address,
            pinCode: vl.pinCode,
            campaignId: campaign.id,
            campaign: campaign.name,
            source: campaign.source,
            createdAt: new Date().toISOString(),
            assignedTelecallerId: assignedId,
            assignedTelecallerName: assignedName,
            status: 'HOT',
            callAttempts: 0,
            notes: vl.notes || `Imported via campaign ${campaign.name}`,
            statusHistory: [
              {
                status: 'HOT',
                changedBy: 'System (Campaign Sync)',
                changedByName: `Campaign: ${campaign.name}`,
                changedAt: new Date().toISOString(),
                notes: `Imported from sheet into ${campaign.name}`,
              },
            ],
          } as Lead;
        });

        // Update state
        setLeads((prev) => [...finalLeads, ...prev]);

        // Write batch to Google Sheets if connected
        if (apiClient.current.isConfigured()) {
          try {
            await apiClient.current.batchUpsertRows('Leads', finalLeads as unknown as Record<string, unknown>[]);
          } catch (err) {
            console.warn('Batch leads saved locally; remote sheets notice:', err);
          }
        }

        // Update campaign lastSyncedAt
        const nowIso = new Date().toISOString();
        setCampaigns((prev) =>
          prev.map((c) => (c.id === campaign.id ? { ...c, lastSyncedAt: nowIso } : c))
        );

        setIsSyncing(false);
        const successMsg = `${finalLeads.length} new leads imported, ${duplicateCount} duplicates skipped`;
        success('Sync Successful', successMsg);

        return {
          success: true,
          imported: finalLeads.length,
          duplicates: duplicateCount,
          message: successMsg,
        };
      } catch (err: unknown) {
        setIsSyncing(false);
        const msg = err instanceof Error ? err.message : String(err);
        error('Sync Failed', msg);
        return { success: false, imported: 0, duplicates: 0, message: msg };
      }
    },
    [campaigns, leads, assignNextTelecallerForCampaign, success, error, info, updateCampaign]
  );

  // Periodic Campaign auto sync for active campaigns
  useEffect(() => {
    const activeSyncCamps = campaigns.filter(
      (c) => c.status === 'Active' && c.autoSync && c.sheetUrl && c.sheetUrl.trim().length > 0
    );
    if (activeSyncCamps.length === 0) return;

    const timer = setInterval(() => {
      activeSyncCamps.forEach((camp) => {
        const intervalMs = Math.max(1, camp.syncInterval || 5) * 60 * 1000;
        const lastSyncTime = camp.lastSyncedAt ? new Date(camp.lastSyncedAt).getTime() : 0;
        if (Date.now() - lastSyncTime >= intervalMs) {
          syncCampaignSheet(camp.id);
        }
      });
    }, 30000);

    return () => clearInterval(timer);
  }, [campaigns, syncCampaignSheet]);

  // Manual Add Lead (Single)
  const addLeadManual = async (
    leadData: Partial<Lead>,
    options?: { assignMode?: 'round_robin' | 'specific' | 'manual'; telecallerId?: string }
  ): Promise<{ success: boolean; lead?: Lead; error?: string }> => {
    const rawPhone = leadData.phone || '';
    const cleanPhone = normalizePhone(rawPhone);

    if (!cleanPhone || cleanPhone.length < 10) {
      error('Invalid Phone', 'Please enter a valid 10-digit mobile number.');
      return { success: false, error: 'Please enter a valid 10-digit mobile number.' };
    }

    // Check duplicate phone across all existing CRM leads
    const existing = leads.find((l) => normalizePhone(l.phone) === cleanPhone);
    if (existing) {
      const dupMsg = `A lead with phone +91 ${cleanPhone} already exists: "${existing.name}" (Status: ${existing.status}).`;
      error('Duplicate Phone', dupMsg);
      return { success: false, error: dupMsg };
    }

    let assignedId = '';
    let assignedName = 'Unassigned';

    const assignMode = options?.assignMode || (leadData.assignedTelecallerId ? 'specific' : 'round_robin');

    if (assignMode === 'specific' && (options?.telecallerId || leadData.assignedTelecallerId)) {
      const tid = options?.telecallerId || leadData.assignedTelecallerId;
      const targetUser = users.find((u) => u.id === tid);
      if (targetUser) {
        assignedId = targetUser.id;
        assignedName = targetUser.name;
      }
    } else if (assignMode === 'round_robin') {
      const next = assignNextTelecaller(users);
      if (next) {
        assignedId = next.id;
        assignedName = next.name;
      }
    }

    const currentUserName = currentUser?.name || 'Staff';
    const currentUserId = currentUser?.id || 'usr_manual';

    const newLead: Lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: leadData.name?.trim() || 'Solar Prospect',
      phone: cleanPhone,
      email: leadData.email?.trim() || undefined,
      city: leadData.city?.trim() || undefined,
      address: leadData.address?.trim() || undefined,
      pinCode: leadData.pinCode?.trim() || undefined,
      campaignId: leadData.campaignId || undefined,
      campaign: leadData.campaign || 'Direct / Offline Entry',
      source: leadData.source || 'Manual',
      createdAt: new Date().toISOString(),
      assignedTelecallerId: assignedId,
      assignedTelecallerName: assignedName,
      status: 'HOT',
      notes: leadData.notes || '',
      callAttempts: 0,
      addedBy: currentUserId,
      addedByName: currentUserName,
      addedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'HOT',
          changedBy: currentUserId,
          changedByName: currentUserName,
          changedAt: new Date().toISOString(),
          notes: `Added manually by ${currentUserName} (${leadData.source || 'Manual'})`,
        },
      ],
    };

    setLeads((prev) => [newLead, ...prev]);

    if (apiClient.current.isConfigured()) {
      try {
        await apiClient.current.upsertRow('Leads', newLead as unknown as Record<string, unknown>);
      } catch (err) {
        console.warn('Manual lead saved locally:', err);
      }
    }

    success('Lead Created', `Added ${newLead.name} (${newLead.phone}) successfully.`);
    return { success: true, lead: newLead };
  };

  // Bulk Add Manual Leads (from CSV / Spreadsheet Paste)
  const bulkAddManualLeads = async (
    leadsData: Array<Partial<Lead>>,
    options: {
      source: LeadSource;
      campaignId?: string;
      campaignName?: string;
      assignmentMode: 'round_robin' | 'specific' | 'manual';
      specificTelecallerId?: string;
    }
  ): Promise<{
    success: boolean;
    imported: number;
    duplicates: number;
    invalid: number;
    skippedRows: SkippedRowInfo[];
  }> => {
    const existingPhones = new Set(
      leads.map((l) => normalizePhone(l.phone)).filter((p) => p.length >= 10)
    );
    const processedInBatch = new Set<string>();
    const skippedRows: SkippedRowInfo[] = [];
    const validRows: Lead[] = [];

    const currentUserName = currentUser?.name || 'Staff';
    const currentUserId = currentUser?.id || 'usr_bulk';

    let specificTelecaller: User | undefined;
    if (options.assignmentMode === 'specific' && options.specificTelecallerId) {
      specificTelecaller = users.find((u) => u.id === options.specificTelecallerId);
    }

    leadsData.forEach((row, idx) => {
      const rowNum = idx + 1;
      const rawPhone = row.phone || '';
      const cleanPhone = normalizePhone(rawPhone);
      const name = row.name?.trim() || 'Solar Prospect';

      if (!cleanPhone || cleanPhone.length < 10) {
        skippedRows.push({
          rowNumber: rowNum,
          name,
          phone: rawPhone,
          reason: 'invalid_phone',
          details: 'Missing or invalid phone number (< 10 digits)',
        });
        return;
      }

      if (existingPhones.has(cleanPhone)) {
        skippedRows.push({
          rowNumber: rowNum,
          name,
          phone: cleanPhone,
          reason: 'duplicate_in_crm',
          details: 'Phone number already exists in CRM records',
        });
        return;
      }

      if (processedInBatch.has(cleanPhone)) {
        skippedRows.push({
          rowNumber: rowNum,
          name,
          phone: cleanPhone,
          reason: 'duplicate_in_file',
          details: 'Duplicate phone number within this import file',
        });
        return;
      }

      processedInBatch.add(cleanPhone);

      let assignedId = '';
      let assignedName = 'Unassigned';

      if (options.assignmentMode === 'specific' && specificTelecaller) {
        assignedId = specificTelecaller.id;
        assignedName = specificTelecaller.name;
      } else if (options.assignmentMode === 'round_robin') {
        const next = assignNextTelecaller(users);
        if (next) {
          assignedId = next.id;
          assignedName = next.name;
        }
      }

      validRows.push({
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${idx}`,
        name,
        phone: cleanPhone,
        email: row.email?.trim() || undefined,
        city: row.city?.trim() || undefined,
        address: row.address?.trim() || undefined,
        pinCode: row.pinCode?.trim() || undefined,
        campaignId: options.campaignId || undefined,
        campaign: options.campaignName || 'Manual Bulk Import',
        source: options.source || 'Manual',
        createdAt: new Date().toISOString(),
        assignedTelecallerId: assignedId,
        assignedTelecallerName: assignedName,
        status: 'HOT',
        notes: row.notes || 'Imported via bulk upload',
        callAttempts: 0,
        addedBy: currentUserId,
        addedByName: currentUserName,
        addedAt: new Date().toISOString(),
        statusHistory: [
          {
            status: 'HOT',
            changedBy: currentUserId,
            changedByName: currentUserName,
            changedAt: new Date().toISOString(),
            notes: `Bulk uploaded by ${currentUserName}`,
          },
        ],
      } as Lead);
    });

    const duplicateCount = skippedRows.filter(
      (s) => s.reason === 'duplicate_in_crm' || s.reason === 'duplicate_in_file'
    ).length;
    const invalidCount = skippedRows.filter((s) => s.reason === 'invalid_phone').length;

    if (validRows.length > 0) {
      setLeads((prev) => [...validRows, ...prev]);

      if (apiClient.current.isConfigured()) {
        try {
          await apiClient.current.batchUpsertRows('Leads', validRows as unknown as Record<string, unknown>[]);
        } catch (err) {
          console.warn('Bulk manual leads saved locally:', err);
        }
      }

      success(
        'Bulk Upload Complete',
        `${validRows.length} new leads imported, ${duplicateCount} duplicates skipped.`
      );
    } else {
      info(
        'Import Summary',
        `0 leads imported (${duplicateCount} duplicates skipped, ${invalidCount} invalid rows).`
      );
    }

    return {
      success: validRows.length > 0,
      imported: validRows.length,
      duplicates: duplicateCount,
      invalid: invalidCount,
      skippedRows,
    };
  };

  // Delete Lead
  const deleteLead = async (leadId: string): Promise<boolean> => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));

    if (apiClient.current.isConfigured()) {
      try {
        await apiClient.current.deleteRow('Leads', leadId);
      } catch (err) {
        console.warn('Delete row error:', err);
      }
    }

    info('Lead Removed', 'Lead record deleted.');
    return true;
  };

  // Update Checklist Questions
  const updateChecklistQuestions = async (questions: ChecklistQuestion[]): Promise<boolean> => {
    setChecklistQuestions(questions);

    if (apiClient.current.isConfigured()) {
      try {
        await apiClient.current.batchUpsertRows(
          'ChecklistQuestions',
          questions as unknown as Record<string, unknown>[]
        );
      } catch (err) {
        console.warn('Error saving checklist questions to sheets:', err);
      }
    }

    success('Questions Updated', 'Checklist question schema saved.');
    return true;
  };

  // Load Demo Data
  const loadDemoData = () => {
    setLeads(INITIAL_LEADS);
    setCalls(INITIAL_CALLS);
    setCampaigns(INITIAL_CAMPAIGNS);
    setChecklistQuestions(getInitialChecklistQuestions());
    loadDemoUsers();
    setLastSynced(new Date());
    success('Demo Data Loaded', 'Sample leads, campaigns, users, checklists, and calls have been populated.');
  };

  // Performance calculations
  const getTelecallerStats = useCallback(
    (
      telecallerId: string,
      timeFilter: 'today' | 'week' | 'month' | 'all' = 'all',
      campaignId?: string
    ): TelecallerStats => {
      const targetUser = users.find((u) => u.id === telecallerId);
      const name = targetUser ? targetUser.name : 'Telecaller';

      let userLeads = leads.filter((l) => l.assignedTelecallerId === telecallerId);
      if (campaignId && campaignId !== 'ALL') {
        userLeads = userLeads.filter(
          (l) => l.campaignId === campaignId || l.campaign === campaignId
        );
      }
      const userLeadIds = new Set(userLeads.map((l) => l.id));

      let userCalls = calls.filter(
        (c) =>
          c.telecallerId === telecallerId &&
          (campaignId && campaignId !== 'ALL' ? userLeadIds.has(c.leadId) : true)
      );

      const now = new Date();
      if (timeFilter === 'today') {
        const todayStr = now.toISOString().split('T')[0];
        userCalls = userCalls.filter((c) => c.timestamp.startsWith(todayStr));
      } else if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 86400000);
        userCalls = userCalls.filter((c) => new Date(c.timestamp) >= weekAgo);
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 86400000);
        userCalls = userCalls.filter((c) => new Date(c.timestamp) >= monthAgo);
      }

      const assignedCount = userLeads.length;
      const calledCount = userCalls.length;
      const confirmedCount = userLeads.filter((l) => l.status === 'CONFIRMED').length;
      const followUpCount = userLeads.filter(
        (l) => l.status === 'FOLLOW_UP' || l.status === 'CALL_LATER'
      );

      const connectedCalls = userCalls.filter(
        (c) => c.status !== 'NO_ANSWER' && c.status !== 'SWITCHED_OFF' && c.status !== 'INVALID'
      );
      const connectedRate = calledCount > 0 ? Math.round((connectedCalls.length / calledCount) * 100) : 0;
      const conversionRate = assignedCount > 0 ? Math.round((confirmedCount / assignedCount) * 100) : 0;

      const totalCallTime = userCalls.reduce((sum, c) => sum + (c.duration || 0), 0);
      const avgCallDuration = calledCount > 0 ? Math.round(totalCallTime / calledCount) : 0;

      return {
        telecallerId,
        name,
        assignedCount,
        calledCount,
        confirmedCount,
        followUpCount: followUpCount.length,
        connectedRate,
        conversionRate,
        avgCallDuration,
        totalCallTime,
      };
    },
    [leads, calls, users]
  );

  const getSurveyorStats = useCallback(
    (surveyorId: string, campaignId?: string): SurveyorStats => {
      const targetUser = users.find((u) => u.id === surveyorId);
      const name = targetUser ? targetUser.name : 'Surveyor';

      let assignedLeads = leads.filter((l) => l.assignedSurveyorId === surveyorId);
      if (campaignId && campaignId !== 'ALL') {
        assignedLeads = assignedLeads.filter(
          (l) => l.campaignId === campaignId || l.campaign === campaignId
        );
      }

      const completedCount = assignedLeads.filter((l) => l.surveyStatus === 'Completed').length;
      const scheduledCount = assignedLeads.filter((l) => l.surveyStatus === 'Scheduled').length;
      const completionRate =
        assignedLeads.length > 0 ? Math.round((completedCount / assignedLeads.length) * 100) : 0;

      return {
        surveyorId,
        name,
        assignedCount: assignedLeads.length,
        completedCount,
        scheduledCount,
        completionRate,
      };
    },
    [leads, users]
  );

  return (
    <CRMContext.Provider
      value={{
        leads,
        users,
        calls,
        campaigns,
        checklistQuestions,
        settings,
        isSyncing,
        lastSynced,
        syncError,
        updateSettings,
        logCall,
        updateChecklist,
        assignSurveyor,
        updateSurveyStatus,
        reassignLead,
        bulkReassignLeads,
        syncWithSheets,
        syncAdLeads,
        createCampaign,
        updateCampaign,
        deleteCampaign,
        syncCampaignSheet,
        loadDemoData,
        addLeadManual,
        bulkAddManualLeads,
        deleteLead,
        updateChecklistQuestions,
        getTelecallerStats,
        getSurveyorStats,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
