import React, { useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, ClipboardCheck, Inbox, Mail, MessageSquare, Package, RefreshCw, Video } from 'lucide-react';
import type { User, SupportTicket, PaidPackageBooking, ConsultationBooking, AthleteAssessment, Enquiry, InAppNotification } from '../../types';
import type { SupportTab } from './SupportSidebar';

interface Analytics {
  avgResponseTime: string;
  avgResolutionTime: string;
  totalEnquiries: number;
  resolved: number;
  breakdownBySource: Record<string, number>;
}

interface Props {
  user?: User | null;
  tickets: SupportTicket[];
  paidBookings: PaidPackageBooking[];
  consultations: ConsultationBooking[];
  assessments: AthleteAssessment[];
  enquiries: Enquiry[];
  notifications: InAppNotification[];
  analytics: Analytics;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onNavigate: (tab: SupportTab, opts?: { recordId?: string; priority?: string }) => void;
  onOpenNotification: (n: InAppNotification) => void;
  onMarkAllRead: () => void;
}

type Kind = 'booking' | 'demo' | 'assessment' | 'enquiry' | 'ticket';

interface QueueItem { key: string; kind: Kind; title: string; detail: string; at: string; tab: SupportTab; recordId?: string; urgent?: boolean }

const KIND: Record<Kind, { label: string; icon: React.ElementType; tab: SupportTab; tone: string }> = {
  booking: { label: 'Booking', icon: Package, tab: 'paid_bookings', tone: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  demo: { label: 'Demo', icon: Video, tab: 'free_consultations', tone: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  assessment: { label: 'Assessment', icon: ClipboardCheck, tab: 'assessments', tone: 'bg-sky-500/10 text-sky-400 border-sky-500/20' },
  enquiry: { label: 'Enquiry', icon: MessageSquare, tab: 'enquiries', tone: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  ticket: { label: 'Ticket', icon: Mail, tab: 'inbox', tone: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20' },
};

// Real averages from ticket timestamps; the analytics prop's response/resolution times are hard-coded placeholders.
const fmtDuration = (ms: number) => ms < 3_600_000 ? `${Math.max(1, Math.round(ms / 60_000))} min` : ms < 86_400_000 ? `${(ms / 3_600_000).toFixed(1)} hrs` : `${(ms / 86_400_000).toFixed(1)} days`;
const avgMs = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

const needsCoach = (b: { assignedCoachName?: string | null; assignedCoachId?: string | null }) =>
  !b.assignedCoachId || !b.assignedCoachName || b.assignedCoachName.toLowerCase() === 'unassigned';

const ago = (iso: string) => {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (!Number.isFinite(mins)) return '';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
};

const Panel: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, action, children, className = '' }) => (
  <section className={`bg-[#121214] border border-zinc-800 rounded-2xl flex flex-col min-h-0 shadow-sm shadow-black/30 ${className}`}>
    <header className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-zinc-800">
      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{title}</h2>
      {action}
    </header>
    {children}
  </section>
);

export const SupportOverview: React.FC<Props> = ({ user, tickets, paidBookings, consultations, assessments, enquiries, notifications, analytics, loading, error, onRetry, onNavigate, onOpenNotification, onMarkAllRead }) => {
  const [filter, setFilter] = useState<Kind | 'all'>('all');

  const queue = useMemo<QueueItem[]>(() => ([
    ...paidBookings.filter(b => b.status !== 'Cancelled' && needsCoach(b)).map(b => ({ key: `b-${b.id}`, kind: 'booking' as const, title: b.clientName, detail: `${b.packageName} · needs a coach`, at: b.createdAt, tab: KIND.booking.tab })),
    ...consultations.filter(c => c.status === 'Pending').map(c => ({ key: `d-${c.id}`, kind: 'demo' as const, title: c.clientName, detail: c.goal || 'Free demo request', at: c.createdAt, tab: KIND.demo.tab })),
    ...enquiries.filter(e => e.status === 'new').map(e => ({ key: `e-${e.id}`, kind: 'enquiry' as const, title: e.name, detail: e.subject, at: e.createdAt, tab: KIND.enquiry.tab })),
    ...tickets.filter(t => t.status !== 'resolved' && t.status !== 'closed').map(t => ({
      key: `t-${t.id}`, kind: 'ticket' as const, title: t.subject, detail: `${t.userName} · ${t.id}`, at: t.createdAt, tab: KIND.ticket.tab, recordId: t.id,
      urgent: t.priority === 'urgent' || t.priority === 'high',
    })),
  ] as QueueItem[]).sort((x, y) => Number(!!y.urgent) - Number(!!x.urgent) || new Date(y.at).getTime() - new Date(x.at).getTime()),
  [paidBookings, consultations, assessments, enquiries, tickets]);

  const countBy = (k: Kind) => queue.filter(q => q.kind === k).length;
  const urgentCount = queue.filter(q => q.urgent).length;
  const shown = (filter === 'all' ? queue : queue.filter(q => q.kind === filter)).slice(0, 15);
  const unread = notifications.filter(n => !n.isRead).length;

  const kpis: { label: string; value: number; note: string; attention: number; tab: SupportTab; opts?: { priority: string } }[] = [
    { label: 'Paid bookings', value: paidBookings.length, note: 'need a coach', attention: countBy('booking'), tab: 'paid_bookings' },
    { label: 'Demo sessions', value: consultations.length, note: 'pending', attention: countBy('demo'), tab: 'free_consultations' },
    { label: 'Assessments', value: assessments.length, note: 'received', attention: 0, tab: 'assessments' },
    { label: 'Enquiries', value: enquiries.length, note: 'new', attention: countBy('enquiry'), tab: 'enquiries' },
    { label: 'Open tickets', value: countBy('ticket'), note: 'urgent', attention: urgentCount, tab: 'inbox', opts: { priority: 'urgent' } },
  ];

  const sources = Object.entries(analytics.breakdownBySource).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxSource = Math.max(1, ...sources.map(([, n]) => n));
  const firstResponse = avgMs(tickets.flatMap(t => {
    const reply = t.conversationHistory?.find(m => m.senderRole === 'agent');
    const d = reply ? new Date(reply.createdAt).getTime() - new Date(t.createdAt).getTime() : NaN;
    return d >= 0 ? [d] : [];
  }));
  const resolution = avgMs(tickets.flatMap(t => {
    const d = t.status === 'resolved' || t.status === 'closed' ? new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime() : NaN;
    return d >= 0 ? [d] : [];
  }));
  const resolvedPct = analytics.totalEnquiries > 0 ? Math.round((analytics.resolved / analytics.totalEnquiries) * 100) : null;
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
        <div className="h-24 rounded-xl bg-zinc-900 animate-pulse" />
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-96 rounded-xl bg-zinc-900 animate-pulse" />
          <div className="h-96 rounded-xl bg-zinc-900 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{today}</p>
          <h1 className="text-2xl font-bold text-white mt-1">Hi {user?.name?.split(' ')[0] || 'there'}, {queue.length ? `${queue.length} item${queue.length === 1 ? '' : 's'} need${queue.length === 1 ? 's' : ''} attention` : "you're all caught up"}</h1>
          {urgentCount > 0 && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-red-300 bg-red-500/10 border border-red-500/30 rounded-full px-2.5 py-1">
              <AlertTriangle className="w-3.5 h-3.5" aria-hidden /> {urgentCount} urgent {urgentCount === 1 ? 'ticket' : 'tickets'} first in the queue
            </p>
          )}
        </div>
        {error && (
          <button onClick={onRetry} className="flex items-center gap-2 text-xs text-red-300 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2 cursor-pointer hover:text-white">
            <AlertTriangle className="w-4 h-4" /> Some data failed to load · Retry <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {kpis.map(k => {
          const Icon = KIND[k.label === 'Open tickets' ? 'ticket' : k.label === 'Paid bookings' ? 'booking' : k.label === 'Demo sessions' ? 'demo' : k.label === 'Assessments' ? 'assessment' : 'enquiry'].icon;
          return (
            <button key={k.label} onClick={() => onNavigate(k.tab, k.opts)} className={`group text-left p-4 rounded-2xl bg-[#121214] border transition-colors hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00] cursor-pointer ${k.attention ? 'border-amber-500/30' : 'border-zinc-800'}`}>
              <span className="flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300">{k.label}</span>
                <Icon className="w-4 h-4 text-zinc-500 group-hover:text-[#CCFF00]" aria-hidden />
              </span>
              <span className="block text-3xl font-bold text-white tabular-nums mt-2">{k.value}</span>
              <span className={`inline-flex items-center gap-1.5 text-xs mt-2 rounded-full px-2 py-0.5 ${k.attention ? 'text-amber-300 bg-amber-500/10' : 'text-zinc-400 bg-zinc-800/60'}`}>
                {k.attention > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden />}
                {k.attention} {k.note}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        <Panel title="Needs attention" className="lg:col-span-2" action={<span className="text-xs text-zinc-400 tabular-nums">{queue.length} open</span>}>
          <div className="flex gap-1.5 px-5 pt-4 overflow-x-auto" role="tablist" aria-label="Filter by type">
            {(['all', 'ticket', 'booking', 'demo', 'enquiry'] as const).map(k => (
              <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${filter === k ? 'bg-[#CCFF00] text-black border-[#CCFF00] font-bold' : 'border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-600'}`}>
                {k === 'all' ? 'All' : `${KIND[k].label}s`} <span className="tabular-nums opacity-70">{k === 'all' ? queue.length : countBy(k)}</span>
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <div role="status" className="py-16 text-center">
              <Inbox className="w-8 h-8 mx-auto text-zinc-600" />
              <p className="mt-2 text-sm text-zinc-200">Nothing waiting here</p>
              <p className="text-xs text-zinc-400">New bookings, demos, assessments, enquiries and tickets appear automatically.</p>
            </div>
          ) : (
            <ul className="p-3 lg:max-h-[calc(100dvh-24rem)] lg:overflow-y-auto custom-scrollbar divide-y divide-zinc-800/60">
              {shown.map(q => {
                const Icon = KIND[q.kind].icon;
                return (
                  <li key={q.key}>
                    <button onClick={() => onNavigate(q.tab, q.recordId ? { recordId: q.recordId } : undefined)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00] cursor-pointer border-l-2 ${q.urgent ? 'border-red-500' : 'border-transparent'}`}>
                      <span className={`w-9 h-9 shrink-0 rounded-lg border flex items-center justify-center ${KIND[q.kind].tone}`}><Icon className="w-4 h-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white truncate">{q.title}</span>
                          {q.urgent && <span className="shrink-0 text-[10px] font-bold uppercase text-white bg-red-600 rounded px-1.5 py-0.5">Urgent</span>}
                        </span>
                        <span className="block text-xs text-zinc-400 truncate mt-0.5">{q.detail}</span>
                      </span>
                      <span className={`hidden sm:inline shrink-0 text-[11px] font-medium border rounded-full px-2 py-0.5 ${KIND[q.kind].tone}`}>{KIND[q.kind].label}</span>
                      <span className="text-xs text-zinc-400 shrink-0 tabular-nums w-14 text-right">{ago(q.at)}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-5">
          <Panel title="Support performance">
            <dl className="grid grid-cols-2 gap-px bg-zinc-800 rounded-b-none">
              {[
                ['First response', firstResponse == null ? '—' : fmtDuration(firstResponse)],
                ['Avg. resolution', resolution == null ? '—' : fmtDuration(resolution)],
                ['Tickets logged', String(analytics.totalEnquiries)],
                ['Resolved', resolvedPct == null ? '—' : `${resolvedPct}%`],
              ].map(([k, v]) => (
                <div key={k} className="bg-[#121214] px-5 py-3.5">
                  <dt className="text-xs text-zinc-400">{k}</dt>
                  <dd className="text-xl font-bold text-white tabular-nums mt-0.5">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="px-5 py-4 space-y-3 border-t border-zinc-800">
              <h3 className="text-xs font-medium text-zinc-300">Tickets by source</h3>
              {sources.length === 0 ? <p className="text-xs text-zinc-400">No tickets yet.</p> : sources.map(([name, n]) => (
                <div key={name} className="text-xs">
                  <div className="flex justify-between text-zinc-300"><span className="truncate">{name}</span><span className="tabular-nums font-medium">{n}</span></div>
                  <div className="h-1.5 mt-1.5 rounded-full bg-zinc-800"><div className="h-1.5 rounded-full bg-[#CCFF00]" style={{ width: `${(n / maxSource) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Latest activity" action={unread > 0 && <button onClick={onMarkAllRead} className="text-xs text-[#CCFF00] hover:underline cursor-pointer">Mark all read</button>}>
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-xs text-zinc-400 text-center">No activity yet.</p>
            ) : (
              <ul className="p-3 max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.slice(0, 10).map(n => (
                  <li key={n.id}>
                    <button onClick={() => onOpenNotification(n)} className="w-full flex gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-zinc-900 cursor-pointer">
                      <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-zinc-700' : 'bg-[#CCFF00]'}`} role="img" aria-label={n.isRead ? 'Read' : 'Unread'} />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm truncate ${n.isRead ? 'text-zinc-400' : 'text-white font-medium'}`}>{n.title}</span>
                        <span className="block text-xs text-zinc-400 truncate">{n.message}</span>
                      </span>
                      <span className="text-xs text-zinc-400 shrink-0 tabular-nums">{ago(n.createdAt)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
