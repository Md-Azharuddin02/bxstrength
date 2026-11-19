import React from 'react';
import { ChevronDown } from 'lucide-react';
import { formatTime } from '../utils/grouping';
import type { ChatMessage } from '../types';
import { Avatar, RoleTag } from './SenderBadge';

// Collapsed view: the latest message only, plus the control that opens the full thread.
export const ChatPreview = ({ last, mine, count, controlsId, onOpen, buttonRef }: { last: ChatMessage; mine: boolean; count: number; controlsId: string; onOpen: () => void; buttonRef?: React.Ref<HTMLButtonElement> }) => {
  const name = last.senderName;
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onOpen}
      aria-expanded={false}
      aria-controls={controlsId}
      className="group w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-900/70 focus-visible:bg-zinc-900/70 outline-none transition-colors cursor-pointer"
    >
      <Avatar name={name} role={last.senderRole} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="font-bold text-zinc-300">{mine ? 'You' : name}</span>
          {!mine && <RoleTag role={last.senderRole} />}
          <time dateTime={last.createdAt} title={new Date(last.createdAt).toLocaleString()}>{formatTime(last.createdAt)}</time>
        </div>
        <p className="mt-0.5 text-[13px] text-zinc-400 truncate">{last.text}</p>
      </div>
      <span className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-zinc-800 text-[11px] font-bold text-[#CCFF00] group-hover:border-[#CCFF00]/40 group-focus-visible:border-[#CCFF00]/60 transition-colors">
        <span className="hidden sm:inline">Show conversation</span>
        <span className="sm:hidden">Show</span>
        {count > 1 && <span className="text-zinc-500 font-medium">· {count}</span>}
        <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
    </button>
  );
};
