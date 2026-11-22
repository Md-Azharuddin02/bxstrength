// Loading, empty and error views for the message list.
import React from 'react';
import { AlertCircle, MessageSquareText, RefreshCw } from 'lucide-react';

export const ChatSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading messages">
    {[60, 40, 70].map((w, i) => (
      <div key={i} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`}>
        <div className="h-9 rounded-2xl bg-zinc-800/80 animate-pulse" style={{ width: `${w}%` }} />
      </div>
    ))}
  </div>
);

export const ChatEmpty = () => (
  <div role="status" className="h-full flex flex-col items-center justify-center text-center gap-2 px-6">
    <MessageSquareText className="w-8 h-8 text-zinc-600" aria-hidden="true" />
    <p className="text-sm font-bold text-zinc-300">No messages yet</p>
    <p className="text-xs text-zinc-500 max-w-xs">Send a message below. Replies appear here automatically.</p>
  </div>
);

export const ChatError = ({ onRetry }: { onRetry: () => void }) => (
  <div role="alert" className="h-full flex flex-col items-center justify-center text-center gap-3 px-6">
    <AlertCircle className="w-8 h-8 text-red-400" aria-hidden="true" />
    <p className="text-sm font-bold text-zinc-300">Couldn't load this conversation</p>
    <button type="button" onClick={onRetry} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs font-bold text-white hover:bg-zinc-800 cursor-pointer">
      <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Try again
    </button>
  </div>
);
