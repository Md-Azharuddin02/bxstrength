import React from 'react';
import { PaidBookingMetrics } from './types';

interface PaidBookingsMetricsProps {
  metrics: PaidBookingMetrics;
  isCustomerSupport: boolean;
}

export const PaidBookingsMetrics: React.FC<PaidBookingsMetricsProps> = ({ metrics, isCustomerSupport }) => {
  return (
    <div className={`grid grid-cols-2 ${isCustomerSupport ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
      <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg">
        <p className="text-[11px] font-mono text-gray-400 uppercase">Total Paid Bookings</p>
        <p className="text-2xl font-black text-white mt-1">{metrics.total}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">{metrics.active} active / scheduled</p>
      </div>

      {!isCustomerSupport && (
        <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg">
          <p className="text-[11px] font-mono text-gray-400 uppercase">Total Revenue</p>
          <p className="text-2xl font-black text-[#CCFF00] mt-1">£{metrics.totalRevenue.toLocaleString()}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">Verified package payments</p>
        </div>
      )}

      <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg">
        <p className="text-[11px] font-mono text-gray-400 uppercase">Session Delivery</p>
        <p className="text-2xl font-black text-white mt-1">{metrics.completedSessions} / {metrics.totalSessions}</p>
        <p className="text-[10px] text-emerald-400 mt-0.5">
          {metrics.totalSessions > 0 ? Math.round((metrics.completedSessions / metrics.totalSessions) * 100) : 0}% completed
        </p>
      </div>

      <div className="bg-[#111111] border border-gray-800 p-4 rounded-lg">
        <p className="text-[11px] font-mono text-gray-400 uppercase">Completed Packages</p>
        <p className="text-2xl font-black text-emerald-400 mt-1">{metrics.completed}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">All sessions fulfilled</p>
      </div>
    </div>
  );
};
