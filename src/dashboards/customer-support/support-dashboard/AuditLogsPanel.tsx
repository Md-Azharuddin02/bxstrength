import React from 'react';
import { Lock } from 'lucide-react';
import { VelocityAPI } from '../../../services/api';

export const AuditLogsPanel: React.FC = () => {
  return (
    <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl space-y-4">
      <div>
        <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#CCFF00]" /> AUDIT LOGS & PCI-DSS COMPLIANCE
        </h2>
        <p className="text-xs text-zinc-400 mt-1">
          Timestamped audit records of ticket creations, escalations, internal notes, and administrative actions.
        </p>
      </div>

      <div className="space-y-2">
        {VelocityAPI.getAuditLogs().slice(0, 15).map(log => (
          <div key={log.id} className="bg-[#18181b] p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-white uppercase">{log.action}</span>
              <p className="text-zinc-400 text-[11px] mt-0.5">{log.details}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] text-zinc-500 font-mono block">{new Date(log.timestamp).toLocaleString()}</span>
              <span className="text-[10px] text-[#CCFF00] font-bold">{log.userName} ({log.userRole.toUpperCase()})</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
