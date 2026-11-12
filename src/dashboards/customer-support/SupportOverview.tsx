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

const KIND: Record<Kind, { label: string; icon: React.ElementType; tab: SupportTab }> = {
  booking: { label: 'Booking', icon: Package, tab: 'paid_bookings' },
  demo: { label: 'Demo', icon: Video, tab: 'free_consultations' },
  assessment: { label: 'Assessment', icon: ClipboardCheck, tab: 'assessments' },
  enquiry: { label: 'Enquiry', icon: MessageSquare, tab: 'enquiries' },
  ticket: { label: 'Ticket', icon: Mail, tab: 'inbox' },
};

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
  <section className={`bg-[#121214] border border-zinc-800 rounded-xl flex flex-col min-h-0 ${className}`}>
    <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800">
      <h2 className="text-sm font-bold text-white">{title}</h2>
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
    ...assessments.filter(a => a.status === 'Pending').map(a => ({ key: `a-${a.id}`, kind: 'assessment' as const, title: a.clientName, detail: a.primaryGoal || 'Self assessment', at: a.createdAt, tab: KIND.assessment.tab })),
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
    { label: 'Assessments', value: assessments.length, note: 'pending', attention: countBy('assessment'), tab: 'assessments' },
    { label: 'Enquiries', value: enquiries.length, note: 'new', attention: countBy('enquiry'), tab: 'enquiries' },
    { label: 'Open tickets', value: countBy('ticket'), note: 'urgent', attention: urgentCount, tab: 'inbox', opts: { priority: 'urgent' } },
  ];

  const sources = Object.entries(analytics.breakdownBySource).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const maxSource = Math.max(1, ...sources.map(([, n]) => n));
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
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-zinc-500">{today}</p>
          <h2 className="text-lg font-bold text-white">Hi {user?.name?.split(' ')[0] || 'there'}, {queue.length ? `${queue.length} item${queue.length === 1 ? '' : 's'} need attention` : "you're all caught up"}</h2>
        </div>
        {error && (
          <button onClick={onRetry} className="flex items-center gap-2 text-xs text-red-300 bg-red-950/40 border border-red-900/60 rounded-lg px-3 py-2 cursor-pointer hover:text-white">
            <AlertTriangle className="w-4 h-4" /> Some data failed to load · Retry <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 bg-[#121214] border border-zinc-800 rounded-xl overflow-hidden">
        {kpis.map(k => (
          <button key={k.label} onClick={() => onNavigate(k.tab, k.opts)} className="text-left p-4 border-zinc-800 border-b border-r -mb-px -mr-px hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#CCFF00] cursor-pointer">
            <span className="text-xs text-zinc-400">{k.label}</span>
            <span className="block text-2xl font-bold text-white tabular-nums mt-1">{k.value}</span>
            <span className={`flex items-center gap-1.5 text-xs mt-1 ${k.attention ? 'text-amber-400' : 'text-zinc-500'}`}>
              {k.attention > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden />}
              {k.attention} {k.note}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <Panel title="Needs attention" className="lg:col-span-2">
          <div className="flex gap-1.5 px-4 pt-3 overflow-x-auto" role="tablist" aria-label="Filter by type">
            {(['all', 'ticket', 'booking', 'demo', 'assessment', 'enquiry'] as const).map(k => (
              <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}
                className={`shrink-0 text-xs px-2.5 py-1 rounded-md border cursor-pointer ${filter === k ? 'bg-[#CCFF00] text-black border-[#CCFF00] font-bold' : 'border-zinc-800 text-zinc-400 hover:text-white'}`}>
                {k === 'all' ? 'All' : `${KIND[k].label}s`} <span className="tabular-nums opacity-70">{k === 'all' ? queue.length : countBy(k)}</span>
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <div role="status" className="py-16 text-center">
              <Inbox className="w-8 h-8 mx-auto text-zinc-700" />
              <p className="mt-2 text-sm text-zinc-300">Nothing waiting here</p>
              <p className="text-xs text-zinc-500">New bookings, demos, assessments, enquiries and tickets appear automatically.</p>
            </div>
          ) : (
            <ul className="p-2 lg:max-h-[calc(100dvh-22rem)] lg:overflow-y-auto custom-scrollbar">
              {shown.map(q => {
                const Icon = KIND[q.kind].icon;
                return (
                  <li key={q.key}>
                    <button onClick={() => onNavigate(q.tab, q.recordId ? { recordId: q.recordId } : undefined)} className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00] cursor-pointer">
                      <span className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center ${q.urgent ? 'bg-red-500/15 text-red-400' : 'bg-zinc-900 text-zinc-400'}`}><Icon className="w-4 h-4" /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-sm text-white truncate">{q.title}</span>
                          {q.urgent && <span className="shrink-0 text-[10px] font-bold uppercase text-red-400 border border-red-500/40 rounded px-1">Urgent</span>}
                        </span>
                        <span className="block text-xs text-zinc-500 truncate">{KIND[q.kind].label} · {q.detail}</span>
                      </span>
                      <span className="text-xs text-zinc-500 shrink-0 tabular-nums">{ago(q.at)}</span>
                      <ChevronRight className="w-4 h-4 text-zinc-600 shrink-0" aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel title="Latest activity" action={unread > 0 && <button onClick={onMarkAllRead} className="text-xs text-[#CCFF00] hover:underline cursor-pointer">Mark all read</button>}>
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-xs text-zinc-500 text-center">No activity yet.</p>
            ) : (
              <ul className="p-2 max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.slice(0, 10).map(n => (
                  <li key={n.id}>
                    <button onClick={() => onOpenNotification(n)} className="w-full flex gap-2.5 px-2 py-2 rounded-lg text-left hover:bg-zinc-900 cursor-pointer">
                      <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-[#CCFF00]'}`} aria-label={n.isRead ? undefined : 'Unread'} />
                      <span className="min-w-0">
                        <span className={`block text-sm truncate ${n.isRead ? 'text-zinc-400' : 'text-white'}`}>{n.title}</span>
                        <span className="block text-xs text-zinc-500 truncate">{ago(n.createdAt)} · {n.message}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Support performance">
            <dl className="grid grid-cols-2 gap-px bg-zinc-800">
              {[
                ['First response', analytics.avgResponseTime],
                ['Resolution', analytics.avgResolutionTime],
                ['Tickets logged', String(analytics.totalEnquiries)],
                ['Resolved', analytics.totalEnquiries > 0 ? `${Math.round((analytics.resolved / analytics.totalEnquiries) * 100)}%` : '—'],
              ].map(([k, v]) => (
                <div key={k} className="bg-[#121214] px-4 py-3">
                  <dt className="text-xs text-zinc-500">{k}</dt>
                  <dd className="text-base font-bold text-white tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="px-4 py-3 space-y-2 border-t border-zinc-800">
              <h3 className="text-xs text-zinc-500">Tickets by source</h3>
              {sources.length === 0 ? <p className="text-xs text-zinc-600">No tickets yet.</p> : sources.map(([name, n]) => (
                <div key={name} className="text-xs">
                  <div className="flex justify-between text-zinc-300"><span className="truncate">{name}</span><span className="tabular-nums">{n}</span></div>
                  <div className="h-1 mt-1 rounded bg-zinc-800"><div className="h-1 rounded bg-[#CCFF00]" style={{ width: `${(n / maxSource) * 100}%` }} /></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
};
