import React, { useState, useEffect, useMemo } from 'react';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory, TicketSource, User, Booking, Subscription, PaidPackageBooking } from '../../types';
import { PaidBookingsView } from '../head-coach/PaidBookingsView';
import { CoachAvailabilityRoster } from './CoachAvailabilityRoster';
import { normalizeRole } from '../../utils/auth';
import { VelocityAPI, getApiUrl, decodeHtmlEntities } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { ProfileManagement } from '../client/ProfileManagement';
import { FreeAssessmentsView } from '../head-coach/FreeAssessmentsView';
import { 
  LifeBuoy, CheckCircle2, Clock, AlertCircle, MessageSquare, Search, Filter, ShieldAlert, 
  Send, Trash2, UserCheck, ArrowUpRight, Phone, Mail, Globe, Tag, ChevronRight, RefreshCw, 
  BarChart2, Lock, AlertTriangle, Plus, FileText, Check, ShieldCheck, X, Zap, CornerUpRight,
  User as UserIcon, Settings, LogOut, Home, ClipboardCheck, Package, Users
} from 'lucide-react';

interface SupportDashboardViewProps {
  onShowToast?: (msg: string) => void;
  onNavigateHome?: () => void;
  onLogout?: () => void;
  initialTab?: 'inbox' | 'analytics' | 'audit_logs' | 'account_settings' | 'assessments' | 'paid_bookings' | 'coaches_workload';
}

export const SupportDashboardView: React.FC<SupportDashboardViewProps> = ({ 
  onShowToast = () => {},
  onNavigateHome,
  onLogout,
  initialTab = 'paid_bookings'
}) => {
  const { user } = useAuth();

  // Role Simulator state for testing RBAC
  const [activeRoleView, setActiveRoleView] = useState<'customer_support' | 'headcoach' | 'coach' | 'admin'>(
    user?.role === 'admin' ? 'admin' : ((user?.role === 'headcoach' || user?.role === 'coach') ? user.role : 'customer_support')
  );

  const [activeTab, setActiveTab] = useState<'inbox' | 'analytics' | 'audit_logs' | 'account_settings' | 'assessments' | 'paid_bookings' | 'coaches_workload'>(initialTab);
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

  const fetchTickets = (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    const loaded = VelocityAPI.getTickets();
    setTickets(loaded);
    if (loaded.length > 0 && !selectedTicket) {
      setSelectedTicket(loaded[0]);
    } else if (selectedTicket) {
      const updated = loaded.find(t => t.id === selectedTicket.id);
      if (updated) setSelectedTicket(updated);
    }
    if (isInitial) setIsLoading(false);
  };

  // Live Coaches & Paid Bookings state for Customer Support Oversight
  const [coaches, setCoaches] = useState<User[]>([]);
  const [paidBookings, setPaidBookings] = useState<PaidPackageBooking[]>(() => {
    try {
      const raw = localStorage.getItem('bxstrength_paid_bookings');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  });

  const loadCoachesAndBookings = async () => {
    try {
      const [uList, bookings] = await Promise.all([
        VelocityAPI.fetchUsers(),
        VelocityAPI.fetchPaidBookings()
      ]);
      const staff = uList.filter(u => {
        const r = normalizeRole(u.role);
        return r === 'coach' || r === 'headcoach';
      });
      setCoaches(staff);
      setPaidBookings(bookings);
      try { localStorage.setItem('bxstrength_paid_bookings', JSON.stringify(bookings)); } catch {}
    } catch (e) {
      console.warn('Failed to load coaches/bookings in CS:', e);
    }
  };

  const unassignedCount = useMemo(() => {
    return paidBookings.filter(b => 
      !b.assignedCoachName || 
      b.assignedCoachName.toLowerCase() === 'unassigned' ||
      !b.assignedCoachId
    ).length;
  }, [paidBookings]);

  useEffect(() => {
    loadCoachesAndBookings();
    const handleBookingsUpdate = () => loadCoachesAndBookings();
    window.addEventListener('bxstrength_paid_bookings_updated', handleBookingsUpdate);
    return () => window.removeEventListener('bxstrength_paid_bookings_updated', handleBookingsUpdate);
  }, []);

  useEffect(() => {
    fetchTickets(true);
    const interval = setInterval(() => fetchTickets(false), 5000); // 5 sec real-time sync

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

  const analytics = VelocityAPI.getSupportAnalytics();

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

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
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

  const handleUpdateStatus = (status: TicketStatus) => {
    if (!selectedTicket) return;
    const updated = VelocityAPI.updateTicketStatus(selectedTicket.id, status);
    if (updated) {
      setSelectedTicket(updated);
      fetchTickets();
      onShowToast(`Ticket #${selectedTicket.id} status set to "${status.toUpperCase().replace('_', ' ')}".`);
    }
  };

  const handleAssignAgent = (agentName: string, agentRole: 'customer_support' | 'headcoach' | 'coach' | 'admin') => {
    if (!selectedTicket) return;
    const updated = VelocityAPI.assignTicket(selectedTicket.id, agentName, agentRole);
    if (updated) {
      setSelectedTicket(updated);
      fetchTickets();
      onShowToast(`Ticket #${selectedTicket.id} assigned to ${agentName}.`);
    }
  };

  const handleSendResponse = () => {
    if (!selectedTicket || !responseInput.trim()) return;
    const updated = VelocityAPI.addTicketMessage(
      selectedTicket.id,
      responseInput.trim(),
      communicationTab === 'chat' ? 'chat' : 'email',
      activeRoleView === 'admin' ? 'Admin Support Desk' : (activeRoleView === 'headcoach' ? 'Head Coach Desk' : (activeRoleView === 'coach' ? 'Coach Support Desk' : 'CS Team Agent')),
      'agent'
    );
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

  const handleConfirmEscalation = () => {
    if (!selectedTicket || !escalationReason.trim()) return;
    const updated = VelocityAPI.escalateTicket(selectedTicket.id, escalationTarget, escalationReason.trim());
    if (updated) {
      setSelectedTicket(updated);
      setEscalateModalOpen(false);
      setEscalationReason('');
      fetchTickets();
      onShowToast(`🚨 Ticket #${selectedTicket.id} escalated to ${escalationTarget} with URGENT priority.`);
    }
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

  const handleConfirmDelete = () => {
    if (!deletingTicket) return;
    VelocityAPI.deleteTicket(deletingTicket.id);
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
    <div className="bg-[#0a0a0c] min-h-screen text-white font-sans border-b border-zinc-800">

      {/* TOP WORKSPACE HEADER & LOGOUT BAR */}
      <div className="bg-[#121214] border-b border-zinc-800 py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user && (
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                alt={user.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#CCFF00]"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black uppercase text-white tracking-wide">
                  {user?.name || 'CUSTOMER SUPPORT AGENT'}
                </h1>
                <span className="bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">
                  CS WORKSPACE
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">
                Logged in as <span className="text-zinc-200 font-bold">{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {onLogout && (
              <button
                onClick={onLogout}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 hover:border-red-500/50 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                title="Sign Out of Customer Support Session"
              >
                <LogOut className="w-4 h-4 text-red-400" />
                <span>LOGOUT SESSION</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* WORKSPACE CONTENT AREA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* SECTION 1: DYNAMIC SUMMARY OVERVIEW CARDS (9 CARDS) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">NEW ENQUIRIES</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">{analytics.newEnquiries}</span>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">OPEN TICKETS</span>
            <span className="text-xl font-black text-white mt-1 block">{analytics.openTickets}</span>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">IN PROGRESS</span>
            <span className="text-xl font-black text-yellow-400 mt-1 block">{analytics.inProgress}</span>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">AWAITING CLIENT</span>
            <span className="text-xl font-black text-orange-400 mt-1 block">{analytics.waitingCustomer}</span>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">RESOLVED</span>
            <span className="text-xl font-black text-cyan-400 mt-1 block">{analytics.resolved}</span>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">URGENT / ESCALATED</span>
            <span className="text-xl font-black text-red-400 mt-1 block">{analytics.urgentEscalated}</span>
          </div>
          <div className="bg-[#18181b] border border-zinc-800 p-3 rounded-xl">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">TODAY'S INQUIRIES</span>
            <span className="text-xl font-black text-[#CCFF00] mt-1 block">{analytics.todaysEnquiries}</span>
          </div>
          <div
            onClick={() => setActiveTab('paid_bookings')}
            className={`p-3 rounded-xl border transition-all cursor-pointer ${
              unassignedCount > 0
                ? 'bg-amber-950/50 border-amber-500/80 hover:bg-amber-900/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                : 'bg-[#18181b] border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">UNASSIGNED BOOKINGS</span>
              {unassignedCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
            </div>
            <span className="text-xl font-black text-amber-400 mt-1 block font-mono">{unassignedCount}</span>
          </div>
          <div
            onClick={() => setActiveTab('paid_bookings')}
            className="bg-[#18181b] border border-zinc-800 hover:border-zinc-700 p-3 rounded-xl cursor-pointer transition-all"
          >
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">TOTAL PAID BOOKINGS</span>
            <span className="text-xl font-black text-purple-400 mt-1 block font-mono">{paidBookings.length}</span>
          </div>
          <div
            onClick={() => setActiveTab('coaches_workload')}
            className="bg-[#18181b] border border-zinc-800 hover:border-zinc-700 p-3 rounded-xl cursor-pointer transition-all"
          >
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">COACHES ROSTER</span>
            <span className="text-xl font-black text-sky-400 mt-1 block font-mono">{coaches.length} Available</span>
          </div>
        </div>

        {/* PRIORITY ACTION BANNER: NEW INCOMING UNASSIGNED BOOKINGS */}
        {unassignedCount > 0 && (
          <div className="bg-gradient-to-r from-amber-950/70 via-zinc-900 to-black border-2 border-amber-500/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_30px_rgba(245,158,11,0.25)] animate-in fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <Zap className="w-6 h-6 fill-amber-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-black uppercase text-amber-300 tracking-wider">
                    ⚡ ACTION REQUIRED: {unassignedCount} NEW INCOMING PAID {unassignedCount === 1 ? 'BOOKING' : 'BOOKINGS'}
                  </h2>
                  <span className="bg-amber-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    COACH UNASSIGNED
                  </span>
                </div>
                <p className="text-xs text-zinc-300 mt-0.5">
                  New paid booking received! Assign a specialist coach from the staff directory or alert the Head Coach immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => setActiveTab('paid_bookings')}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(204,255,0,0.3)] transition-all active:scale-95"
              >
                <Package className="w-4 h-4 text-black" />
                <span>DISPATCH &amp; ASSIGN NOW</span>
              </button>
            </div>
          </div>
        )}

        {/* WORKSPACE MAIN TABS */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('paid_bookings')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'paid_bookings' ? 'bg-[#CCFF00] text-black shadow-lg scale-102' : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Package className="w-4 h-4 text-purple-400" />
              <span>📦 PAID BOOKINGS &amp; DISPATCH {unassignedCount > 0 ? `(${unassignedCount} UNASSIGNED)` : `(${paidBookings.length})`}</span>
            </button>
            <button
              onClick={() => setActiveTab('coaches_workload')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'coaches_workload' ? 'bg-[#CCFF00] text-black shadow-lg scale-102' : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>👥 COACH AVAILABILITY &amp; WORKLOAD ({coaches.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'inbox' ? 'bg-[#CCFF00] text-black shadow-lg scale-102' : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>📬 ALL ENQUIRIES &amp; TICKETS ({filteredTickets.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'analytics' ? 'bg-[#CCFF00] text-black shadow-lg scale-102' : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span>📊 PERFORMANCE ANALYTICS</span>
            </button>
            <button
              onClick={() => setActiveTab('assessments')}
              className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'assessments' ? 'bg-[#CCFF00] text-black shadow-lg scale-102' : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-[#CCFF00]" />
              <span>📋 ATHLETE ASSESSMENTS</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCreateTicketModalOpen(true)}
              className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow active:scale-95"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>LOG NEW INQUIRY</span>
            </button>
            <button
              onClick={() => fetchTickets(false)}
              className="text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 bg-[#18181b] hover:bg-zinc-800 px-3.5 py-2 rounded-xl border border-zinc-800 cursor-pointer transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#CCFF00]" />
              <span className="hidden sm:inline">REFRESH LIVE FEED</span>
            </button>
          </div>
        </div>

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
              onBookingsUpdated={loadCoachesAndBookings}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* TAB 1: CENTRAL TICKET INBOX & 360 WORKSPACE */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            
            {/* QUICK SOURCE CATEGORY FILTER PILLS */}
            <div className="flex flex-wrap items-center gap-2 bg-[#121214] p-3 rounded-2xl border border-zinc-800">
              <span className="text-[11px] font-black uppercase text-zinc-400 tracking-wider mr-1">QUICK CHANNELS:</span>
              <button
                onClick={() => setSourceFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sourceFilter === 'all'
                    ? 'bg-[#CCFF00] text-black font-black'
                    : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                All Channels ({tickets.length})
              </button>
              <button
                onClick={() => setSourceFilter('Website Contact Form')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sourceFilter === 'Website Contact Form'
                    ? 'bg-[#CCFF00] text-black font-black'
                    : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                💬 Website Enquiries ({tickets.filter(t => t.source?.toLowerCase().includes('contact') || t.source?.toLowerCase().includes('form')).length})
              </button>
              <button
                onClick={() => setSourceFilter('Chatbot')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sourceFilter === 'Chatbot'
                    ? 'bg-[#CCFF00] text-black font-black'
                    : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                🤖 Chatbot AI ({tickets.filter(t => t.source?.toLowerCase().includes('chat') || t.source?.toLowerCase().includes('bot')).length})
              </button>
              <button
                onClick={() => setSourceFilter('Booking')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  sourceFilter === 'Booking'
                    ? 'bg-[#CCFF00] text-black font-black'
                    : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                📅 Consultations &amp; Bookings ({tickets.filter(t => t.source?.toLowerCase().includes('book') || t.source?.toLowerCase().includes('assessment')).length})
              </button>
              <button
                onClick={() => setPriorityFilter(priorityFilter === 'urgent' ? 'all' : 'urgent')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ml-auto ${
                  priorityFilter === 'urgent'
                    ? 'bg-red-500 text-white font-black'
                    : 'bg-red-950/40 text-red-400 hover:bg-red-950/80 border border-red-900/60'
                }`}
              >
                🚨 Urgent Priority ({tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length})
              </button>
            </div>

            {/* SEARCH & FILTERS BAR */}
            <div className="bg-[#121214] p-4 rounded-2xl border border-zinc-800 space-y-3">
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Name, Email, Phone, Ticket ID, Booking ID, Txn ID..."
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* STATUS FILTER */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-[#18181b] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer"
                  >
                    <option value="all">Status: All</option>
                    <option value="new">Status: New / Open</option>
                    <option value="assigned">Status: Assigned</option>
                    <option value="in_progress">Status: In Progress</option>
                    <option value="waiting_customer">Status: Awaiting Client</option>
                    <option value="resolved">Status: Resolved</option>
                    <option value="closed">Status: Closed</option>
                  </select>

                  {/* PRIORITY FILTER */}
                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="bg-[#18181b] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer"
                  >
                    <option value="all">Priority: All</option>
                    <option value="urgent">Priority: Urgent</option>
                    <option value="high">Priority: High</option>
                    <option value="normal">Priority: Normal</option>
                    <option value="low">Priority: Low</option>
                  </select>

                  {/* SOURCE FILTER */}
                  <select
                    value={sourceFilter}
                    onChange={(e) => setSourceFilter(e.target.value)}
                    className="bg-[#18181b] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer"
                  >
                    <option value="all">Source: All Channels</option>
                    <option value="Website Contact Form">Channel: Website Contact Form</option>
                    <option value="Chatbot">Channel: Chatbot AI</option>
                    <option value="Booking">Channel: Consultation / Booking</option>
                    <option value="Payment">Channel: Payment &amp; Billing</option>
                    <option value="WhatsApp">Channel: WhatsApp Support</option>
                    <option value="Callback Request">Channel: Phone Callback</option>
                  </select>

                  {/* SORT BY */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-[#18181b] border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-[#CCFF00] cursor-pointer"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="oldest">Sort: Oldest First</option>
                    <option value="priority">Sort: Highest Priority</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SPLIT VIEW WORKSPACE (LEFT: TICKET LIST, RIGHT: DETAILED TICKET & 360 PROFILE) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT INBOX TICKET LIST (4 COLS) */}
              <div className="lg:col-span-5 bg-[#121214] border border-zinc-800 rounded-2xl p-4 space-y-3 h-[750px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-black uppercase text-zinc-400">INBOX TICKETS ({filteredTickets.length})</span>
                  <span className="text-[10px] text-zinc-500">Live Auto-Sync Active</span>
                </div>

                {filteredTickets.length === 0 ? (
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
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
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
              <div className="lg:col-span-7 bg-[#121214] border border-zinc-800 rounded-2xl p-5 h-[750px] overflow-y-auto custom-scrollbar flex flex-col justify-between">
                
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
                          360° CLIENT PROFILE &amp; SYSTEM DATA
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
                        COMMUNICATION TIMELINE &amp; LOGS
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

        {/* TAB 2: SUPPORT ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl space-y-6">
              <div>
                <h2 className="text-lg font-black uppercase text-white">SUPPORT SYSTEM PERFORMANCE ANALYTICS</h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Metrics dynamically computed from authentic database ticket &amp; booking logs.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">AVG FIRST RESPONSE</span>
                  <span className="text-2xl font-black text-[#CCFF00] mt-1 block">{analytics.avgResponseTime}</span>
                </div>
                <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">AVG RESOLUTION TIME</span>
                  <span className="text-2xl font-black text-cyan-400 mt-1 block">{analytics.avgResolutionTime}</span>
                </div>
                <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">TOTAL INQUIRIES LOGGED</span>
                  <span className="text-2xl font-black text-white mt-1 block">{analytics.totalEnquiries}</span>
                </div>
                <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase">RESOLVED RATE</span>
                  <span className="text-2xl font-black text-emerald-400 mt-1 block">
                    {analytics.totalEnquiries > 0 ? `${Math.round((analytics.resolved / analytics.totalEnquiries) * 100)}%` : '100%'}
                  </span>
                </div>
              </div>

              {/* BREAKDOWN BY SOURCE */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#18181b] p-5 rounded-xl border border-zinc-800 space-y-3">
                  <h3 className="text-xs font-black uppercase text-[#CCFF00]">INQUIRY VOLUME BY SOURCE</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.breakdownBySource).map(([src, count]) => (
                      <div key={src} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 font-medium">{src}</span>
                        <span className="font-mono font-bold text-[#CCFF00] bg-black px-2.5 py-0.5 rounded border border-zinc-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#18181b] p-5 rounded-xl border border-zinc-800 space-y-3">
                  <h3 className="text-xs font-black uppercase text-[#CCFF00]">VOLUME BY CATEGORY</h3>
                  <div className="space-y-2">
                    {Object.entries(analytics.breakdownByCategory).map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="text-zinc-300 font-medium">{cat}</span>
                        <span className="font-mono font-bold text-cyan-400 bg-black px-2.5 py-0.5 rounded border border-zinc-800">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS & SECURITY */}
        {activeTab === 'audit_logs' && (
          <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl space-y-4">
            <div>
              <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#CCFF00]" /> AUDIT LOGS &amp; PCI-DSS COMPLIANCE
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

        {/* TAB 4: MY ACCOUNT & PASSWORD SETTINGS */}
        {activeTab === 'account_settings' && user && (
          <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl space-y-4">
            <div className="border-b border-zinc-800 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#CCFF00]" /> ACCOUNT &amp; PASSWORD SETTINGS
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Manage your customer support employee profile, avatar image, phone number, security credentials, and password.
                </p>
              </div>
              <div className="bg-[#18181b] px-3.5 py-2 rounded-xl border border-zinc-800 text-xs font-bold text-zinc-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ROLE: <strong className="text-white uppercase">CUSTOMER SUPPORT EMPLOYEE</strong></span>
              </div>
            </div>

            <ProfileManagement user={user} onShowToast={onShowToast} />

            {onLogout && (
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-red-400">SESSION LOGOUT CONTROL</h3>
                  <p className="text-[11px] text-zinc-400">End active Customer Support session securely on this device.</p>
                </div>
                <button
                  onClick={onLogout}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase px-5 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>LOGOUT NOW</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ATHLETE ASSESSMENTS DESK */}
        {activeTab === 'assessments' && user && (
          <FreeAssessmentsView
            user={user}
            onShowToast={onShowToast}
          />
        )}

      </div>

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

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="+44 7911 123456"
                  className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                />
              </div>

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
