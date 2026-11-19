import React, { useState } from 'react';
import {
  AlertTriangle, CornerUpRight, Globe, Lock, ShieldCheck, Tag, Trash2,
  User as UserIcon, UserCheck
} from 'lucide-react';
import { SupportTicket, TicketStatus } from '../../../types';
import { TicketChat } from '../../../components/TicketChat/TicketChat';
import { getPriorityBadge, getStatusBadge } from './TicketBadges';
import { RoleView } from './types';
import { ContactPhoneField } from './ContactPhoneField';

interface TicketDetailProps {
  ticket: SupportTicket | null;
  activeRoleView: RoleView;
  /** Signed-in user; the live chat is hidden until it is known. */
  currentUserId?: string;
  onSaveContactNumber: (phone: string) => Promise<boolean>;
  onEscalate: () => void;
  onDelete: (ticket: SupportTicket) => void;
  onUpdateStatus: (status: TicketStatus) => void;
  onTransferToHeadCoach: () => void;
}

// RIGHT WORKSPACE: SELECTED TICKET DETAIL & 360 PROFILE
export const TicketDetail: React.FC<TicketDetailProps> = ({
  ticket: selectedTicket,
  activeRoleView,
  currentUserId,
  onSaveContactNumber,
  onEscalate,
  onDelete,
  onUpdateStatus,
  onTransferToHeadCoach
}) => {
  // While the chat is open it takes over the panel; the other sections are hidden (not unmounted) so drafts survive.
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="lg:col-span-7 bg-[#121214] border border-zinc-800 rounded-2xl p-5 lg:h-[calc(100dvh-11rem)] h-[70dvh] min-h-[420px] overflow-y-auto custom-scrollbar flex flex-col justify-between">

      {selectedTicket ? (
        <div className={chatOpen ? 'flex-1 min-h-0 flex flex-col' : 'space-y-6'}>

          {/* TICKET TOP HEADER & QUICK STATUS ACTIONS */}
          <div hidden={chatOpen} className="bg-[#18181b] border border-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono font-black text-[#CCFF00] bg-black px-3 py-1 rounded-md border border-zinc-800">
                  #{selectedTicket.id}
                </span>
                {getPriorityBadge(selectedTicket.priority)}
                {getStatusBadge(selectedTicket.status)}
              </div>

              {/* REASSIGN & ESCALATE */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onEscalate}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>ESCALATE</span>
                </button>

                {activeRoleView === 'admin' && (
                  <button
                    onClick={() => onDelete(selectedTicket)}
                    className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-all cursor-pointer"
                    title="Delete Ticket"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-base font-black uppercase text-white leading-snug">
                {selectedTicket.subject}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2">
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5 text-[#CCFF00]" /> Category: <strong className="text-white">{selectedTicket.category}</strong></span>
                <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5 text-[#CCFF00]" /> Source: <strong className="text-white">{selectedTicket.source || 'Website Contact Form'}</strong></span>
                <span className="flex items-center gap-1"><UserCheck className="w-3.5 h-3.5 text-[#CCFF00]" /> Agent: <strong className="text-white">{selectedTicket.assignedAgent || 'CS Team'}</strong></span>
              </div>
            </div>

            {/* QUICK STATUS TRANSITION & HEAD COACH TRANSFER BUTTONS */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[10px] font-bold uppercase text-zinc-400 mr-1">Update Status:</span>
              <button onClick={() => onUpdateStatus('in_progress')} className="bg-zinc-900 hover:bg-yellow-500/20 hover:text-yellow-400 text-zinc-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded border border-zinc-800 transition-all cursor-pointer">
                In Progress
              </button>
              <button onClick={() => onUpdateStatus('waiting_customer')} className="bg-zinc-900 hover:bg-orange-500/20 hover:text-orange-400 text-zinc-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded border border-zinc-800 transition-all cursor-pointer">
                Awaiting Client
              </button>
              <button onClick={() => onUpdateStatus('resolved')} className="bg-zinc-900 hover:bg-cyan-500/20 hover:text-cyan-400 text-zinc-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded border border-zinc-800 transition-all cursor-pointer">
                Resolved
              </button>
              <button onClick={() => onUpdateStatus('closed')} className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase px-2.5 py-1 rounded border border-zinc-800 transition-all cursor-pointer">
                Closed
              </button>

              <button
                onClick={onTransferToHeadCoach}
                className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-[10px] font-black uppercase px-3 py-1 rounded border border-amber-700/80 transition-all cursor-pointer flex items-center gap-1 ml-auto shadow-sm"
                title="Directly transfer this coaching/training enquiry to Head Coach Dashboard Enquiries tab"
              >
                <CornerUpRight className="w-3 h-3 text-amber-400" />
                <span>TRANSFER TO HEAD COACH</span>
              </button>
            </div>
          </div>

          {/* 360° CUSTOMER PROFILE & SAFE DATA INTEGRATION SUMMARY */}
          <div hidden={chatOpen} className="bg-[#18181b]/70 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#CCFF00] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#CCFF00]" />
                360° CLIENT PROFILE & SYSTEM DATA
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-zinc-400 text-[11px]">Client Name: <strong className="text-white">{selectedTicket.userName}</strong></p>
                <p className="text-zinc-400 text-[11px]">Email: <a href={`mailto:${selectedTicket.userEmail}`} className="text-white underline">{selectedTicket.userEmail}</a></p>
                <div className="text-zinc-400 text-[11px]">Phone: <ContactPhoneField key={selectedTicket.id} phone={selectedTicket.userPhone} onSave={onSaveContactNumber} /></div>
              </div>
              <div>
                <p className="text-zinc-400 text-[11px]">Linked Service: <strong className="text-white">{selectedTicket.serviceOrProduct || '1-to-1 Digital Session'}</strong></p>
                {selectedTicket.relatedBookingId && (
                  <p className="text-zinc-400 text-[11px]">Booking Code: <span className="text-[#CCFF00] font-mono font-bold">{selectedTicket.relatedBookingId}</span></p>
                )}
                {selectedTicket.relatedTransactionId && (
                  <p className="text-zinc-400 text-[11px]">Txn Reference: <span className="text-purple-400 font-mono font-bold">{selectedTicket.relatedTransactionId}</span></p>
                )}
              </div>
            </div>
          </div>

          {/* CHATBOT CONTEXT SNIPPET (IF ORIGINATED FROM CHATBOT) */}
          {selectedTicket.chatContext?.botConversationSnippet && (
            <div hidden={chatOpen} className="bg-[#18181c] border-l-4 border-[#CCFF00] p-3.5 rounded-r-xl space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00] block">
                🤖 CHATBOT CONVERSATION SNIPPET (ESCALATION CONTEXT)
              </span>
              <pre className="text-[11px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.chatContext.botConversationSnippet}
              </pre>
            </div>
          )}

          {/* ESCALATION HISTORY (IF APPLICABLE) */}
          {selectedTicket.escalationHistory && selectedTicket.escalationHistory.length > 0 && (
            <div hidden={chatOpen} className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl space-y-1 text-xs">
              <span className="text-[10px] font-black uppercase text-red-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> ESCALATION RECORD
              </span>
              {selectedTicket.escalationHistory.map(esc => (
                <div key={esc.id} className="text-zinc-300 text-[11px]">
                  Escalated by <strong className="text-white">{esc.escalatedBy}</strong> to <strong className="text-white">{esc.escalatedTo}</strong>: "{esc.reason}" ({new Date(esc.createdAt).toLocaleTimeString()})
                </div>
              ))}
            </div>
          )}

          {/* LIVE TICKET CHAT (stored in database) */}
          {currentUserId && (
            <TicketChat
              ticketId={selectedTicket.id}
              currentUserId={currentUserId}
              subtitle={`#${selectedTicket.id} · ${selectedTicket.subject} · ${selectedTicket.userName}`}
              onOpenChange={setChatOpen}
            />
          )}

          {/* CONVERSATION HISTORY TIMELINE */}
          <div hidden={chatOpen} className="space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-zinc-400 block">
              COMMUNICATION TIMELINE & LOGS
            </span>

            <div className="space-y-3">
              {selectedTicket.conversationHistory && selectedTicket.conversationHistory.length > 0 ? (
                selectedTicket.conversationHistory.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-xl border space-y-1 text-xs ${
                      msg.senderRole === 'customer'
                        ? 'bg-[#18181b] border-zinc-800 text-zinc-200'
                        : (msg.channel === 'callback' 
                            ? 'bg-purple-950/30 border-purple-800/50 text-purple-200' 
                            : 'bg-[#18181c] border-[#CCFF00]/40 text-white')
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-800/60 pb-1">
                      <span className="font-bold text-white flex items-center gap-1">
                        {msg.senderRole === 'customer' ? <UserIcon className="w-3 h-3 text-zinc-400" /> : <ShieldCheck className="w-3 h-3 text-[#CCFF00]" />}
                        {msg.senderName} ({msg.channel.toUpperCase()})
                      </span>
                      <span className="font-mono text-zinc-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed pt-1 whitespace-pre-wrap">{msg.text}</p>
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-[#18181b] border border-zinc-800 text-xs text-zinc-300">
                  {selectedTicket.description}
                </div>
              )}

              {/* INTERNAL NOTES (STRICTLY HIDDEN FROM CUSTOMER) */}
              {selectedTicket.internalNotes && selectedTicket.internalNotes.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                  <span className="text-[10px] font-black uppercase text-amber-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" /> INTERNAL TEAM NOTES (CUSTOMER-HIDDEN)
                  </span>
                  {selectedTicket.internalNotes.map(note => (
                    <div key={note.id} className="bg-amber-950/20 border border-amber-800/40 p-2.5 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-amber-300/80">
                        <span>Author: {note.authorName} ({note.authorRole})</span>
                        <span>{new Date(note.createdAt).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-amber-100 text-xs">{note.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        <div className="py-32 text-center text-zinc-500 text-xs">
          Select a support ticket from the inbox to open the 360° workspace.
        </div>
      )}
    </div>
  );
};
