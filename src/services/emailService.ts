// Emails are built from server-side templates. The client only names a template
// `type` and its data; the server owns the HTML and the recipient (see
// Backend/src/services/emailTemplates.ts).
const metaEnv = (import.meta as any).env || {};
const API_BASE_URL = metaEnv.VITE_API_URL || "";

const sendTemplatedEmail = async (
  type: string,
  data: Record<string, unknown>,
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export interface BrevoTicketEmailParams {
  ticketId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
}

export const sendBrevoTicketEmail = async (
  params: BrevoTicketEmailParams,
): Promise<{ success: boolean; message: string }> => {
  const success = await sendTemplatedEmail("ticket", { ...params });
  return {
    success,
    message: `Ticket ${params.ticketId} logged & email notification dispatched to admin.`,
  };
};

export interface ConsultationEmailParams {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  goal: string;
  duration?: string;
  coachPreference: string;
  date: string;
  timeSlot: string;
  additionalNotes?: string;
}

export const sendConsultationConfirmationEmail = async (
  params: ConsultationEmailParams,
): Promise<{ success: boolean; message: string }> => {
  const success = await sendTemplatedEmail("consultation", { ...params });
  return {
    success,
    message: `Appointment confirmation recorded and sent to ${params.clientEmail} and Admin`,
  };
};

export interface PaymentReceiptEmailParams {
  orderId: string;
  clientName: string;
  clientEmail: string;
  planName: string;
  serviceType: string;
  amountPaid: number;
  expiryDate: string;
  selectedExercises?: string[];
  paymentMethod?: string;
}

export const sendBrevoPaymentReceiptEmail = async (
  params: PaymentReceiptEmailParams,
): Promise<{ success: boolean; message: string }> => {
  const success = await sendTemplatedEmail("payment_receipt", { ...params });
  return {
    success,
    message: `Payment receipt recorded and sent to ${params.clientEmail}`,
  };
};

export interface PaymentFailedEmailParams {
  clientName: string;
  clientEmail: string;
  planName: string;
  amount: number;
  reason?: string;
}

export const sendBrevoPaymentFailedEmail = async (
  params: PaymentFailedEmailParams,
): Promise<{ success: boolean; message: string }> => {
  const success = await sendTemplatedEmail("payment_failed", { ...params });
  return {
    success,
    message: `Payment failed alert sent to ${params.clientEmail}`,
  };
};

export interface ContactEnquiryEmailParams {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const sendContactEnquiryEmail = async (
  params: ContactEnquiryEmailParams,
): Promise<{ success: boolean; message: string }> => {
  const success = await sendTemplatedEmail("contact_enquiry", { ...params });
  return { success, message: `Enquiry recorded.` };
};

export interface CoachAssignmentAlertParams {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceTitle: string;
  serviceType: string;
  amountPaid: number;
  customExercises?: string[];
}

export const sendBrevoCoachAssignmentAlertToAdmin = async (
  params: CoachAssignmentAlertParams,
): Promise<{ success: boolean; message: string }> => {
  const success = await sendTemplatedEmail("coach_assignment_alert", { ...params });
  return {
    success,
    message: `Admin coach assignment notification sent.`,
  };
};

export interface ScheduleConfirmationEmailParams {
  bookingId: string;
  clientName: string;
  clientEmail: string;
  serviceTitle: string;
  coachName: string;
  coachTitle: string;
  scheduledDate: string;
  scheduledTime: string;
  joinUrl: string;
}

export const sendBrevoScheduleConfirmationEmail = async (
  params: ScheduleConfirmationEmailParams,
): Promise<{ success: boolean; message: string }> => {
  const success = await sendTemplatedEmail("schedule_confirmation", { ...params });
  return {
    success,
    message: `Training schedule confirmation email dispatched to ${params.clientEmail}`,
  };
};
