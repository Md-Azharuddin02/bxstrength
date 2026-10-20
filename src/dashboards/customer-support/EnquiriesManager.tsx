import React, { useState, useEffect, useMemo } from 'react';
import { Enquiry, User, EnquiryActivityLog } from '../../types';
import { VelocityAPI, apiFetch } from '../../services/api';
import { 
  Mail, Trash2, CheckCircle2, Phone, Calendar, RefreshCw, Search, X, Filter, 
  UserCheck, Clock, ShieldAlert, Plus, Tag, Flame, Zap, Check, ChevronDown, ChevronUp, History, MessageSquare, Award, CornerUpRight
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface EnquiriesManagerProps {
  enquiries: Enquiry[];
  user?: User;
  coaches?: User[];
  onEnquiriesUpdated: () => void;
  onShowToast: (msg: string) => void;
}

// Format submission date safely
const formatEnquiryDate = (rawItem: any): string => {
  if (!rawItem) return 'Recently';
  const rawDate = rawItem.createdAt || rawItem.created_at || rawItem.submittedAt || rawItem.date || rawItem.timestamp;
  if (!rawDate) return 'Recently';

  try {
    const d = typeof rawDate === 'number' ? new Date(rawDate) : new Date(String(rawDate));
    if (isNaN(d.getTime())) return 'Recently';
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return 'Recently';
  }
};

// Deduplicate and normalize incoming enquiry records
const normalizeAndDeduplicateEnquiries = (rawList: any[]): Enquiry[] => {
  if (!Array.isArray(rawList)) return [];

  const deduppedMap = new Map<string, Enquiry>();

  rawList.forEach((item) => {
    if (!item || typeof item !== 'object') return;

    const rawDate = item.createdAt || item.created_at || item.submittedAt || item.date || item.timestamp;
    let validISO = '';
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        validISO = parsed.toISOString();
      }
    }
    if (!validISO) validISO = new Date().toISOString();

    const id = String(item.id || `enq-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);
    const name = String(item.name || item.client_name || item.userName || 'Website User').trim();
    const email = String(item.email || item.client_email || item.userEmail || '').trim();
    const phone = String(item.phone || item.client_phone || item.userPhone || '').trim();
    const subject = String(item.subject || item.title || 'General Website Enquiry').trim();
    const message = String(item.message || item.notes || item.description || '').trim();
    const category = item.category || '1-on-1 Coaching';
    const priority = item.priority || 'normal';
    const weightage = item.weightage || (priority === 'urgent' ? 'High Weightage (95/100)' : 'Normal Weightage (50/100)');
    const status = (['new', 'transferred_to_headcoach', 'assigned_to_coach', 'in_progress', 'resolved'].includes(item.status) ? item.status : 'new') as Enquiry['status'];
    const assignedCoach = item.assignedCoach || item.assigned_coach || (item.transferredToHeadCoach ? 'Head Coach & Team' : 'Unassigned');

    const normalized: Enquiry = {
      id,
      name,
      email,
      phone,
      subject,
      message,
      category,
      priority,
      weightage,
      createdAt: validISO,
      status,
      assignedCoach,
      assignedNotes: item.assignedNotes || item.assigned_notes || '',
      transferredToHeadCoach: Boolean(item.transferredToHeadCoach || item.status === 'transferred_to_headcoach'),
      transferredBy: item.transferredBy || undefined,
      transferredAt: item.transferredAt || undefined,
      activityLog: Array.isArray(item.activityLog) ? item.activityLog : []
    };

    // Fingerprint for deduplication: email + subject + truncated message
    const fingerprint = `${email.toLowerCase()}|${subject.toLowerCase()}|${message.slice(0, 40).toLowerCase()}`;

    // Prefer exact ID match first
    if (deduppedMap.has(id)) {
      const existing = deduppedMap.get(id)!;
      if (existing.status === 'new' && normalized.status !== 'new') existing.status = normalized.status;
      if (existing.assignedCoach === 'Unassigned' && normalized.assignedCoach !== 'Unassigned') existing.assignedCoach = normalized.assignedCoach;
      if (!existing.phone && normalized.phone) existing.phone = normalized.phone;
    } else {
      let fingerprintMatchKey: string | null = null;
      for (const [existingId, existingItem] of deduppedMap.entries()) {
        const fp = `${existingItem.email.toLowerCase()}|${existingItem.subject.toLowerCase()}|${existingItem.message.slice(0, 40).toLowerCase()}`;
        if (fp === fingerprint) {
          fingerprintMatchKey = existingId;
          break;
        }
      }

      if (fingerprintMatchKey) {
        const existing = deduppedMap.get(fingerprintMatchKey)!;
        if (existing.status === 'new' && normalized.status !== 'new') existing.status = normalized.status;
        if (existing.assignedCoach === 'Unassigned' && normalized.assignedCoach !== 'Unassigned') existing.assignedCoach = normalized.assignedCoach;
        if (!existing.phone && normalized.phone) existing.phone = normalized.phone;
      } else {
        deduppedMap.set(id, normalized);
      }
    }
  });

  return Array.from(deduppedMap.values());
};

export const EnquiriesManager: React.FC<EnquiriesManagerProps> = ({
  enquiries: propEnquiries,
  user,
  coaches = [],
  onEnquiriesUpdated,
  onShowToast
}) => {
  const currentUser = user || VelocityAPI.getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';
  const isHeadCoachRole = currentUser?.role === 'headcoach' || (currentUser?.role === 'coach' && Boolean(currentUser.coachPosition?.toLowerCase().includes('head')));
  const isHeadCoachOrAdmin = isAdmin || isHeadCoachRole || !currentUser;
  const isCoachOnly = currentUser && currentUser.role === 'coach' && !isHeadCoachRole && !isAdmin;

  // Dynamic coach list computation so newly onboarded coaches automatically appear
  const availableCoachOptions = useMemo(() => {
    const list: string[] = [];

    if (coaches && coaches.length > 0) {
      list.push(...coaches.map((c) => c.name));
    }

    try {
      const allUsers = VelocityAPI.getUsers();
      if (Array.isArray(allUsers)) {
        const coachUsers = allUsers.filter((u) => u.role === 'coach' || u.role === 'headcoach');
        list.push(...coachUsers.map((c) => c.name));
      }
    } catch { }

    const defaults = ['Shaban Faridi', 'Moheeb Khan', 'Sadeem'];
    list.push(...defaults);

    return Array.from(new Set(list.map((n) => String(n).trim()).filter(Boolean)));
  }, [coaches]);

  const [allEnquiries, setAllEnquiries] = useState<Enquiry[]>(() => normalizeAndDeduplicateEnquiries(propEnquiries));
  const [deletingEnquiry, setDeletingEnquiry] = useState<{ id: string; name: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Create Enquiry Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [createName, setCreateName] = useState<string>('');
  const [createEmail, setCreateEmail] = useState<string>('');
  const [createPhone, setCreatePhone] = useState<string>('');
  const [createSubject, setCreateSubject] = useState<string>('');
  const [createCategory, setCreateCategory] = useState<string>('1-on-1 Coaching');
  const [createPriority, setCreatePriority] = useState<'urgent' | 'high' | 'normal' | 'low'>('normal');
  const [createMessage, setCreateMessage] = useState<string>('');
  const [createAssignCoach, setCreateAssignCoach] = useState<string>('Head Coach & Team');
  const [createTransferHeadCoach, setCreateTransferHeadCoach] = useState<boolean>(true);
  const [createNotes, setCreateNotes] = useState<string>('');

  // Assign Coach Modal State
  const [assignModalEnquiry, setAssignModalEnquiry] = useState<Enquiry | null>(null);
  const [assignCoachName, setAssignCoachName] = useState<string>('Head Coach & Team');
  const [assignNotes, setAssignNotes] = useState<string>('');

  const fetchEnquiriesFromDatabase = async () => {
    setIsRefreshing(true);
    try {
      const local = VelocityAPI.getEnquiries();
      let serverData: Enquiry[] = [];

      try {
        const res = await apiFetch('/api/enquiries');
        if (res.ok) {
          serverData = await res.json();
        }
      } catch (e) {
        console.error('Failed to fetch server enquiries:', e);
      }

      const merged = normalizeAndDeduplicateEnquiries([...local, ...serverData]);
      setAllEnquiries(merged);
    } catch (e) {
      setAllEnquiries(normalizeAndDeduplicateEnquiries(VelocityAPI.getEnquiries()));
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEnquiriesFromDatabase();
  }, [propEnquiries]);

  // Filtered List
  const filteredEnquiries = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return allEnquiries.filter((e) => {
      // Role scope: Normal coach ONLY sees enquiries assigned specifically to them by Head Coach or CS
      if (isCoachOnly) {
        if (!currentUser?.name && !currentUser?.email) return false;

        const coachName = currentUser.name.toLowerCase().trim();
        const coachEmail = (currentUser.email || '').toLowerCase().trim();
        const assigned = (e.assignedCoach || '').toLowerCase().trim();

        // Hide unassigned, general lead, or generic Head Coach & Team placeholders from normal coaches
        if (!assigned || assigned === 'unassigned' || assigned === 'head coach & team' || assigned === 'head coach' || assigned.includes('unassigned')) {
          return false;
        }

        const isExplicitlyAssignedToMe = 
          assigned.includes(coachName) || 
          coachName.includes(assigned) || 
          (coachEmail && assigned.includes(coachEmail));

        if (!isExplicitlyAssignedToMe) return false;
      }

      // Status Filter
      if (statusFilter !== 'all' && e.status !== statusFilter) {
        return false;
      }

      // Category Filter
      if (categoryFilter !== 'all' && e.category !== categoryFilter) {
        return false;
      }

      // Search query matching
      if (!term) return true;

      const matchId = e.id.toLowerCase().includes(term);
      const matchName = e.name.toLowerCase().includes(term);
      const matchEmail = e.email.toLowerCase().includes(term);
      const matchPhone = e.phone ? e.phone.toLowerCase().includes(term) : false;
      const matchSubject = e.subject.toLowerCase().includes(term);
      const matchMessage = e.message.toLowerCase().includes(term);
      const matchCoach = e.assignedCoach ? e.assignedCoach.toLowerCase().includes(term) : false;
      const matchCategory = e.category ? e.category.toLowerCase().includes(term) : false;

      return matchId || matchName || matchEmail || matchPhone || matchSubject || matchMessage || matchCoach || matchCategory;
    });
  }, [allEnquiries, searchTerm, statusFilter, categoryFilter, isCoachOnly, currentUser]);

  // Stats Counters
  const stats = useMemo(() => {
    const total = allEnquiries.length;
    const transferredCount = allEnquiries.filter(e => e.status === 'transferred_to_headcoach' || e.transferredToHeadCoach).length;
    const newCount = allEnquiries.filter(e => e.status === 'new').length;
    const assignedCount = allEnquiries.filter(e => e.status === 'assigned_to_coach').length;
    const inProgressCount = allEnquiries.filter(e => e.status === 'in_progress').length;
    const resolvedCount = allEnquiries.filter(e => e.status === 'resolved').length;
    return { total, transferredCount, newCount, assignedCount, inProgressCount, resolvedCount };
  }, [allEnquiries]);

  const handleUpdateStatus = (id: string, status: Enquiry['status'], notes?: string) => {
    const updated = VelocityAPI.updateEnquiryStatus(id, status, notes, currentUser ? currentUser.name : undefined);
    onShowToast(`Updated enquiry status to "${status.toUpperCase().replace('_', ' ')}"`);
    fetchEnquiriesFromDatabase();
    onEnquiriesUpdated();
  };

  const handleOpenAssignModal = (enquiry: Enquiry) => {
    setAssignModalEnquiry(enquiry);
    setAssignCoachName(enquiry.assignedCoach || 'Head Coach');
    setAssignNotes(enquiry.assignedNotes || '');
  };

  const handleConfirmAssignCoach = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalEnquiry) return;

    VelocityAPI.updateEnquiryCoach(
      assignModalEnquiry.id,
      assignCoachName,
      assignNotes,
      currentUser ? currentUser.name : 'Head Coach'
    );

    if (assignCoachName && assignCoachName !== 'Unassigned' && assignCoachName !== 'Head Coach & Team') {
      VelocityAPI.saveCoachAssignment({
        assignmentType: 'consultation',
        referenceId: assignModalEnquiry.id,
        title: `Consultation: ${assignModalEnquiry.name}`,
        description: assignModalEnquiry.subject || 'Client Lead Consultation',
        instructions: assignNotes || assignModalEnquiry.message || `Contact client, perform initial athletic consultation, and update lead status.`,
        assignedCoachName: assignCoachName,
        clientName: assignModalEnquiry.name,
        clientEmail: assignModalEnquiry.email,
        serviceName: '1-on-1 Consultation',
        assignedByName: currentUser?.name || 'Shaban Faridi',
        assignedByRole: 'Head Coach',
        dueDate: 'Within 24 Hours',
        priority: assignModalEnquiry.priority === 'urgent' ? 'urgent' : 'high',
        status: 'assigned',
        details: { phone: assignModalEnquiry.phone, category: assignModalEnquiry.category }
      });
    }

    onShowToast(`Enquiry for "${assignModalEnquiry.name}" assigned to ${assignCoachName}!`);
    setAssignModalEnquiry(null);
    fetchEnquiriesFromDatabase();
    onEnquiriesUpdated();
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createEmail || !createSubject || !createMessage) {
      onShowToast('Name, Email, Subject, and Description are required.');
      return;
    }

    const created = VelocityAPI.createEnquiry({
      name: createName,
      email: createEmail,
      phone: createPhone,
      subject: createSubject,
      category: createCategory,
      priority: createPriority,
      message: createMessage,
      assignedCoach: createAssignCoach,
      transferredToHeadCoach: createTransferHeadCoach,
      assignedNotes: createNotes
    });

    onShowToast(`Successfully created client enquiry lead for "${created.name}"!`);
    setShowCreateModal(false);
    setCreateName('');
    setCreateEmail('');
    setCreatePhone('');
    setCreateSubject('');
    setCreateMessage('');
    setCreateNotes('');
    fetchEnquiriesFromDatabase();
    onEnquiriesUpdated();
  };

  const handleDeleteTrigger = (id: string, name: string) => {
    setDeletingEnquiry({ id, name });
  };

  const confirmDelete = async () => {
    if (deletingEnquiry) {
      const targetId = deletingEnquiry.id;
      const targetName = deletingEnquiry.name;

      setAllEnquiries(prev => prev.filter(e => e.id !== targetId));
      VelocityAPI.deleteEnquiry(targetId);

      try {
        await apiFetch(`/api/enquiries/${targetId}`, { method: 'DELETE' });
      } catch (err) {
        console.error('Failed to delete enquiry from server:', err);
      }

      onShowToast(`Deleted enquiry from "${targetName}"`);
      setDeletingEnquiry(null);
      onEnquiriesUpdated();
    }
  };

  return (
    <div className="space-y-6 text-white font-sans">
      {/* Top Header Banner */}
      <div className="bg-[#121214] border border-zinc-800 p-6 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-amber-950/60 text-amber-300 rounded border border-amber-800/60">
              {isAdmin
                ? 'ADMIN CRM • WEBSITE ENQUIRIES & LEADS'
                : isHeadCoachRole
                ? 'HEAD COACH DASHBOARD • ENQUIRIES MODULE'
                : 'COACH WORKSPACE • MY ASSIGNED ENQUIRIES'}
            </span>
            {stats.transferredCount > 0 && (
              <span className="text-[10px] font-bold text-[#CCFF00] bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700 flex items-center gap-1 animate-pulse">
                👑 {stats.transferredCount} Transferred by Customer Support
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1 flex items-center gap-2">
            <Mail className="w-6 h-6 text-[#CCFF00]" />
            {isAdmin
              ? 'ADMIN CRM ENQUIRIES & LEAD MANAGEMENT'
              : isHeadCoachRole
              ? 'HEAD COACH ENQUIRIES & LEAD ASSIGNMENT'
              : 'MY ASSIGNED CLIENT ENQUIRIES'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            {isAdmin
              ? 'Master administrative control to view, edit, update, assign coaches, and audit all client website enquiries & diagnostic leads.'
              : isHeadCoachRole
              ? 'Review website enquiries, 15-minute consultation calls, and Customer Support transferred leads. Assess requirements and assign specialized UK coaches in real-time.'
              : 'View and manage your assigned client training enquiries, update progress notes, and maintain full activity logs.'}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {isHeadCoachOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black tracking-widest px-4 py-2.5 uppercase rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-black" />
              <span>ADD NEW ENQUIRY</span>
            </button>
          )}

          <button
            onClick={fetchEnquiriesFromDatabase}
            className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase px-4 py-2.5 rounded-lg border border-zinc-700 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>REFRESH</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'all' ? 'bg-[#18181b] border-emerald-500/50 shadow-md' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-zinc-400 block tracking-widest">TOTAL</span>
          <span className="text-xl font-black text-white mt-1 block">{stats.total}</span>
        </div>

        <div
          onClick={() => setStatusFilter('transferred_to_headcoach')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'transferred_to_headcoach' ? 'bg-[#18181b] border-amber-500/50 shadow-md' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-amber-400 block tracking-widest">CS TRANSFERRED</span>
          <span className="text-xl font-black text-amber-400 mt-1 block">{stats.transferredCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('assigned_to_coach')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'assigned_to_coach' ? 'bg-[#18181b] border-[#CCFF00]/50 shadow-md' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-[#CCFF00] block tracking-widest">COACH ASSIGNED</span>
          <span className="text-xl font-black text-[#CCFF00] mt-1 block">{stats.assignedCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('in_progress')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'in_progress' ? 'bg-[#18181b] border-blue-500/50 shadow-md' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-blue-400 block tracking-widest">IN PROGRESS</span>
          <span className="text-xl font-black text-blue-400 mt-1 block">{stats.inProgressCount}</span>
        </div>

        <div
          onClick={() => setStatusFilter('resolved')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
            statusFilter === 'resolved' ? 'bg-[#18181b] border-zinc-500/50 shadow-md' : 'bg-[#121214] border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-black uppercase text-zinc-400 block tracking-widest">RESOLVED</span>
          <span className="text-xl font-black text-zinc-400 mt-1 block">{stats.resolvedCount}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(ev) => setSearchTerm(ev.target.value)}
              placeholder="Search by ticket ID (#enq-...), client name, email, phone, category, or coach..."
              className="w-full bg-[#18181b] border border-zinc-700 text-white text-xs rounded-lg pl-10 pr-9 py-2.5 focus:outline-none focus:border-[#CCFF00] transition-colors placeholder:text-zinc-500 font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer p-0.5"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#18181b] border border-zinc-700 text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#CCFF00] cursor-pointer"
          >
            <option value="all">Category: All Categories</option>
            <option value="1-on-1 Coaching">Category: 1-on-1 Coaching</option>
            <option value="Transformation Package">Category: Transformation Package</option>
            <option value="Rehab & Recovery">Category: Rehab & Recovery</option>
            <option value="Nutrition & Recomp">Category: Nutrition & Recomp</option>
            <option value="Head Coach Consultation">Category: Head Coach Consultation</option>
          </select>
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none border-t border-zinc-800/60 pt-3">
          <span className="text-[10px] font-black uppercase text-zinc-400 mr-1 shrink-0">Filter Status:</span>
          {(['all', 'transferred_to_headcoach', 'new', 'assigned_to_coach', 'in_progress', 'resolved'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-zinc-800 text-white border-[#CCFF00] shadow-sm'
                  : 'bg-[#18181b] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700'
              }`}
            >
              {st === 'all'
                ? `ALL (${stats.total})`
                : st === 'transferred_to_headcoach'
                ? `👑 CS TRANSFERRED (${stats.transferredCount})`
                : st === 'assigned_to_coach'
                ? `COACH ASSIGNED (${stats.assignedCount})`
                : `${st.replace('_', ' ')} (${stats[`${st === 'new' ? 'newCount' : st === 'in_progress' ? 'inProgressCount' : 'resolvedCount'}` as keyof typeof stats]})`}
            </button>
          ))}
        </div>
      </div>

      {/* Enquiries List */}
      {filteredEnquiries.length === 0 ? (
        <div className="bg-[#121214] border border-zinc-800 rounded-xl p-12 text-center space-y-3">
          <Mail className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-base font-black uppercase text-white">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' ? 'NO MATCHING ENQUIRIES FOUND' : 'NO ENQUIRIES FOUND'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your search terms or resetting filters to view all client enquiries.'
              : 'Website enquiries, 15-minute consultation calls, and Customer Support transferred leads will display here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEnquiries.map((e) => {
            const isExpandedTimeline = expandedTimelineId === e.id;
            const priorityLabel = e.priority === 'urgent' ? '🔥 URGENT (100/100)' : (e.priority === 'high' ? '⚡ HIGH WEIGHTAGE (80/100)' : '🟢 NORMAL WEIGHTAGE (50/100)');
            const priorityClass = e.priority === 'urgent' ? 'bg-red-950/80 text-red-300 border-red-800' : (e.priority === 'high' ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-emerald-950/80 text-emerald-300 border-emerald-800');

            return (
              <div key={e.id} className="bg-[#121214] border border-zinc-800 p-6 rounded-xl space-y-4 hover:border-zinc-700 transition-colors shadow-lg">
                {/* Header Row: ID, Badges & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                      #{e.id}
                    </span>
                    <span className="text-sm font-black text-white uppercase">{e.name}</span>
                    <span className="text-xs text-zinc-400">({e.email})</span>
                    {e.phone && (
                      <span className="text-xs text-emerald-400 font-mono flex items-center gap-1 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-900/40">
                        <Phone className="w-3 h-3 text-emerald-400" /> {e.phone}
                      </span>
                    )}

                    {/* Category Tag */}
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-800 text-[#CCFF00] px-2 py-0.5 rounded border border-zinc-700 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-[#CCFF00]" /> {e.category || '1-on-1 Coaching'}
                    </span>

                    {/* Priority & Weightage Badge */}
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${priorityClass}`}>
                      {priorityLabel}
                    </span>

                    {/* Transferred Badge */}
                    {(e.transferredToHeadCoach || e.status === 'transferred_to_headcoach') && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-950/90 text-amber-300 px-2 py-0.5 rounded border border-amber-700 flex items-center gap-1">
                        👑 CS TRANSFERRED ({e.transferredBy || 'CS Desk'})
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Status Badge Buttons */}
                    {(['new', 'transferred_to_headcoach', 'assigned_to_coach', 'in_progress', 'resolved'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(e.id, st)}
                        className={`px-2.5 py-1 text-[10px] font-black uppercase rounded border transition-all cursor-pointer ${
                          e.status === st
                            ? st === 'transferred_to_headcoach'
                              ? 'bg-amber-950/90 text-amber-300 border-amber-600 shadow-sm'
                              : st === 'assigned_to_coach'
                              ? 'bg-emerald-950/90 text-[#CCFF00] border-emerald-600 shadow-sm'
                              : st === 'in_progress'
                              ? 'bg-blue-950/90 text-blue-300 border-blue-600 shadow-sm'
                              : st === 'resolved'
                              ? 'bg-zinc-800 text-zinc-300 border-zinc-600'
                              : 'bg-zinc-800 text-white border-zinc-600'
                            : 'bg-[#18181b] text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {st === 'transferred_to_headcoach' ? 'HEADCOACH' : st === 'assigned_to_coach' ? 'ASSIGNED' : st.replace('_', ' ')}
                      </button>
                    ))}

                    {isHeadCoachOrAdmin && (
                      <button
                        onClick={() => handleDeleteTrigger(e.id, e.name)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded transition-colors ml-2 cursor-pointer"
                        title="Delete Enquiry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Subject & Body */}
                <div className="bg-[#18181b] p-4 rounded-lg border border-zinc-800/80 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#CCFF00] font-black uppercase tracking-wider text-[11px]">
                      SUBJECT: {e.subject}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      Submitted: {formatEnquiryDate(e)}
                    </span>
                  </div>
                  <p className="text-zinc-200 leading-relaxed font-normal whitespace-pre-line">{e.message}</p>
                  
                  {e.assignedNotes && (
                    <div className="mt-2 pt-2 border-t border-zinc-800 text-[11px] text-amber-300 bg-amber-950/30 p-2.5 rounded border border-amber-900/40">
                      <strong>Coach Notes &amp; Requirements:</strong> {e.assignedNotes}
                    </div>
                  )}
                </div>

                {/* Footer Row: Coach Assignment & Audit Timeline Toggle */}
                <div className="text-[11px] text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-zinc-800/60 font-semibold">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setExpandedTimelineId(isExpandedTimeline ? null : e.id)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-bold uppercase flex items-center gap-1.5 cursor-pointer bg-emerald-950/40 hover:bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800/60 transition-colors"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{isExpandedTimeline ? 'Hide Activity Trail' : `Activity & Audit Trail (${e.activityLog?.length || 1})`}</span>
                      {isExpandedTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {isHeadCoachOrAdmin && (
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <span className="text-[10px] font-black uppercase text-zinc-300">ASSIGNED COACH:</span>
                      <button
                        onClick={() => handleOpenAssignModal(e)}
                        className="bg-[#18181b] hover:bg-zinc-800 border border-zinc-700 text-[#CCFF00] text-xs font-bold px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#CCFF00] cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#CCFF00]" />
                        <span>{e.assignedCoach || 'Unassigned (General Lead)'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* EXPANDABLE ACTIVITY & AUDIT TRAIL DRAWER */}
                {isExpandedTimeline && (
                  <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-3 animate-in fade-in">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#CCFF00] flex items-center gap-1.5 border-b border-zinc-800 pb-2">
                      <History className="w-4 h-4 text-[#CCFF00]" />
                      COMPLETE ACTIVITY &amp; AUDIT TRAIL (REAL-TIME LOG)
                    </span>

                    {(!e.activityLog || e.activityLog.length === 0) ? (
                      <div className="text-[11px] text-zinc-400 italic">No activity logs recorded yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {e.activityLog.map((log) => (
                          <div key={log.id} className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white text-[11px]">
                                {log.action} <span className="text-zinc-400 font-normal">by</span> <strong className="text-emerald-400">{log.actorName} ({log.actorRole})</strong>
                              </span>
                              <span className="text-[10px] text-zinc-400 font-mono">
                                {formatEnquiryDate(log.timestamp)}
                              </span>
                            </div>
                            {log.notes && (
                              <p className="text-[11px] text-zinc-300 pl-3 border-l-2 border-emerald-500/50 mt-1 italic">
                                "{log.notes}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ASSIGN COACH MODAL */}
      {assignModalEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#121214] text-white border-0 sm:border border-zinc-800 rounded-none sm:rounded-xl p-4 sm:p-6 space-y-4 shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[9px] font-black uppercase text-[#CCFF00] bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
                  HEAD COACH CONTROL
                </span>
                <h3 className="text-base font-black text-white uppercase mt-1">Assign Coach for {assignModalEnquiry.name}</h3>
              </div>
              <button onClick={() => setAssignModalEnquiry(null)} className="text-zinc-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignCoach} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Select Coach / Specialist *</label>
                <select
                  value={assignCoachName}
                  onChange={(e) => setAssignCoachName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white font-bold cursor-pointer"
                >
                  <option value="Shaban Faridi">Shaban Faridi (Head Coach)</option>
                  {availableCoachOptions.map((cName) => (
                    <option key={cName} value={cName}>{cName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Coaching Instructions / Notes</label>
                <textarea
                  rows={3}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Needs 1-on-1 strength assessment and custom mobility routine. Client requested morning slot."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <UserCheck className="w-4 h-4 text-black" />
                <span>Confirm Coach Assignment</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW CLIENT ENQUIRY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#121214] text-white border-0 sm:border border-zinc-800 rounded-none sm:rounded-xl p-4 sm:p-6 space-y-4 shadow-2xl overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <span className="text-[9px] font-black uppercase text-[#CCFF00] bg-zinc-900 border border-zinc-700 px-2 py-0.5 rounded">
                  NEW CLIENT LEAD
                </span>
                <h3 className="text-base font-black text-white uppercase mt-1">Add New Client Enquiry</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-400 hover:text-white p-1 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="alex@example.com"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Mobile Phone Number</label>
                  <input
                    type="text"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+44 7700 900123"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Enquiry Category *</label>
                  <select
                    value={createCategory}
                    onChange={(e) => setCreateCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white font-bold cursor-pointer"
                  >
                    <option value="1-on-1 Coaching">1-on-1 Personal Coaching</option>
                    <option value="Transformation Package">Transformation Package</option>
                    <option value="Rehab & Recovery">Injury Rehab &amp; Recovery</option>
                    <option value="Nutrition & Recomp">Nutrition &amp; Recomp</option>
                    <option value="Head Coach Consultation">Head Coach Consultation</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Priority &amp; Weightage *</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white font-bold cursor-pointer"
                  >
                    <option value="urgent">🔥 Urgent (100/100 Weightage)</option>
                    <option value="high">⚡ High Weightage (80/100)</option>
                    <option value="normal">🟢 Normal Weightage (50/100)</option>
                    <option value="low">⚪ Low Weightage (20/100)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Assign Coach *</label>
                  <select
                    value={createAssignCoach}
                    onChange={(e) => setCreateAssignCoach(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white font-bold cursor-pointer"
                  >
                    <option value="None">None</option>
                    {availableCoachOptions.map((cName) => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Subject / Headline *</label>
                <input
                  type="text"
                  value={createSubject}
                  onChange={(e) => setCreateSubject(e.target.value)}
                  placeholder="e.g. 1-on-1 Consultation Request for Strength Recomp"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Client Enquiry Details / Requirements *</label>
                <textarea
                  rows={3}
                  value={createMessage}
                  onChange={(e) => setCreateMessage(e.target.value)}
                  placeholder="Describe the client's training goals, availability, and specific coaching needs..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-300 mb-1">Initial Staff Notes</label>
                <textarea
                  rows={2}
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="e.g. Client requested callback after 5 PM."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>Create &amp; Transfer Enquiry Lead</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingEnquiry}
        title="Delete Enquiry Record"
        message={`Are you sure you want to permanently delete enquiry from "${deletingEnquiry?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeletingEnquiry(null)}
      />
    </div>
  );
};
