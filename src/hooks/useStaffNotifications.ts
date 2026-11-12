import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../services/core/http';
import type { InAppNotification } from '../types';

const POLL_MS = 30_000;

// linkTab is stored as "<tab>|<recordId>" by the backend (notifyStaff).
export const parseLink = (n: InAppNotification) => {
  const [tab, recordId] = (n.linkTab || '').split('|');
  return { tab, recordId };
};

/**
 * Staff notification inbox backed by /api/notifications?email=staff (rows written by the server when a
 * ticket, paid booking, enquiry, demo session or assessment is created). Polling is used instead of
 * sockets/SSE: the repo has no socket layer, and 30s polling on an existing endpoint needs no new infra.
 * Read state lives in the DB, so counts survive refresh and are shared by the whole support team.
 */
export function useStaffNotifications() {
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch('/api/notifications?email=staff');
      if (!res.ok) throw new Error(String(res.status));
      const raw = await res.json();
      setItems(Array.isArray(raw) ? raw : []);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const tick = () => { if (document.visibilityState === 'visible') refresh(); };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [refresh]);

  const markRead = useCallback(async (ids: string[]) => {
    if (!ids.length) return;
    setItems(prev => prev.map(n => (ids.includes(n.id) ? { ...n, isRead: true } : n)));
    await Promise.all(ids.map(id => apiFetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: 'PUT' }).catch(() => {})));
  }, []);

  const unreadByTab = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach(n => { if (!n.isRead) { const { tab } = parseLink(n); counts[tab] = (counts[tab] || 0) + 1; } });
    return counts;
  }, [items]);

  const unreadTotal = useMemo(() => items.filter(n => !n.isRead).length, [items]);

  return { items, loading, error, unreadByTab, unreadTotal, markRead, refresh };
}
