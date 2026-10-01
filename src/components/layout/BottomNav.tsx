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
  ClipboardCheck,
  Megaphone,
  UserPlus,
} from 'lucide-react';
import { Role } from '../../types';

export interface TabConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface BottomNavProps {
  role: Role;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  badgeCounts?: Record<string, number>;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  activeTab,
  onTabChange,
  badgeCounts = {},
}) => {
  const getTabsForRole = (): TabConfig[] => {
    switch (role) {
      case 'admin':
        return [
          { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { id: 'leads', label: 'Leads', icon: PhoneCall, badge: badgeCounts.leads },
          { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
          { id: 'addleads', label: 'Add Leads', icon: UserPlus },
          { id: 'settings', label: 'Settings', icon: Settings },
        ];
      case 'backoffice':
        return [
          { id: 'confirmed', label: 'Confirmed', icon: CheckCircle2, badge: badgeCounts.confirmed },
          { id: 'surveys', label: 'Surveys', icon: CalendarCheck, badge: badgeCounts.surveys },
          { id: 'addleads', label: 'Add Leads', icon: UserPlus },
          { id: 'telecallers', label: 'Telecallers', icon: PhoneCall },
          { id: 'surveyors', label: 'Surveyors', icon: Compass },
        ];
      case 'telecaller':
        return [
          { id: 'myleads', label: 'My Leads', icon: PhoneCall, badge: badgeCounts.myleads },
          { id: 'followups', label: 'Follow-ups', icon: Clock, badge: badgeCounts.followups },
          { id: 'history', label: 'Calls', icon: ClipboardList },
          { id: 'performance', label: 'My Stats', icon: BarChart3 },
        ];
      case 'surveyor':
        return [
          { id: 'surveys', label: 'Surveys', icon: CalendarCheck, badge: badgeCounts.surveys },
          { id: 'checklists', label: 'Checklist', icon: ClipboardCheck },
          { id: 'upcoming', label: 'Upcoming', icon: Clock },
          { id: 'completed', label: 'Completed', icon: CheckCircle2 },
          { id: 'performance', label: 'My Stats', icon: BarChart3 },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabsForRole();

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-around h-15">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full min-h-[44px] min-w-[44px] transition-all ${
                isActive ? 'text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 text-emerald-600 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-1 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
