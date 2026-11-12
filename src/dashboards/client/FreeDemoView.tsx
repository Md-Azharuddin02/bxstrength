import React, { useState } from 'react';
import { User, ConsultationBooking } from '../../types';
import { 
  Sparkles, Video, Clock, CheckCircle2, ChevronRight, ExternalLink, 
  User as UserIcon, Calendar, Info, Copy, Check, MessageSquare, Award
} from 'lucide-react';
import { decodeHtmlEntities, formatMeetingUrl } from '../../services/api';

interface FreeDemoViewProps {
  user: User;
  consultation?: ConsultationBooking | null;
  onOpenBooking?: () => void;
  onNavigateTab: (tab: string) => void;
}

export const FreeDemoView: React.FC<FreeDemoViewProps> = ({
  user,
  consultation,
  onOpenBooking,
  onNavigateTab
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const isUnclaimed = !consultation || consultation.status === 'Cancelled';
  const isPending = consultation?.status === 'Pending';
  const isAssigned = consultation?.status === 'Assigned';
  const isConfirmed = consultation?.status === 'Confirmed';
  const isCompleted = consultation?.status === 'Completed';

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateStr || 'Recently';
    }
  };

  const handleCopyMeetingLink = (url: string) => {
    const clean = formatMeetingUrl(url);
    if (!clean) return;
    navigator.clipboard.writeText(clean);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const scheduledSlot = consultation?.preferredDate
    ? `${consultation.preferredDate} at ${consultation.preferredTime || 'Agreed Slot'}`
    : consultation?.date
    ? `${consultation.date} at ${consultation.timeSlot}`
    : 'To be arranged by Head Coach';

  const cleanMeetingLink = consultation?.meetingLink ? formatMeetingUrl(consultation.meetingLink) : '';

  return (
    <div className="space-y-6 text-white font-sans">
      {/* STATE 1: UNCLAIMED (Athlete hasn't booked free demo yet - Clean single card) */}
      {isUnclaimed && (
        <div className="bg-[#121215] border border-zinc-800 p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 border border-amber-800/80 rounded uppercase">
                  100% FREE CONSULTATION • 1 PER ATHLETE
                </span>
              </div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                You Haven't Claimed Your Free 15-Min Strategy Session Yet!
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                Kickstart your transformation with a direct 1-on-1 video call. Our Head Coaching team will evaluate your athletic background, discuss injury management, and tailor a personalized fitness strategy for your goals.
              </p>
            </div>
          </div>

          <button
            onClick={onOpenBooking}
            className="bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase px-6 py-3.5 rounded-xl transition-all shadow-xl shadow-amber-500/20 hover:scale-[1.02] flex items-center justify-center gap-2 cursor-pointer shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-black" />
            <span>Claim Free Demo</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STATE 2: ACTIVE IN PROGRESS (Pending, Assigned, Confirmed) */}
      {!isUnclaimed && !isCompleted && consultation && (
        <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                isConfirmed
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : isAssigned
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}>
                {isConfirmed ? (
                  <Video className="w-6 h-6 animate-pulse" />
                ) : (
                  <Clock className="w-6 h-6 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                    isConfirmed
                      ? 'bg-emerald-500 text-black font-mono'
                      : isAssigned
                      ? 'bg-blue-500 text-white font-mono'
                      : 'bg-amber-500 text-black font-mono'
                  }`}>
                    {isConfirmed
                      ? '● SESSION CONFIRMED'
                      : isAssigned
                      ? '● COACH ASSIGNED'
                      : '● PENDING HEAD COACH REVIEW'}
                  </span>
                  <span className="text-[11px] font-mono font-bold text-zinc-400">
                    ORDER ID : {consultation.id}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight mt-1">
                  {isConfirmed
                    ? `Live Strategy Session Ready with Coach ${consultation.assignedCoachName || 'Assigned Coach'}`
                    : isAssigned
                    ? `Coach Assigned: ${consultation.assignedCoachName || 'Assigned Coach'}`
                    : 'Free Demo Application Under Review'}
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 self-start sm:self-auto">
              Applied on: <strong className="text-white">{formatDate(consultation.createdAt)}</strong>
            </span>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Assigned Coach</span>
              <p className="text-white font-bold text-sm truncate">{consultation.assignedCoachName || 'Head Coach Reviewing'}</p>
              {consultation.assignedBy && (
                <span className="text-[10px] text-zinc-400 block">Assigned by: {consultation.assignedBy}</span>
              )}
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Session Type</span>
              <p className="text-white font-bold text-sm truncate">{consultation.goal && consultation.goal !== 'Fitness Boxing' ? decodeHtmlEntities(consultation.goal) : '15-Min Free Strategy Demo'}</p>
              <span className="text-[10px] text-zinc-400 block">Duration: {consultation.duration && consultation.duration !== '20 Min' ? consultation.duration : '15 Minutes'}</span>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Scheduled Slot</span>
              <p className="text-white font-bold text-sm truncate">{scheduledSlot}</p>
              <span className="text-[10px] text-zinc-400 block">1-on-1 Virtual Call</span>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Current Status</span>
              <p className={`font-bold text-sm ${isConfirmed ? 'text-emerald-400' : isAssigned ? 'text-blue-400' : 'text-amber-400'}`}>
                {consultation.status}
              </p>
              <span className="text-[10px] text-zinc-400 block">Single-use benefit</span>
            </div>
          </div>

          {/* Live Video Meeting Room Block */}
          {cleanMeetingLink ? (
            <div className="bg-emerald-950/30 border-2 border-emerald-500/50 p-6 rounded-xl space-y-4 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                      LIVE GOOGLE MEET / VIDEO ROOM READY
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 max-w-xl">
                    Your coach has prepared the live meeting room. Join on time with your camera and microphone enabled.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleCopyMeetingLink(cleanMeetingLink)}
                    className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 rounded-xl text-xs font-bold uppercase transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>

                  <a
                    href={cleanMeetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-[rgba(204,255,0,0.25)] flex items-center gap-2"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Video Call</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-3 border-t border-emerald-900/40 text-xs font-mono text-zinc-400 truncate">
                Direct Room URL: <a href={cleanMeetingLink} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline hover:text-emerald-300">{cleanMeetingLink}</a>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex items-center gap-3 text-xs text-zinc-400">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                {isAssigned
                  ? `Coach ${consultation.assignedCoachName || 'Assigned Coach'} is setting up your Google Meet room. Your link will appear here shortly and will also be sent to ${user.email}.`
                  : 'Our Head Coach is currently matching your athletic profile with the best specialist coach. Your video room link will be generated soon.'}
              </span>
            </div>
          )}

          {/* Notes & Instructions */}
          {(consultation.notes || consultation.additionalNotes) && (
            <div className="space-y-3 pt-4 border-t border-zinc-800">
              {consultation.notes && (
                <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">Coach Notes & Instructions:</span>
                  <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-line">{decodeHtmlEntities(consultation.notes)}</p>
                </div>
              )}
              {consultation.additionalNotes && (
                <div className="bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-800/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-wider block">Your Intake Request Notes:</span>
                  <p className="text-xs text-zinc-400 leading-relaxed">{decodeHtmlEntities(consultation.additionalNotes)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STATE 3: COMPLETED (Session Delivered & Marked Finished by Head Coach) */}
      {isCompleted && consultation && (
        <div className="bg-[#121215] border-2 border-emerald-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-lg">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-mono">
                    DEMO SESSION COMPLETED
                  </span>
                  <span className="text-[11px] font-mono font-bold text-zinc-400">
                    ORDER ID : {consultation.id}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight mt-1">
                  Complimentary 15-Min Strategy Session Completed
                </h3>
              </div>
            </div>

            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 px-3 py-1.5 rounded-lg border border-emerald-800/80 self-start sm:self-auto">
              Completed on: <strong className="text-white">{formatDate(consultation.updatedAt || consultation.createdAt)}</strong>
            </span>
          </div>

          {/* Historical Details Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Applied Date</span>
              <p className="text-white font-bold text-sm truncate">{formatDate(consultation.createdAt)}</p>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">Completed Date</span>
              <p className="text-emerald-400 font-bold text-sm truncate">{formatDate(consultation.updatedAt || consultation.createdAt)}</p>
            </div>
          </div>

          {/* Meeting Room Used Record */}
          {cleanMeetingLink && (
            <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-zinc-500 block">Meeting Room Used:</span>
                <a
                  href={cleanMeetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 font-mono text-xs flex items-center gap-1.5 underline break-all"
                >
                  <Video className="w-3.5 h-3.5 shrink-0" />
                  <span>{cleanMeetingLink}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>

              <button
                type="button"
                onClick={() => handleCopyMeetingLink(cleanMeetingLink)}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy Room Link'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
