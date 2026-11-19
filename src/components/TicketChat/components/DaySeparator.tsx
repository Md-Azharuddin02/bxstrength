import React from 'react';

export const DaySeparator = ({ label }: { label: string }) => (
  <div role="separator" className="flex items-center gap-3 py-1">
    <div className="h-px flex-1 bg-zinc-800" />
    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
    <div className="h-px flex-1 bg-zinc-800" />
  </div>
);
