import React from 'react';
import { ConsultationStats, FilterTab } from './types';

interface ConsultationStatsCardsProps {
  stats: ConsultationStats;
  filterTab: FilterTab;
  isHeadCoachOrAdmin: boolean;
  onSelectTab: (tab: FilterTab) => void;
}

export const ConsultationStatsCards: React.FC<ConsultationStatsCardsProps> = ({
  stats,
  filterTab,
  isHeadCoachOrAdmin,
  onSelectTab
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div
        onClick={() => onSelectTab('all')}
        className={`p-4 rounded-xl border cursor-pointer transition-all ${
          filterTab === 'all' ? 'bg-[#18181b] border-[#CCFF00]/60 shadow-md ring-1 ring-[#CCFF00]/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <span className="text-[10px] font-black uppercase text-zinc-400 block tracking-wider">ALL DEMOS</span>
        <span className="text-2xl font-black text-white mt-1 block">{stats.total}</span>
        <span className="text-[9px] text-zinc-500 uppercase font-semibold">Total submissions</span>
      </div>

      <div
        onClick={() => onSelectTab('pending')}
        className={`p-4 rounded-xl border cursor-pointer transition-all ${
          filterTab === 'pending' ? 'bg-[#18181b] border-amber-500/60 shadow-md ring-1 ring-amber-500/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">PENDING ACTION</span>
        <span className="text-2xl font-black text-amber-300 mt-1 block">{stats.pending}</span>
        <span className="text-[9px] text-amber-400/80 uppercase font-semibold">Needs assignment</span>
      </div>

      {isHeadCoachOrAdmin && (
        <div
          onClick={() => onSelectTab('headcoach')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterTab === 'headcoach' ? 'bg-[#18181b] border-[#CCFF00]/60 shadow-md ring-1 ring-[#CCFF00]/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-[#CCFF00] block tracking-wider">TAKEN BY HEAD COACH</span>
          <span className="text-2xl font-black text-[#CCFF00] mt-1 block">{stats.takenByHeadCoach}</span>
          <span className="text-[9px] text-[#CCFF00]/80 uppercase font-semibold">My direct sessions</span>
        </div>
      )}

      {isHeadCoachOrAdmin && (
        <div
          onClick={() => onSelectTab('coaches')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            filterTab === 'coaches' ? 'bg-[#18181b] border-blue-500/60 shadow-md ring-1 ring-blue-500/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-blue-400 block tracking-wider">COACH DELEGATED</span>
          <span className="text-2xl font-black text-blue-300 mt-1 block">{stats.assignedToCoaches}</span>
          <span className="text-[9px] text-blue-400/80 uppercase font-semibold">Handled by team</span>
        </div>
      )}

      <div
        onClick={() => onSelectTab('completed')}
        className={`p-4 rounded-xl border cursor-pointer transition-all ${
          filterTab === 'completed' ? 'bg-[#18181b] border-emerald-500/60 shadow-md ring-1 ring-emerald-500/40' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
        }`}
      >
        <span className="text-[10px] font-black uppercase text-emerald-400 block tracking-wider">COMPLETED</span>
        <span className="text-2xl font-black text-emerald-300 mt-1 block">{stats.completed}</span>
        <span className="text-[9px] text-emerald-400/80 uppercase font-semibold">Finished demos</span>
      </div>
    </div>
  );
};
