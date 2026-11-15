import React from 'react';
import { Search } from 'lucide-react';
import { FilterTab } from './types';

interface ConsultationFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterTab: FilterTab;
  onSelectTab: (tab: FilterTab) => void;
  isHeadCoachOrAdmin: boolean;
}

export const ConsultationFilters: React.FC<ConsultationFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterTab,
  onSelectTab,
  isHeadCoachOrAdmin
}) => {
  return (
    <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="relative w-full md:w-96">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by client, email, ref, phone, goal, coach..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-[#18181b] border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00]"
        />
      </div>

      {/* Filter Tab Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
        <span className="text-[10px] font-bold text-zinc-500 uppercase mr-1">FILTER:</span>
        {(['all', 'pending', 'headcoach', 'coaches', 'completed'] as const).map(tab => {
          if (!isHeadCoachOrAdmin && (tab === 'headcoach' || tab === 'coaches')) return null;
          const labels: Record<string, string> = {
            all: 'ALL',
            pending: 'PENDING',
            headcoach: 'HEAD COACH',
            coaches: 'COACHES',
            completed: 'COMPLETED'
          };
          return (
            <button
              key={tab}
              onClick={() => onSelectTab(tab)}
              className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all cursor-pointer ${
                filterTab === tab
                  ? 'bg-white text-black font-black shadow-sm'
                  : 'bg-[#18181b] text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
};
