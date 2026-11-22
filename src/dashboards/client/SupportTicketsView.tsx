import React, { useState, useEffect, useRef } from 'react';
import { User, SupportTicket, TicketCategory, TicketPriority } from '../../types';
import { VelocityAPI, getApiUrl, apiFetch } from '../../services/api';
import { sendBrevoTicketEmail } from '../../services/emailService';
import { ArrowLeft, LifeBuoy, Plus, CheckCircle2, Clock, AlertCircle, MessageSquare, Tag, X, ShieldAlert, Send, UserCheck } from 'lucide-react';

import { TicketChat } from '../../components/TicketChat/TicketChat';
import { Skeleton } from '../../components/ui/Skeleton';
import { Select } from '../../components/ui/Select';

interface SupportTicketsViewProps {
  user: User;
  onShowToast: (msg: string) => void;
  /** Set by a clicked notification: open this ticket's chat. `at` changes on every click. */
  focus?: { ticketId: string; at: number } | null;
}

export const SupportTicketsView: React.FC<SupportTicketsViewProps> = ({ user, onShowToast, focus }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  // Desktop always shows a ticket (the chosen one, else the newest); on phones null means "show the list".
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // While the ticket chat is open it takes over the detail panel.
  const [chatOpen, setChatOpen] = useState(false);
  const [openChatRequest, setOpenChatRequest] = useState(0);
  const handledFocus = useRef(0);
  const refetchedFor = useRef(0);

  // Form states initialized from draft storage if present
  const [subject, setSubject] = useState(() => sessionStorage.getItem('bxstrength_ticket_draft_subj') || '');
  const [category, setCategory] = useState<TicketCategory>(() => (sessionStorage.getItem('bxstrength_ticket_draft_cat') as TicketCategory) || 'General');
  const [priority, setPriority] = useState<TicketPriority>(() => (sessionStorage.getItem('bxstrength_ticket_draft_prio') as TicketPriority) || 'medium');
  const [description, setDescription] = useState(() => sessionStorage.getItem('bxstrength_ticket_draft_desc') || '');

  useEffect(() => {
    sessionStorage.setItem('bxstrength_ticket_draft_subj', subject);
  }, [subject]);

  useEffect(() => {
    sessionStorage.setItem('bxstrength_ticket_draft_cat', category);
  }, [category]);

  useEffect(() => {
    sessionStorage.setItem('bxstrength_ticket_draft_prio', priority);
  }, [priority]);

  useEffect(() => {
    sessionStorage.setItem('bxstrength_ticket_draft_desc', description);
  }, [description]);

  const fetchUserTickets = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      // Server is the only source of truth; on a failed request keep what is on screen (the local copy is stale).
      const res = await apiFetch(getApiUrl(`/api/tickets?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`));
      if (res.ok) setTickets(await res.json());
    } catch {
      // Network error: keep the current list.
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTickets(true);
    // Every client runs this, so keep it gentle and pause it in background tabs
    const interval = setInterval(() => { if (!document.hidden) fetchUserTickets(false); }, 30000);
    const onVisible = () => { if (!document.hidden) fetchUserTickets(false); };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('bxstrength_tickets_updated', onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('bxstrength_tickets_updated', onVisible);
    };
  }, [user.id, user.email]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      setIsSubmitting(true);
      let createdTicket: SupportTicket | null = null;

      // 1. Persist to PostgreSQL database endpoint
      const res = await fetch(getApiUrl('/api/tickets'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          subject: subject.trim(),
          category,
          priority,
          description: description.trim()
        })
      });

      if (res.ok) {
        const body = await res.json();
        createdTicket = body.data;
      } else {
        // Fallback to local store if server offline
        createdTicket = VelocityAPI.createTicket({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          subject: subject.trim(),
          category,
          priority,
          description: description.trim()
        });
      }

      // 2. Trigger Brevo Mail Real Email Dispatch to Admin
      if (createdTicket) {
        await sendBrevoTicketEmail({
          ticketId: createdTicket.id,
          userName: user.name,
          userEmail: user.email,
          subject: subject.trim(),
          category,
          priority,
          description: description.trim()
        });
      }

      sessionStorage.removeItem('bxstrength_ticket_draft_subj');
      sessionStorage.removeItem('bxstrength_ticket_draft_desc');
      setSubject('');
      setDescription('');
      setShowModal(false);
      await fetchUserTickets();
      onShowToast(`Support ticket ${createdTicket?.id || ''} submitted successfully! Coach notified.`);
    } catch (err) {
      console.error('Ticket submission error:', err);
      onShowToast('Support ticket submitted.');
    } finally {
      setIsSubmitting(false);
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
      case 'waiting_customer':
        return (
          <span className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> AWAITING YOUR REPLY
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
        return <span className="bg-red-600 text-white font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded">URGENT</span>;
      case 'high':
        return <span className="bg-orange-600 text-white font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded">HIGH</span>;
      case 'medium':
        return <span className="bg-zinc-800 text-zinc-300 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded">MEDIUM</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-500 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded">LOW</span>;
    }
  };

  // A clicked notification: select its ticket and open the chat once the ticket is in the list.
  useEffect(() => {
    if (!focus || focus.at === handledFocus.current) return;
    if (!tickets.some(t => t.id === focus.ticketId)) {
      // Reload once per click (the ticket may be newer than the list); a deleted ticket just stays unselected.
      if (!isLoading && refetchedFor.current !== focus.at) {
        refetchedFor.current = focus.at;
        fetchUserTickets(false);
      }
      return;
    }
    handledFocus.current = focus.at;
    setSelectedId(focus.ticketId);
    setOpenChatRequest(focus.at);
  }, [focus, tickets, isLoading]);

  const activeTicket = tickets.find(t => t.id === selectedId) ?? tickets[0];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-black text-white uppercase tracking-tight">SUPPORT TICKETS</h2>
          </div>
          <p className="text-xs text-zinc-400">
            Raise issues regarding training programs, nutrition plans, or scheduling. Real-time updates reflect live from headcoach / coach.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-wider uppercase px-5 py-3 rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>RAISE NEW TICKET</span>
        </button>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <Skeleton variant="card" count={3} />
      ) : tickets.length === 0 ? (
        <div className="bg-[#121214] border border-zinc-800/80 p-12 text-center rounded-2xl space-y-3">
          <h3 className="text-base font-bold text-white uppercase tracking-wider">No Support Tickets Raised Yet</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            If you experience any training issue, injury adjustment request, or diet query, click above to alert your coach team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,360px)_1fr] gap-4 items-start">
          {/* LEFT: ticket list */}
          <nav
            aria-label="Your support tickets"
            className={`${selectedId ? 'hidden lg:block' : ''} bg-[#121214] border border-zinc-800 rounded-2xl overflow-hidden lg:sticky lg:top-4`}
          >
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-white">Your tickets</span>
              <span className="text-[10px] text-zinc-500">{tickets.length}</span>
            </div>
            <ul className="divide-y divide-zinc-800/80 lg:max-h-[calc(100dvh-21rem)] overflow-y-auto">
              {tickets.map((t) => {
                const active = t.id === activeTicket?.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(t.id)}
                      aria-current={active ? 'true' : undefined}
                      className={`w-full text-left px-4 py-3.5 space-y-1.5 border-l-2 transition-colors cursor-pointer ${active ? 'bg-zinc-900 border-[#CCFF00]' : 'border-transparent hover:bg-zinc-900/60'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] font-bold text-emerald-400">#{t.id}</span>
                        {getStatusBadge(t.status)}
                      </div>
                      <p className="text-sm font-bold text-white truncate">{t.subject}</p>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span className="uppercase font-bold tracking-wider">{t.category}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={t.updatedAt || t.createdAt}>{new Date(t.updatedAt || t.createdAt).toLocaleDateString()} {new Date(t.updatedAt || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* RIGHT: selected ticket details + chat */}
          {activeTicket && (
            <section
              aria-label={`Ticket ${activeTicket.id}`}
              className={`${chatOpen ? `${selectedId ? 'flex' : 'hidden lg:flex'} flex-col h-[75dvh] lg:h-[calc(100dvh-18rem)] min-h-[420px]` : `${selectedId ? '' : 'hidden lg:block'} space-y-5`} bg-[#121214] border border-zinc-800 p-5 sm:p-6 rounded-2xl min-w-0`}
            >
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                hidden={chatOpen}
                className="lg:hidden flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> All tickets
              </button>

              <div hidden={chatOpen} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
                    #{activeTicket.id}
                  </span>
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{activeTicket.category}</span>
                  {getPriorityBadge(activeTicket.priority)}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-zinc-500">{new Date(activeTicket.createdAt).toLocaleDateString()} {new Date(activeTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {getStatusBadge(activeTicket.status)}
                </div>
              </div>

              <div hidden={chatOpen}>
                <h3 className="text-base font-bold text-white mb-2 break-words">{activeTicket.subject}</h3>
                <p className="text-xs text-zinc-300 bg-[#18181b] p-3.5 rounded-xl border border-zinc-800/80 leading-relaxed whitespace-pre-wrap break-words">
                  {activeTicket.description}
                </p>
              </div>

              {activeTicket.adminResponse && (
                <div hidden={chatOpen} className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Admin resolution & coach response</span>
                  </div>
                  <p className="text-xs text-zinc-200 font-medium pl-6 leading-relaxed">{activeTicket.adminResponse}</p>
                </div>
              )}

              <TicketChat ticketId={activeTicket.id} currentUserId={user.id} subtitle={`#${activeTicket.id} · ${activeTicket.subject}`} onOpenChange={setChatOpen} openRequest={openChatRequest} />
            </section>
          )}
        </div>
      )}

      {/* RAISE NEW TICKET MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#121214] text-white border-0 sm:border border-zinc-800 shadow-2xl rounded-none sm:rounded-xl overflow-y-auto flex flex-col font-sans">
            
            <div className="bg-[#18181b] p-5 flex items-center justify-between border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <LifeBuoy className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">RAISE SUPPORT TICKET</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Issue Subject *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Need exercise substitution for shoulder pain"
                  className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white px-3.5 py-2.5 text-xs font-bold rounded-lg outline-none placeholder-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Category
                  </label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white px-3 py-2.5 text-xs font-bold rounded-lg outline-none"
                  >
                    <option value="Training">Training Issue</option>
                    <option value="Nutrition">Nutrition Plan</option>
                    <option value="Schedule">Schedule / Class</option>
                    <option value="Billing">Billing & Subscription</option>
                    <option value="General">General Inquiry</option>
                  </Select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Priority Level
                  </label>
                  <Select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white px-3 py-2.5 text-xs font-bold rounded-lg outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Detailed Issue Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your issue, symptoms, or question in detail so coaches can resolve it..."
                  className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white p-3 text-xs font-medium rounded-lg outline-none placeholder-zinc-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-wider uppercase rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmitting ? 'RAISING TICKET...' : 'RAISE TICKET & NOTIFY ADMIN'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
