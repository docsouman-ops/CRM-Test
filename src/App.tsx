import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { OfflineIndicator } from './components/pwa/OfflineIndicator';
import { LoginScreen } from './components/auth/LoginScreen';
import { FirstRunSetupScreen } from './components/auth/FirstRunSetupScreen';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLeads } from './components/admin/AdminLeads';
import { CampaignsView } from './components/campaigns/CampaignsView';
import { AddLeadsView } from './components/leads/AddLeadsView';
import { AdminTeam } from './components/admin/AdminTeam';
import { AdminPerformance } from './components/admin/AdminPerformance';
import { AdminSettings } from './components/admin/AdminSettings';

// Back Office Views
import { BackOfficeDashboard } from './components/backoffice/BackOfficeDashboard';

// Telecaller Views
import { TelecallerHome } from './components/telecaller/TelecallerHome';
import { TelecallerPerformance } from './components/telecaller/TelecallerPerformance';

// Surveyor Views
import { SurveyorHome } from './components/surveyor/SurveyorHome';

const MainAppLayout: React.FC = () => {
  const { realUser, effectiveRole, currentUser } = useAuth();
  const { leads, settings } = useCRM();

  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('gva_crm_setup_completed');
      if (stored === 'false') return false;
      return true; // Default to instant demo ready out of the box
    } catch {
      // ignore
    }
    return true;
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>(() => {
    switch (effectiveRole) {
      case 'admin':
        return 'dashboard';
      case 'backoffice':
        return 'confirmed';
      case 'telecaller':
        return 'myleads';
      case 'surveyor':
        return 'surveys';
      default:
        return 'myleads';
    }
  });

  // Switch default tab when role changes (e.g. via "View as" switch)
  useEffect(() => {
    switch (effectiveRole) {
      case 'admin':
        setActiveTab('dashboard');
        break;
      case 'backoffice':
        setActiveTab('confirmed');
        break;
      case 'telecaller':
        setActiveTab('myleads');
        break;
      case 'surveyor':
        setActiveTab('surveys');
        break;
    }
  }, [effectiveRole]);

  // First-run database setup screen (Apps Script Web App URL and Secret Key)
  if (!hasCompletedSetup) {
    return <FirstRunSetupScreen onComplete={() => setHasCompletedSetup(true)} />;
  }

  if (!realUser) {
    return <LoginScreen onOpenSetup={() => setHasCompletedSetup(false)} />;
  }

  // Compute dynamic badge counts
  const todayStr = new Date().toISOString().split('T')[0];
  const badgeCounts: Record<string, number> = {
    leads: leads.length,
    confirmed: leads.filter((l) => l.status === 'CONFIRMED' && (!l.assignedSurveyorId || l.surveyStatus === 'Pending')).length,
    surveys: effectiveRole === 'surveyor'
      ? leads.filter((l) => l.assignedSurveyorId === currentUser?.id && l.surveyDate === todayStr).length
      : leads.filter((l) => l.assignedSurveyorId && l.surveyStatus !== 'Completed').length,
    myleads: leads.filter((l) => l.assignedTelecallerId === currentUser?.id).length,
    followups: leads.filter(
      (l) =>
        l.assignedTelecallerId === currentUser?.id &&
        (l.status === 'FOLLOW_UP' || l.status === 'CALL_LATER') &&
        (!l.callbackDate || l.callbackDate <= todayStr)
    ).length,
  };

  // Render view corresponding to effective role and active tab
  const renderContent = () => {
    if (effectiveRole === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setActiveTab} />;
        case 'leads':
          return <AdminLeads />;
        case 'campaigns':
          return <CampaignsView />;
        case 'addleads':
          return <AddLeadsView onNavigateToLead={() => setActiveTab('leads')} />;
        case 'team':
          return <AdminTeam />;
        case 'performance':
          return <AdminPerformance />;
        case 'settings':
          return <AdminSettings onNavigate={setActiveTab} />;
        default:
          return <AdminDashboard onNavigate={setActiveTab} />;
      }
    }

    if (effectiveRole === 'backoffice') {
      switch (activeTab) {
        case 'confirmed':
          return <BackOfficeDashboard activeSubTab="confirmed" />;
        case 'surveys':
          return <BackOfficeDashboard activeSubTab="surveys" />;
        case 'addleads':
          return <AddLeadsView onNavigateToLead={() => setActiveTab('confirmed')} />;
        case 'telecallers':
          return <BackOfficeDashboard activeSubTab="telecallers" />;
        case 'surveyors':
          return <BackOfficeDashboard activeSubTab="surveyors" />;
        default:
          return <BackOfficeDashboard activeSubTab="confirmed" />;
      }
    }

    if (effectiveRole === 'telecaller') {
      switch (activeTab) {
        case 'myleads':
          return <TelecallerHome activeSubTab="myleads" />;
        case 'followups':
          return <TelecallerHome activeSubTab="followups" />;
        case 'history':
        case 'performance':
          return <TelecallerPerformance />;
        default:
          return <TelecallerHome activeSubTab="myleads" />;
      }
    }

    if (effectiveRole === 'surveyor') {
      switch (activeTab) {
        case 'surveys':
          return <SurveyorHome activeSubTab="surveys" />;
        case 'checklists':
          return <SurveyorHome activeSubTab="checklists" />;
        case 'upcoming':
          return <SurveyorHome activeSubTab="upcoming" />;
        case 'completed':
          return <SurveyorHome activeSubTab="completed" />;
        case 'performance':
          return <SurveyorHome activeSubTab="performance" />;
        default:
          return <SurveyorHome activeSubTab="surveys" />;
      }
    }

    return <AdminDashboard onNavigate={setActiveTab} />;
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col">
      {/* Top Header */}
      <Header />

      {/* Main Container: Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Tablet / Desktop Sidebar */}
        <Sidebar
          role={effectiveRole}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          badgeCounts={badgeCounts}
        />

        {/* Dynamic Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0 max-w-5xl">
          {renderContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        role={effectiveRole}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        badgeCounts={badgeCounts}
      />

      {/* Offline Status Warning Banner */}
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <CRMProvider>
          <MainAppLayout />
        </CRMProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
