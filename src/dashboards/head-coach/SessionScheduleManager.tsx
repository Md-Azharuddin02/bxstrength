import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Calendar, CalendarPlus, ChevronRight, Clock, Pencil, RefreshCw, Search, Trash2, Video, X } from 'lucide-react';
import { BookingSession, PaidPackageBooking, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import { decodeHtmlEntities } from '../../services/core/mappers';
import { normalizeRole } from '../../utils/auth';
import { formatScheduledAt } from '../../utils/schedule';
import { Select } from '../../components/ui/Select';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface Props {
  user?: User;
  onShowToast: (msg: string) => void;
}

const STATUS_STYLE: Record<string, string> = {
  Scheduled: 'bg-sky-950 text-sky-300 border-sky-800',
  Completed: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  Missed: 'bg-amber-950 text-amber-300 border-amber-800',
  Cancelled: 'bg-zinc-900 text-zinc-400 border-zinc-700',
};

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time
const toLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const inputCls = 'w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#CCFF00]';

export const SessionScheduleManager: React.FC<Props> = ({ user, onShowToast }) => {
  const currentUser = user || VelocityAPI.getCurrentUser();
  const role = normalizeRole(currentUser?.role);
  const isManager = role === 'admin' || role === 'headcoach' || Boolean(currentUser?.coachPosition?.toLowerCase().includes('head'));
  const isSupport = role === 'customersupport' || role === 'support';

  const [bookings, setBookings] = useState<PaidPackageBooking[]>([]);
  const [sessions, setSessions] = useState<BookingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // add form
  const [firstAt, setFirstAt] = useState('');
  const [count, setCount] = useState(1);
  const [weekly, setWeekly] = useState(true);
  const [link, setLink] = useState('');
  const [saving, setSaving] = useState(false);

  // inline edit
  const [editId, setEditId] = useState<string | null>(null);
  const [editAt, setEditAt] = useState('');
  const [editLink, setEditLink] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deleting, setDeleting] = useState<BookingSession | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [b, s] = await Promise.all([VelocityAPI.fetchPaidBookings(), VelocityAPI.fetchBookingSessions()]);
      setBookings(b);
      setSessions(s);
    } catch {
      onShowToast('Failed to load session schedules');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const mine = useMemo(() => bookings.filter(b => {
    if (b.status === 'Cancelled') return false;
    if (isManager || isSupport) return true;
    return b.assignedCoachId === currentUser?.id
      || Boolean(!b.assignedCoachId && b.assignedCoachName && currentUser?.name && b.assignedCoachName.trim().toLowerCase() === currentUser.name.trim().toLowerCase());
  }), [bookings, isManager, isSupport, currentUser]);

  const byBooking = useMemo(() => {
    const m = new Map<string, BookingSession[]>();
    sessions.forEach(s => m.set(s.bookingId, [...(m.get(s.bookingId) || []), s]));
    return m;
  }, [sessions]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? mine.filter(b => `${b.clientName} ${b.clientEmail} ${b.packageName} ${b.assignedCoachName || ''}`.toLowerCase().includes(q)) : mine;
  }, [mine, search]);

  const selected = mine.find(b => b.id === selectedId) || null;
  const selSessions = selected ? (byBooking.get(selected.id) || []) : [];
  const live = selSessions.filter(s => s.status !== 'Cancelled').length;
  const left = selected ? Math.max(0, (selected.totalSessions || 1) - live) : 0;

  const openBooking = (b: PaidPackageBooking) => {
    setSelectedId(b.id);
    setFirstAt('');
    setCount(1);
    setLink(b.meetingLink || '');
    setEditId(null);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    if (!firstAt) return onShowToast('Pick a date and time first.');
    const dates: string[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(firstAt);
      d.setDate(d.getDate() + (weekly ? 7 * i : 0));
      dates.push(d.toISOString());
    }
    setSaving(true);
    const res = await VelocityAPI.createBookingSessions(selected.id, { scheduledAts: dates, meetingLink: link });
    setSaving(false);
    if (res.success) {
      onShowToast(`${dates.length} session${dates.length === 1 ? '' : 's'} scheduled.`);
      setFirstAt('');
      load();
    } else onShowToast(res.error || 'Failed to schedule');
  };

  const patch = async (s: BookingSession, body: Parameters<typeof VelocityAPI.updateBookingSession>[1], msg: string) => {
    const res = await VelocityAPI.updateBookingSession(s.id, body);
    if (res.success) { onShowToast(msg); load(); return true; }
    onShowToast(res.error || 'Update failed');
    return false;
  };

  const saveEdit = async (s: BookingSession) => {
    if (!editAt) return onShowToast('Date and time is required.');
    if (await patch(s, { scheduledAt: new Date(editAt).toISOString(), meetingLink: editLink, notes: editNotes }, 'Session updated.')) setEditId(null);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const res = await VelocityAPI.deleteBookingSession(deleting.id);
    setDeleting(null);
    if (res.success) { onShowToast('Session removed.'); load(); } else onShowToast(res.error || 'Delete failed');
  };

  const canEdit = !isSupport;

  /* ---------- detail ---------- */
  if (selected) {
    return (
      <div className="space-y-5">
        <button onClick={() => setSelectedId(null)} className="flex items-center gap-1.5 text-xs font-bold uppercase text-zinc-300 hover:text-white cursor-pointer">
          <ArrowLeft className="w-4 h-4 text-[#CCFF00]" /> Back to session schedules
        </button>

        <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-white">{decodeHtmlEntities(selected.clientName)}</h3>
            <p className="text-xs text-zinc-400">{decodeHtmlEntities(selected.packageName)} · {selected.assignedCoachName ? `Coach: ${selected.assignedCoachName}` : 'No coach assigned'}</p>
          </div>
          <div className="text-right text-xs">
            <div className="font-mono font-bold text-white">{selected.completedSessions || 0} / {selected.totalSessions || 1} completed</div>
            <div className="text-zinc-500">{live} scheduled · {left} left to schedule</div>
          </div>
        </div>

        {canEdit && (
          <form onSubmit={handleAdd} className="bg-[#121214] border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-300">
              <CalendarPlus className="w-4 h-4 text-[#CCFF00]" /> Schedule sessions
            </div>
            {left === 0 ? (
              <p className="text-xs text-zinc-500">All {selected.totalSessions} sessions of this package are scheduled. Remove or cancel one to add another.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="space-y-1 sm:col-span-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">First session</span>
                    <input type="datetime-local" value={firstAt} onChange={e => setFirstAt(e.target.value)} className={inputCls} required />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">How many (max {left})</span>
                    <input type="number" min={1} max={left} value={count} onChange={e => setCount(Math.min(left, Math.max(1, Number(e.target.value) || 1)))} className={inputCls} />
                  </label>
                  <label className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Meeting link (optional)</span>
                    <input type="url" value={link} onChange={e => setLink(e.target.value)} placeholder="https://meet.google.com/..." className={inputCls} />
                  </label>
                </div>
                {count > 1 && (
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input type="checkbox" checked={weekly} onChange={e => setWeekly(e.target.checked)} className="accent-[#CCFF00]" />
                    Repeat weekly at the same time ({count} sessions)
                  </label>
                )}
                <button type="submit" disabled={saving} className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase px-4 py-2.5 rounded-lg disabled:opacity-60 cursor-pointer">
                  {saving ? 'Saving…' : `Schedule ${count} session${count === 1 ? '' : 's'}`}
                </button>
              </>
            )}
          </form>
        )}

        <div className="bg-[#121214] border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden">
          {selSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500">No sessions scheduled yet.</div>
          ) : selSessions.map((s, i) => (
            <div key={s.id} className="p-4 space-y-3">
              {editId === s.id ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input type="datetime-local" value={editAt} onChange={e => setEditAt(e.target.value)} className={inputCls} />
                  <input type="url" value={editLink} onChange={e => setEditLink(e.target.value)} placeholder="Meeting link" className={inputCls} />
                  <input value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Note for client (optional)" className={inputCls} />
                  <div className="sm:col-span-3 flex gap-2">
                    <button onClick={() => saveEdit(s)} className="bg-[#CCFF00] text-black font-black text-xs uppercase px-3 py-1.5 rounded-lg cursor-pointer">Save</button>
                    <button onClick={() => setEditId(null)} className="text-xs font-bold uppercase text-zinc-400 hover:text-white px-3 py-1.5 cursor-pointer">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 text-[#CCFF00] text-xs font-black flex items-center justify-center">{i + 1}</div>
                  <div className="flex-1 min-w-[12rem]">
                    <div className="text-sm font-bold text-white flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-zinc-500" />{formatScheduledAt(s.scheduledAt)}</div>
                    {s.meetingLink && <div className="text-[11px] text-zinc-500 truncate flex items-center gap-1"><Video className="w-3 h-3" />{s.meetingLink}</div>}
                    {s.notes && <div className="text-[11px] text-zinc-400 italic">"{s.notes}"</div>}
                  </div>
                  {canEdit ? (
                    <>
                      <div className="w-36">
                        <Select
                          value={s.status}
                          onChange={e => patch(s, { status: e.target.value as BookingSession['status'] }, `Marked ${e.target.value}.`)}
                          className={`w-full border rounded-lg px-3 py-1.5 text-xs font-bold ${STATUS_STYLE[s.status]}`}
                        >
                          {['Scheduled', 'Completed', 'Missed', 'Cancelled'].map(v => <option key={v} value={v}>{v}</option>)}
                        </Select>
                      </div>
                      <button onClick={() => { setEditId(s.id); setEditAt(toLocalInput(s.scheduledAt)); setEditLink(s.meetingLink || ''); setEditNotes(s.notes || ''); }} className="p-2 text-zinc-400 hover:text-white cursor-pointer" title="Edit"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => setDeleting(s)} className="p-2 text-zinc-500 hover:text-red-400 cursor-pointer" title="Delete"><Trash2 className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <ConfirmModal
          isOpen={Boolean(deleting)}
          title="Remove Session"
          message="Remove this session from the schedule? The client will no longer see it."
          confirmText="Remove"
          cancelText="Keep"
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
          requireTextConfirm={false}
        />
      </div>
    );
  }

  /* ---------- list ---------- */
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-[#121214] border border-zinc-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by client, package or coach..." className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#CCFF00]" />
        </div>
        <button onClick={load} disabled={loading} className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer" title="Refresh">
          <RefreshCw className={`w-4 h-4 text-[#CCFF00] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && bookings.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-500">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="text-center py-16 bg-[#121214] border border-dashed border-zinc-800 rounded-2xl space-y-2">
          <Calendar className="w-9 h-9 text-zinc-600 mx-auto" />
          <p className="text-sm font-black text-white uppercase">No bookings to schedule</p>
          <p className="text-xs text-zinc-500">Paid bookings assigned to you appear here.</p>
        </div>
      ) : (
        <div className="bg-[#121214] border border-zinc-800 rounded-2xl divide-y divide-zinc-800 overflow-hidden">
          {shown.map(b => {
            const ss = byBooking.get(b.id) || [];
            const live = ss.filter(s => s.status !== 'Cancelled').length;
            const next = ss.find(s => s.status === 'Scheduled' && new Date(s.scheduledAt) >= new Date());
            return (
              <button key={b.id} onClick={() => openBooking(b)} className="w-full text-left px-4 sm:px-5 py-3.5 flex items-center gap-4 hover:bg-zinc-900/70 transition-colors cursor-pointer">
                <div className="w-10 h-10 shrink-0 rounded-full bg-zinc-800 border border-zinc-700 text-[#CCFF00] font-black flex items-center justify-center">{(b.clientName || '?').charAt(0).toUpperCase()}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{decodeHtmlEntities(b.clientName)}</div>
                  <div className="text-xs text-zinc-400 truncate">{decodeHtmlEntities(b.packageName)} · {b.assignedCoachName ? `Coach: ${b.assignedCoachName}` : 'Unassigned'}</div>
                </div>
                <div className="hidden md:block text-xs text-right shrink-0">
                  <div className={next ? 'text-[#CCFF00] font-bold' : 'text-zinc-500'}>{next ? formatScheduledAt(next.scheduledAt) : 'No upcoming session'}</div>
                </div>
                <span className="hidden sm:inline font-mono text-[11px] text-zinc-300 shrink-0">{live}/{b.totalSessions || 1} scheduled</span>
                <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SessionScheduleManager;
