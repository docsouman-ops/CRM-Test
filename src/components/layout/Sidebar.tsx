import React from 'react';
import {
  LayoutDashboard,
  Users,
  PhoneCall,
  CalendarCheck,
  BarChart3,
  Settings,
  ClipboardList,
  CheckCircle2,
  Clock,
  Compass,
  Building2,
  ShieldAlert,
  ClipboardCheck,
  Megaphone,
  UserPlus,
} from 'lucide-react';
import { Role } from '../../types';

interface SidebarProps {
  role: Role;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  badgeCounts?: Record<string, number>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeTab,
  onTabChange,
  badgeCounts = {},
}) => {
  const getTabsForRole = () => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & Funnel' },
          { id: 'leads', label: 'All Leads', icon: PhoneCall, badge: badgeCounts.leads, desc: 'Manage & Reassign' },
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone, desc: 'Meta & Google Sheet Feeds' },
          { id: 'addleads', label: 'Add Leads', icon: UserPlus, desc: 'Manual & Bulk Upload' },
          { id: 'team', label: 'Team Members', icon: Users, desc: 'Users & Passwords' },
          { id: 'performance', label: 'Performance', icon: BarChart3, desc: 'Leaderboard & Analytics' },
          { id: 'settings', label: 'Settings', icon: Settings, desc: 'Database & Sync Setup' },
        ];
      case 'backoffice':
        return [
          { id: 'confirmed', label: 'Confirmed Leads', icon: CheckCircle2, badge: badgeCounts.confirmed, desc: 'Awaiting Surveyor' },
          { id: 'surveys', label: 'All Surveys', icon: CalendarCheck, badge: badgeCounts.surveys, desc: 'Survey Progress' },
          { id: 'addleads', label: 'Add Leads', icon: UserPlus, desc: 'Incoming Call & Offline Leads' },
          { id: 'telecallers', label: 'Telecaller List', icon: PhoneCall, desc: 'Performance Review' },
          { id: 'surveyors', label: 'Surveyor List', icon: Compass, desc: 'Field Workloads' },
        ];
      case 'telecaller':
        return [
          { id: 'myleads', label: 'My Leads', icon: PhoneCall, badge: badgeCounts.myleads, desc: 'Active Queue' },
          { id: 'followups', label: 'Today’s Follow-ups', icon: Clock, badge: badgeCounts.followups, desc: 'Scheduled Calls' },
          { id: 'history', label: 'Call Log History', icon: ClipboardList, desc: 'Past Interactions' },
          { id: 'performance', label: 'My Performance', icon: BarChart3, desc: 'Calls & Conversion' },
        ];
      case 'surveyor':
        return [
          { id: 'surveys', label: 'Today’s Surveys', icon: CalendarCheck, badge: badgeCounts.surveys, desc: 'Assigned Visits' },
          { id: 'checklists', label: 'Lead Checklists', icon: ClipboardCheck, desc: '23 Questions Verification' },
          { id: 'upcoming', label: 'Upcoming Surveys', icon: Clock, desc: 'Scheduled Ahead' },
          { id: 'completed', label: 'Completed Visits', icon: CheckCircle2, desc: 'Done & Feasible' },
          { id: 'performance', label: 'My Performance', icon: BarChart3, desc: 'Completion Rate' },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabsForRole();

  return (
    <aside className="hidden sm:flex flex-col w-60 lg:w-64 bg-white border-r border-slate-200/80 p-4 shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Navigation
        </p>

        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                />
                <div className="text-left truncate">
                  <p className="truncate leading-snug">{tab.label}</p>
                  <p className="text-[10px] text-slate-400 font-normal truncate leading-none">
                    {tab.desc}
                  </p>
                </div>
              </div>

              {tab.badge && tab.badge > 0 ? (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="bg-emerald-50/60 rounded-xl p-3 border border-emerald-100">
          <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs mb-1">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>PM Surya Ghar</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            National Rooftop Solar Subsidy program up to ₹78,000 for domestic connections.
          </p>
        </div>
      </div>
    </aside>
  );
};
