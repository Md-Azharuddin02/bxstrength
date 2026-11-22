import React from 'react';
import { Award, RefreshCw } from 'lucide-react';

interface ConsultationsHeaderProps {
  isCustomerSupport: boolean;
  isHeadCoachOrAdmin: boolean;
  leadCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export const ConsultationsHeader: React.FC<ConsultationsHeaderProps> = ({
  isCustomerSupport,
  isHeadCoachOrAdmin,
  leadCount,
  isLoading,
  onRefresh
}) => {
  return (
    <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#CCFF00]/10 text-[#CCFF00] rounded border border-[#CCFF00]/30">
            {isCustomerSupport
              ? 'CUSTOMER SUPPORT • FREE DEMO ENQUIRIES'
              : isHeadCoachOrAdmin
              ? 'HEAD COACH PIPELINE • SEPARATE DEMO ENQUIRIES'
              : 'COACH WORKSPACE • MY ASSIGNED DEMOS'}
          </span>
          <span className="text-[10px] font-mono text-zinc-400">
            {leadCount} Leads in this view
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1.5 flex items-center gap-2.5">
          <Award className="w-6 h-6 text-[#CCFF00]" />
          {isHeadCoachOrAdmin ? 'FREE DEMO & 15-MIN CONSULTATION ENQUIRIES' : 'MY ASSIGNED FREE DEMO CALLS'}
        </h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
          {isCustomerSupport
            ? 'Real-time pipeline for "Request My Free 15-Min Demo" submissions. Review lead details and click "ASSIGN TO COACH" to delegate.'
            : isHeadCoachOrAdmin
            ? 'Real-time pipeline for "Request My Free 15-Min Demo" submissions. Click "TAKE MYSELF" to conduct the session yourself, or "ASSIGN TO COACH" to delegate.'
            : 'Free strategy calls and demo sessions delegated to you by the Head Coach. Provide your video call link and mark as completed.'}
        </p>
      </div>

      <button
        onClick={onRefresh}
        className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase px-4 py-2.5 rounded-xl border border-zinc-700 flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto"
      >
        <RefreshCw className={`w-4 h-4 text-[#CCFF00] ${isLoading ? 'animate-spin' : ''}`} />
        <span>REFRESH LEADS</span>
      </button>
    </div>
  );
};
