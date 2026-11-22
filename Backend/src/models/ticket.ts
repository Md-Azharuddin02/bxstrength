export interface ServerTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  status: string;
  adminResponse?: string;
  assignedAgent?: string;
  assignedAgentRole?: string;
  escalationHistory?: any[];
  createdAt: string;
  updatedAt: string;
}

export const mapRowToTicket = (row: any): ServerTicket => ({
  id: row.id,
  userId: row.user_id || row.userId || '',
  userName: row.user_name || row.userName || 'BxStrength Customer',
  userEmail: row.user_email || row.userEmail || '',
  subject: row.subject || '',
  category: row.category || 'General',
  priority: row.priority || 'medium',
  description: row.description || '',
  status: row.status || 'open',
  adminResponse: row.admin_response || row.adminResponse || '',
  assignedAgent: row.assigned_agent || row.assignedAgent || undefined,
  assignedAgentRole: row.assigned_agent_role || row.assignedAgentRole || undefined,
  escalationHistory: row.escalation_history || row.escalationHistory || [],
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : (row.createdAt || new Date().toISOString()),
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : (row.updatedAt || new Date().toISOString())
});

export const ticketsStore: ServerTicket[] = [];
