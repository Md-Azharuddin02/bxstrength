import { dbPool } from '../config/db.ts';

export type StaffNotificationType = 'ticket' | 'paid_booking' | 'enquiry' | 'consultation' | 'assessment';

const LINK_TAB: Record<StaffNotificationType, string> = {
  ticket: 'inbox',
  paid_booking: 'paid_bookings',
  enquiry: 'enquiries',
  consultation: 'free_consultations',
  assessment: 'assessments',
};

// Staff-wide inbox: rows use user_email='staff' (clients never match it) and the id is derived from the
// record, so a retried request cannot create duplicates. Never throws - a failed alert must not fail the create.
export const notifyStaff = async (type: StaffNotificationType, recordId: string, title: string, message: string) => {
  if (!dbPool) return;
  try {
    await dbPool.query(
      `INSERT INTO in_app_notifications (id, user_email, title, message, content_type, coach_name, link_tab, is_read, created_at)
       VALUES ($1, 'staff', $2, $3, $4, 'BxStrength System', $5, FALSE, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [`staff-${type}-${recordId}`.slice(0, 255), title.slice(0, 255), message, type, `${LINK_TAB[type]}|${recordId}`.slice(0, 100)],
    );
  } catch (err: any) {
    console.warn('staff notification failed:', err.message);
  }
};
