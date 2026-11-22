import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, MessageSquareText } from 'lucide-react';
import { useTicketMessages } from './hooks/useTicketMessages';
import { buildChatItems } from './utils/grouping';
import { ChatPreview } from './components/ChatPreview';
import { ChatEmpty, ChatError, ChatSkeleton } from './components/ChatStates';
import { Composer } from './components/Composer';
import { DaySeparator } from './components/DaySeparator';
import { MessageGroup } from './components/MessageGroup';
import { PendingGroup } from './components/PendingGroup';

interface TicketChatProps {
  ticketId: string;
  currentUserId: string;
  /** Shown in the header so the thread keeps its context when the page hides everything else. */
  subtitle?: string;
  /** Lets the page hide the other ticket sections while the full thread is open. */
  onOpenChange?: (open: boolean) => void;
  /** Change this number (e.g. Date.now()) to open the thread, such as when a notification is clicked. */
  openRequest?: number;
}

// Distance from the bottom (px) within which new messages auto-scroll into view.
const STICKY_THRESHOLD = 80;
const OPEN_POLL_MS = 4000;
const CLOSED_POLL_MS = 15000;

const TicketChatView: React.FC<TicketChatProps> = ({ ticketId, currentUserId, subtitle, onOpenChange, openRequest }) => {
  // The thread starts collapsed; it opens on request or when this user sends a message.
  const [expanded, setExpanded] = useState(false);
  // Poll fast while someone is reading the thread; the collapsed preview can lag a little.
  const { messages, pending, status, reload, send, retry, discard } = useTicketMessages(ticketId, expanded ? OPEN_POLL_MS : CLOSED_POLL_MS);
  const items = useMemo(() => buildChatItems(messages, currentUserId), [messages, currentUserId]);
  const listId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLButtonElement>(null);
  const atBottom = useRef(true);
  const seenCount = useRef(0);
  const hydrated = useRef(false);
  const [unseen, setUnseen] = useState(0);

  useEffect(() => { onOpenChange?.(expanded); }, [expanded, onOpenChange]);

  const scrollToBottom = (smooth = false) => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    setUnseen(0);
  };

  useEffect(() => {
    seenCount.current = 0;
    hydrated.current = false;
    atBottom.current = true;
    setUnseen(0);
    setExpanded(false);
  }, [ticketId]);

  // Declared after the reset above so a request that arrives with a new ticket wins.
  useEffect(() => { if (openRequest) setExpanded(true); }, [openRequest]);

  // Opening the thread (or a notification asking for it again) always lands on the latest message.
  useLayoutEffect(() => {
    if (!expanded) return;
    atBottom.current = true;
    scrollToBottom();
  }, [expanded, openRequest]);

  // Follow new messages only when the reader is already at the bottom or just sent one;
  // otherwise leave their scroll position alone and show a "new messages" pill.
  useLayoutEffect(() => {
    const total = messages.length + pending.length;
    const added = total - seenCount.current;
    const firstLoad = !hydrated.current;
    if (status === 'ready') hydrated.current = true;
    seenCount.current = total;
    // While collapsed the preview row already shows the newest message.
    if (!expanded) return;
    // The thread was opened before its messages arrived: jump straight to the latest one.
    if (firstLoad) {
      if (status === 'ready') scrollToBottom();
      return;
    }
    if (added <= 0) return;
    const lastIsMine = pending.length > 0 || messages[messages.length - 1]?.senderId === currentUserId;
    if (atBottom.current || lastIsMine) scrollToBottom(true);
    else setUnseen(n => n + added);
  }, [messages, pending, status, currentUserId, expanded]);

  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICKY_THRESHOLD;
    if (atBottom.current && unseen) setUnseen(0);
  };

  const onSend = useCallback((text: string) => { send(text); setExpanded(true); }, [send]);

  const collapse = () => {
    setExpanded(false);
    requestAnimationFrame(() => previewRef.current?.focus());
  };

  const last = messages[messages.length - 1];
  const isEmpty = status === 'ready' && messages.length === 0 && pending.length === 0;
  const showThread = expanded || status === 'error';

  return (
    <section aria-label="Ticket conversation" className={`bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden flex flex-col ${expanded ? 'flex-1 min-h-0' : ''}`}>
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2 min-w-0">
          {expanded ? (
            <button
              type="button"
              onClick={collapse}
              aria-expanded={true}
              aria-controls={listId}
              aria-label="Close conversation and go back to ticket details"
              className="-ml-1.5 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <MessageSquareText className="w-4 h-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Conversation</h3>
            {expanded && subtitle && <p className="text-[11px] text-zinc-500 truncate">{subtitle}</p>}
          </div>
        </div>
      </header>

      {showThread ? (
        <div className="relative flex-1 min-h-0 flex flex-col">
          <div
            id={listId}
            ref={listRef}
            onScroll={onScroll}
            role="log"
            aria-live="polite"
            aria-label="Messages"
            className="flex-1 min-h-40 overflow-y-auto overscroll-contain custom-scrollbar px-4 py-5 space-y-5"
          >
            {status === 'loading' && <ChatSkeleton />}
            {status === 'error' && <ChatError onRetry={reload} />}
            {isEmpty && <ChatEmpty />}
            {items.map(item => (item.kind === 'day' ? <DaySeparator key={item.key} label={item.label} /> : <MessageGroup key={item.key} group={item} />))}
            {pending.length > 0 && <PendingGroup pending={pending} onRetry={retry} onDiscard={discard} />}
          </div>

          {unseen > 0 && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-black text-[11px] font-bold shadow-lg cursor-pointer"
            >
              <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
              {unseen} new {unseen === 1 ? 'message' : 'messages'}
            </button>
          )}
        </div>
      ) : last ? (
        <ChatPreview
          buttonRef={previewRef}
          last={last}
          mine={last.senderId === currentUserId}
          count={messages.length}
          controlsId={listId}
          onOpen={() => setExpanded(true)}
        />
      ) : status === 'loading' ? (
        <div className="px-4 py-3" aria-busy="true" aria-label="Loading messages">
          <div className="h-8 w-2/3 rounded-lg bg-zinc-800/80 animate-pulse" />
        </div>
      ) : (
        <p role="status" className="px-4 py-3 text-xs text-zinc-500">No messages yet. Start the conversation below — replies show up here automatically.</p>
      )}

      <Composer onSend={onSend} />
    </section>
  );
};

// Props are plain strings and a stable setter, so dashboard re-renders skip the chat.
export const TicketChat = React.memo(TicketChatView);
