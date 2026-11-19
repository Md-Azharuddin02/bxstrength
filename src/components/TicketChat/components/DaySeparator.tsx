import React from 'react';

export const DaySeparator = ({ label }: { label: string }) => (
  <div role="separator" aria-label={label} className="flex justify-center">
    <span className="px-2.5 py-0.5 rounded-full bg-zinc-800/70 text-[10px] font-semibold text-zinc-400">{label}</span>
  </div>
);
