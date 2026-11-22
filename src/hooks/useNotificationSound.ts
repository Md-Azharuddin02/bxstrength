import { useEffect, useRef } from 'react';
import { playNotificationSound } from '../utils/notificationSound';

/**
 * Plays a chime when an unread notification appears that was not in the previous list.
 * The first load only records what is already there, so opening the dashboard is silent.
 */
export function useNotificationSound(items: { id: string; isRead?: boolean }[], ready = true) {
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!ready) return;
    const unread = items.filter(n => !n.isRead).map(n => n.id);
    if (seen.current === null) {
      seen.current = new Set(unread);
      return;
    }
    const fresh = unread.filter(id => !seen.current!.has(id));
    unread.forEach(id => seen.current!.add(id));
    if (fresh.length > 0) playNotificationSound();
  }, [items, ready]);
}
