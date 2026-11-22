import React from 'react';
import { ConsultationBooking } from '../../../types';
import { Calendar, Video, X } from 'lucide-react';
import { SpecialistCoach } from './types';
import { Select } from '../../../components/ui/Select';

interface AssignCoachModalProps {
  target: ConsultationBooking;
  coaches: SpecialistCoach[];
  selectedCoachId: string;
  onCoachChange: (coachId: string) => void;
  scheduledAt: string;
  onScheduledAtChange: (value: string) => void;
  meetingLink: string;
  onMeetingLinkChange: (value: string) => void;
  notes: string;
  onNotesChange: (value: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const AssignCoachModal: React.FC<AssignCoachModalProps> = ({
  target: assignTarget,
  coaches: availableSpecialistCoaches,
  selectedCoachId,
  onCoachChange,
  scheduledAt,
  onScheduledAtChange,
  meetingLink,
  onMeetingLinkChange,
  notes,
  onNotesChange,
  isSubmitting,
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
                FREE 15-MIN DEMO
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                ORDER ID : {assignTarget.id}
              </span>
            </div>
            <h3 className="text-base font-black uppercase text-white">
              ASSIGN SPECIALIST COACH & VIDEO LINK
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Client: <strong className="text-white">{assignTarget.clientName}</strong> ({assignTarget.clientEmail})
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
          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
              SELECT SPECIALIST COACH * ({availableSpecialistCoaches.length} found in database)
            </label>
            {availableSpecialistCoaches.length === 0 ? (
              <div className="bg-amber-950/40 border border-amber-800/80 rounded-xl p-3.5 text-amber-300 text-xs leading-relaxed">
                No specialist coaches with role <strong>coach</strong> are currently registered in your database. Head Coach can take this demo session directly using the <strong>TAKE MYSELF</strong> button.
              </div>
            ) : (
              <>
                <Select
                  value={selectedCoachId}
                  onChange={(e) => onCoachChange(e.target.value)}
                  required
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-[#CCFF00] cursor-pointer"
                >
                  {availableSpecialistCoaches.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email}) {c.position ? `— ${c.position}` : ''}
                    </option>
                  ))}
                </Select>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Staff coaches from your team directory appear here.
                </p>
              </>
            )}
          </div>

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
              Scheduled date & time will be included in confirmation emails dispatched to both client and coach.
            </p>
          </div>

          {/* Live Video Meeting URL */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5 flex items-center justify-between">
              <span>LIVE VIDEO MEETING URL (GOOGLE MEET / ZOOM)</span>
              <Video className="w-3.5 h-3.5 text-[#CCFF00]" />
            </label>
            <input
              type="url"
              placeholder="https://meet.google.com/xxx-xxxx-xxx or Zoom URL"
              value={meetingLink}
              onChange={(e) => onMeetingLinkChange(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
            />
            <p className="text-[10px] text-zinc-500 mt-1">
              This meeting link will be emailed to both client and coach upon assignment.
            </p>
          </div>

          {/* Instructions / Notes */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1.5">
              COACHING NOTES / INSTRUCTIONS FOR ATHLETE (OPTIONAL)
            </label>
            <textarea
              rows={3}
              placeholder="Notes on client focus, warmup emphasis, fitness background, or session instructions..."
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
              disabled={isSubmitting || availableSpecialistCoaches.length === 0}
              className="bg-[#CCFF00] disabled:bg-zinc-800 disabled:text-zinc-500 hover:bg-[#b8e600] text-black font-black uppercase px-5 py-2.5 rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              {isSubmitting ? 'CONFIRMING...' : 'CONFIRM & SAVE ASSIGNMENT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
