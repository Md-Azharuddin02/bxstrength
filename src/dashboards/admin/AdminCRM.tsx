import React, { useState, useEffect } from 'react';
import { User, UserRole, ClassSchedule, Subscription, AuditLog, Enquiry, WorkoutProgram, NutritionPlan, Announcement } from '../../types';
import { VelocityAPI, getApiUrl } from '../../services/api';
import { CRMOverview } from './CRMOverview';
import { UserManagement } from './UserManagement';
import { ClassScheduleManager } from '../head-coach/ClassScheduleManager';
import { ProgramManager } from '../head-coach/ProgramManager';
import { NutritionManager } from '../head-coach/NutritionManager';
import { FinancialSubscriptions } from './FinancialSubscriptions';
import { EnquiriesManager } from '../customer-support/EnquiriesManager';
import { AnnouncementsManager } from './AnnouncementsManager';
import { AuditLogsAndSettings } from './AuditLogsAndSettings';
import { TicketManagement } from '../customer-support/TicketManagement';
import { SupportDashboardView } from '../customer-support/SupportDashboardView';
import { CoachesManager } from './CoachesManager';
import {
  LayoutDashboard, Users, Calendar, Dumbbell, Utensils,
  CreditCard, Mail, ShieldAlert, ShieldCheck, LogOut, CheckCircle2, X, LifeBuoy, UserCheck, Headphones, FileText, Menu
} from 'lucide-react';

import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

interface AdminCRMProps {
  user: User;
  onLogout: () => void;
  onNavigateHome: () => void;
}

export const AdminCRM: React.FC<AdminCRMProps> = ({ user, onLogout, onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Loaded data state
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassSchedule[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const loadCRMData = async () => {
    setIsLoading(true);
    try {
      const [
        fetchedUsers,
        fetchedClasses,
        fetchedSubs,
        fetchedAudit,
        fetchedEnq,
        fetchedProgs,
        fetchedNut,
        fetchedAnn
      ] = await Promise.all([
        VelocityAPI.fetchUsers(),
        VelocityAPI.fetchClasses(),
        VelocityAPI.fetchSubscriptions(),
        VelocityAPI.fetchAuditLogs(),
        VelocityAPI.fetchEnquiries(),
        VelocityAPI.fetchPrograms(),
        VelocityAPI.fetchNutritionPlans(),
        VelocityAPI.fetchAnnouncements()
      ]);

      setUsers(fetchedUsers);
      setClasses(fetchedClasses);
      setSubscriptions(fetchedSubs);
      setAuditLogs(fetchedAudit);
      setEnquiries(fetchedEnq);
      setPrograms(fetchedProgs);
      setNutritionPlans(fetchedNut);
      setAnnouncements(fetchedAnn);
    } catch (e: any) {
      console.error('Error loading CRM data from database:', e);
      setUsers(VelocityAPI.getUsers());
      setClasses(VelocityAPI.getClasses());
      setSubscriptions(VelocityAPI.getSubscriptions());
      setAuditLogs(VelocityAPI.getAuditLogs());
      setEnquiries(VelocityAPI.getEnquiries());
      setPrograms(VelocityAPI.getPrograms());
      setNutritionPlans(VelocityAPI.getNutritionPlans());
      setAnnouncements(VelocityAPI.getAnnouncements());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCRMData();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const isAdmin = user.role === 'admin';
  const isHeadCoach = user.role === 'headcoach' || (user.role === 'coach' && Boolean(
    user.coachPosition && (
      user.coachPosition.toLowerCase() === 'head coach' ||
      user.coachPosition.toLowerCase() === 'headcoach' ||
      user.coachPosition.toLowerCase() === 'chief athletic officer'
    )
  ));
  const isCoach = user.role === 'coach' || isHeadCoach;

  const coachPerms = VelocityAPI.getCoachPermissions();
  const allowedCoachTabs: string[] = [];

  if (isHeadCoach) {
    allowedCoachTabs.push('overview', 'users', 'schedule', 'programs', 'nutrition', 'enquiries', 'cs_dashboard', 'tickets', 'announcements');
    if (coachPerms.allowFinancials) allowedCoachTabs.push('subscriptions');
  } else if (isCoach) {
    if (coachPerms.allowLeadPipeline) allowedCoachTabs.push('overview');
    if (coachPerms.allowClientRoster) allowedCoachTabs.push('users');
    if (coachPerms.allowClassSchedules) allowedCoachTabs.push('schedule');
    if (coachPerms.allowWorkoutPrograms) allowedCoachTabs.push('programs');
    if (coachPerms.allowNutritionPlans) allowedCoachTabs.push('nutrition');
    allowedCoachTabs.push('enquiries');
    if (coachPerms.allowFinancials) allowedCoachTabs.push('subscriptions');
  } else {
    allowedCoachTabs.push('overview', 'users', 'schedule', 'programs', 'nutrition', 'subscriptions', 'enquiries', 'cs_dashboard', 'tickets', 'announcements', 'audit');
  }

  const allNavItems = [
    { id: 'overview', label: isHeadCoach ? 'HEAD COACH DASHBOARD' : (isCoach ? 'COACH DASHBOARD' : 'CRM OVERVIEW'), icon: LayoutDashboard },
    { id: 'users', label: isCoach ? 'CLIENT ROSTER' : 'USER DIRECTORY', icon: Users },
    { id: 'schedule', label: 'CLASS SCHEDULES', icon: Calendar },
    { id: 'programs', label: 'WORKOUT PROGRAMS', icon: Dumbbell },
    { id: 'nutrition', label: 'DIET PLANS', icon: Utensils },
    { id: 'subscriptions', label: 'FINANCIAL BILLING', icon: CreditCard },
    { id: 'enquiries', label: isCoach && !isHeadCoach ? 'ENQUIRIES' : (isHeadCoach ? 'HEAD COACH ENQUIRIES' : 'WEBSITE ENQUIRIES'), icon: Mail },
    { id: 'cs_dashboard', label: 'CUSTOMER SUPPORT DESK', icon: Headphones },
    { id: 'tickets', label: 'SUPPORT TICKETS', icon: LifeBuoy },
    { id: 'announcements', label: 'ANNOUNCEMENTS', icon: ShieldAlert },
    { id: 'audit', label: 'SECURITY & PERMISSIONS', icon: ShieldCheck }
  ];

  const navItems = isAdmin
    ? allNavItems
    : allNavItems.filter((item) => allowedCoachTabs.includes(item.id));

  const groupedNavSections = [
    {
      category: 'CORE MANAGEMENT',
      items: [
        { id: 'overview', label: isCoach ? 'COACH DASHBOARD' : 'CRM OVERVIEW', icon: LayoutDashboard },
        { id: 'users', label: isCoach ? 'CLIENT ROSTER' : 'USER DIRECTORY', icon: Users },
      ]
    },
    {
      category: 'ATHLETIC PROGRAMMING',
      items: [
        { id: 'schedule', label: 'CLASS SCHEDULES', icon: Calendar },
        { id: 'programs', label: 'WORKOUT PROGRAMS', icon: Dumbbell },
        { id: 'nutrition', label: 'DIET PLANS', icon: Utensils },
      ]
    },
    {
      category: isCoach && !isHeadCoach ? 'MY ASSIGNED WORKSPACE' : 'CUSTOMER SUPPORT & COMMUNICATIONS',
      items: [
        { id: 'enquiries', label: isCoach && !isHeadCoach ? 'ENQUIRIES' : (isHeadCoach ? 'HEAD COACH ENQUIRIES' : 'WEBSITE ENQUIRIES'), icon: Mail },
        { id: 'cs_dashboard', label: 'CUSTOMER SUPPORT DESK', icon: Headphones },
        { id: 'tickets', label: 'SUPPORT TICKETS', icon: LifeBuoy },
        { id: 'announcements', label: 'ANNOUNCEMENTS', icon: ShieldAlert },
      ]
    },
    {
      category: 'FINANCE & SECURITY',
      items: [
        { id: 'subscriptions', label: 'FINANCIAL BILLING', icon: CreditCard },
        { id: 'audit', label: 'SECURITY & PERMISSIONS', icon: ShieldCheck }
      ]
    }
  ];

  // Auto-redirect coach if currently on a restricted tab (e.g., Financial Billing)
  useEffect(() => {
    if (isCoach && !allowedCoachTabs.includes(activeTab)) {
      const fallbackTab = allowedCoachTabs[0] || 'overview';
      setActiveTab(fallbackTab);
      showToast('Tab access restricted by System Administrator.');
    }
  }, [isCoach, activeTab, allowedCoachTabs]);

  const coaches = users.filter((u) => u.role === 'coach' || u.role === 'headcoach' || u.role === 'admin');
  const clients = users.filter((u) => u.role === 'client');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col md:flex-row">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181b] text-white border-l-4 border-white px-5 py-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <p className="text-xs font-bold uppercase tracking-wide">{toastMsg}</p>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Navigation Header (< md) */}
      <div className="md:hidden bg-[#121214] border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-black uppercase text-white truncate max-w-[160px]">{user.name}</h2>
            <span className="text-[9px] font-bold text-zinc-400 uppercase block">
              {isAdmin ? 'BxStrength Admin' : (isHeadCoach ? 'Head Coach' : 'Coach')}
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="p-2 bg-zinc-900 border border-zinc-800 text-white rounded-lg flex items-center gap-1.5 text-xs font-bold uppercase cursor-pointer"
        >
          {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span>{mobileNavOpen ? 'CLOSE' : 'MENU'}</span>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`w-full md:w-64 bg-[#121214] border-b md:border-b-0 md:border-r border-zinc-800 flex-col justify-between flex-shrink-0 ${mobileNavOpen ? 'flex' : 'hidden md:flex'}`}>
        <div>
          {/* Header Info */}
          <div className="hidden md:block p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white text-black flex items-center justify-center font-bold shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-sm font-black uppercase text-white truncate">{user.name}</h2>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  {isAdmin ? 'BxStrength Admin' : (isHeadCoach ? 'BxStrength Head Coach' : 'BxStrength Coach')}
                </span>
              </div>
            </div>
          </div>

          {/* Grouped Nav Items */}
          <nav className="p-3 space-y-4 max-h-[60vh] md:max-h-none overflow-y-auto">
            {groupedNavSections.map((group) => {
              const visibleItems = group.items.filter((item) => navItems.some((n) => n.id === item.id));
              if (visibleItems.length === 0) return null;

              return (
                <div key={group.category} className="space-y-1">
                  <div className="px-3 pt-3 pb-1.5 border-b border-zinc-800/60 mb-1">
                    <h3 className="text-[11px] font-black tracking-widest text-zinc-400 uppercase">
                      {group.category}
                    </h3>
                  </div>
                  {visibleItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileNavOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all text-left rounded-lg cursor-pointer ${
                          isActive
                            ? 'bg-white text-black shadow-md font-extrabold ring-1 ring-white/50'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800 space-y-2">
          <button
            onClick={onNavigateHome}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold tracking-wider py-2.5 px-4 uppercase text-center transition-colors block rounded-lg border border-zinc-800 cursor-pointer"
          >
            ← BACK TO PUBLIC SITE
          </button>

          <button
            onClick={onLogout}
            className="w-full bg-red-950/40 hover:bg-red-900 text-red-300 text-xs font-bold tracking-wider py-2.5 px-4 uppercase text-center transition-colors flex items-center justify-center gap-2 border border-red-900/40 rounded-lg cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>EXIT SESSION</span>
          </button>
        </div>
      </aside>

      {/* Main CRM Workspace */}
      <main className="flex-grow p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {isLoading ? (
          <div className="space-y-6">
            <SkeletonLoader type="kpi" count={4} />
            <SkeletonLoader type="table" count={5} />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <CRMOverview
                users={users}
                classes={classes}
                subscriptions={subscriptions}
                auditLogs={auditLogs}
                enquiries={enquiries}
                isCoach={isCoach}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'users' && (
              <UserManagement
                users={users}
                isCoach={isCoach}
                isHeadCoach={isHeadCoach}
                onUsersUpdated={loadCRMData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'schedule' && (
              <ClassScheduleManager
                classes={classes}
                coaches={coaches}
                clients={clients}
                onClassesUpdated={loadCRMData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'programs' && (
              <ProgramManager
                programs={programs}
                clients={clients}
                coaches={coaches}
                user={user}
                onProgramsUpdated={loadCRMData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'nutrition' && (
              <NutritionManager
                plans={nutritionPlans}
                clients={clients}
                coaches={coaches}
                user={user}
                onPlansUpdated={loadCRMData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'subscriptions' && (
              <FinancialSubscriptions
                subscriptions={subscriptions}
                clients={clients}
                onSubscriptionsUpdated={loadCRMData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'enquiries' && (
              <EnquiriesManager
                enquiries={enquiries}
                user={user}
                coaches={coaches}
                onEnquiriesUpdated={loadCRMData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'cs_dashboard' && (
              <div className="space-y-6">
                <div className="bg-[#121214] border border-zinc-800 p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-amber-950/80 text-amber-300 rounded border border-amber-800/80">
                        {isAdmin ? 'ADMIN CRM • CUSTOMER SUPPORT CONTROL' : 'HEAD COACH • SUPPORT CONTROL'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                        Live Database Sync
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                      <Headphones className="w-6 h-6 text-[#CCFF00]" />
                      CUSTOMER SUPPORT DESK & INBOX MODULE
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
                      Master control over customer support operations: View live client tickets, compose email responses, log callbacks, edit tickets, assign agents, escalate urgent cases to Head Coach, and inspect complete audit logs.
                    </p>
                  </div>
                </div>

                <SupportDashboardView
                  onShowToast={showToast}
                />
              </div>
            )}

            {activeTab === 'tickets' && (
              <TicketManagement user={user} coaches={coaches} onShowToast={showToast} />
            )}

            {activeTab === 'announcements' && (
              <AnnouncementsManager
                announcements={announcements}
                onAnnouncementsUpdated={loadCRMData}
                onShowToast={showToast}
              />
            )}

            {isAdmin && activeTab === 'audit' && (
              <AuditLogsAndSettings
                auditLogs={auditLogs}
                onAuditLogsUpdated={loadCRMData}
                onShowToast={showToast}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};
