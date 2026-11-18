import React from 'react';
import { PaidPackageBooking, User } from '../../../types';
import { decodeHtmlEntities } from '../../../services/core/mappers';
import { Calendar, Clock, Layers, UserCheck, Video, X } from 'lucide-react';
import { AvailableCoach } from './types';

interface AssignCoachModalProps {
  target: PaidPackageBooking;
  user: User;
  isCustomerSupport: boolean;
  availableCoaches: AvailableCoach[];
  selectedCoachId: string;
  setSelectedCoachId: (v: string) => void;
  setSelectedCoachName: (v: string) => void;
  isReassigning: boolean;
  setIsReassigning: (v: boolean) => void;
  scheduledAt: string;
  setScheduledAt: (v: string) => void;
  meetingLink: string;
  setMeetingLink: (v: string) => void;
  coachNotes: string;
  setCoachNotes: (v: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export const AssignCoachModal: React.FC<AssignCoachModalProps> = ({
  target: assignTarget,
  user,
  isCustomerSupport,
  availableCoaches,
  selectedCoachId,
  setSelectedCoachId,
  setSelectedCoachName,
  isReassigning,
  setIsReassigning,
  scheduledAt,
  setScheduledAt,
  meetingLink,
  setMeetingLink,
  coachNotes,
  setCoachNotes,
  isSubmitting: isSubmittingAssign,
  onSubmit,
  onClose
}) => {
  const hasAssignedCoach = Boolean(
    assignTarget.assignedCoachId &&
    assignTarget.assignedCoachName &&
    assignTarget.assignedCoachName.toLowerCase() !== 'unassigned'
  );
  const isAssignedToMe = !isCustomerSupport && hasAssignedCoach && (
    (assignTarget.assignedCoachId === user.id) ||
    (selectedCoachId === user.id && !isReassigning)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111111] border border-gray-800 rounded-xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 font-bold uppercase">
              {assignTarget.packageType}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
              ORDER ID : {assignTarget.orderId || assignTarget.id}
            </span>
          </div>
          <h3 className="text-lg font-black uppercase text-white mt-1">
            {isAssignedToMe && !isReassigning ? 'Edit Live Meeting Link & Coaching Notes' : 'Assign Specialist Coach & Video Link'}
          </h3>
          <p className="text-xs text-gray-400">
            Package: <strong className="text-white">{decodeHtmlEntities(assignTarget.packageName)}</strong> • Client: <strong className="text-white">{assignTarget.clientName}</strong>
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* When already assigned to me */}
          {isAssignedToMe && !isReassigning ? (
            <div className="bg-emerald-950/30 border border-emerald-800/60 p-3.5 rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#CCFF00]/15 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00] font-black text-xs shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">
                    Assigned Coach: <span className="text-[#CCFF00]">{user.name} (You)</span>
                  </p>
                  <p className="text-[10px] text-zinc-400">
                    Enter your Google Meet or Zoom link below to connect with {assignTarget.clientName}.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsReassigning(true);
                  const otherCoach = availableCoaches.find(c => c.id !== user.id);
                  if (otherCoach) {
                    setSelectedCoachId(otherCoach.id);
                    setSelectedCoachName(otherCoach.name);
                  }
                }}
                className="text-[11px] font-bold text-zinc-400 hover:text-white underline cursor-pointer shrink-0"
              >
                Reassign Coach?
              </button>
            </div>
          ) : (
            /* Coach selection / reassignment mode */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-300 uppercase">
                  Select Coach Assignment
                </label>
                {!isCustomerSupport && assignTarget.assignedCoachId === user.id && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCoachId(user.id);
                      setSelectedCoachName(user.name);
                      setIsReassigning(false);
                    }}
                    className="text-[11px] font-bold text-[#CCFF00] hover:underline cursor-pointer"
                  >
                    Keep assigned to me
                  </button>
                )}
              </div>

              {!isCustomerSupport && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCoachId(user.id);
                      setSelectedCoachName(user.name);
                      setIsReassigning(false);
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      selectedCoachId === user.id && !isReassigning
                        ? 'bg-[#CCFF00]/15 border-[#CCFF00] text-white shadow-[0_0_12px_rgba(204,255,0,0.2)]'
                        : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-[#CCFF00]" /> Coach Myself
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{user.name}</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsReassigning(true);
                      if (selectedCoachId === user.id) {
                        const firstOther = availableCoaches.find(c => c.id !== user.id);
                        if (firstOther) {
                          setSelectedCoachId(firstOther.id);
                          setSelectedCoachName(firstOther.name);
                        }
                      }
                    }}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isReassigning
                        ? 'bg-[#CCFF00]/15 border-[#CCFF00] text-white shadow-[0_0_12px_rgba(204,255,0,0.2)]'
                        : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold uppercase flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#CCFF00]" /> Delegate Coach
                    </p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Assign to team member</p>
                  </button>
                </div>
              )}

              {(isCustomerSupport || isReassigning || selectedCoachId !== user.id) && (
                <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                  <label className="block text-[11px] font-bold text-gray-400 uppercase">
                    Select Specialist Coach from Staff Directory <span className="text-red-400">*</span>:
                  </label>
                  <select
                    value={selectedCoachId}
                    onChange={(e) => {
                      const found = availableCoaches.find(c => c.id === e.target.value);
                      setSelectedCoachId(e.target.value);
                      setSelectedCoachName(found ? found.name : '');
                    }}
                    required
                    className="w-full bg-black/80 border border-gray-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
                  >
                    <option value="">-- Choose Coach from Staff Directory --</option>
                    {availableCoaches
                      .filter(c => !c.position.toLowerCase().includes('support'))
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — {c.position}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center justify-between">
              <span>Scheduled Session Date & Time (UK / GMT)</span>
              <Calendar className="w-3.5 h-3.5 text-[#CCFF00]" />
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full bg-black/80 border border-gray-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-[#CCFF00]"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Scheduled date & time will be included in the confirmation email dispatched to both client and coach.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1 flex items-center justify-between">
              <span>Live Video Meeting URL (Google Meet / Zoom)</span>
              <Video className="w-3.5 h-3.5 text-[#CCFF00]" />
            </label>
            <input
              type="url"
              placeholder="https://meet.google.com/xyz-abcd-efg"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full bg-black/80 border border-gray-800 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00]"
            />
            <p className="text-[10px] text-gray-500 mt-1">
              This link is instantly visible on the client's dashboard under MY BOOKINGS.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Coaching Notes / Instructions for Athlete (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Notes on client focus, warmup emphasis, injury considerations, or session instructions..."
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              className="w-full bg-black/80 border border-gray-800 rounded-lg p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#CCFF00]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-bold uppercase rounded-lg text-gray-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingAssign}
              className="px-5 py-2 bg-[#CCFF00] hover:bg-[#b8e600] disabled:opacity-50 text-xs font-black uppercase tracking-wider rounded-lg text-black flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-all"
            >
              {isSubmittingAssign ? (
                <>
                  <Clock className="w-3.5 h-3.5 animate-spin" /> Saving...
                </>
              ) : isAssignedToMe && !isReassigning ? (
                'Save Meeting Link & Notes'
              ) : (
                'Confirm & Save Assignment'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
