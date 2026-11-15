import React from 'react';
import { ConsultationBooking } from '../../../types';
import { formatMeetingUrl } from '../../../services/api';
import {
  Calendar, Phone, Mail, MessageSquare, Video, UserCheck, CheckCircle2,
  ExternalLink, Check, User as UserIcon, Trash2
} from 'lucide-react';

interface ConsultationCardProps {
  item: ConsultationBooking;
  isAdmin: boolean;
  isHeadCoachOrAdmin: boolean;
  isCustomerSupport: boolean;
  onTakeMyself: (item: ConsultationBooking) => void;
  onOpenAssign: (item: ConsultationBooking) => void;
  onOpenStatus: (item: ConsultationBooking) => void;
  onMarkCompleted: (item: ConsultationBooking) => void;
  onDelete: (id: string) => void;
}

export const ConsultationCard: React.FC<ConsultationCardProps> = ({
  item,
  isAdmin,
  isHeadCoachOrAdmin,
  isCustomerSupport,
  onTakeMyself,
  onOpenAssign,
  onOpenStatus,
  onMarkCompleted,
  onDelete
}) => {
  const isAssigned = Boolean(item.assignedCoachName);
  const isTakenByHeadCoach = isAssigned && item.assignedCoachName!.toLowerCase().includes('head coach');
  const isCoachDelegated = isAssigned && !isTakenByHeadCoach;
  const isCompleted = item.status === 'Completed';

  return (
    <div
      className="bg-[#121214] border border-zinc-800 hover:border-zinc-700/80 rounded-2xl p-5 space-y-4 transition-all shadow-md"
    >
      {/* Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3.5 border-b border-zinc-800/80">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
            <UserIcon className="w-5 h-5 text-[#CCFF00]" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-black text-white uppercase tracking-wide">
                {item.clientName}
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                ORDER ID : {item.id}
              </span>

              {/* Status Pills */}
              {isCompleted ? (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Demo Completed
                </span>
              ) : isTakenByHeadCoach ? (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#CCFF00]/15 text-[#CCFF00] border border-[#CCFF00]/40 flex items-center gap-1">
                  👑 Claimed by Head Coach
                </span>
              ) : isCoachDelegated ? (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 flex items-center gap-1">
                  👤 Delegated: {item.assignedCoachName}
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 animate-pulse flex items-center gap-1">
                  ⚡ Pending Assignment
                </span>
              )}
            </div>

            {/* Contact row */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-400 mt-2">
              <a
                href={`mailto:${item.clientEmail}`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-zinc-500" />
                <span>{item.clientEmail}</span>
              </a>

              {item.clientPhone && (
                <a
                  href={`https://wa.me/${item.clientPhone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-[#CCFF00] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{item.clientPhone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Goal Badge */}
        <div className="bg-[#18181b] border border-zinc-800 px-4 py-2.5 rounded-xl text-left lg:text-right">
          <span className="text-[10px] font-bold uppercase text-zinc-500 block">SESSION TYPE</span>
          <span className="text-xs font-black text-[#CCFF00] uppercase block">
            {item.goal && item.goal !== 'Fitness Boxing' ? item.goal : '15-MIN STRATEGY DEMO'} ({item.duration && item.duration !== '20 Min' ? item.duration : '15 MIN'})
          </span>
        </div>
      </div>

      {/* Details Body */}
      <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Client message / notes from form */}
        <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800/90 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[#CCFF00] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#CCFF00]" />
              CLIENT MESSAGE / QUESTION (OPTIONAL FIELD IN FORM):
            </p>
            {item.additionalNotes ? (
              <p className="text-zinc-100 font-medium mt-2 leading-relaxed whitespace-pre-wrap text-xs bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
                "{item.additionalNotes}"
              </p>
            ) : (
              <p className="text-zinc-500 text-xs italic mt-2">
                Client left this field empty during strategy session request.
              </p>
            )}
          </div>
        </div>

        {/* Assignment & Meeting details */}
        <div className="bg-[#18181b] p-4 rounded-xl border border-zinc-800/90 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-zinc-400 block tracking-wider">
              SESSION HANDLED BY:
            </span>
            <p className="text-white font-black text-sm mt-0.5">
              {item.assignedCoachName || 'Unassigned (Waiting for Head Coach decision)'}
            </p>
            {item.notes && (
              <p className="text-zinc-400 text-xs mt-1.5 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/60">
                <strong className="text-zinc-300">Coach Instructions:</strong> {item.notes}
              </p>
            )}
            {item.scheduledAt && (
              <div className="flex items-center gap-1.5 mt-2 text-[#CCFF00] font-bold text-xs bg-[#CCFF00]/10 border border-[#CCFF00]/25 px-2.5 py-1.5 rounded-lg">
                <Calendar className="w-3.5 h-3.5 text-[#CCFF00]" />
                <span>
                  Scheduled: {new Date(item.scheduledAt).toLocaleString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Live Meeting Link display */}
          {item.meetingLink && (
            <div className="mt-3 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-2">
              <a
                href={formatMeetingUrl(item.meetingLink)}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#CCFF00]/10 hover:bg-[#CCFF00]/20 text-[#CCFF00] border border-[#CCFF00]/30 px-3 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>JOIN DEMO VIDEO CALL</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {item.clientPhone && (
                <a
                  href={`https://wa.me/${item.clientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${item.clientName}, your BxStrength Free 15-Min Strategy Session link is ready: ${formatMeetingUrl(item.meetingLink)}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                  title="Share meeting link directly via WhatsApp"
                >
                  <Phone className="w-3 h-3 text-emerald-400" />
                  <span>WhatsApp Link</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="mt-4 pt-3.5 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <span className="text-[11px] text-zinc-500">
          Received: {new Date(item.createdAt).toLocaleString()}
        </span>

        <div className="flex flex-wrap items-center gap-2">

          {/* CASE 1: UNASSIGNED LEAD -> EXACTLY 2 BUTTONS (TAKE MYSELF & ASSIGN TO COACH) */}
          {!isAssigned && isHeadCoachOrAdmin && !isCompleted && (
            <>
              {!isCustomerSupport && (
                <button
                  type="button"
                  onClick={() => onTakeMyself(item)}
                  className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black px-4 py-2 uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>TAKE MYSELF</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onOpenAssign(item)}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black px-4 py-2 uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>ASSIGN TO COACH</span>
              </button>
            </>
          )}

          {/* CASE 2: CLAIMED BY HEAD COACH -> HEAD COACH CAN ADD MEETING LINK, MARK COMPLETED, OR REASSIGN */}
          {isAssigned && isTakenByHeadCoach && isHeadCoachOrAdmin && !isCompleted && (
            <>
              {!isCustomerSupport && (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenStatus(item)}
                    className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black px-4 py-2 uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Video className="w-3.5 h-3.5 text-black" />
                    <span>{item.meetingLink ? 'EDIT MEETING LINK' : 'ADD MEETING LINK'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onMarkCompleted(item)}
                    className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>MARK COMPLETED</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => onOpenAssign(item)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-2 uppercase rounded-xl border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>REASSIGN TO COACH</span>
              </button>
            </>
          )}

          {/* CASE 3: DELEGATED TO ANOTHER COACH -> HEAD COACH SEES REASSIGN BUTTON */}
          {isAssigned && isCoachDelegated && isHeadCoachOrAdmin && !isCompleted && (
            <>
              <button
                type="button"
                onClick={() => onOpenAssign(item)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold px-3 py-2 uppercase rounded-xl border border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
                <span>REASSIGN COACH</span>
              </button>

              {!isCustomerSupport && (
                <button
                  type="button"
                  onClick={() => onOpenStatus(item)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold px-3 py-2 uppercase rounded-xl border border-zinc-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>{item.meetingLink ? 'VIEW / EDIT LINK' : 'ADD LINK'}</span>
                </button>
              )}
            </>
          )}

          {/* CASE 4: SPECIALIST COACH LOGGED IN -> SEES ADD LINK & MARK COMPLETED */}
          {!isHeadCoachOrAdmin && !isCompleted && (
            <>
              <button
                type="button"
                onClick={() => onOpenStatus(item)}
                className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black px-4 py-2 uppercase rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Video className="w-3.5 h-3.5 text-black" />
                <span>{item.meetingLink ? 'EDIT MEETING LINK' : 'ADD MEETING LINK'}</span>
              </button>

              <button
                type="button"
                onClick={() => onMarkCompleted(item)}
                className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>MARK COMPLETED</span>
              </button>
            </>
          )}

          {/* Completed State badge */}
          {isCompleted && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-900/60">
              <CheckCircle2 className="w-4 h-4" /> Demo Session Finalized
            </span>
          )}

          {/* Admin Delete */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer ml-1"
              title="Delete Demo Lead"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};
