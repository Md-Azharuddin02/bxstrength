import { useState, useEffect } from 'react';
import { SupportTicket } from '../../../types';
import { apiFetch } from '../../../services/api';

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTickets = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      // The server is the only source of truth. On a failed request (offline, 401, 429) keep what is
      // on screen: the browser's stored copy is stale and would bring back deleted tickets.
      const res = await apiFetch('/api/tickets');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const source: SupportTicket[] = await res.json();

      const mapById = new Map<string, SupportTicket>();
      source.forEach(t => {
        if (t && t.id && t.id !== 'TICKET-849201' && t.id !== 'TICKET-739104') {
          mapById.set(t.id, t);
        }
      });
      const loaded = Array.from(mapById.values());
      setTickets(loaded);
      // Functional update: this runs from a stale-closure interval, so don't read `selectedTicket` directly.
      setSelectedTicket(prev => {
        if (!prev) return loaded[0] ?? null;
        return loaded.find(t => t.id === prev.id) ?? prev;
      });
    } catch (err) {
      console.warn('Failed to fetch server tickets in CS:', err);
    } finally {
      if (isInitial) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(true);
    const interval = setInterval(() => { if (document.visibilityState === 'visible') fetchTickets(false); }, 60_000); // 60s sync, paused while the tab is hidden; new tickets also arrive via notifications

    const handleTicketsUpdated = () => {
      fetchTickets(false);
    };

    window.addEventListener('bxstrength_tickets_updated', handleTicketsUpdated);
    window.addEventListener('storage', handleTicketsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('bxstrength_tickets_updated', handleTicketsUpdated);
      window.removeEventListener('storage', handleTicketsUpdated);
    };
  }, []);

  return { tickets, setTickets, selectedTicket, setSelectedTicket, isLoading, fetchTickets };
};
