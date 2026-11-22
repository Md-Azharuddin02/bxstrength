import { BookingSession } from "../../types";
import { getApiUrl, apiFetch } from "../core/http";

type Result<T> = { success: boolean; error?: string } & T;

const send = async (url: string, method: string, body?: unknown): Promise<any> => {
  try {
    const res = await apiFetch(getApiUrl(url), {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    return res.ok ? data : { success: false, error: data.error || 'Request failed' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Request failed' };
  }
};

export const bookingSessionsApi = {
  async fetchBookingSessions(params?: { bookingId?: string; clientEmail?: string }): Promise<BookingSession[]> {
    const q = new URLSearchParams();
    if (params?.bookingId) q.set('bookingId', params.bookingId);
    if (params?.clientEmail) q.set('clientEmail', params.clientEmail);
    try {
      const res = await apiFetch(getApiUrl(`/api/booking-sessions${q.toString() ? `?${q}` : ''}`));
      if (res.ok) return await res.json();
    } catch (err: any) {
      console.warn('Failed to fetch booking sessions:', err?.message);
    }
    return [];
  },

  createBookingSessions(bookingId: string, payload: { scheduledAts: string[]; meetingLink?: string; notes?: string }): Promise<Result<{ sessions?: BookingSession[] }>> {
    return send(`/api/paid-bookings/${encodeURIComponent(bookingId)}/sessions`, 'POST', payload);
  },

  updateBookingSession(id: string, payload: { scheduledAt?: string; meetingLink?: string; status?: BookingSession['status']; notes?: string }): Promise<Result<{ session?: BookingSession }>> {
    return send(`/api/booking-sessions/${encodeURIComponent(id)}`, 'PATCH', payload);
  },

  deleteBookingSession(id: string): Promise<Result<{}>> {
    return send(`/api/booking-sessions/${encodeURIComponent(id)}`, 'DELETE');
  }
};
