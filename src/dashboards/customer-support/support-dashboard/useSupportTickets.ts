import { useState, useEffect } from 'react';
import { SupportTicket } from '../../../types';
import { VelocityAPI, apiFetch } from '../../../services/api';

export const useSupportTickets = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTickets = async (isInitial = false) => {
    if (isInitial) setIsLoading(true);
    try {
      const localTickets = VelocityAPI.getTickets();
      let serverTickets: SupportTicket[] = [];
      try {
        const res = await apiFetch('/api/tickets');
        if (res.ok) {
          serverTickets = await res.json();
        }
      } catch (err) {
        console.warn('Failed to fetch server tickets in CS:', err);
      }

      const mapById = new Map<string, SupportTicket>();
      [...localTickets, ...serverTickets].forEach(t => {
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
    } catch {
      const loaded = VelocityAPI.getTickets().filter(t => t.id !== 'TICKET-849201' && t.id !== 'TICKET-739104');
      setTickets(loaded);
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
