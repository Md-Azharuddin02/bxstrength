import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { PendingMessage } from '../types';
import { bubbleBase, mineBubble } from './bubbleStyles';

export const PendingGroup = ({ pending, onRetry, onDiscard }: { pending: PendingMessage[]; onRetry: (id: string) => void; onDiscard: (id: string) => void }) => (
  <div className="flex flex-col items-end gap-0.5">
    {pending.map(p => (
      <div key={p.tempId} className="flex flex-col items-end gap-0.5 max-w-[78%]">
        <p className={`${bubbleBase} ${mineBubble} ${p.status === 'sending' ? 'opacity-60' : 'ring-1 ring-red-500/70'}`}>{p.text}</p>
        {p.status === 'failed' && (
          <span className="flex items-center gap-2 text-[10px] text-red-400">
            <AlertCircle className="w-3 h-3" aria-hidden="true" /> Not delivered
            <button type="button" onClick={() => onRetry(p.tempId)} className="font-bold underline cursor-pointer">Retry</button>
            <button type="button" onClick={() => onDiscard(p.tempId)} className="text-zinc-500 underline cursor-pointer">Remove</button>
          </span>
        )}
      </div>
    ))}
  </div>
);
