import React from 'react';
import { Search, X } from 'lucide-react';
import { FilterTab } from './types';

interface PaidBookingsFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filterTab: FilterTab;
  onSelectTab: (tab: FilterTab) => void;
}

export const PaidBookingsFilters: React.FC<PaidBookingsFiltersProps> = ({
  searchTerm,
  onSearchChange,
  filterTab,
  onSelectTab
}) => {
  return (
    <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by client name, email, package, booking ID or assigned coach..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-black/60 border border-gray-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#CCFF00]/60"
        />
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
        {[
          { id: 'all', label: 'ALL' },
          { id: 'active', label: 'ACTIVE' },
          { id: 'scheduled', label: 'SCHEDULED' },
          { id: 'completed', label: 'COMPLETED' },
          { id: 'custom', label: 'CUSTOM PLANS' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id as FilterTab)}
            className={`px-3 py-1.5 text-xs font-mono font-bold uppercase rounded transition-all cursor-pointer whitespace-nowrap ${
              filterTab === tab.id
                ? 'bg-[#CCFF00] text-black shadow-[0_0_10px_rgba(204,255,0,0.3)]'
                : 'bg-black/40 text-gray-400 hover:text-white border border-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};
