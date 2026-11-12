import { decodeHtmlEntities } from '../utils/sanitize.ts';

export interface ServerPaidBooking {
  id: string;
  orderId?: string;
  paymentId?: string;
  userId?: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  packageName: string;
  packageType: 'standard' | 'weekly' | 'monthly' | 'custom';
  totalPrice: number;
  currency: string;
  totalSessions: number;
  completedSessions: number;
  durationMinutes: number;
  validityDays: number;
  customizedDetails?: any;
  sessionFocusList?: string[];
  status: 'Active' | 'Scheduled' | 'Completed' | 'Cancelled';
  assignedCoachId?: string | null;
  assignedCoachName?: string | null;
  assignedBy?: string | null;
  assignedAt?: string | null;
  meetingLink?: string | null;
  scheduledAt?: string | null;
  coachNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export const paidBookingsStore: ServerPaidBooking[] = [];

export const formatPaidBookingRow = (r: any): ServerPaidBooking => ({
  id: r.id,
  orderId: r.order_id || undefined,
  paymentId: r.payment_id || undefined,
  userId: r.user_id || undefined,
  clientName: r.client_name,
  clientEmail: r.client_email,
  clientPhone: r.client_phone || '',
  packageName: r.package_name,
  packageType: (r.package_type || 'standard') as any,
  totalPrice: Number(r.total_price) || 0,
  currency: r.currency || 'GBP',
  totalSessions: Number(r.total_sessions) || 1,
  completedSessions: Number(r.completed_sessions) || 0,
  durationMinutes: Number(r.duration_minutes) || 45,
  validityDays: Number(r.validity_days) || 30,
  customizedDetails: typeof r.customized_details === 'string' ? JSON.parse(r.customized_details) : (r.customized_details || {}),
  sessionFocusList: Array.isArray(r.session_focus_list) ? r.session_focus_list : (typeof r.session_focus_list === 'string' ? JSON.parse(r.session_focus_list) : []),
  status: (r.status || 'Active') as any,
  assignedCoachId: r.assigned_coach_id || null,
  assignedCoachName: r.assigned_coach_name || null,
  assignedBy: r.assigned_by || null,
  assignedAt: r.assigned_at ? new Date(r.assigned_at).toISOString() : null,
  meetingLink: r.meeting_link ? decodeHtmlEntities(r.meeting_link) : null,
  scheduledAt: r.scheduled_at ? new Date(r.scheduled_at).toISOString() : null,
  coachNotes: r.coach_notes || null,
  createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
  updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
});
