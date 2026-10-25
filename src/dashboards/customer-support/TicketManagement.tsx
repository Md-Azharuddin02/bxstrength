import React, { useState, useEffect, useMemo } from 'react';
import { SupportTicket, TicketStatus, TicketPriority, TicketCategory, User } from '../../types';
import { VelocityAPI, apiFetch } from '../../services/api';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import {
  LifeBuoy, CheckCircle2, Clock, AlertCircle, MessageSquare, Search, Filter,
  ShieldAlert, Send, Trash2, UserCheck, RefreshCw, X, Tag, ShieldCheck, ChevronDown, FileText
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

interface TicketManagementProps {
  user?: User;
  coaches?: User[];
  onShowToast: (msg: string) => void;
}

const formatTicketDate = (rawDate?: string): string => {
  if (!rawDate) return 'Recently';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Recently';
  }
};

export const TicketManagement: React.FC<TicketManagementProps> = ({ user, coaches = [], onShowToast }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const [responseInputs, setResponseInputs] = useState<Record<string, string>>({});
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [activeNoteTab, setActiveNoteTab] = useState<Record<string, 'response' | 'notes'>>({});

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [ticketToDelete, setTicketToDelete] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const currentUser = user || VelocityAPI.getCurrentUser();
  const isHeadCoach = currentUser?.role === 'headcoach' || (currentUser?.role === 'coach' && Boolean((currentUser as any)?.isHeadCoach));
  const isCoachOnly = currentUser?.role === 'coach' && !isHeadCoach;

  const fetchAllTickets = async (showSpin = false) => {
    if (showSpin) setIsRefreshing(true);
    try {
      const localTickets = VelocityAPI.getTickets();
      let serverTickets: SupportTicket[] = [];

      try {
        const res = await apiFetch('/api/tickets');
        if (res.ok) {
          serverTickets = await res.json();
        }
      } catch (e) {
        console.error('Failed to fetch server tickets:', e);
      }

      // Deduplicate by both ID and Content (userEmail + description snippet)
      const mapById = new Map<string, SupportTicket>();
      const mapByContent = new Map<string, SupportTicket>();

      [...localTickets, ...serverTickets].forEach(t => {
        if (t && t.id && t.id !== 'TICKET-849201' && t.id !== 'TICKET-739104') {
          const email = (t.userEmail || '').toLowerCase().trim();
          const descSnippet = (t.description || t.subject || '').toLowerCase().trim().slice(0, 40);
          const contentKey = `${email}|${descSnippet}`;

          if (!mapByContent.has(contentKey)) {
            mapByContent.set(contentKey, t);
            mapById.set(t.id, t);
          } else {
            const existing = mapByContent.get(contentKey)!;
            const newDate = new Date(t.createdAt || 0).getTime();
            const existingDate = new Date(existing.createdAt || 0).getTime();
            if (newDate > existingDate) {
              mapById.delete(existing.id);
              mapByContent.set(contentKey, t);
              mapById.set(t.id, t);
            }
          }
        }
      });

      setTickets(Array.from(mapById.values()));
    } catch (e) {
      setTickets(VelocityAPI.getTickets().filter(t => t.id !== 'TICKET-849201' && t.id !== 'TICKET-739104'));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllTickets();
    const interval = setInterval(() => fetchAllTickets(false), 5000); // 5 sec live sync
    return () => clearInterval(interval);
  }, []);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    const term = searchTerm.toLowerCase().trim().replace(/^#/, '');

    return tickets.filter((t) => {
      // Role Scope: Normal coach only views tickets assigned to them
      if (isCoachOnly && currentUser) {
        const coachName = (currentUser.name || '').toLowerCase().trim();
        const coachEmail = (currentUser.email || '').toLowerCase().trim();
        const assigned = (t.assignedAgent || '').toLowerCase().trim();

        if (!assigned || assigned === 'unassigned' || assigned === 'cs team') {
          return false;
        }

        const isAssignedToMe = assigned.includes(coachName) || (coachEmail && assigned.includes(coachEmail));
        if (!isAssignedToMe) return false;
      }

      // 1. Status Filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // 2. Priority Filter
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      // 3. Category Filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      // 4. Search term matching
      if (!term) return true;

      const matchId = t.id.toLowerCase().includes(term);
      const matchName = t.userName.toLowerCase().includes(term);
      const matchEmail = t.userEmail.toLowerCase().includes(term);
      const matchPhone = t.userPhone ? t.userPhone.toLowerCase().includes(term) : false;
      const matchSubject = t.subject.toLowerCase().includes(term);
      const matchCategory = t.category ? t.category.toLowerCase().includes(term) : false;
      const matchDesc = t.description.toLowerCase().includes(term);
      const matchAgent = t.assignedAgent ? t.assignedAgent.toLowerCase().includes(term) : false;

      return matchId || matchName || matchEmail || matchPhone || matchSubject || matchCategory || matchDesc || matchAgent;
    });
  }, [tickets, searchTerm, statusFilter, priorityFilter, categoryFilter, isCoachOnly, currentUser]);

  // Stats Counters
  const stats = useMemo(() => {
    const total = tickets.length;
    const openCount = tickets.filter(t => t.status === 'open' || t.status === 'new' || !t.status).length;
    const urgentHighCount = tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length;
    const inProgressCount = tickets.filter(t => t.status === 'in_progress' || t.status === 'assigned').length;
    const resolvedClosedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
    return { total, openCount, urgentHighCount, inProgressCount, resolvedClosedCount };
  }, [tickets]);

  // Actions
  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      setUpdatingId(ticketId);
      const resMsg = responseInputs[ticketId] !== undefined ? responseInputs[ticketId] : undefined;

      // Optimistically update React state
      setTickets(prev =>
        prev.map(t =>
          t.id === ticketId
            ? { ...t, status: newStatus, adminResponse: resMsg !== undefined ? resMsg : t.adminResponse, updatedAt: new Date().toISOString() }
            : t
        )
      );

      // 1. Update in local store
      VelocityAPI.updateTicketStatus(ticketId, newStatus, resMsg);

      // 2. Update via server API endpoint
      try {
        await apiFetch(`/api/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            adminResponse: resMsg
          })
        });
      } catch (err) {
        console.error('Failed to update ticket on server:', err);
      }

      onShowToast(`Ticket #${ticketId} status updated to "${newStatus.toUpperCase().replace('_', ' ')}"!`);
    } catch (err) {
      console.error('Failed to update ticket:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAssignAgent = async (ticketId: string, agentName: string) => {
    try {
      setUpdatingId(ticketId);
      setTickets(prev =>
        prev.map(t => t.id === ticketId ? { ...t, assignedAgent: agentName } : t)
      );

      VelocityAPI.assignTicket(ticketId, agentName, 'admin');

      try {
        await apiFetch(`/api/tickets/${ticketId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedAgent: agentName })
        });
      } catch (e) {
        console.error('Failed to assign ticket on server:', e);
      }

      onShowToast(`Assigned Ticket #${ticketId} to ${agentName}`);
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdatePriority = async (ticketId: string, priority: TicketPriority) => {
    try {
      setUpdatingId(ticketId);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, priority } : t));
      VelocityAPI.updateTicketMeta(ticketId, { priority });
      onShowToast(`Updated Ticket #${ticketId} priority to ${priority.toUpperCase()}`);
    } catch (err) {
      console.error('Failed to update priority:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateCategory = async (ticketId: string, category: TicketCategory) => {
    try {
      setUpdatingId(ticketId);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, category } : t));
      VelocityAPI.updateTicketMeta(ticketId, { category });
      onShowToast(`Updated Ticket #${ticketId} category to ${category}`);
    } catch (err) {
      console.error('Failed to update category:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddInternalNote = (ticketId: string) => {
    const noteText = noteInputs[ticketId];
    if (!noteText || !noteText.trim()) return;

    VelocityAPI.addInternalNote(ticketId, noteText.trim(), 'System Administrator', 'ADMIN');
    onShowToast(`Added internal note to Ticket #${ticketId}`);

    setNoteInputs(prev => ({ ...prev, [ticketId]: '' }));
    fetchAllTickets(false);
  };

  const confirmDeleteTicket = async () => {
    if (!ticketToDelete) return;
    const targetId = ticketToDelete.id;

    try {
      setTickets(prev => prev.filter(t => t.id !== targetId));
      VelocityAPI.deleteTicket(targetId);

      try {
        await apiFetch(`/api/tickets/${targetId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete ticket on server:', err);
      }

      onShowToast(`Ticket #${targetId} deleted permanently from system.`);
    } catch (err) {
      console.error('Failed to delete ticket:', err);
    } finally {
      setTicketToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
      case 'new':
        return (
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> OPEN
          </span>
        );
      case 'assigned':
      case 'in_progress':
        return (
          <span className="bg-blue-500/10 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> IN PROGRESS
          </span>
        );
      case 'resolved':
        return (
          <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> RESOLVED
          </span>
        );
      default:
        return (
          <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
            CLOSED
          </span>
        );
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'urgent':
        return <span className="bg-red-600 text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">URGENT</span>;
      case 'high':
        return <span className="bg-orange-600 text-white font-mono text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">HIGH</span>;
      case 'medium':
        return <span className="bg-zinc-800 text-zinc-300 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-zinc-700">MEDIUM</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-500 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-zinc-800">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 font-sans text-white">

      {/* Header Bar */}
      <div className="bg-[#121214] border border-zinc-800 p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">SUPPORT TICKETS COMMAND CENTER</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Full administrative authority to manage, assign, prioritize, respond, and resolve all client &amp; customer support tickets.
          </p>
        </div>

        <button
          onClick={() => fetchAllTickets(true)}
          className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase px-4 py-2.5 rounded-lg border border-zinc-700 flex items-center gap-2 cursor-pointer self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>REFRESH LIVE FEED</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => { setStatusFilter('all'); setPriorityFilter('all'); setCategoryFilter('all'); }}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'all' && priorityFilter === 'all' ? 'bg-[#18181b] border-emerald-500/50 shadow-md' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-zinc-400 block tracking-widest">TOTAL TICKETS</span>
          <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter('open')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'open' ? 'bg-[#18181b] border-amber-500/50 shadow-md' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-amber-400 block tracking-widest">OPEN / UNASSIGNED</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.openCount}</span>
        </div>

        <div
          onClick={() => setPriorityFilter('urgent')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            priorityFilter === 'urgent' ? 'bg-[#18181b] border-red-500/50 shadow-md' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-red-400 block tracking-widest">URGENT &amp; HIGH</span>
          <span className="text-2xl font-black text-red-400 mt-1 block">{stats.urgentHighCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('resolved')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'resolved' ? 'bg-[#18181b] border-emerald-500/50 shadow-md' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-widest">RESOLVED / CLOSED</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.resolvedClosedCount}</span>
        </div>
      </div>

      {/* Filter & Search Controls Bar */}
      <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ticket ID (#TKT-...), client name, email, subject, or assigned agent..."
              className="w-full bg-[#18181b] border border-zinc-700 text-white text-xs rounded-lg pl-10 pr-9 py-2.5 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-zinc-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-0.5"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {['all', 'open', 'in_progress', 'resolved', 'closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-2 text-[11px] font-black uppercase rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-zinc-800 text-white border-emerald-500 shadow-sm'
                    : 'bg-[#18181b] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
                }`}
              >
                {st === 'all' ? `ALL (${tickets.length})` : st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Priority & Category Dropdown Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-zinc-400">PRIORITY:</span>
              <select
                value={priorityFilter}
                onChange={(ev) => setPriorityFilter(ev.target.value)}
                className="bg-[#18181b] border border-zinc-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-zinc-400">CATEGORY:</span>
              <select
                value={categoryFilter}
                onChange={(ev) => setCategoryFilter(ev.target.value)}
                className="bg-[#18181b] border border-zinc-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Training">Training</option>
                <option value="Nutrition">Nutrition</option>
                <option value="Billing">Billing</option>
                <option value="Schedule">Schedule</option>
                <option value="General">General</option>
                <option value="Technical">Technical</option>
                <option value="Chatbot">Chatbot</option>
                <option value="Callback">Callback</option>
              </select>
            </div>
          </div>

          {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCategoryFilter('all');
              }}
              className="text-emerald-400 hover:underline text-[11px] font-bold uppercase cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : filteredTickets.length === 0 ? (
        <div className="bg-[#121214] border border-zinc-800 p-12 text-center rounded-xl space-y-3">
          <LifeBuoy className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-black uppercase text-white">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' ? 'NO MATCHING SUPPORT TICKETS FOUND' : 'NO TICKETS IN QUEUE'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all'
              ? 'Try clearing your search query or resetting filters to view all customer support queries.'
              : 'When users or clients submit support tickets or request assistance, they will appear here in real-time.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t) => {
            const currentTab = activeNoteTab[t.id] || 'response';

            return (
              <div key={t.id} className="bg-[#121214] border border-zinc-800 p-6 rounded-xl space-y-4 hover:border-zinc-700 transition-colors">
                
                {/* Header Meta Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-emerald-400 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded">
                      #{t.id}
                    </span>
                    <span className="text-sm font-black text-white uppercase">{t.userName}</span>
                    <span className="text-xs text-zinc-400">({t.userEmail})</span>
                    {t.userPhone && (
                      <span className="text-xs text-zinc-400 font-mono">
                        • {t.userPhone}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {t.source && (
                      <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase">
                        {t.source}
                      </span>
                    )}
                    {getPriorityBadge(t.priority)}
                    {getStatusBadge(t.status)}

                    <button
                      onClick={() => setTicketToDelete(t)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors ml-2 cursor-pointer"
                      title="Delete Ticket Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Admin Management Toolbar */}
                <div className="bg-[#18181b] p-3 rounded-lg border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  {/* Assignee */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-zinc-400">ASSIGNEE:</span>
                    <select
                      value={
                        (t.assignedAgent === 'Head Coach & Team' || t.assignedAgent === 'Head Coach' || t.assignedAgent === 'Shaban Faridi (Head Coach)')
                          ? 'Shaban Faridi'
                          : (t.assignedAgent || 'Unassigned')
                      }
                      onChange={(ev) => handleAssignAgent(t.id, ev.target.value)}
                      className="bg-[#121214] border border-zinc-700 text-[#CCFF00] text-xs font-bold px-2.5 py-1 rounded focus:outline-none focus:border-[#CCFF00] cursor-pointer"
                    >
                      <option value="Unassigned">Unassigned (General Queue)</option>
                      <option value="Shaban Faridi">Shaban Faridi (Head Coach)</option>
                      <option value="Sadeem (Strength & Conditioning)">Sadeem (Strength &amp; Conditioning)</option>
                      <option value="Moheeb Khan (Boxing Specialist)">Moheeb Khan (Boxing Specialist)</option>
                      <option value="CS Agent Desk">CS Agent Desk</option>
                      <option value="System Administrator">System Administrator</option>
                    </select>
                  </div>

                  {/* Priority Override */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-zinc-400">PRIORITY:</span>
                    <select
                      value={t.priority || 'normal'}
                      onChange={(ev) => handleUpdatePriority(t.id, ev.target.value as TicketPriority)}
                      className="bg-[#121214] border border-zinc-700 text-white text-xs font-bold px-2.5 py-1 rounded focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  {/* Category */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-zinc-400">CATEGORY:</span>
                    <select
                      value={t.category || 'General'}
                      onChange={(ev) => handleUpdateCategory(t.id, ev.target.value as TicketCategory)}
                      className="bg-[#121214] border border-zinc-700 text-white text-xs font-bold px-2.5 py-1 rounded focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="Training">Training</option>
                      <option value="Nutrition">Nutrition</option>
                      <option value="Billing">Billing</option>
                      <option value="Schedule">Schedule</option>
                      <option value="General">General</option>
                      <option value="Technical">Technical</option>
                      <option value="Chatbot">Chatbot</option>
                      <option value="Callback">Callback</option>
                    </select>
                  </div>
                </div>

                {/* Subject & Description */}
                <div className="space-y-1.5">
                  <span className="text-emerald-400 font-black uppercase block tracking-wider text-[11px]">
                    SUBJECT: {t.subject}
                  </span>
                  <p className="text-zinc-200 text-xs bg-[#18181b] p-3.5 rounded-lg border border-zinc-800/80 font-normal leading-relaxed whitespace-pre-line">
                    {t.description}
                  </p>
                </div>

                {/* Admin Action Box: Response vs Internal Notes */}
                <div className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveNoteTab(prev => ({ ...prev, [t.id]: 'response' }))}
                        className={`text-xs font-black uppercase px-3 py-1 rounded transition-colors cursor-pointer ${
                          currentTab === 'response' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Client Resolution Response
                      </button>
                      <button
                        onClick={() => setActiveNoteTab(prev => ({ ...prev, [t.id]: 'notes' }))}
                        className={`text-xs font-black uppercase px-3 py-1 rounded transition-colors cursor-pointer ${
                          currentTab === 'notes' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Internal Team Notes ({t.internalNotes?.length || 0})
                      </button>
                    </div>

                    <span className="text-[10px] text-zinc-500 font-semibold">
                      Submitted: {formatTicketDate(t.createdAt)}
                    </span>
                  </div>

                  {currentTab === 'response' ? (
                    <div className="space-y-3">
                      <textarea
                        rows={2}
                        value={responseInputs[t.id] !== undefined ? responseInputs[t.id] : (t.adminResponse || '')}
                        onChange={(e) => setResponseInputs({ ...responseInputs, [t.id]: e.target.value })}
                        placeholder="Type resolution instructions or response message to client..."
                        className="w-full bg-[#121214] border border-zinc-700 focus:border-emerald-500 text-white p-3 text-xs font-medium rounded-lg outline-none placeholder-zinc-500 resize-none"
                      />

                      {/* Status Action Buttons */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleUpdateStatus(t.id, 'open')}
                          disabled={updatingId === t.id}
                          className="px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/30 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer"
                        >
                          MARK OPEN
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(t.id, 'in_progress')}
                          disabled={updatingId === t.id}
                          className="px-3.5 py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>MARK IN PROGRESS</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(t.id, 'resolved')}
                          disabled={updatingId === t.id}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>SAVE &amp; MARK RESOLVED</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(t.id, 'closed')}
                          disabled={updatingId === t.id}
                          className="px-3.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer"
                        >
                          CLOSE TICKET
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Internal Notes History */}
                      {t.internalNotes && t.internalNotes.length > 0 && (
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                          {t.internalNotes.map((note) => (
                            <div key={note.id} className="bg-[#121214] border border-zinc-800 p-2.5 rounded text-xs space-y-1">
                              <div className="flex items-center justify-between text-[10px] text-zinc-400 font-bold uppercase">
                                <span>{note.authorName} ({note.authorRole})</span>
                                <span>{formatTicketDate(note.createdAt)}</span>
                              </div>
                              <p className="text-zinc-200">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={noteInputs[t.id] || ''}
                          onChange={(e) => setNoteInputs({ ...noteInputs, [t.id]: e.target.value })}
                          placeholder="Type internal team note (private for coaches/admin)..."
                          className="flex-1 bg-[#121214] border border-zinc-700 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleAddInternalNote(t.id)}
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase px-3.5 py-2 rounded-lg cursor-pointer"
                        >
                          Add Note
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(ticketToDelete)}
        title="DELETE SUPPORT TICKET"
        message={`Are you sure you want to permanently delete Ticket #${ticketToDelete?.id} raised by ${ticketToDelete?.userName}?`}
        type="danger"
        confirmText="DELETE TICKET"
        cancelText="CANCEL"
        onConfirm={confirmDeleteTicket}
        onCancel={() => setTicketToDelete(null)}
      />

    </div>
  );
};

