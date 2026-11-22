import React from 'react';
import { LifeBuoy } from 'lucide-react';
import { SupportTicket } from '../../../types';
import { getPriorityBadge, getStatusBadge } from './TicketBadges';

interface TicketListProps {
  tickets: SupportTicket[];
  isLoading: boolean;
  selectedTicketId?: string;
  onSelect: (ticket: SupportTicket) => void;
}

export const TicketList: React.FC<TicketListProps> = ({ tickets: filteredTickets, isLoading, selectedTicketId, onSelect }) => {
  return (
    <div className="lg:col-span-5 bg-[#121214] border border-zinc-800 rounded-2xl p-4 space-y-3 lg:h-full h-[70dvh] min-h-[420px] overflow-y-auto custom-scrollbar">
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
          const isSelected = selectedTicketId === ticket.id;
          return (
            <div
              key={ticket.id}
              onClick={() => onSelect(ticket)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(ticket); } }}
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
  );
};
