import React from 'react';
import { Award, RefreshCw } from 'lucide-react';

interface PaidBookingsHeaderProps {
  isLoading: boolean;
  onRefresh: () => void;
}

export const PaidBookingsHeader: React.FC<PaidBookingsHeaderProps> = ({ isLoading, onRefresh }) => {
  return (
    <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-[#CCFF00]" />
          PAID PACKAGES & 1-ON-1 SESSIONS DESK
        </h2>
      </div>

      <button
        onClick={onRefresh}
        className="flex items-center gap-2 text-xs font-bold text-gray-300 hover:text-white bg-black/50 border border-gray-800 px-3 py-2 rounded-lg cursor-pointer transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#CCFF00]' : ''}`} />
        Refresh Bookings
      </button>
    </div>
  );
};
