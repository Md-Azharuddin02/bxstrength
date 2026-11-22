import { useState } from 'react';
import { SupportTicket } from '../../../types';
import { RoleView, SortBy } from './types';

// Filters & Search for the ticket inbox
export const useTicketFilters = (tickets: SupportTicket[], activeRoleView: RoleView) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  // Filtered & Sorted Tickets
  const filteredTickets = tickets.filter(t => {
    // RBAC Filter: CS Agent can only view relevant/assigned tickets unless they are Company Agent or Admin
    if (activeRoleView === 'customer_support') {
      const isAssigned = t.assignedAgent?.toLowerCase().includes('cs') || t.assignedAgent === 'Unassigned' || !t.assignedAgent;
      if (!isAssigned && t.assignedAgentRole === 'admin') return false;
    }

    const cleanTerm = searchTerm.toLowerCase().trim().replace(/^#/, '');
    const matchesSearch = !cleanTerm ||
      t.id.toLowerCase().includes(cleanTerm) ||
      t.userName.toLowerCase().includes(cleanTerm) ||
      t.userEmail.toLowerCase().includes(cleanTerm) ||
      (t.userPhone && t.userPhone.toLowerCase().includes(cleanTerm)) ||
      t.subject.toLowerCase().includes(cleanTerm) ||
      t.description.toLowerCase().includes(cleanTerm) ||
      (t.assignedAgent && t.assignedAgent.toLowerCase().includes(cleanTerm)) ||
      (t.relatedBookingId && t.relatedBookingId.toLowerCase().includes(cleanTerm)) ||
      (t.relatedTransactionId && t.relatedTransactionId.toLowerCase().includes(cleanTerm));

    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'new' ? (t.status === 'new' || t.status === 'open') :
       statusFilter === 'escalated' ? Boolean(t.escalationHistory?.length) :
       statusFilter === 'open' ? (t.status !== 'resolved' && t.status !== 'closed') :
       statusFilter === 'in_progress' ? (t.status === 'in_progress' || t.status === 'assigned') :
       t.status === statusFilter);

    const matchesPriority = priorityFilter === 'all' || 
      (priorityFilter === 'urgent' 
        ? (t.priority === 'urgent' || Boolean(t.escalationHistory && t.escalationHistory.length > 0)) 
        : t.priority === priorityFilter);
    const matchesSource = sourceFilter === 'all' || t.source === sourceFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesAgent = agentFilter === 'all' || 
      (agentFilter === 'unassigned' ? (!t.assignedAgent || t.assignedAgent === 'Unassigned') : t.assignedAgent === agentFilter);

    return matchesSearch && matchesStatus && matchesPriority && matchesSource && matchesCategory && matchesAgent;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'priority') {
      const priorityMap: Record<string, number> = { urgent: 4, high: 3, normal: 2, medium: 2, low: 1 };
      return (priorityMap[b.priority] || 0) - (priorityMap[a.priority] || 0);
    }
    return 0;
  });

  return {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    sourceFilter, setSourceFilter,
    categoryFilter, setCategoryFilter,
    agentFilter, setAgentFilter,
    sortBy, setSortBy,
    filteredTickets
  };
};
