import type { ChatMessage } from '../types';

// Consecutive messages from one sender within this gap share a header, like most chat apps.
const GROUP_GAP_MS = 5 * 60 * 1000;

export type ChatItem =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'group'; key: string; senderId: string; senderName: string; senderRole: ChatMessage['senderRole']; mine: boolean; messages: ChatMessage[] };

export function dayLabel(date: Date, now = new Date()): string {
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

export function buildChatItems(messages: ChatMessage[], currentUserId: string, now = new Date()): ChatItem[] {
  const items: ChatItem[] = [];
  let lastDay = '';
  let group: Extract<ChatItem, { kind: 'group' }> | null = null;

  for (const m of messages) {
    const at = new Date(m.createdAt);
    const day = at.toDateString();
    if (day !== lastDay) {
      items.push({ kind: 'day', key: `day-${day}`, label: dayLabel(at, now) });
      lastDay = day;
      group = null;
    }
    const prev = group?.messages[group.messages.length - 1];
    if (group && prev && group.senderId === m.senderId && at.getTime() - new Date(prev.createdAt).getTime() < GROUP_GAP_MS) {
      group.messages.push(m);
    } else {
      group = { kind: 'group', key: m.id, senderId: m.senderId, senderName: m.senderName, senderRole: m.senderRole, mine: m.senderId === currentUserId, messages: [m] };
      items.push(group);
    }
  }
  return items;
}

export const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]!.toUpperCase()).join('') || '?';
