import React from 'react';
import { Award } from 'lucide-react';
import { FilterTab } from './types';

interface ConsultationsEmptyStateProps {
  filterTab: FilterTab;
}

export const ConsultationsEmptyState: React.FC<ConsultationsEmptyStateProps> = ({ filterTab }) => {
  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-12 text-center space-y-4">
      <Award className="w-12 h-12 text-zinc-600 mx-auto" />
      <div>
        <h3 className="text-base font-black uppercase text-white tracking-wide">
          NO FREE DEMO ENQUIRIES FOUND
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
          {filterTab === 'pending'
            ? 'All free demo strategy calls have been claimed or delegated!'
            : filterTab === 'headcoach'
            ? 'No active demo sessions currently claimed by Head Coach.'
            : filterTab === 'coaches'
            ? 'No demo sessions currently delegated to specialist coaches.'
            : 'When clients submit the 15-Min Free Demo form on the website, their enquiries will appear right here in real-time.'}
        </p>
      </div>
    </div>
  );
};
