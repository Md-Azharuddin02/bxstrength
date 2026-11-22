export type ServerEnquiryStatus = 'new' | 'transferred_to_headcoach' | 'assigned_to_coach' | 'in_progress' | 'resolved';

export interface ServerEnquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredContactMethod?: 'whatsapp' | 'email' | 'call';
  subject: string;
  message: string;
  createdAt: string;
  status: ServerEnquiryStatus;
  assignedNotes?: string;
}

export const enquiriesStore: ServerEnquiry[] = [];
