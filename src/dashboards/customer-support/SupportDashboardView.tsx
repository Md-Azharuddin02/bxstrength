import React, { useState, useEffect, useMemo } from 'react';
import { SupportTicket, TicketStatus, InAppNotification } from '../../types';
import { PaidBookingsView } from '../head-coach/PaidBookingsView';
import { CoachAvailabilityRoster } from './CoachAvailabilityRoster';
import { VelocityAPI, apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { FreeAssessmentsView } from '../head-coach/FreeAssessmentsView';
import { FreeConsultationsView } from '../head-coach/FreeConsultationsView';
import { EnquiriesManager } from './EnquiriesManager';
import { SupportSidebar, SUPPORT_NAV, type SupportTab } from './SupportSidebar';
import { SupportOverview } from './SupportOverview';
import { useStaffNotifications, parseLink } from '../../hooks/useStaffNotifications';
import { RoleView } from './support-dashboard/types';
import { useSupportTickets } from './support-dashboard/useSupportTickets';
import { useSupportData } from './support-dashboard/useSupportData';
import { useTicketFilters } from './support-dashboard/useTicketFilters';
import { SupportTopBar } from './support-dashboard/SupportTopBar';
import { TicketFiltersBar } from './support-dashboard/TicketFiltersBar';
import { TicketList } from './support-dashboard/TicketList';
import { TicketDetail } from './support-dashboard/TicketDetail';
import { CreateTicketModal } from './support-dashboard/CreateTicketModal';
import { useCreateTicketForm } from './support-dashboard/useCreateTicketForm';
import { ProfileModal } from './support-dashboard/ProfileModal';
import { AuditLogsPanel } from './support-dashboard/AuditLogsPanel';

interface SupportDashboardViewProps {
  onShowToast?: (msg: string) => void;
  onNavigateHome?: () => void;
  onLogout?: () => void;
  initialTab?: SupportTab;
}

export const SupportDashboardView: React.FC<SupportDashboardViewProps> = ({ 
  onShowToast = () => {},
  onNavigateHome,
  onLogout,
  initialTab = 'dashboard'
}) => {
  const { user } = useAuth();

  // Role Simulator state for testing RBAC
  const [activeRoleView, setActiveRoleView] = useState<RoleView>(
    user?.role === 'admin' ? 'admin' : ((user?.role === 'headcoach' || user?.role === 'coach') ? user.role : 'customer_support')
  );

  const [activeTab, setActiveTab] = useState<SupportTab>(initialTab);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const { tickets, setTickets, selectedTicket, setSelectedTicket, isLoading, fetchTickets } = useSupportTickets();
  const { coaches, consultations, assessments, enquiries, loadError, paidBookings, loadData } = useSupportData();

  // Filters & Search
  const {
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    priorityFilter, setPriorityFilter,
    sourceFilter, setSourceFilter,
    sortBy, setSortBy,
    filteredTickets
  } = useTicketFilters(tickets, activeRoleView);

  // Interactive Form Inputs inside Selected Ticket
  const [communicationTab, setCommunicationTab] = useState<'email' | 'chat' | 'callback' | 'internal_note'>('email');
  const [responseInput, setResponseInput] = useState<string>('');
  const [internalNoteInput, setInternalNoteInput] = useState<string>('');
  const [callbackNotes, setCallbackNotes] = useState<string>('');


  // Create Ticket Modal State
  const createForm = useCreateTicketForm({ fetchTickets, setSelectedTicket, onShowToast });

  // Delete Confirm Modal State
  const [deletingTicket, setDeletingTicket] = useState<SupportTicket | null>(null);

  const { items: notifications, loading: notifLoading, error: notifError, unreadByTab, unreadTotal, markRead, refresh: refreshNotifications } = useStaffNotifications();

  // A new notification means a new record: reload the lists so the dashboard and sections show it right away.
  const newestNotifId = notifications[0]?.id;
  useEffect(() => {
    if (!newestNotifId) return;
    loadData();
    fetchTickets(false);
  }, [newestNotifId]);

  const selectTab = (tab: SupportTab, resetFilters = true) => {
    setActiveTab(tab);
    if (tab === 'inbox' && resetFilters) { setStatusFilter('all'); setPriorityFilter('all'); }
    markRead(notifications.filter(n => !n.isRead && parseLink(n).tab === tab).map(n => n.id));
  };

  const openNotification = (n: InAppNotification) => {
    const { tab, recordId } = parseLink(n);
    markRead([n.id]);
    if (!SUPPORT_NAV.some(i => i.id === tab)) return;
    setActiveTab(tab as SupportTab);
    if (tab === 'inbox' && recordId) {
      setStatusFilter('all'); setPriorityFilter('all'); setSourceFilter('all'); setSearchTerm('');
      setPendingTicketId(recordId);
      if (!tickets.some(x => x.id === recordId)) fetchTickets(false); // e.g. a ticket created since the last refresh
    }
  };

  // A clicked notification's ticket: select it and open its chat once it is in the list.
  const [pendingTicketId, setPendingTicketId] = useState<string | null>(null);
  const [openChatRequest, setOpenChatRequest] = useState(0);
  useEffect(() => {
    if (!pendingTicketId) return;
    const t = tickets.find(x => x.id === pendingTicketId);
    if (!t) return;
    setSelectedTicket(t);
    setOpenChatRequest(Date.now());
    setPendingTicketId(null);
  }, [pendingTicketId, tickets]);

  const analytics = useMemo(() => VelocityAPI.getSupportAnalytics(tickets), [tickets]);

  const handleUpdateStatus = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    const id = selectedTicket.id;
    // Server first: tickets fetched from the API are not in local storage, so the local update can return null.
    try {
      const res = await apiFetch(`/api/tickets/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      onShowToast('Could not save the status change. Please try again.');
      return;
    }
    const updated = VelocityAPI.updateTicketStatus(id, status) ?? { ...selectedTicket, status, updatedAt: new Date().toISOString() };
    setSelectedTicket(updated);
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: updated.status, updatedAt: updated.updatedAt } : t));
    fetchTickets();
    window.dispatchEvent(new CustomEvent('bxstrength_tickets_updated'));
    onShowToast(`Ticket #${id} status set to "${status.toUpperCase().replace('_', ' ')}".`);
  };

  // Assign/escalate must be saved on the server: tickets fetched from the API are not in local storage,
  // and the server copy overwrites local edits on the next refresh. Returns false (and toasts) if the save fails.
  const saveTicketChange = async (patch: Record<string, unknown>): Promise<boolean> => {
    if (!selectedTicket) return false;
    try {
      const res = await apiFetch(`/api/tickets/${encodeURIComponent(selectedTicket.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      if (res.ok) return true;
    } catch {}
    onShowToast('Could not save the change. Please try again.');
    return false;
  };

  const handleAssignAgent = async (agentName: string, agentRole: 'customer_support' | 'headcoach' | 'coach' | 'admin') => {
    if (!selectedTicket) return;
    if (!(await saveTicketChange({ assignedAgent: agentName, assignedAgentRole: agentRole, status: selectedTicket.status === 'new' ? 'assigned' : undefined }))) return;
    VelocityAPI.assignTicket(selectedTicket.id, agentName, agentRole); // keeps the local copy and audit log in step
    setSelectedTicket({ ...selectedTicket, assignedAgent: agentName, assignedAgentRole: agentRole, status: selectedTicket.status === 'new' ? 'assigned' : selectedTicket.status });
    fetchTickets();
    onShowToast(`Ticket #${selectedTicket.id} assigned to ${agentName}.`);
  };

  const handleSendResponse = async () => {
    if (!selectedTicket || !responseInput.trim()) return;
    const text = responseInput.trim();
    const updated = VelocityAPI.addTicketMessage(
      selectedTicket.id,
      text,
      communicationTab === 'chat' ? 'chat' : 'email',
      activeRoleView === 'admin' ? 'Admin Support Desk' : (activeRoleView === 'headcoach' ? 'Head Coach Desk' : (activeRoleView === 'coach' ? 'Coach Support Desk' : 'CS Team Agent')),
      'agent'
    );
    try {
      await apiFetch(`/api/tickets/${encodeURIComponent(selectedTicket.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminResponse: text, ...(['new', 'open', 'assigned'].includes(selectedTicket.status) && { status: 'in_progress' }) }) // a reply must not silently resolve/close the ticket
      });
    } catch {}
    const shown = updated ?? selectedTicket; // server-only tickets have no local copy
    if (shown) {
      setSelectedTicket(shown);
      setResponseInput('');
      fetchTickets();
      onShowToast(`Response sent to customer ${selectedTicket.userName} via ${communicationTab.toUpperCase()}!`);
    }
  };

  const handleAddInternalNote = () => {
    if (!selectedTicket || !internalNoteInput.trim()) return;
    const updated = VelocityAPI.addInternalNote(
      selectedTicket.id,
      internalNoteInput.trim(),
      user ? user.name : (activeRoleView === 'admin' ? 'Admin Manager' : 'CS Agent'),
      activeRoleView.toUpperCase()
    );
    if (updated) {
      setSelectedTicket(updated);
      setInternalNoteInput('');
      fetchTickets();
      onShowToast(`Internal note logged for Ticket #${selectedTicket.id} (Customer-Hidden).`);
    }
  };

  const handleLogCallback = () => {
    if (!selectedTicket || !callbackNotes.trim()) return;
    const updated = VelocityAPI.addTicketMessage(
      selectedTicket.id,
      `[PHONE CALLBACK LOGGED]\nSummary: ${callbackNotes.trim()}`,
      'callback',
      activeRoleView === 'admin' ? 'Admin Desk' : 'CS Agent',
      'agent'
    );
    if (updated) {
      setSelectedTicket(updated);
      setCallbackNotes('');
      fetchTickets();
      onShowToast(`Phone callback logged for ${selectedTicket.userName}.`);
    }
  };

  const handleTransferToHeadCoach = () => {
    if (!selectedTicket) return;
    try {
      VelocityAPI.transferEnquiryToHeadCoach(
        selectedTicket.id,
        user ? user.name : 'Customer Support Desk',
        `Support Ticket #${selectedTicket.id}: ${selectedTicket.description}`,
        selectedTicket.category,
        selectedTicket.priority === 'medium' ? 'normal' : selectedTicket.priority
      );
      onShowToast(`Enquiry for "${selectedTicket.userName}" transferred directly to Head Coach Enquiries Tab!`);
      fetchTickets();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to transfer to Head Coach');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingTicket) return;
    VelocityAPI.deleteTicket(deletingTicket.id);
    try {
      await apiFetch(`/api/tickets/${encodeURIComponent(deletingTicket.id)}`, { method: 'DELETE' });
    } catch {}
    if (selectedTicket?.id === deletingTicket.id) {
      setSelectedTicket(null);
    }
    setDeletingTicket(null);
    fetchTickets();
    onShowToast(`Ticket #${deletingTicket.id} permanently deleted.`);
  };

  return (
    <div className="h-screen h-[100dvh] flex bg-[#0a0a0c] text-white font-sans overflow-clip">
      <SupportSidebar
        active={activeTab}
        onSelect={selectTab}
        unread={{ ...unreadByTab, inbox: unreadByTab.inbox || 0 }}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        onLogout={onLogout}
        user={user}
        onEditProfile={() => setProfileOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Fixed top bar: only the content below it scrolls */}
        <SupportTopBar
          title={SUPPORT_NAV.find(n => n.id === activeTab)?.label}
          user={user}
          onOpenMenu={() => setMobileOpen(true)}
          onNewInquiry={createForm.open}
          onRefresh={() => { fetchTickets(false); loadData(); refreshNotifications(); onShowToast('Dashboard refreshed'); }}
          bell={{
            items: notifications,
            unread: unreadTotal,
            loading: notifLoading,
            error: notifError,
            onOpen: openNotification,
            onMarkAllRead: () => markRead(notifications.filter(n => !n.isRead).map(n => n.id))
          }}
        />

        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-5 space-y-6">

        {activeTab === 'dashboard' && (
          <SupportOverview
            tickets={tickets}
            paidBookings={paidBookings}
            consultations={consultations}
            assessments={assessments}
            enquiries={enquiries}
            notifications={notifications}
            loading={isLoading}
            error={loadError}
            onRetry={() => { fetchTickets(false); loadData(); }}
            onNavigate={(tab, opts) => {
              if (opts?.priority) setPriorityFilter(opts.priority);
              if (opts?.recordId) setSelectedTicket(tickets.find(t => t.id === opts.recordId) ?? null);
              selectTab(tab, !opts?.priority);
            }}
            onOpenNotification={openNotification}
            user={user}
            analytics={analytics}
            onMarkAllRead={() => markRead(notifications.filter(n => !n.isRead).map(n => n.id))}
          />
        )}

        {/* TAB 0A: LIVE PAID BOOKINGS & DISPATCH DESK */}
        {activeTab === 'paid_bookings' && user && (
          <div className="space-y-4">
            <PaidBookingsView
              user={user}
              coaches={coaches}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* TAB 0B: COACH AVAILABILITY & WORKLOAD ROSTER */}
        {activeTab === 'coaches_workload' && (
          <div className="space-y-4">
            <CoachAvailabilityRoster
              coaches={coaches}
              paidBookings={paidBookings}
              onBookingsUpdated={loadData}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* TAB 1: CENTRAL TICKET INBOX & 360 WORKSPACE */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            <TicketFiltersBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              priorityFilter={priorityFilter}
              onPriorityChange={setPriorityFilter}
              sourceFilter={sourceFilter}
              onSourceChange={setSourceFilter}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onClear={() => { setStatusFilter('all'); setPriorityFilter('all'); setSourceFilter('all'); setSearchTerm(''); }}
            />

            {/* SPLIT VIEW WORKSPACE (LEFT: TICKET LIST, RIGHT: DETAILED TICKET & 360 PROFILE) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <TicketList
                tickets={filteredTickets}
                isLoading={isLoading}
                selectedTicketId={selectedTicket?.id}
                onSelect={setSelectedTicket}
              />
              <TicketDetail
                ticket={selectedTicket}
                activeRoleView={activeRoleView}
                currentUserId={user?.id}
                onDelete={setDeletingTicket}
                onUpdateStatus={handleUpdateStatus}
                onTransferToHeadCoach={handleTransferToHeadCoach}
                openChatRequest={openChatRequest}
              />
            </div>
          </div>
        )}

        {/* TAB 3: AUDIT LOGS & SECURITY */}
        {activeTab === 'audit_logs' && <AuditLogsPanel />}

        {activeTab === 'enquiries' && (
          <EnquiriesManager
            enquiries={enquiries}
            user={user ?? undefined}
            coaches={coaches}
            onEnquiriesUpdated={loadData}
            onShowToast={onShowToast}
          />
        )}

        {/* TAB 5: ATHLETE ASSESSMENTS DESK */}
        {activeTab === 'assessments' && user && (
          <FreeAssessmentsView
            user={user}
            onShowToast={onShowToast}
          />
        )}

        {/* TAB 6: FREE DEMO & CONSULTATIONS DESK */}
        {activeTab === 'free_consultations' && user && (
          <FreeConsultationsView
            user={user}
            coaches={coaches}
            onShowToast={onShowToast}
          />
        )}

        </main>
      </div>

      {profileOpen && user && (
        <ProfileModal user={user} onShowToast={onShowToast} onClose={() => setProfileOpen(false)} />
      )}

      {/* CREATE NEW TICKET MODAL */}
      {createForm.isOpen && <CreateTicketModal {...createForm.modalProps} />}

      {/* CONFIRM DELETE TICKET MODAL */}
      {deletingTicket && (
        <ConfirmModal
          isOpen={!!deletingTicket}
          title={`Delete Ticket #${deletingTicket.id}?`}
          message="Are you sure you want to permanently delete this support ticket? This action will be logged in audit history."
          confirmText="Delete Ticket"
          type="danger"
          requireTextConfirm={false}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingTicket(null)}
        />
      )}

    </div>
  );
};
