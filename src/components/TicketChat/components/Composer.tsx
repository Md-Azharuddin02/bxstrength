import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { MAX_MESSAGE_LENGTH } from '../types';

const MAX_HEIGHT_PX = 128;

// Memoised: typing re-renders only the composer, and chat polls do not re-render it.
export const Composer = React.memo(({ onSend }: { onSend: (text: string) => void }) => {
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const remaining = MAX_MESSAGE_LENGTH - text.length;

  // Grow with the content up to a cap, then scroll inside the box.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
    // Hide the scrollbar until the box hits its cap.
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT_PX ? 'auto' : 'hidden';
  }, [text]);

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    onSend(body);
    setText('');
    ref.current?.focus();
  };

  return (
    <form onSubmit={e => { e.preventDefault(); submit(); }} className="border-t border-zinc-800 p-3">
      <div className="flex items-end gap-1 bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600 rounded-2xl pl-3.5 pr-1.5 py-1.5 transition-colors">
        <label htmlFor={id} className="sr-only">Message</label>
        <textarea
          id={id}
          ref={ref}
          rows={1}
          value={text}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            // Enter sends, Shift+Enter breaks the line; ignore Enter while an IME is composing.
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Write a message…"
          className="flex-1 min-w-0 resize-none overflow-hidden bg-transparent text-white text-[13px] leading-relaxed py-[5px] outline-none placeholder-zinc-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send message"
          className="h-8 w-8 shrink-0 grid place-items-center rounded-xl bg-[#CCFF00] text-black hover:bg-[#d8ff4d] disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <SendHorizontal className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
});
