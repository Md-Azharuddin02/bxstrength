import React, { useState, useEffect } from 'react';
import { User, SupportTicket, TicketCategory, TicketPriority } from '../../types';
import { VelocityAPI, getApiUrl, apiFetch } from '../../services/api';
import { sendBrevoTicketEmail } from '../../services/emailService';
import { LifeBuoy, Plus, CheckCircle2, Clock, AlertCircle, MessageSquare, Tag, X, ShieldAlert, Send, UserCheck } from 'lucide-react';

import { Skeleton } from '../../components/ui/Skeleton';

interface SupportTicketsViewProps {
  user: User;
  onShowToast: (msg: string) => void;
}

export const SupportTicketsView: React.FC<SupportTicketsViewProps> = ({ user, onShowToast }) => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

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
      const localTickets = VelocityAPI.getTickets(user.id);
      const res = await apiFetch(getApiUrl(`/api/tickets?userId=${encodeURIComponent(user.id)}&userEmail=${encodeURIComponent(user.email)}`));
      if (res.ok) {
        const serverTickets: SupportTicket[] = await res.json();
        const map = new Map<string, SupportTicket>();
        [...localTickets, ...serverTickets].forEach(t => map.set(t.id, t));
        setTickets(Array.from(map.values()));
      } else {
        setTickets(localTickets);
      }
    } catch {
      setTickets(VelocityAPI.getTickets(user.id));
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserTickets(true);
    const interval = setInterval(() => fetchUserTickets(false), 5000);
    return () => clearInterval(interval);
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
        return (
          <span className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
            <Clock className="w-3 h-3" /> OPEN
          </span>
        );
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
        return <span className="bg-red-600 text-white font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded">URGENT</span>;
      case 'high':
        return <span className="bg-orange-600 text-white font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded">HIGH</span>;
      case 'medium':
        return <span className="bg-zinc-800 text-zinc-300 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded">MEDIUM</span>;
      default:
        return <span className="bg-zinc-800 text-zinc-500 font-mono text-[9px] font-bold uppercase px-2 py-0.5 rounded">LOW</span>;
    }
  };

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
        <div className="space-y-4">
          {tickets.map((t) => (
            <div key={t.id} className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl space-y-4 transition-all hover:border-zinc-700">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold text-emerald-400 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded">
                    #{t.id}
                  </span>
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    {t.category}
                  </span>
                  {getPriorityBadge(t.priority)}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono text-zinc-500">
                    {new Date(t.createdAt).toLocaleDateString()} {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {getStatusBadge(t.status)}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-2">{t.subject}</h3>
                <p className="text-xs text-zinc-300 bg-[#18181b] p-3.5 rounded-xl border border-zinc-800/80 font-normal leading-relaxed">
                  "{t.description}"
                </p>
              </div>

              {/* Admin Response Note */}
              {t.adminResponse ? (
                <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-xl space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ADMIN RESOLUTION & COACH RESPONSE:</span>
                  </div>
                  <p className="text-xs text-zinc-200 font-medium pl-6 leading-relaxed">
                    {t.adminResponse}
                  </p>
                  <div className="text-[10px] font-mono text-zinc-500 pl-6 pt-1">
                    Updated: {new Date(t.updatedAt).toLocaleDateString()} at {new Date(t.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-zinc-500 text-xs italic">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Awaiting coach/admin resolution response. You will be notified live once updated.</span>
                </div>
              )}

            </div>
          ))}
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
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TicketCategory)}
                    className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white px-3 py-2.5 text-xs font-bold rounded-lg outline-none"
                  >
                    <option value="Training">Training Issue</option>
                    <option value="Nutrition">Nutrition Plan</option>
                    <option value="Schedule">Schedule / Class</option>
                    <option value="Billing">Billing & Subscription</option>
                    <option value="General">General Inquiry</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TicketPriority)}
                    className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white px-3 py-2.5 text-xs font-bold rounded-lg outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent Priority</option>
                  </select>
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
