import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface EscalateTicketModalProps {
  ticketId?: string;
  target: string;
  onTargetChange: (value: string) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const EscalateTicketModal: React.FC<EscalateTicketModalProps> = ({
  ticketId,
  target,
  onTargetChange,
  reason,
  onReasonChange,
  onClose,
  onConfirm
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
      <div className="bg-[#18181b] border-0 sm:border border-red-500/40 w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md p-4 sm:p-6 rounded-none sm:rounded-2xl space-y-4 shadow-2xl animate-in zoom-in-95 overflow-y-auto flex flex-col justify-center">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-sm font-black uppercase text-red-400 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> ESCALATE TICKET #{ticketId}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Escalate To Agent/Role:</label>
            <select
              value={target}
              onChange={(e) => onTargetChange(e.target.value)}
              className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-red-400"
            >
              <option value="Company Agent">Senior Company Agent</option>
              <option value="Admin">Executive Admin Team</option>
              <option value="Shaban Faridi">Shaban Faridi (Head Coach)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Reason for Escalation:</label>
            <textarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Explain why this ticket requires urgent senior escalation..."
              rows={3}
              className="w-full bg-[#121214] border border-zinc-800 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-red-400"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-lg hover:bg-zinc-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase rounded-lg shadow cursor-pointer"
          >
            CONFIRM ESCALATION
          </button>
        </div>
      </div>
    </div>
  );
};
