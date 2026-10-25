import React, { useState, useEffect } from 'react';
import { User, BodyStat, Booking, WorkoutProgram, NutritionPlan, Announcement, Subscription, Enquiry, InAppNotification, ClassSchedule } from '../../types';
import { VelocityAPI } from '../../services/api';
import { DashboardOverview } from './DashboardOverview';
import { ProfileManagement } from './ProfileManagement';
import { BodyStatsTracker } from './BodyStatsTracker';
import { WorkoutPlansView } from './WorkoutPlansView';
import { NutritionPlanView } from './NutritionPlanView';
import { MyBookingsView } from './MyBookingsView';
import { SubscriptionView } from './SubscriptionView';
import { SupportTicketsView } from './SupportTicketsView';
import {
  LayoutDashboard, UserCheck, Scale, Dumbbell, Utensils,
  Calendar, Award, CreditCard, LogOut, CheckCircle2, X, LifeBuoy, Bell, ExternalLink, ShieldCheck, Menu
} from 'lucide-react';

import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

interface ClientDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigateHome: () => void;
  onOpenBooking?: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  user,
  onLogout,
  onNavigateHome
}) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  // Loaded data state
  const [bodyStats, setBodyStats] = useState<BodyStat[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [nutritionPlans, setNutritionPlans] = useState<NutritionPlan[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState<boolean>(false);

  const loadDashboardData = async (isInitial = false) => {
    if (isInitial) {
      setIsLoading(true);
    }

    const statsData = VelocityAPI.getBodyStats(user.id);
    setBodyStats(statsData);

    const bookingsData = VelocityAPI.getBookings(user.id);
    setBookings(bookingsData);

    try {
      const progData = await VelocityAPI.fetchPrograms(user.id);
      setPrograms(progData);
    } catch {
      setPrograms(VelocityAPI.getPrograms(user.id));
    }

    try {
      const nutData = await VelocityAPI.fetchNutritionPlans(user.id);
      setNutritionPlans(nutData);
    } catch {
      setNutritionPlans(VelocityAPI.getNutritionPlans(user.id));
    }

    try {
      const allClasses = await VelocityAPI.fetchClasses();
      const userClasses = allClasses.filter(c => {
        const isClientMatch = c.assignedToUserId === user.id || (c.assignedToUserName && c.assignedToUserName.toLowerCase().trim() === user.name.toLowerCase().trim()) || !c.assignedToUserId;
        const isApprovedOrPublished = c.isPublishedToClient !== false || c.status === 'approved' || c.status === 'published_to_client';
        return isClientMatch && isApprovedOrPublished;
      });
      setClassSchedules(userClasses);
    } catch {
      const localClasses = VelocityAPI.getClasses();
      const userClasses = localClasses.filter(c => {
        const isClientMatch = c.assignedToUserId === user.id || (c.assignedToUserName && c.assignedToUserName.toLowerCase().trim() === user.name.toLowerCase().trim()) || !c.assignedToUserId;
        const isApprovedOrPublished = c.isPublishedToClient !== false || c.status === 'approved' || c.status === 'published_to_client';
        return isClientMatch && isApprovedOrPublished;
      });
      setClassSchedules(userClasses);
    }

    const annData = VelocityAPI.getAnnouncements();
    setAnnouncements(annData);

    const subData = VelocityAPI.getSubscriptions();
    setSubscriptions(subData);

    const enqData = VelocityAPI.getEnquiries(user.email);
    setEnquiries(enqData);

    try {
      const notifs = await VelocityAPI.fetchInAppNotifications(user.email);
      setNotifications(notifs);
    } catch {
      setNotifications([]);
    }

    if (isInitial) {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData(true);
    const handleSync = () => loadDashboardData(false);
    window.addEventListener('bxstrength_programs_updated', handleSync);
    window.addEventListener('bxstrength_nutrition_updated', handleSync);
    window.addEventListener('bxstrength_assignments_updated', handleSync);
    window.addEventListener('bxstrength_notifications_updated', handleSync);

    const interval = setInterval(() => { if (!document.hidden) loadDashboardData(false); }, 30000);

    return () => {
      window.removeEventListener('bxstrength_programs_updated', handleSync);
      window.removeEventListener('bxstrength_nutrition_updated', handleSync);
      window.removeEventListener('bxstrength_assignments_updated', handleSync);
      window.removeEventListener('bxstrength_notifications_updated', handleSync);
      clearInterval(interval);
    };
  }, [user.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleMarkNotificationRead = async (id: string) => {
    await VelocityAPI.markNotificationAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const permissions = VelocityAPI.getCoachPermissions();

  const navItems = [
    { id: 'overview', label: 'OVERVIEW', icon: LayoutDashboard },
    { id: 'stats', label: 'BODY STATS & BMI', icon: Scale },
    ...(permissions.showUserWorkoutLogger !== false ? [{ id: 'workouts', label: 'WORKOUT PLANS', icon: Dumbbell }] : []),
    ...(permissions.showUserNutritionTracker !== false ? [{ id: 'nutrition', label: 'NUTRITION DIET', icon: Utensils }] : []),
    { id: 'bookings', label: 'MY BOOKINGS', icon: Calendar },
    { id: 'tickets', label: 'SUPPORT TICKETS', icon: LifeBuoy },
    ...(permissions.showUserBillingHistory !== false ? [{ id: 'subscription', label: 'SUBSCRIPTION', icon: CreditCard }] : []),
    { id: 'profile', label: 'MY PROFILE', icon: UserCheck }
  ];

  const latestStat = bodyStats.length > 0 ? bodyStats[bodyStats.length - 1] : undefined;
  const nextBooking = bookings.find((b) => b.status === 'Confirmed');

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col md:flex-row">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181b] text-white border-l-4 border-white px-5 py-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-white flex-shrink-0" />
          <p className="text-xs font-bold uppercase tracking-wide">{toastMsg}</p>
          <button onClick={() => setToastMsg(null)} className="ml-2 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mobile Navigation Header (< md) */}
      <div className="md:hidden bg-[#121214] border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center gap-3">
          <img
            src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
            alt={user.name}
            className="w-9 h-9 rounded-full object-cover border border-zinc-700"
          />
          <div>
            <h2 className="text-xs font-black uppercase text-white truncate max-w-[150px]">{user.name}</h2>
            <span className="text-[9px] font-bold text-zinc-400 uppercase block">Client Portal</span>
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
          {/* Sidebar Top User Card */}
          <div className="hidden md:block p-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-zinc-700"
              />
              <div className="overflow-hidden">
                <h2 className="text-sm font-black uppercase text-white truncate">{user.name}</h2>
                <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                  BxStrength Client
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 max-h-[60vh] md:max-h-none overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors text-left rounded-lg cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-md'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Actions */}
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
            <span>SIGN OUT</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow p-4 sm:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {/* Top Bar with Real-time In-App Notification Bell */}
        <div className="mb-6 bg-[#111114] border border-zinc-800 p-4 rounded-xl flex items-center justify-between relative shadow-lg">
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">CLIENT PORTAL & SYNCED PLANS</span>
            <h1 className="text-lg font-black uppercase text-white">Welcome back, {user.name}</h1>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white rounded-lg relative cursor-pointer transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5 text-amber-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#E52165] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-black animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showNotificationsMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#121214] border border-zinc-700 p-4 shadow-2xl z-50 rounded-xl max-h-96 overflow-y-auto space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-400" /> IN-APP NOTIFICATIONS
                  </span>
                  <button onClick={() => setShowNotificationsMenu(false)} className="text-zinc-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic text-center py-4">No notifications yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 border rounded-lg transition-all ${
                        n.isRead ? 'bg-zinc-900/40 border-zinc-800 opacity-70' : 'bg-amber-950/20 border-amber-800/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white uppercase">{n.title}</h4>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkNotificationRead(n.id)}
                            className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 border border-emerald-800 rounded"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">{n.message}</p>
                      
                      <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="flex items-center gap-1 text-amber-300">
                          <ShieldCheck className="w-3 h-3" /> Coach: {n.coachName}
                        </span>
                        <span>{new Date(n.timestamp || n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {n.linkTab && (
                        <button
                          onClick={() => {
                            setActiveTab(n.linkTab!);
                            setShowNotificationsMenu(false);
                          }}
                          className="mt-2 w-full bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold py-1 px-2 uppercase rounded flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 text-amber-400" /> View Update in {n.linkTab.toUpperCase()}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            <SkeletonLoader type="profile" />
            <SkeletonLoader type="kpi" count={4} />
            <SkeletonLoader type="card" count={2} />
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <DashboardOverview
                user={user}
                latestStat={latestStat}
                nextBooking={nextBooking}
                activeProgram={programs.find(p => p.assignedToUserId === user.id) || programs[0]}
                nutritionPlan={nutritionPlans.find(n => n.assignedToUserId === user.id) || nutritionPlans[0]}
                announcements={announcements}
                enquiries={enquiries}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'stats' && (
              <BodyStatsTracker
                userId={user.id}
                stats={bodyStats}
                onStatsUpdated={loadDashboardData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'workouts' && (
              <WorkoutPlansView
                programs={[...programs].sort((a, b) => (a.assignedToUserId === user.id ? -1 : 1))}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'nutrition' && (
              <NutritionPlanView
                plans={[...nutritionPlans].sort((a, b) => (a.assignedToUserId === user.id ? -1 : 1))}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'bookings' && (
              <MyBookingsView
                bookings={bookings}
                enquiries={enquiries}
                classSchedules={classSchedules}
                onBookingsUpdated={loadDashboardData}
                onShowToast={showToast}
              />
            )}

            {activeTab === 'tickets' && (
              <SupportTicketsView user={user} onShowToast={showToast} />
            )}

            {activeTab === 'subscription' && (
              <SubscriptionView user={user} onShowToast={showToast} />
            )}

            {activeTab === 'profile' && (
              <ProfileManagement user={user} onShowToast={showToast} />
            )}
          </>
        )}
      </main>
    </div>
  );
};
