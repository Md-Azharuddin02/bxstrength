import React from 'react';
import { TicketPriority, TicketStatus } from '../../../types';

// Helper formatting badges
export const getPriorityBadge = (p: TicketPriority) => {
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

export const getStatusBadge = (s: TicketStatus) => {
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
