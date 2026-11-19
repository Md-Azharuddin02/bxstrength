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
  }, [text]);

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    onSend(body);
    setText('');
    ref.current?.focus();
  };

  return (
    <form onSubmit={e => { e.preventDefault(); submit(); }} className="border-t border-zinc-800 bg-[#121214] p-3">
      <div className="flex items-end gap-2">
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
          className="flex-1 min-w-0 resize-none bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white text-[13px] leading-relaxed px-3.5 py-2.5 rounded-xl outline-none placeholder-zinc-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Send message"
          className="h-10 w-10 shrink-0 grid place-items-center rounded-xl bg-[#CCFF00] text-black hover:bg-[#d8ff4d] disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          <SendHorizontal className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-zinc-500">
        <span className="hidden sm:inline">Enter to send · Shift + Enter for a new line</span>
        {remaining <= 200 && <span className={`ml-auto ${remaining <= 50 ? 'text-amber-400' : ''}`}>{remaining} characters left</span>}
      </div>
    </form>
  );
});
