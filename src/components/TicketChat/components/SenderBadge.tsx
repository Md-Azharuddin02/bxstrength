import React from 'react';
import { initials } from '../utils/grouping';
import type { ChatMessage } from '../types';

type Role = ChatMessage['senderRole'];

export const RoleTag = ({ role }: { role: Role }) => (
  <span className={`px-1.5 py-px rounded text-[9px] font-black uppercase tracking-wider ${role === 'agent' ? 'bg-[#CCFF00]/10 text-[#CCFF00]' : 'bg-zinc-800 text-zinc-400'}`}>
    {role === 'agent' ? 'Support' : 'Client'}
  </span>
);

export const Avatar = ({ name, role }: { name: string; role: Role }) => (
  <div
    aria-hidden="true"
    className={`w-8 h-8 shrink-0 rounded-full grid place-items-center text-[11px] font-black ${role === 'agent' ? 'bg-[#CCFF00]/15 text-[#CCFF00]' : 'bg-zinc-800 text-zinc-300'}`}
  >
    {initials(name)}
  </div>
);
