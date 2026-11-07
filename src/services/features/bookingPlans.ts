import { BookingDietPlan, BookingWorkoutPlan } from "../../types";
import { getApiUrl, apiFetch } from "../core/http";

export const bookingPlansApi = {
  async fetchBookingDietPlans(params?: { bookingId?: string; clientEmail?: string; coachId?: string }): Promise<BookingDietPlan[]> {
    try {
      let url = getApiUrl('/api/booking-diet-plans');
      const q = new URLSearchParams();
      if (params?.bookingId) q.set('bookingId', params.bookingId);
      if (params?.clientEmail) q.set('clientEmail', params.clientEmail);
      if (params?.coachId) q.set('coachId', params.coachId);
      const qs = q.toString();
      if (qs) url += `?${qs}`;

      const res = await apiFetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      console.warn('Failed to fetch booking diet plans:', err?.message);
    }
    return [];
  },

  async createBookingDietPlan(payload: {
    bookingId: string;
    clientEmail: string;
    clientName?: string;
    coachId?: string | null;
    coachName?: string | null;
    title: string;
    validFrom: string;
    validTo: string;
    content: string;
  }): Promise<{ success: boolean; plan?: BookingDietPlan; error?: string }> {
    try {
      const res = await apiFetch(getApiUrl('/api/booking-diet-plans'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      console.error('Failed to create booking diet plan:', err);
      return { success: false, error: err?.message || 'Failed to create diet plan' };
    }
  },

  async updateBookingDietPlan(id: string, payload: Partial<BookingDietPlan>): Promise<{ success: boolean; plan?: BookingDietPlan; error?: string }> {
    try {
      const res = await apiFetch(getApiUrl(`/api/booking-diet-plans/${encodeURIComponent(id)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      console.error('Failed to update booking diet plan:', err);
      return { success: false, error: err?.message || 'Failed to update diet plan' };
    }
  },

  async deleteBookingDietPlan(id: string): Promise<boolean> {
    try {
      const res = await apiFetch(getApiUrl(`/api/booking-diet-plans/${encodeURIComponent(id)}`), {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err: any) {
      console.error('Failed to delete booking diet plan:', err);
      return false;
    }
  },

  async fetchBookingWorkoutPlans(params?: { bookingId?: string; clientEmail?: string; coachId?: string }): Promise<BookingWorkoutPlan[]> {
    try {
      let url = getApiUrl('/api/booking-workout-plans');
      const q = new URLSearchParams();
      if (params?.bookingId) q.set('bookingId', params.bookingId);
      if (params?.clientEmail) q.set('clientEmail', params.clientEmail);
      if (params?.coachId) q.set('coachId', params.coachId);
      const qs = q.toString();
      if (qs) url += `?${qs}`;

      const res = await apiFetch(url);
      if (res.ok) {
        return await res.json();
      }
    } catch (err: any) {
      console.warn('Failed to fetch booking workout plans:', err?.message);
    }
    return [];
  },

  async createBookingWorkoutPlan(payload: {
    bookingId: string;
    clientEmail: string;
    clientName?: string;
    coachId?: string | null;
    coachName?: string | null;
    title: string;
    validFrom: string;
    validTo: string;
    content: string;
  }): Promise<{ success: boolean; plan?: BookingWorkoutPlan; error?: string }> {
    try {
      const res = await apiFetch(getApiUrl('/api/booking-workout-plans'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      console.error('Failed to create booking workout plan:', err);
      return { success: false, error: err?.message || 'Failed to create workout plan' };
    }
  },

  async updateBookingWorkoutPlan(id: string, payload: Partial<BookingWorkoutPlan>): Promise<{ success: boolean; plan?: BookingWorkoutPlan; error?: string }> {
    try {
      const res = await apiFetch(getApiUrl(`/api/booking-workout-plans/${encodeURIComponent(id)}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err: any) {
      console.error('Failed to update booking workout plan:', err);
      return { success: false, error: err?.message || 'Failed to update workout plan' };
    }
  },

  async deleteBookingWorkoutPlan(id: string): Promise<boolean> {
    try {
      const res = await apiFetch(getApiUrl(`/api/booking-workout-plans/${encodeURIComponent(id)}`), {
        method: 'DELETE'
      });
      return res.ok;
    } catch (err: any) {
      console.error('Failed to delete booking workout plan:', err);
      return false;
    }
  }
};
