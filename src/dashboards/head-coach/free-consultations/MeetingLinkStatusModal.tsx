import React from 'react';
import { ConsultationBooking } from '../../../types';
import { Calendar, Video, X } from 'lucide-react';

interface MeetingLinkStatusModalProps {
  target: ConsultationBooking;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  meetingLink: string;
  onMeetingLinkChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const MeetingLinkStatusModal: React.FC<MeetingLinkStatusModalProps> = ({
  target: statusTarget,
  scheduledAt,
  onScheduledAtChange,
  meetingLink,
  onMeetingLinkChange,
  status,
  onStatusChange,
  notes,
  onNotesChange,
  onSubmit,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-[#121214] border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 font-bold uppercase">
                FREE DEMO
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                ORDER ID : {statusTarget.id}
              </span>
            </div>
            <h3 className="text-base font-black uppercase text-white flex items-center gap-2">
              <Video className="w-5 h-5 text-[#CCFF00]" />
              EDIT LIVE MEETING LINK & SCHEDULE
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Athlete: <strong className="text-white">{statusTarget.clientName}</strong> ({statusTarget.clientEmail})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 text-xs">
          {/* Scheduled Session Date & Time */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>SCHEDULED SESSION DATE & TIME (UK / GMT)</span>
              <Calendar className="w-3.5 h-3.5 text-[#CCFF00]" />
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => onScheduledAtChange(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#CCFF00] [color-scheme:dark]"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Updating scheduled date & time will notify both client and coach via email.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
              GOOGLE MEET / ZOOM LINK *
            </label>
            <input
              type="url"
              required
              placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom URL"
              value={meetingLink}
              onChange={(e) => onMeetingLinkChange(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              Once saved, this link will be visible to join and will be dispatched to the client and coach via email.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
              DEMO SESSION STATUS
            </label>
            <select
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-[#CCFF00] cursor-pointer"
            >
              <option value="Confirmed">Confirmed (Ready for Demo)</option>
              <option value="Completed">Completed (Demo Conducted)</option>
              <option value="Rescheduled">Rescheduled</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
              INTERNAL COACH NOTES / ATHLETE INSTRUCTIONS
            </label>
            <textarea
              rows={2}
              placeholder="Any prep notes for the call..."
              value={notes}
              onChange={(e) => onNotesChange(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#CCFF00] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black uppercase px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              SAVE & UPDATE SESSION
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
