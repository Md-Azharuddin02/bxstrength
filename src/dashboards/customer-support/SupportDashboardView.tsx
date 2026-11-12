import React, { useState, useEffect, useMemo } from 'react';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory, TicketSource, User, PaidPackageBooking, ConsultationBooking, AthleteAssessment, Enquiry, InAppNotification } from '../../types';
import { PaidBookingsView } from '../head-coach/PaidBookingsView';
import { CoachAvailabilityRoster } from './CoachAvailabilityRoster';
import { normalizeRole } from '../../utils/auth';
import { VelocityAPI, getApiUrl, decodeHtmlEntities, apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { PhoneInput } from '../../components/PhoneInput';
import { ProfileManagement } from '../client/ProfileManagement';
import { FreeAssessmentsView } from '../head-coach/FreeAssessmentsView';
import { FreeConsultationsView } from '../head-coach/FreeConsultationsView';
import { EnquiriesManager } from './EnquiriesManager';
import { SupportSidebar, SUPPORT_NAV, type SupportTab } from './SupportSidebar';
import { SupportOverview } from './SupportOverview';
import { NotificationBell } from './NotificationBell';
import { useStaffNotifications, parseLink } from '../../hooks/useStaffNotifications';
import { 
  LifeBuoy, CheckCircle2, Clock, AlertCircle, MessageSquare, Search, Filter, ShieldAlert, 
  Send, Trash2, UserCheck, ArrowUpRight, Phone, Mail, Globe, Tag, ChevronRight, RefreshCw, 
  BarChart2, Lock, AlertTriangle, Plus, FileText, Check, ShieldCheck, X, Zap, CornerUpRight,
  User as UserIcon, Menu
} from 'lucide-react';

interface SupportDashboardViewProps {
  onShowToast?: (msg: string) => void;
  onNavigateHome?: () => void;
  onLogout?: () => void;
  initialTab?: SupportTab;
}

export const SupportDashboardView: React.FC<SupportDashboardViewProps> = ({ 
  onShowToast = () => {},
  onNavigateHome,
  onLogout,
  initialTab = 'dashboard'
}) => {
  const { user } = useAuth();

  // Role Simulator state for testing RBAC
  const [activeRoleView, setActiveRoleView] = useState<'customer_support' | 'headcoach' | 'coach' | 'admin'>(
    user?.role === 'admin' ? 'admin' : ((user?.role === 'headcoach' || user?.role === 'coach') ? user.role : 'customer_support')
  );

  const [activeTab, setActiveTab] = useState<SupportTab>(initialTab);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority'>('newest');

  // Interactive Form Inputs inside Selected Ticket
  const [communicationTab, setCommunicationTab] = useState<'email' | 'chat' | 'callback' | 'internal_note'>('email');
  const [responseInput, setResponseInput] = useState<string>('');
  const [internalNoteInput, setInternalNoteInput] = useState<string>('');
  const [callbackNotes, setCallbackNotes] = useState<string>('');

  // Escalation Modal State
  const [escalateModalOpen, setEscalateModalOpen] = useState<boolean>(false);
  const [escalationTarget, setEscalationTarget] = useState<string>('Company Agent');
  const [escalationReason, setEscalationReason] = useState<string>('');

  // Create Ticket Modal State
  const [createTicketModalOpen, setCreateTicketModalOpen] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>('');
  const [newCustEmail, setNewCustEmail] = useState<string>('');
  const [newCustPhone, setNewCustPhone] = useState<string>('');
  const [newCustCountry, setNewCustCountry] = useState<string>('GB');
  const [newSubject, setNewSubject] = useState<string>('');
  const [newDesc, setNewDesc] = useState<string>('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('General');
  const [newPriority, setNewPriority] = useState<TicketPriority>('normal');
  const [newSource, setNewSource] = useState<TicketSource>('Website Contact Form');

  // Delete Confirm Modal State
  const [deletingTicket, setDeletingTicket] = useState<SupportTicket | null>(null);

  const fetchTickets = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const localTickets = VelocityAPI.getTickets();
      let serverTickets: SupportTicket[] = [];
      try {
        const res = await apiFetch('/api/tickets');
        if (res.ok) {
          serverTickets = await res.json();
        }
      } catch (err) {
        console.warn('Failed to fetch server tickets in CS:', err);
      }

      const mapById = new Map<string, SupportTicket>();
      [...localTickets, ...serverTickets].forEach(t => {
        if (t && t.id && t.id !== 'TICKET-849201' && t.id !== 'TICKET-739104') {
          mapById.set(t.id, t);
        }
      });
      const loaded = Array.from(mapById.values());
      setTickets(loaded);
      // Functional update: this runs from a stale-closure interval, so don't read `selectedTicket` directly.
      setSelectedTicket(prev => {
        if (!prev) return loaded[0] ?? null;
        return loaded.find(t => t.id === prev.id) ?? prev;
      });
    } catch {
      const loaded = VelocityAPI.getTickets().filter(t => t.id !== 'TICKET-849201' && t.id !== 'TICKET-739104');
      setTickets(loaded);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  // Live Coaches & Paid Bookings state for Customer Support Oversight
  const [coaches, setCoaches] = useState<User[]>([]);
  const [consultations, setConsultations] = useState<ConsultationBooking[]>([]);
  const [assessments, setAssessments] = useState<AthleteAssessment[]>([]);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [paidBookings, setPaidBookings] = useState<PaidPackageBooking[]>(() => {
    try {
      const raw = localStorage.getItem('bxstrength_paid_bookings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const loadData = async () => {
    try {
      const [uList, bookings, cons, assess, enqs] = await Promise.all([
        VelocityAPI.fetchUsers(),
        VelocityAPI.fetchPaidBookings(),
        VelocityAPI.fetchConsultations(),
        VelocityAPI.fetchAssessments(),
        VelocityAPI.fetchEnquiries(),
      ]);
      setCoaches(uList.filter(u => {
        const r = normalizeRole(u.role);
        return r === 'coach' || r === 'headcoach';
      }));
      setPaidBookings(bookings);
      setConsultations(Array.isArray(cons) ? cons : []);
      setAssessments(Array.isArray(assess) ? assess : []);
      setEnquiries(Array.isArray(enqs) ? enqs : []);
      setLoadError(false);
      try { localStorage.setItem('bxstrength_paid_bookings', JSON.stringify(bookings)); } catch {}
    } catch (e) {
      console.warn('Failed to load support dashboard data:', e);
      setLoadError(true);
    }
  };

  const { items: notifications, loading: notifLoading, error: notifError, unreadByTab, unreadTotal, markRead, refresh: refreshNotifications } = useStaffNotifications();

  useEffect(() => {
    loadData();
    window.addEventListener('bxstrength_paid_bookings_updated', loadData);
    return () => window.removeEventListener('bxstrength_paid_bookings_updated', loadData);
  }, []);

  // A new notification means a new record: reload the lists so the dashboard and sections show it right away.
  const newestNotifId = notifications[0]?.id;
  useEffect(() => {
    if (!newestNotifId) return;
    loadData();
    fetchTickets(false);
  }, [newestNotifId]);

  const selectTab = (tab: SupportTab, resetFilters = true) => {
    setActiveTab(tab);
    if (tab === 'inbox' && resetFilters) { setStatusFilter('all'); setPriorityFilter('all'); }
    markRead(notifications.filter(n => !n.isRead && parseLink(n).tab === tab).map(n => n.id));
  };

  const openNotification = (n: InAppNotification) => {
    const { tab, recordId } = parseLink(n);
    markRead([n.id]);
    if (!SUPPORT_NAV.some(i => i.id === tab)) return;
    setActiveTab(tab as SupportTab);
    if (tab === 'inbox') {
      setStatusFilter('all'); setPriorityFilter('all'); setSourceFilter('all'); setSearchTerm('');
      const t = tickets.find(x => x.id === recordId);
      if (t) setSelectedTicket(t);
    }
  };

  useEffect(() => {
    fetchTickets(true);
    const interval = setInterval(() => { if (document.visibilityState === 'visible') fetchTickets(false); }, 60_000); // 60s sync, paused while the tab is hidden; new tickets also arrive via notifications

    const handleTicketsUpdated = () => {
      fetchTickets(false);
    };

    window.addEventListener('bxstrength_tickets_updated', handleTicketsUpdated);
    window.addEventListener('storage', handleTicketsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bxstrength_tickets_updated', handleTicketsUpdated);
      window.removeEventListener('storage', handleTicketsUpdated);
    };
  }, []);

  const analytics = useMemo(() => VelocityAPI.getSupportAnalytics(tickets), [tickets]);

  // Filtered & Sorted Tickets
  const filteredTickets = tickets.filter(t => {
    // RBAC Filter: CS Agent can only view relevant/assigned tickets unless they are Company Agent or Admin
    if (activeRoleView === 'customer_support') {
      const isAssigned = t.assignedAgent?.toLowerCase().includes('cs') || t.assignedAgent === 'Unassigned' || !t.assignedAgent;
      if (!isAssigned && t.assignedAgentRole === 'admin') return false;
    }

    const cleanTerm = searchTerm.toLowerCase().trim().replace(/^#/, '');
    const matchesSearch = !cleanTerm ||
      t.id.toLowerCase().includes(cleanTerm) ||
      t.userName.toLowerCase().includes(cleanTerm) ||
      t.userEmail.toLowerCase().includes(cleanTerm) ||
      (t.userPhone && t.userPhone.toLowerCase().includes(cleanTerm)) ||
      t.subject.toLowerCase().includes(cleanTerm) ||
      t.description.toLowerCase().includes(cleanTerm) ||
      (t.assignedAgent && t.assignedAgent.toLowerCase().includes(cleanTerm)) ||
      (t.relatedBookingId && t.relatedBookingId.toLowerCase().includes(cleanTerm)) ||
      (t.relatedTransactionId && t.relatedTransactionId.toLowerCase().includes(cleanTerm));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'new' ? (t.status === 'new' || t.status === 'open') :
       statusFilter === 'open' ? (t.status !== 'resolved' && t.status !== 'closed') :
       statusFilter === 'in_progress' ? (t.status === 'in_progress' || t.status === 'assigned') :
       t.status === statusFilter);

    const matchesPriority = priorityFilter === 'all' || 
      (priorityFilter === 'urgent' 
        ? (t.priority === 'urgent' || Boolean(t.escalationHistory && t.escalationHistory.length > 0)) 
        : t.priority === priorityFilter);
    const matchesSource = sourceFilter === 'all' || t.source === sourceFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesAgent = agentFilter === 'all' || 
      (agentFilter === 'unassigned' ? (!t.assignedAgent || t.assignedAgent === 'Unassigned') : t.assignedAgent === agentFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesCategory && matchesAgent;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'priority') {
      const priorityMap: Record<string, number> = { urgent: 4, high: 3, normal: 2, medium: 2, low: 1 };
      return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
    }
    return 0;
  });

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    const updated = VelocityAPI.updateTicketStatus(selectedTicket.id, status);
    try {
      await apiFetch(`/api/tickets/${encodeURIComponent(selectedTicket.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
    } catch {}
    if (updated) {
      setSelectedTicket(updated);
      fetchTickets();
      onShowToast(`Ticket #${selectedTicket.id} status set to "${status.toUpperCase().replace('_', ' ')}".`);
    }
  };

  // Assign/escalate must be saved on the server: tickets fetched from the API are not in local storage,
  // and the server copy overwrites local edits on the next refresh. Returns false (and toasts) if the save fails.
  const saveTicketChange = async (patch: Record<string, unknown>): Promise<boolean> => {
    if (!selectedTicket) return false;
    try {
      const res = await apiFetch(`/api/tickets/${encodeURIComponent(selectedTicket.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) return true;
    } catch {}
    onShowToast('Could not save the change. Please try again.');
    return false;
  };

  const handleAssignAgent = async (agentName: string, agentRole: 'customer_support' | 'headcoach' | 'coach' | 'admin') => {
    if (!selectedTicket) return;
    if (!(await saveTicketChange({ assignedAgent: agentName, assignedAgentRole: agentRole, status: selectedTicket.status === 'new' ? 'assigned' : undefined }))) return;
    VelocityAPI.assignTicket(selectedTicket.id, agentName, agentRole); // keeps the local copy and audit log in step
    setSelectedTicket({ ...selectedTicket, assignedAgent: agentName, assignedAgentRole: agentRole, status: selectedTicket.status === 'new' ? 'assigned' : selectedTicket.status });
    fetchTickets();
    onShowToast(`Ticket #${selectedTicket.id} assigned to ${agentName}.`);
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseInput.trim()) return;
    const text = responseInput.trim();
    const updated = VelocityAPI.addTicketMessage(
      selectedTicket.id,
      text,
      communicationTab === 'chat' ? 'chat' : 'email',
      activeRoleView === 'admin' ? 'Admin Support Desk' : (activeRoleView === 'headcoach' ? 'Head Coach Desk' : (activeRoleView === 'coach' ? 'Coach Support Desk' : 'CS Team Agent')),
      'agent'
    );
    try {
      await apiFetch(`/api/tickets/${encodeURIComponent(selectedTicket.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminResponse: text, status: 'resolved' })
      });
    } catch {}
    if (updated) {
      setSelectedTicket(updated);
      setResponseInput('');
      fetchTickets();
      onShowToast(`Response sent to customer ${selectedTicket.userName} via ${communicationTab.toUpperCase()}!`);
    }
  };

  const handleAddInternalNote = () => {
    if (!selectedTicket || !internalNoteInput.trim()) return;
    const updated = VelocityAPI.addInternalNote(
      selectedTicket.id,
      internalNoteInput.trim(),
      user ? user.name : (activeRoleView === 'admin' ? 'Admin Manager' : 'CS Agent'),
      activeRoleView.toUpperCase()
    );
    if (updated) {
      setSelectedTicket(updated);
      setInternalNoteInput('');
      fetchTickets();
      onShowToast(`Internal note logged for Ticket #${selectedTicket.id} (Customer-Hidden).`);
    }
  };

  const handleLogCallback = () => {
    if (!selectedTicket || !callbackNotes.trim()) return;
    const updated = VelocityAPI.addTicketMessage(
      selectedTicket.id,
      `[PHONE CALLBACK LOGGED]\nSummary: ${callbackNotes.trim()}`,
      'callback',
      activeRoleView === 'admin' ? 'Admin Desk' : 'CS Agent',
      'agent'
    );
    if (updated) {
      setSelectedTicket(updated);
      setCallbackNotes('');
      fetchTickets();
      onShowToast(`Phone callback logged for ${selectedTicket.userName}.`);
    }
  };

  const handleConfirmEscalation = async () => {
    if (!selectedTicket || !escalationReason.trim()) return;
    const reason = escalationReason.trim();
    const saved = await saveTicketChange({
      priority: 'urgent',
      assignedAgent: escalationTarget,
      escalation: { escalatedTo: escalationTarget, reason, priorityAtEscalation: selectedTicket.priority },
    });
    if (!saved) return;
    VelocityAPI.escalateTicket(selectedTicket.id, escalationTarget, reason); // local copy + audit log
    setSelectedTicket({
      ...selectedTicket,
      priority: 'urgent',
      assignedAgent: escalationTarget,
      escalationHistory: [
        { id: `esc-${Date.now()}`, escalatedBy: `${user?.name || 'CS Agent'} (${(user?.role || '').toUpperCase()})`, escalatedTo: escalationTarget, reason, priorityAtEscalation: selectedTicket.priority, createdAt: new Date().toISOString() },
        ...(selectedTicket.escalationHistory || []),
      ],
    });
    setEscalateModalOpen(false);
    setEscalationReason('');
    fetchTickets();
    onShowToast(`Ticket #${selectedTicket.id} escalated to ${escalationTarget} with urgent priority.`);
  };

  const handleCreateNewTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustEmail || !newSubject || !newDesc) return;

    const created = VelocityAPI.createTicket({
      userName: newCustName,
      userEmail: newCustEmail,
      userPhone: newCustPhone,
      userCountry: newCustCountry,
      subject: newSubject,
      description: newDesc,
      category: newCategory,
      priority: newPriority,
      source: newSource,
      assignedAgent: 'CS Team'
    });

    setCreateTicketModalOpen(false);
    setNewCustName('');
    setNewCustEmail('');
    setNewCustPhone('');
    setNewSubject('');
    setNewDesc('');
    fetchTickets();
    setSelectedTicket(created);
    onShowToast(`New ticket #${created.id} logged successfully in CS Dashboard.`);
  };

  const handleConfirmDelete = async () => {
    if (!deletingTicket) return;
    VelocityAPI.deleteTicket(deletingTicket.id);
    try {
      await apiFetch(`/api/tickets/${encodeURIComponent(deletingTicket.id)}`, { method: 'DELETE' });
    } catch {}
    if (selectedTicket?.id === deletingTicket.id) {
      setSelectedTicket(null);
    }
    setDeletingTicket(null);
    fetchTickets();
    onShowToast(`Ticket #${deletingTicket.id} permanently deleted.`);
  };

  // Helper formatting badges
  const getPriorityBadge = (p: TicketPriority) => {
    switch (p) {
      case 'urgent':
        return <span className="bg-red-500/20 text-red-400 border border-red-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">🚨 URGENT</span>;
      case 'high':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">⚡ HIGH</span>;
      case 'normal':
      case 'medium':
        return <span className="bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">NORMAL</span>;
      case 'low':
      default:
        return <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">LOW</span>;
    }
  };

  const getStatusBadge = (s: TicketStatus) => {
    switch (s) {
      case 'new':
      case 'open':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">NEW / OPEN</span>;
      case 'assigned':
        return <span className="bg-purple-500/20 text-purple-400 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">ASSIGNED</span>;
      case 'in_progress':
        return <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">IN PROGRESS</span>;
      case 'waiting_customer':
        return <span className="bg-orange-500/20 text-orange-400 border border-orange-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">AWAITING CLIENT</span>;
      case 'resolved':
        return <span className="bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">RESOLVED</span>;
      case 'closed':
        return <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">CLOSED</span>;
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex bg-[#0a0a0c] text-white font-sans overflow-hidden">
      <SupportSidebar
        active={activeTab}
        onSelect={selectTab}
        unread={{ ...unreadByTab, inbox: unreadByTab.inbox || 0 }}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={onLogout}
        user={user}
        onEditProfile={() => setProfileOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Fixed top bar: only the content below it scrolls */}
        <header className="shrink-0 h-14 bg-[#121214] border-b border-zinc-800 px-3 sm:px-5 flex items-center justify-between gap-3 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 rounded-xl bg-[#18181b] border border-zinc-800 text-zinc-300 cursor-pointer" aria-label="Open menu">
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">{SUPPORT_NAV.find(n => n.id === activeTab)?.label}</h1>
              <p className="hidden sm:block text-[11px] text-zinc-500 truncate">{user?.name} · {user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setCreateTicketModalOpen(true)}
              className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase px-3 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Log New Inquiry</span>
            </button>
            <button
              onClick={() => { fetchTickets(false); loadData(); refreshNotifications(); onShowToast('Dashboard refreshed'); }}
              className="p-2 rounded-xl bg-[#18181b] border border-zinc-800 hover:bg-zinc-800 cursor-pointer"
              title="Refresh live data"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4 text-[#CCFF00]" />
            </button>
            <a href="/" target="_blank" rel="noopener noreferrer" className="hidden md:flex p-2 rounded-xl bg-[#18181b] border border-zinc-800 hover:bg-zinc-800" title="Open BxStrength website" aria-label="View website">
              <Globe className="w-4 h-4 text-[#CCFF00]" />
            </a>
            <NotificationBell
              items={notifications}
              unread={unreadTotal}
              loading={notifLoading}
              error={notifError}
              onOpen={openNotification}
              onMarkAllRead={() => markRead(notifications.filter(n => !n.isRead).map(n => n.id))}
            />
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-6">

        {activeTab === 'dashboard' && (
          <SupportOverview
            tickets={tickets}
            paidBookings={paidBookings}
            consultations={consultations}
            assessments={assessments}
            enquiries={enquiries}
            notifications={notifications}
            loading={isLoading}
            error={loadError}
            onRetry={() => { fetchTickets(false); loadData(); }}
            onNavigate={(tab, opts) => {
              if (opts?.priority) setPriorityFilter(opts.priority);
              if (opts?.recordId) setSelectedTicket(tickets.find(t => t.id === opts.recordId) ?? null);
              selectTab(tab, !opts?.priority);
            }}
            onOpenNotification={openNotification}
            user={user}
            analytics={analytics}
            onMarkAllRead={() => markRead(notifications.filter(n => !n.isRead).map(n => n.id))}
          />
        )}

        {/* TAB 0A: LIVE PAID BOOKINGS & DISPATCH DESK */}
        {activeTab === 'paid_bookings' && user && (
          <div className="space-y-4">
            <PaidBookingsView
              user={user}
              coaches={coaches}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* TAB 0B: COACH AVAILABILITY & WORKLOAD ROSTER */}
        {activeTab === 'coaches_workload' && (
          <div className="space-y-4">
            <CoachAvailabilityRoster
              coaches={coaches}
              paidBookings={paidBookings}
              onBookingsUpdated={loadData}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* TAB 1: CENTRAL TICKET INBOX & 360 WORKSPACE */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            
            {/* One toolbar: search + filters (source select replaces the old channel pills) */}
            <div className="flex flex-col xl:flex-row gap-2 bg-[#121214] p-2 rounded-xl border border-zinc-800">
              <div className="relative flex-1 min-w-0">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" aria-hidden />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, email, phone, ticket or booking ID"
                  aria-label="Search tickets"
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00]"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer">
                  <option value="all">All statuses</option>
                  <option value="new">New / open</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In progress</option>
                  <option value="waiting_customer">Awaiting client</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <select aria-label="Priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer">
                  <option value="all">All priorities</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
                <select aria-label="Channel" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="bg-[#18181b] border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer">
                  <option value="all">All channels</option>
                  <option value="Website Contact Form">Website form</option>
                  <option value="Chatbot">Chatbot</option>
                  <option value="Booking">Consultation / booking</option>
                  <option value="Payment">Payment & billing</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Callback Request">Phone callback</option>
                </select>
                <select aria-label="Sort" value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="bg-[#18181b] border border-zinc-800 rounded-lg px-2.5 py-2 text-sm text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer">
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="priority">Highest priority</option>
                </select>
                {(statusFilter !== 'all' || priorityFilter !== 'all' || sourceFilter !== 'all' || searchTerm) && (
                  <button
                    onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setSourceFilter('all'); setSearchTerm(''); }}
                    className="text-sm text-zinc-400 hover:text-white px-2 py-2 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            {/* SPLIT VIEW WORKSPACE (LEFT: TICKET LIST, RIGHT: DETAILED TICKET & 360 PROFILE) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT INBOX TICKET LIST (4 COLS) */}
              <div className="lg:col-span-5 bg-[#121214] border border-zinc-800 rounded-2xl p-4 space-y-3 lg:h-[calc(100dvh-11rem)] h-[70dvh] min-h-[420px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-sm font-bold text-white">Tickets <span className="text-zinc-500 font-normal tabular-nums">{filteredTickets.length}</span></span>
                  <span className="text-xs text-zinc-500">Updates every minute</span>
                </div>

                {isLoading ? (
                  <div role="status" className="py-24 text-center text-zinc-500 text-xs">Loading tickets…</div>
                ) : filteredTickets.length === 0 ? (
                  <div className="py-24 text-center text-zinc-500 text-xs px-4 space-y-2">
                    <LifeBuoy className="w-10 h-10 mx-auto text-zinc-600 mb-1" />
                    <p className="font-bold text-zinc-300 uppercase tracking-wide">NO SUPPORT TICKETS OR INQUIRIES YET</p>
                    <p className="text-[11px] text-zinc-500 max-w-xs mx-auto leading-relaxed">
                      All authentic customer enquiries from the website, chatbot, bookings, payments, or WhatsApp will appear here in real time.
                    </p>
                  </div>
                ) : (
                  filteredTickets.map(ticket => {
                    const isSelected = selectedTicket?.id === ticket.id;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => setSelectedTicket(ticket)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedTicket(ticket); } }}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isSelected}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00] ${
                          isSelected
                            ? 'bg-[#18181c] border-[#CCFF00] shadow-md'
                            : 'bg-[#18181b]/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-[#18181b]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-mono font-bold text-[#CCFF00]">{ticket.id}</span>
                          <div className="flex items-center gap-1.5">
                            {getPriorityBadge(ticket.priority)}
                            {getStatusBadge(ticket.status)}
                          </div>
                        </div>

                        <h3 className="text-xs font-black uppercase text-white line-clamp-1 leading-snug">
                          {ticket.subject}
                        </h3>

                        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/60">
                          <span className="font-medium text-zinc-300">{ticket.userName}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-zinc-400">
                          <span className="bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-mono">
                            {ticket.source || 'Website Contact Form'}
                          </span>
                          <span className="text-zinc-500">Agent: {ticket.assignedAgent || 'CS Team'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* RIGHT WORKSPACE: SELECTED TICKET DETAIL & 360 PROFILE (7 COLS) */}
              <div className="lg:col-span-7 bg-[#121214] border border-zinc-800 rounded-2xl p-5 lg:h-[calc(100dvh-11rem)] h-[70dvh] min-h-[420px] overflow-y-auto custom-scrollbar flex flex-col justify-between">
                
                {selectedTicket ? (
                  <div className="space-y-6">
                    
                    {/* TICKET TOP HEADER & QUICK STATUS ACTIONS */}
                    <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono font-black text-[#CCFF00] bg-black px-3 py-1 rounded-md border border-zinc-800">
                            #{selectedTicket.id}
                          </span>
                          {getPriorityBadge(selectedTicket.priority)}
                          {getStatusBadge(selectedTicket.status)}
                        </div>

                        {/* REASSIGN & ESCALATE */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEscalateModalOpen(true)}
                            className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>ESCALATE</span>
                          </button>

                          {activeRoleView === 'admin' && (
                            <button
                              onClick={() => setDeletingTicket(selectedTicket)}
                              className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
                              title="Delete Ticket"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <h2 className="text-base font-black uppercase text-white leading-snug">
                          {selectedTicket.subject}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2">
                          <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-[#CCFF00]" /> Category: <strong className="text-white">{selectedTicket.category}</strong></span>
                          <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-[#CCFF00]" /> Source: <strong className="text-white">{selectedTicket.source || 'Website Contact Form'}</strong></span>
                          <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-[#CCFF00]" /> Agent: <strong className="text-white">{selectedTicket.assignedAgent || 'CS Team'}</strong></span>
                        </div>
                      </div>

                      {/* QUICK STATUS TRANSITION & HEAD COACH TRANSFER BUTTONS */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 mr-1">Update Status:</span>
                        <button onClick={() => handleUpdateStatus('in_progress')} className="bg-zinc-900 hover:bg-yellow-500/20 hover:text-yellow-400 text-zinc-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded border border-zinc-800 transition-all cursor-pointer">
                          In Progress
                        </button>
                        <button onClick={() => handleUpdateStatus('waiting_customer')} className="bg-zinc-900 hover:bg-orange-500/20 hover:text-orange-400 text-zinc-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded border border-zinc-800 transition-all cursor-pointer">
                          Awaiting Client
                        </button>
                        <button onClick={() => handleUpdateStatus('resolved')} className="bg-zinc-900 hover:bg-cyan-500/20 hover:text-cyan-400 text-zinc-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded border border-zinc-800 transition-all cursor-pointer">
                          Resolved
                        </button>
                        <button onClick={() => handleUpdateStatus('closed')} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded border border-zinc-800 transition-all cursor-pointer">
                          Closed
                        </button>

                        <button
                          onClick={() => {
                            if (!selectedTicket) return;
                            try {
                              VelocityAPI.transferEnquiryToHeadCoach(
                                selectedTicket.id,
                                user ? user.name : 'Customer Support Desk',
                                `Support Ticket #${selectedTicket.id}: ${selectedTicket.description}`,
                                selectedTicket.category,
                                selectedTicket.priority === 'medium' ? 'normal' : selectedTicket.priority
                              );
                              onShowToast(`Enquiry for "${selectedTicket.userName}" transferred directly to Head Coach Enquiries Tab!`);
                              fetchTickets();
                            } catch (err: any) {
                              onShowToast(err.message || 'Failed to transfer to Head Coach');
                            }
                          }}
                          className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-[10px] font-black uppercase px-3 py-1 rounded border border-amber-700/80 transition-all cursor-pointer flex items-center gap-1 ml-auto shadow-sm"
                          title="Directly transfer this coaching/training enquiry to Head Coach Dashboard Enquiries tab"
                        >
                          <CornerUpRight className="w-3 h-3 text-amber-400" />
                          <span>TRANSFER TO HEAD COACH</span>
                        </button>
                      </div>
                    </div>

                    {/* 360° CUSTOMER PROFILE & SAFE DATA INTEGRATION SUMMARY */}
                    <div className="bg-[#18181b]/70 border border-zinc-800 p-4 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#CCFF00] flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-[#CCFF00]" />
                          360° CLIENT PROFILE & SYSTEM DATA
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-zinc-400 text-[11px]">Client Name: <strong className="text-white">{selectedTicket.userName}</strong></p>
                          <p className="text-zinc-400 text-[11px]">Email: <a href={`mailto:${selectedTicket.userEmail}`} className="text-white underline">{selectedTicket.userEmail}</a></p>
                          <p className="text-zinc-400 text-[11px]">Phone: <strong className="text-white">{selectedTicket.userPhone || '+44 (UK) / +91 (IN)'}</strong></p>
                        </div>
                        <div>
                          <p className="text-zinc-400 text-[11px]">Linked Service: <strong className="text-white">{selectedTicket.serviceOrProduct || '1-to-1 Digital Coaching'}</strong></p>
                          {selectedTicket.relatedBookingId && (
                            <p className="text-zinc-400 text-[11px]">Booking Code: <span className="text-[#CCFF00] font-mono font-bold">{selectedTicket.relatedBookingId}</span></p>
                          )}
                          {selectedTicket.relatedTransactionId && (
                            <p className="text-zinc-400 text-[11px]">Txn Reference: <span className="text-purple-400 font-mono font-bold">{selectedTicket.relatedTransactionId}</span></p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* CHATBOT CONTEXT SNIPPET (IF ORIGINATED FROM CHATBOT) */}
                    {selectedTicket.chatContext?.botConversationSnippet && (
                      <div className="bg-[#18181c] border-l-4 border-[#CCFF00] p-3.5 rounded-r-xl space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00] block">
                          🤖 CHATBOT CONVERSATION SNIPPET (ESCALATION CONTEXT)
                        </span>
                        <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {selectedTicket.chatContext.botConversationSnippet}
                        </pre>
                      </div>
                    )}

                    {/* ESCALATION HISTORY (IF APPLICABLE) */}
                    {selectedTicket.escalationHistory && selectedTicket.escalationHistory.length > 0 && (
                      <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl space-y-1 text-xs">
                        <span className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> ESCALATION RECORD
                        </span>
                        {selectedTicket.escalationHistory.map(esc => (
                          <div key={esc.id} className="text-zinc-300 text-[11px]">
                            Escalated by <strong className="text-white">{esc.escalatedBy}</strong> to <strong className="text-white">{esc.escalatedTo}</strong>: "{esc.reason}" ({new Date(esc.createdAt).toLocaleTimeString()})
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CONVERSATION HISTORY TIMELINE */}
                    <div className="space-y-3">
                      <span className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
                        COMMUNICATION TIMELINE & LOGS
                      </span>

                      <div className="space-y-3">
                        {selectedTicket.conversationHistory && selectedTicket.conversationHistory.length > 0 ? (
                          selectedTicket.conversationHistory.map(msg => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-xl border space-y-1 text-xs ${
                                msg.senderRole === 'customer'
                                  ? 'bg-[#18181b] border-zinc-800 text-zinc-200'
                                  : (msg.channel === 'callback' 
                                      ? 'bg-purple-950/30 border-purple-800/50 text-purple-200' 
                                      : 'bg-[#18181c] border-[#CCFF00]/40 text-white')
                              }`}
                            >
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-800/60 pb-1">
                                <span className="font-bold text-white flex items-center gap-1">
                                  {msg.senderRole === 'customer' ? <UserIcon className="w-3 h-3 text-zinc-400" /> : <ShieldCheck className="w-3 h-3 text-[#CCFF00]" />}
                                  {msg.senderName} ({msg.channel.toUpperCase()})
                                </span>
                                <span className="font-mono text-zinc-500">
                                  {new Date(msg.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed pt-1 whitespace-pre-wrap">{msg.text}</p>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800 text-xs text-zinc-300">
                            {selectedTicket.description}
                          </div>
                        )}

                        {/* INTERNAL NOTES (STRICTLY HIDDEN FROM CUSTOMER) */}
                        {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 && (
                          <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                            <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-400" /> INTERNAL TEAM NOTES (CUSTOMER-HIDDEN)
                            </span>
                            {selectedTicket.internalNotes.map(note => (
                              <div key={note.id} className="bg-amber-950/20 border border-amber-800/40 p-2.5 rounded-lg text-xs space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-amber-300/80">
                                  <span>Author: {note.authorName} ({note.authorRole})</span>
                                  <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-amber-100 text-xs">{note.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                                   </div>       </div>

                  </div>
                ) : (
                  <div className="py-32 text-center text-zinc-500 text-xs">
                    Select a support ticket from the inbox to open the 360° workspace.
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS & SECURITY */}
        {activeTab === 'audit_logs' && (
          <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl space-y-4">
            <div>
              <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#CCFF00]" /> AUDIT LOGS & PCI-DSS COMPLIANCE
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Timestamped audit records of ticket creations, escalations, internal notes, and administrative actions.
              </p>
            </div>

            <div className="space-y-2">
              {VelocityAPI.getAuditLogs().slice(0, 15).map(log => (
                <div key={log.id} className="bg-[#18181b] p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-white uppercase">{log.action}</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">{log.details}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-zinc-500 font-mono block">{new Date(log.timestamp).toLocaleString()}</span>
                    <span className="text-[10px] text-[#CCFF00] font-bold">{log.userName} ({log.userRole.toUpperCase()})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'enquiries' && (
          <EnquiriesManager
            enquiries={enquiries}
            user={user ?? undefined}
            coaches={coaches}
            onEnquiriesUpdated={loadData}
            onShowToast={onShowToast}
          />
        )}

        {/* TAB 5: ATHLETE ASSESSMENTS DESK */}
        {activeTab === 'assessments' && user && (
          <FreeAssessmentsView
            user={user}
            onShowToast={onShowToast}
          />
        )}

        {/* TAB 6: FREE DEMO & CONSULTATIONS DESK */}
        {activeTab === 'free_consultations' && user && (
          <FreeConsultationsView
            user={user}
            coaches={coaches}
            onShowToast={onShowToast}
          />
        )}

        </main>
      </div>

      {profileOpen && user && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-start justify-center p-0 sm:p-6 overflow-y-auto" role="dialog" aria-modal="true" aria-label="Edit profile">
          <div className="relative w-full max-w-3xl bg-[#121214] border border-zinc-800 sm:rounded-2xl p-4 sm:p-6 min-h-full sm:min-h-0">
            <button onClick={() => setProfileOpen(false)} className="absolute top-3 right-3 text-zinc-400 hover:text-white cursor-pointer" aria-label="Close profile"><X className="w-5 h-5" /></button>
            <ProfileManagement user={user} onShowToast={onShowToast} />
          </div>
        </div>
      )}

      {/* ESCALATION MODAL */}
      {escalateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
          <div className="bg-[#18181b] border-0 sm:border border-red-500/40 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md p-4 sm:p-6 rounded-none sm:rounded-2xl space-y-4 shadow-2xl animate-in zoom-in-95 overflow-y-auto flex flex-col justify-center">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" /> ESCALATE TICKET #{selectedTicket?.id}
              </h3>
              <button onClick={() => setEscalateModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Escalate To Agent/Role:</label>
                <select
                  value={escalationTarget}
                  onChange={(e) => setEscalationTarget(e.target.value)}
                  className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-400"
                >
                  <option value="Company Agent">Senior Company Agent</option>
                  <option value="Admin">Executive Admin Team</option>
                  <option value="Shaban Faridi">Shaban Faridi (Head Coach)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Reason for Escalation:</label>
                <textarea
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Explain why this ticket requires urgent senior escalation..."
                  rows={3}
                  className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEscalateModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-lg hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEscalation}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded-lg shadow cursor-pointer"
              >
                CONFIRM ESCALATION
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW TICKET MODAL */}
      {createTicketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
          <form onSubmit={handleCreateNewTicketSubmit} className="bg-[#18181b] border-0 sm:border border-zinc-800 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg p-4 sm:p-6 rounded-none sm:rounded-2xl space-y-4 shadow-2xl animate-in zoom-in-95 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-[#CCFF00]">LOG NEW CUSTOMER INQUIRY / TICKET</h3>
              <button type="button" onClick={() => setCreateTicketModalOpen(false)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Customer Name *</label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Customer Email *</label>
                <input
                  type="email"
                  required
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  placeholder="e.g. john@example.co.uk"
                  className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

              <PhoneInput
                label="Phone Number"
                value={newCustPhone}
                onChange={setNewCustPhone}
                inputClassName="w-full bg-[#121214] border border-zinc-800 rounded-xl pl-[104px] pr-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
              />

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Source</label>
                <select
                  value={newSource}
                  onChange={(e) => setNewSource(e.target.value as any)}
                  className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                >
                  <option value="Website Contact Form">Website Contact Form</option>
                  <option value="Chatbot">Chatbot</option>
                  <option value="Booking">Booking</option>
                  <option value="Payment">Payment</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Callback Request">Callback Request</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Subject / Overview *</label>
              <input
                type="text"
                required
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="Brief summary of inquiry..."
                className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Full Description *</label>
              <textarea
                required
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Detailed customer inquiry content..."
                rows={3}
                className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setCreateTicketModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-lg hover:bg-zinc-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase rounded-lg shadow cursor-pointer"
              >
                CREATE TICKET
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CONFIRM DELETE TICKET MODAL */}
      {deletingTicket && (
        <ConfirmModal
          isOpen={!!deletingTicket}
          title={`Delete Ticket #${deletingTicket.id}?`}
          message="Are you sure you want to permanently delete this support ticket? This action will be logged in audit history."
          confirmText="Delete Ticket"
          type="danger"
          requireTextConfirm={false}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTicket(null)}
        />
      )}

    </div>
  );
};
