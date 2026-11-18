import React from 'react';
import { PaidPackageBooking } from '../../../types';
import { AlertCircle, CheckCircle2, Layers, Lock, RotateCcw } from 'lucide-react';

interface SessionDeliveryTrackerProps {
  booking: PaidPackageBooking;
  isCustomerSupport: boolean;
  onQuickSessionUpdate: (b: PaidPackageBooking, action: 'increment' | 'decrement') => void;
}

export const SessionDeliveryTracker: React.FC<SessionDeliveryTrackerProps> = ({
  booking: b,
  isCustomerSupport,
  onQuickSessionUpdate
}) => {
  const totalSess = b.totalSessions || 1;
  const completedSess = b.completedSessions || 0;
  const remainingSess = Math.max(0, totalSess - completedSess);
  const progressPercent = Math.min(100, Math.round((completedSess / totalSess) * 100));
  const isAssigned = Boolean(
    b.assignedCoachName &&
    b.assignedCoachName.trim() &&
    b.assignedCoachName.toLowerCase() !== 'unassigned'
  );

  return (
    <div className="bg-black/70 border border-zinc-800 p-4 rounded-xl space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <Layers className="w-4 h-4 text-[#CCFF00]" />
            <span className="text-xs font-black uppercase text-white tracking-wider">
              Session Delivery & Attendance Tracking
            </span>
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
              completedSess >= totalSess
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                : completedSess > 0
                ? 'bg-sky-950/80 text-sky-400 border-sky-800'
                : 'bg-amber-950/80 text-amber-400 border-amber-800'
            }`}>
              {completedSess >= totalSess
                ? '✓ All Sessions Delivered (Package Completed)'
                : completedSess > 0
                ? `In Progress (${remainingSess} remaining)`
                : `Pending First Session (${totalSess} to conduct)`}
            </span>
          </div>
          <p className="text-[11px] text-zinc-400 mt-1">
            Track live 1-on-1 coaching sessions completed with the client. When a session is held, record it below to update the client's balance.
          </p>
        </div>

        {/* Action buttons - Hidden for Customer Support (Only coaches deliver & record sessions) */}
        {!isCustomerSupport && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start sm:self-auto shrink-0">
            {!isAssigned ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="px-3 py-1.5 bg-zinc-900/90 text-zinc-500 border border-zinc-700/60 font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-not-allowed opacity-60 select-none"
                  title="Assign a coach or click 'Take Myself' before recording sessions"
                >
                  <Lock className="w-3.5 h-3.5 text-zinc-500" />
                  Record Session {completedSess + 1} Done (Locked)
                </button>
                <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
                  <AlertCircle className="w-3 h-3" /> Assign coach first
                </span>
              </div>
            ) : completedSess < totalSess ? (
              <button
                type="button"
                onClick={() => onQuickSessionUpdate(b, 'increment')}
                className="px-3 py-1.5 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(204,255,0,0.25)] transition-all"
                title="Record that a coaching session has been completed"
              >
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                Record Session {completedSess + 1} Done
              </button>
            ) : (
              <span className="px-3 py-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-black uppercase rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Package Fulfilled
              </span>
            )}

            {completedSess > 0 && isAssigned && (
              <button
                type="button"
                onClick={() => onQuickSessionUpdate(b, 'decrement')}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Revert last session if recorded by mistake"
              >
                <RotateCcw className="w-3 h-3" />
                Undo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress visual bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono text-zinc-400">
          <span>Conducted: <strong className="text-white">{completedSess} of {totalSess} Sessions</strong></span>
          <span>{progressPercent}% Delivered</span>
        </div>
        <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#CCFF00] to-emerald-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
