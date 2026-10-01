export type Role = 'admin' | 'backoffice' | 'telecaller' | 'surveyor';

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: Role;
  active: boolean;
  phone?: string;
  mustChangePassword?: boolean;
}

export type StatusCategory = 'positive' | 'callback' | 'not_reached' | 'closed_lost' | 'bad_lead';

export interface StatusConfig {
  code: string;
  label: string;
  category: StatusCategory;
  color: string;
  bgColor: string;
  textColor: string;
  description?: string;
}

export interface StatusHistoryEntry {
  status: string;
  changedBy: string;
  changedByName?: string;
  changedAt: string;
  notes?: string;
}

export interface CallRecord {
  id: string;
  leadId: string;
  leadName: string;
  phone: string;
  timestamp: string;
  duration: number; // in seconds
  status: string;
  notes?: string;
  telecallerId: string;
  telecallerName: string;
  recordingUrl?: string;
}

export type SurveyStatus = 'Pending' | 'Scheduled' | 'Reached' | 'Completed' | 'Rescheduled' | 'Cancelled';

export type LeadSource = 'Meta' | 'Google' | 'Manual' | 'Inbound Call' | 'Walk-in' | 'Referral' | 'Other';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  campaignId?: string;
  campaign: string;
  source: LeadSource;
  createdAt: string;
  assignedTelecallerId: string;
  assignedTelecallerName: string;
  status: string;
  notes?: string;
  callbackDate?: string;
  callbackTime?: string;
  surveyDate?: string;
  surveyTime?: string;
  address?: string;
  pinCode?: string;
  checklistAnswers?: Record<string, boolean>; // questionId -> true(Yes)/false(No)
  assignedSurveyorId?: string;
  assignedSurveyorName?: string;
  surveyStatus?: SurveyStatus;
  surveyNotes?: string;
  callAttempts?: number;
  statusHistory?: StatusHistoryEntry[];
  callHistory?: CallRecord[];
  addedBy?: string;
  addedByName?: string;
  addedAt?: string;
}

export type CampaignSource = 'Meta' | 'Google' | 'Other';
export type CampaignStatus = 'Active' | 'Paused' | 'Completed' | 'Archived';
export type CampaignAssignmentMode = 'round_robin' | 'manual';

export interface CampaignColumnMapping {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  address?: string;
  pinCode?: string;
  notes?: string;
}

export interface Campaign {
  id: string;
  name: string;
  source: CampaignSource;
  status: CampaignStatus;
  sheetUrl?: string;
  columnMapping?: CampaignColumnMapping;
  assignedTelecallerIds: string[]; // multi-select of active telecallers
  assignmentMode: CampaignAssignmentMode;
  autoSync: boolean;
  syncInterval: number; // in minutes (1, 5, 15)
  lastSyncedAt?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface ChecklistQuestion {
  id: string;
  sectionKey: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  sectionTitle: string;
  questionText: string;
  order: number;
}

export interface ColumnMapping {
  name: string;
  phone: string;
  email: string;
  campaign: string;
  source: string;
}

export interface AppSettings {
  companyName: string;
  tagline: string;
  autoAssignEnabled: boolean;
  adSheetUrl: string;
  adSheetAutoSync: boolean;
  adSheetSyncInterval: number; // in minutes (1, 5, 15)
  adSheetLastSynced?: string;
  adSheetColumnMapping: ColumnMapping;
  webAppUrl: string;
  secretKey: string;
}

export interface TelecallerStats {
  telecallerId: string;
  name: string;
  assignedCount: number;
  calledCount: number;
  confirmedCount: number;
  followUpCount: number;
  connectedRate: number; // 0-100%
  conversionRate: number; // 0-100%
  avgCallDuration: number; // in seconds
  totalCallTime: number; // in seconds
}

export interface SurveyorStats {
  surveyorId: string;
  name: string;
  assignedCount: number;
  completedCount: number;
  scheduledCount: number;
  completionRate: number; // 0-100%
}
