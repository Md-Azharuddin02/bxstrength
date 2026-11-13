import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import type { InAppNotification } from '../../types';

interface Props {
  items: InAppNotification[];
  unread: number;
  loading: boolean;
  error: boolean;
  onOpen: (n: InAppNotification) => void;
  onMarkAllRead: () => void;
}

export const NotificationBell: React.FC<Props> = ({ items, unread, loading, error, onOpen, onMarkAllRead }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-label={`Notifications, ${unread} unread`} className="relative p-2 rounded-xl bg-[#18181b] border border-zinc-800 hover:bg-zinc-800 cursor-pointer">
        <Bell className="w-4 h-4 text-[#CCFF00]" />
        {unread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-mono font-black rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] max-h-[70vh] flex flex-col bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
              <span className="text-xs font-black uppercase text-white">Notifications</span>
              {unread > 0 && <button onClick={onMarkAllRead} className="text-[11px] font-bold text-[#CCFF00] hover:underline cursor-pointer">Mark all read</button>}
            </div>
            <div className="overflow-y-auto custom-scrollbar divide-y divide-zinc-800/70">
              {loading ? <p className="p-6 text-center text-xs text-zinc-500">Loading…</p>
                : error && items.length === 0 ? <p className="p-6 text-center text-xs text-red-400">Could not load notifications.</p>
                : items.length === 0 ? <p className="p-6 text-center text-xs text-zinc-500">No notifications yet.</p>
                : items.map(n => (
                  <button key={n.id} onClick={() => { setOpen(false); onOpen(n); }} className={`w-full text-left px-4 py-3 hover:bg-zinc-800/50 cursor-pointer ${n.isRead ? 'opacity-60' : ''}`}>
                    <span className="flex items-center gap-2 text-xs font-bold text-white">{!n.isRead && <span className="w-2 h-2 rounded-full bg-[#CCFF00] shrink-0" />}<span className="truncate">{n.title}</span></span>
                    <span className="block text-[11px] text-zinc-400 truncate">{n.message}</span>
                    <span className="block text-[10px] text-zinc-600 font-mono">{new Date(n.createdAt).toLocaleString()}</span>
                  </button>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
