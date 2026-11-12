// Shape returned by the consultation assign and status endpoints.
export const formatConsultationResult = (r: any, clientName: string) => ({
  id: r.id,
  clientName,
  clientEmail: r.client_email,
  clientPhone: r.client_phone,
  goal: r.goal,
  duration: r.duration,
  preferredDate: r.preferred_date,
  preferredTime: r.preferred_time,
  additionalNotes: r.additional_notes || r.message,
  status: r.status,
  assignedCoachId: r.assigned_coach_id,
  assignedCoachName: r.assigned_coach_name,
  assignedBy: r.assigned_by,
  assignedAt: r.assigned_at,
  scheduledAt: r.scheduled_at,
  meetingLink: r.meeting_link,
  notes: r.notes,
  createdAt: r.created_at
});
