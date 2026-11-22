import React, { useState } from 'react';
import {
  Bot, CornerUpRight, Globe, Lock, ShieldCheck, Tag, Trash2,
  User as UserIcon, UserCheck, ListChecks
} from 'lucide-react';
import { SupportTicket, TicketStatus } from '../../../types';
import { TicketChat } from '../../../components/TicketChat/TicketChat';
import { getPriorityBadge, getStatusBadge } from './TicketBadges';
import { RoleView } from './types';

interface TicketDetailProps {
  ticket: SupportTicket | null;
  activeRoleView: RoleView;
  /** Signed-in user; the live chat is hidden until it is known. */
  currentUserId?: string;
  onDelete: (ticket: SupportTicket) => void;
  onUpdateStatus: (status: TicketStatus) => void;
  onTransferToHeadCoach: () => void;
  /** Changes when a notification asks to open this ticket's chat. */
  openChatRequest?: number;
}

const CARD = 'bg-[#18181b] border border-zinc-800 rounded-xl';

const STATUS_OPTIONS: ReadonlyArray<readonly [TicketStatus, string]> = [
  ['in_progress', 'In progress'],
  ['waiting_customer', 'Awaiting client'],
  ['resolved', 'Resolved'],
  ['closed', 'Closed'],
];

const CardTitle = ({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) => (
  <h3 className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800 text-[11px] font-bold uppercase tracking-wider text-zinc-300">
    <Icon className="w-4 h-4 text-[#CCFF00]" />
    {children}
  </h3>
);

// RIGHT WORKSPACE: SELECTED TICKET DETAIL & 360 PROFILE
export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket: selectedTicket,
  activeRoleView,
  currentUserId,
  onDelete,
  onUpdateStatus,
  onTransferToHeadCoach,
  openChatRequest
}) => {
  // While the chat is open it takes over the panel; the other sections are hidden (not unmounted) so drafts survive.
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="lg:col-span-7 bg-[#121214] border border-zinc-800 rounded-2xl p-4 lg:h-full h-[70dvh] min-h-[420px] overflow-y-auto custom-scrollbar flex flex-col">

      {selectedTicket ? (
        <div className={chatOpen ? 'flex-1 min-h-0 flex flex-col' : 'space-y-4'}>

          {/* TICKET HEADER */}
          <section hidden={chatOpen} aria-label="Ticket" className={CARD}>
            <div className="p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono font-bold text-[#CCFF00]">#{selectedTicket.id}</span>
                {getPriorityBadge(selectedTicket.priority)}
                {getStatusBadge(selectedTicket.status)}
                <div className="ml-auto flex items-center gap-1.5">
                  <button
                    onClick={onTransferToHeadCoach}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-amber-700/60 bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 text-[11px] font-bold transition-colors cursor-pointer"
                    title="Send this enquiry to the Head Coach dashboard"
                  >
                    <CornerUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    Transfer to Head Coach
                  </button>
                  {activeRoleView === 'admin' && (
                    <button
                      onClick={() => onDelete(selectedTicket)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      aria-label="Delete ticket"
                      title="Delete ticket"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              <h2 className="text-base font-bold text-white leading-snug break-words">{selectedTicket.subject}</h2>

              <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
                {([
                  [Tag, 'Category', selectedTicket.category],
                  [Globe, 'Source', selectedTicket.source || 'Website Contact Form'],
                  [UserCheck, 'Agent', selectedTicket.assignedAgent || 'CS Team'],
                ] as const).map(([Icon, label, value]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                    <dt className="text-zinc-500">{label}</dt>
                    <dd className="text-zinc-200 font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* STATUS: segmented control, current status highlighted */}
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-t border-zinc-800">
              <span id="ticket-status-label" className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Status</span>
              <div role="group" aria-labelledby="ticket-status-label" className="flex flex-wrap gap-1 p-0.5 rounded-lg bg-zinc-900 border border-zinc-800">
                {STATUS_OPTIONS.map(([value, label]) => {
                  const current = selectedTicket.status === value;
                  return (
                    <button
                      key={value}
                      onClick={() => !current && onUpdateStatus(value)}
                      aria-pressed={current}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${current ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* CLIENT PROFILE */}
          <section hidden={chatOpen} className={CARD}>
            <CardTitle icon={UserCheck}>Client profile</CardTitle>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 p-4 text-xs">
              {[
                ['Client', <span className="text-white font-semibold">{selectedTicket.userName}</span>],
                ['Service', <span className="text-white font-semibold">{selectedTicket.serviceOrProduct || '1-to-1 Digital Session'}</span>],
                ['Email', <a href={`mailto:${selectedTicket.userEmail}`} className="text-white hover:text-[#CCFF00] underline underline-offset-2">{selectedTicket.userEmail}</a>],
                ['Phone', selectedTicket.userPhone
                  ? <a href={`tel:${selectedTicket.userPhone}`} className="text-white hover:text-[#CCFF00] tabular-nums">{selectedTicket.userPhone}</a>
                  : <span className="text-zinc-500">Not provided</span>],
                ...(selectedTicket.relatedBookingId ? [['Booking', <span className="text-[#CCFF00] font-mono font-bold">{selectedTicket.relatedBookingId}</span>]] : []),
                ...(selectedTicket.relatedTransactionId ? [['Txn ref', <span className="text-purple-400 font-mono font-bold">{selectedTicket.relatedTransactionId}</span>]] : []),
              ].map(([label, value]) => (
                <div key={label as string} className="grid grid-cols-[72px_1fr] items-baseline gap-2 min-w-0">
                  <dt className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">{label}</dt>
                  <dd className="min-w-0 break-words">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* CHATBOT CONTEXT (IF THE TICKET CAME FROM THE CHATBOT) */}
          {selectedTicket.chatContext?.botConversationSnippet && (
            <section hidden={chatOpen} className={CARD}>
              <CardTitle icon={Bot}>Chatbot conversation</CardTitle>
              <pre className="p-4 text-[11px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.chatContext.botConversationSnippet}
              </pre>
            </section>
          )}

          {/* LIVE TICKET CHAT (stored in database) */}
          {currentUserId && (
            <TicketChat
              ticketId={selectedTicket.id}
              currentUserId={currentUserId}
              subtitle={`#${selectedTicket.id} · ${selectedTicket.subject} · ${selectedTicket.userName}`}
              onOpenChange={setChatOpen}
              openRequest={openChatRequest}
            />
          )}

          {/* TIMELINE & INTERNAL NOTES */}
          <section hidden={chatOpen} className={CARD}>
            <CardTitle icon={ListChecks}>Timeline & notes</CardTitle>
            <ol className="p-4 space-y-3">
              {selectedTicket.conversationHistory && selectedTicket.conversationHistory.length > 0 ? (
                selectedTicket.conversationHistory.map(msg => (
                  <li
                    key={msg.id}
                    className={`pl-3 border-l-2 text-xs space-y-1 ${
                      msg.senderRole === 'customer' ? 'border-zinc-700' : msg.channel === 'callback' ? 'border-purple-500/60' : 'border-[#CCFF00]/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-x-3 text-[11px]">
                      <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                        {msg.senderRole === 'customer' ? <UserIcon className="w-3 h-3 text-zinc-500" aria-hidden="true" /> : <ShieldCheck className="w-3 h-3 text-[#CCFF00]" aria-hidden="true" />}
                        {msg.senderName}
                        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{msg.channel}</span>
                      </span>
                      <time dateTime={msg.createdAt} className="text-zinc-500 tabular-nums">{new Date(msg.createdAt).toLocaleString()}</time>
                    </div>
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  </li>
                ))
              ) : (
                <li className="pl-3 border-l-2 border-zinc-700 text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap break-words">
                  {selectedTicket.description}
                </li>
              )}
            </ol>

            {/* INTERNAL NOTES (HIDDEN FROM THE CLIENT) */}
            {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 && (
              <div className="px-4 pb-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-3 h-3" aria-hidden="true" /> Internal notes · not visible to client
                </span>
                {selectedTicket.internalNotes.map(note => (
                  <div key={note.id} className="bg-amber-950/20 border border-amber-800/40 p-2.5 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-amber-300/80">
                      <span>{note.authorName} ({note.authorRole})</span>
                      <time dateTime={note.createdAt}>{new Date(note.createdAt).toLocaleTimeString()}</time>
                    </div>
                    <p className="text-amber-100">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      ) : (
        <div className="flex-1 grid place-items-center text-center text-zinc-500 text-xs">
          Select a ticket from the inbox to see its details.
        </div>
      )}
    </div>
  );
};
