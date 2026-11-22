import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch, decodeHtmlEntities, getApiUrl } from '../../../services/api';
import type { ChatMessage, PendingMessage } from '../types';

// shortcut: polls instead of a websocket, upgrade if typing indicators or many concurrent chats are needed.
// Each poll asks only for messages since the newest one held, so a poll with nothing new costs one tiny request.
// The server stores text HTML-escaped; decode once on arrival so components render plain strings.
const decode = (m: ChatMessage): ChatMessage => ({ ...m, senderName: decodeHtmlEntities(m.senderName), text: decodeHtmlEntities(m.text) });

export function useTicketMessages(ticketId: string, pollMs: number) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const activeTicket = useRef(ticketId);
  const newest = useRef<string | undefined>(undefined);
  const url = getApiUrl(`/api/tickets/${encodeURIComponent(ticketId)}/messages`);

  const load = useCallback(async () => {
    try {
      const after = newest.current;
      const res = await apiFetch(after ? `${url}?after=${encodeURIComponent(after)}` : url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (activeTicket.current !== ticketId) return; // a reply for a ticket we already left
      const incoming: ChatMessage[] = Array.isArray(data) ? data : [];
      // Advance the cursor only from server reads: our own sends must not skip a reply that landed just before them.
      if (incoming.length) newest.current = incoming[incoming.length - 1].createdAt;
      // The cursor is inclusive, so drop what we already have; keep the same array when nothing is new to skip a re-render.
      setMessages(list => {
        const have = new Set(list.map(m => m.id));
        const fresh = incoming.filter(m => !have.has(m.id)).map(decode);
        return fresh.length ? [...list, ...fresh] : list;
      });
      setStatus('ready');
    } catch {
      if (activeTicket.current !== ticketId) return;
      setStatus(s => (s === 'ready' ? 'ready' : 'error'));
    }
  }, [ticketId, url]);

  useEffect(() => {
    activeTicket.current = ticketId;
    newest.current = undefined;
    setMessages([]);
    setPending([]);
    setStatus('loading');
  }, [ticketId]);

  // Fetches right away (first load, or catching up when the rate speeds up), then on every tick.
  // Skips background tabs and catches up as soon as the tab is visible again.
  useEffect(() => {
    const tick = () => { if (!document.hidden) load(); };
    tick();
    const timer = setInterval(tick, pollMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [load, pollMs]);

  const post = useCallback(async (msg: PendingMessage) => {
    setPending(list => list.map(p => (p.tempId === msg.tempId ? { ...p, status: 'sending' } : p)));
    try {
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: msg.text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved = decode(await res.json());
      if (activeTicket.current !== ticketId) return;
      setMessages(list => (list.some(m => m.id === saved.id) ? list : [...list, saved]));
      setPending(list => list.filter(p => p.tempId !== msg.tempId));
    } catch {
      setPending(list => list.map(p => (p.tempId === msg.tempId ? { ...p, status: 'failed' } : p)));
    }
  }, [ticketId, url]);

  const send = useCallback((text: string) => {
    const msg: PendingMessage = { tempId: `tmp-${Date.now()}-${Math.random().toString(36).slice(2)}`, text, status: 'sending', createdAt: new Date().toISOString() };
    setPending(list => [...list, msg]);
    post(msg);
  }, [post]);

  const retry = (tempId: string) => {
    const msg = pending.find(p => p.tempId === tempId);
    if (msg) post(msg);
  };

  const discard = (tempId: string) => setPending(list => list.filter(p => p.tempId !== tempId));

  return { messages, pending, status, reload: load, send, retry, discard };
}
