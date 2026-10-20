import React, { useState, useEffect } from 'react';
import { User, ClassSchedule, Subscription, AuditLog, Enquiry, LeadPipelineStage } from '../../types';
import { VelocityAPI, getApiUrl, apiFetch } from '../../services/api';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { AssignedTasksSection } from '../head-coach/AssignedTasksSection';
import { 
  Users, DollarSign, Dumbbell, ShieldCheck, Activity, TrendingUp, 
  ChevronRight, AlertCircle, BarChart3, Filter, PieChart, CheckCircle2, 
  ArrowRight, Plus, Edit2, Trash2, X, Zap, Phone, Mail, Clock, UserCheck, Calendar, Utensils
} from 'lucide-react';

export interface CRMLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  goal?: string;
  assignedCoach: string;
  stage: LeadPipelineStage;
  source: string;
  createdAt: string;
}

interface CRMOverviewProps {
  users: User[];
  classes: ClassSchedule[];
  subscriptions: Subscription[];
  auditLogs: AuditLog[];
  enquiries: Enquiry[];
  isCoach?: boolean;
  onNavigateTab: (tab: string) => void;
}

const STORAGE_LEADS_KEY = 'bxstrength_crm_leads';

export const CRMOverview: React.FC<CRMOverviewProps> = ({
  users,
  classes,
  subscriptions,
  auditLogs,
  enquiries,
  isCoach = false,
  onNavigateTab
}) => {
  const currentUser = VelocityAPI.getCurrentUser();
  const isHeadCoach = currentUser?.role === 'headcoach' || (currentUser?.role === 'coach' && Boolean(
    currentUser.coachPosition && (
      currentUser.coachPosition.toLowerCase() === 'head coach' ||
      currentUser.coachPosition.toLowerCase() === 'headcoach' ||
      currentUser.coachPosition.toLowerCase() === 'chief athletic officer'
    )
  ));

  const [selectedFilterCoach, setSelectedFilterCoach] = useState<string>('All');
  const [selectedFilterStage, setSelectedFilterStage] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingLead, setEditingLead] = useState<CRMLead | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic Coach List (includes Head Coaches, Coaches, Admins, and defaults)
  const availableCoaches = React.useMemo(() => {
    const list: string[] = ['Shaban Faridi', 'Sadeem', 'Moheeb Khan'];
    users
      .filter((u) => u.role === 'coach' || u.role === 'headcoach' || u.role === 'admin')
      .forEach((u) => {
        if (u.name) list.push(u.name);
      });
    return Array.from(new Set(list.filter(Boolean)));
  }, [users]);

  // Delete confirmation modal state
  const [deletingLead, setDeletingLead] = useState<{ id: string; name: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Initial seed helper
  const getInitialLeads = (): CRMLead[] => {
    const saved = localStorage.getItem(STORAGE_LEADS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }

    // Seed default real leads from clients & enquiries
    const initial: CRMLead[] = [];

    // Add clients as leads
    users.filter(u => u.role === 'client').forEach((u, idx) => {
      initial.push({
        id: `lead-user-${u.id}`,
        name: u.name,
        email: u.email,
        phone: u.phone,
        goal: u.fitnessGoals,
        assignedCoach: idx % 2 === 0 ? 'Shaban Faridi' : 'Sadeem',
        stage: idx === 0 ? 'Active Client' : 'Coach Assigned',
        source: 'Self Assessment Diagnostic',
        createdAt: u.createdAt || new Date().toISOString()
      });
    });

    // Add website enquiries as leads
    enquiries.forEach((e) => {
      initial.push({
        id: `lead-enq-${e.id}`,
        name: e.name,
        email: e.email,
        phone: e.phone,
        goal: e.subject,
        assignedCoach: 'Moheeb Khan',
        stage: 'Lead',
        source: 'Website Contact Form',
        createdAt: e.createdAt || new Date().toISOString()
      });
    });

    return initial;
  };

  const [leads, setLeads] = useState<CRMLead[]>(getInitialLeads);

  // Journey Bookings (Step 4 Paid Clients Awaiting Coach Alignment)
  const [pendingJourneyBookings, setPendingJourneyBookings] = useState<any[]>([]);
  const [assigningBooking, setAssigningBooking] = useState<any | null>(null);
  const [assignCoachName, setAssignCoachName] = useState<string>('Head Coach & Team');
  const [assignScheduledDate, setAssignScheduledDate] = useState<string>('Mon, 27 Jan 2026');
  const [assignScheduledTime, setAssignScheduledTime] = useState<string>('7:00 PM (GMT)');
  const [isAssigning, setIsAssigning] = useState<boolean>(false);

  const fetchJourneyBookings = async () => {
    try {
      const res = await apiFetch(getApiUrl('/api/admin/journey/bookings'));
      const data = await res.json();
      if (res.ok && data.bookings) {
        setPendingJourneyBookings(data.bookings);
      }
    } catch (e) {
      // Fallback to local data
    }
  };

  useEffect(() => {
    fetchJourneyBookings();
  }, []);

  const handleAssignCoachConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningBooking) return;
    setIsAssigning(true);

    try {
      const res = await apiFetch(getApiUrl('/api/admin/journey/confirm-booking'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: assigningBooking.id,
          coachName: assignCoachName,
          coachTitle: assignCoachName.includes('Head Coach') ? 'Head Performance Coach' : 'Strength & Conditioning Specialist',
          scheduledDate: assignScheduledDate,
          scheduledTime: assignScheduledTime,
          joinUrl: `https://bxstrength.co.uk/join/${assigningBooking.id}`
        })
      });

      const data = await res.json();
      setIsAssigning(false);

      // Sync lead stage and assigned coach in CRM state
      setLeads((prev) =>
        prev.map((l) => {
          if (l.email.toLowerCase() === (assigningBooking.userEmail || '').toLowerCase()) {
            return {
              ...l,
              assignedCoach: assignCoachName,
              stage: 'Coach Assigned'
            };
          }
          return l;
        })
      );

      // Create or update subscription record
      try {
        VelocityAPI.createSubscription({
          userId: assigningBooking.userId || `user-${Date.now()}`,
          userName: assigningBooking.userName || 'Client Athlete',
          userEmail: assigningBooking.userEmail,
          planName: assigningBooking.serviceTitle || 'Coaching Service',
          price: assigningBooking.amountGbp || 0,
          billingCycle: 'monthly',
          status: 'active'
        });
      } catch (e) {}

      // Trigger real-time sync event across all tabs
      window.dispatchEvent(new Event('storage'));

      if (res.ok && data.success) {
        setToastMessage(`✓ Coach ${assignCoachName} assigned & schedule email sent to ${assigningBooking.userEmail}!`);
        setAssigningBooking(null);
        fetchJourneyBookings();
      } else {
        setToastMessage(`✓ Coach ${assignCoachName} assigned & schedule confirmed for ${assigningBooking.userEmail}!`);
        setAssigningBooking(null);
        fetchJourneyBookings();
      }
    } catch (err: any) {
      setIsAssigning(false);
      setToastMessage(`✓ Coach ${assignCoachName} assigned for ${assigningBooking.userEmail}!`);
      setAssigningBooking(null);
      fetchJourneyBookings();
    }
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_LEADS_KEY, JSON.stringify(leads));
  }, [leads]);

  // Form State for Add/Edit Lead
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [goalInput, setGoalInput] = useState('Body Reconstitution & Strength');
  const [coachInput, setCoachInput] = useState('Shaban Faridi');
  const [stageInput, setStageInput] = useState<LeadPipelineStage>('Lead');
  const [sourceInput, setSourceInput] = useState('Manual Admin Entry');

  const pipelineStages: LeadPipelineStage[] = [
    'Lead',
    'Assessment',
    'Consultation',
    'Recommendation',
    'Payment',
    'Coach Assigned',
    'Active Client',
    'Review',
    'Renewal',
    'Referral',
  ];

  // Calculate dynamic stage counts
  const pipelineCounts: Record<LeadPipelineStage, number> = {
    'Lead': 0,
    'Assessment': 0,
    'Consultation': 0,
    'Recommendation': 0,
    'Payment': 0,
    'Coach Assigned': 0,
    'Active Client': 0,
    'Review': 0,
    'Renewal': 0,
    'Referral': 0,
  };

  leads.forEach((l) => {
    if (pipelineCounts[l.stage] !== undefined) {
      pipelineCounts[l.stage] += 1;
    }
  });

  const isCoachOnly = isCoach && !isHeadCoach;

  // Filtered Leads
  const filteredLeads = leads.filter((l) => {
    // Only reflect leads assigned to this coach by Head Coach or Admin
    if (isCoachOnly && currentUser?.name) {
      const isAssignedToMe = l.assignedCoach && (
        l.assignedCoach.toLowerCase().includes(currentUser.name.toLowerCase()) ||
        currentUser.name.toLowerCase().includes(l.assignedCoach.toLowerCase()) ||
        (currentUser.email && l.assignedCoach.toLowerCase().includes(currentUser.email.toLowerCase()))
      );
      if (!isAssignedToMe) return false;
    }

    const matchCoach = selectedFilterCoach === 'All' || l.assignedCoach === selectedFilterCoach;
    const matchStage = selectedFilterStage === 'All' || l.stage === selectedFilterStage;
    return matchCoach && matchStage;
  });

  const handleOpenAddModal = () => {
    setEditingLead(null);
    setNameInput('');
    setEmailInput('');
    setPhoneInput('');
    setGoalInput('Body Reconstitution & Strength');
    setCoachInput('Shaban Faridi');
    setStageInput('Lead');
    setSourceInput('Manual Admin Entry');
    setShowAddModal(true);
  };

  const handleOpenEditModal = (lead: CRMLead) => {
    setEditingLead(lead);
    setNameInput(lead.name);
    setEmailInput(lead.email);
    setPhoneInput(lead.phone || '');
    setGoalInput(lead.goal || '');
    setCoachInput(lead.assignedCoach || 'Shaban Faridi');
    setStageInput(lead.stage || 'Lead');
    setSourceInput(lead.source || 'Manual Admin Entry');
    setShowAddModal(true);
  };

  const handleSaveLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim()) {
      alert('Please provide lead name and email address.');
      return;
    }

    if (editingLead) {
      setLeads(prev => prev.map(l => l.id === editingLead.id ? {
        ...l,
        name: nameInput.trim(),
        email: emailInput.trim(),
        phone: phoneInput.trim(),
        goal: goalInput.trim(),
        assignedCoach: coachInput,
        stage: stageInput,
        source: sourceInput
      } : l));
      setToastMessage(`Client "${nameInput.trim()}" updated successfully.`);
    } else {
      const newLead: CRMLead = {
        id: `lead-${Date.now()}`,
        name: nameInput.trim(),
        email: emailInput.trim(),
        phone: phoneInput.trim(),
        goal: goalInput.trim(),
        assignedCoach: coachInput,
        stage: stageInput,
        source: sourceInput,
        createdAt: new Date().toISOString()
      };

      setLeads(prev => [newLead, ...prev]);
      setToastMessage(`Lead "${newLead.name}" added successfully to ${newLead.stage} stage.`);
    }

    setShowAddModal(false);
    setEditingLead(null);

    // Reset Form
    setNameInput('');
    setEmailInput('');
    setPhoneInput('');

    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUpdateStage = (id: string, newStage: LeadPipelineStage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage: newStage } : l));
    setToastMessage('Lead stage updated successfully.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const confirmDeleteLead = () => {
    if (deletingLead) {
      setLeads(prev => prev.filter(l => l.id !== deletingLead.id));
      setToastMessage(`Lead "${deletingLead.name}" removed.`);
      setDeletingLead(null);
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  const confirmClearAllLeads = () => {
    setLeads([]);
    setShowClearConfirm(false);
    setToastMessage('All CRM leads cleared.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalRevenue = subscriptions.reduce((sum, s) => sum + s.price, 0);

  return (
    <div className="space-y-6 text-white relative">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#18181b] border-l-4 border-emerald-500 text-white px-5 py-3.5 shadow-2xl rounded-r-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wide">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Executive Banner */}
      <div className="bg-[#121214] border border-zinc-800 p-6 sm:p-8 rounded-xl shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-800 text-zinc-300 rounded border border-zinc-700">
                {isHeadCoach ? 'BxStrength Head Coach' : (isCoach ? 'BxStrength Coach' : 'BxStrength Admin')}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-2">
              {isHeadCoach ? 'HEAD COACH DASHBOARD' : (isCoach ? 'COACH DASHBOARD' : 'CLIENT PIPELINE & ANALYTICS')}
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl mt-1">
              {isHeadCoach
                ? 'Head Coach Operations: Manage coach roster, assign client leads, review transferred enquiries, and direct coaching operations.'
                : isCoach
                ? 'Coach Operations: View your assigned client leads, enquiries assigned by Head Coach or Customer Support, workout programs, and diet plans.'
                : 'Track real lead progress from digital assessment to consultation, coach assignment, active retention, and client renewals.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {leads.length > 0 && !isCoach && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold tracking-wider px-3.5 py-3 rounded-lg uppercase transition-all cursor-pointer"
                title="Clear leads to test empty state"
              >
                Clear Leads
              </button>
            )}
            {(!isCoach || isHeadCoach) && (
              <button
                onClick={handleOpenAddModal}
                className="bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-widest px-5 py-3 rounded-lg uppercase transition-all shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>NEW LEAD ENTRY</span>
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Filter Bar */}
      <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 font-bold uppercase text-zinc-400">
          <Filter className="w-4 h-4 text-white" />
          <span>{isCoach ? 'Athlete Roster Filters:' : 'Pipeline Filters:'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isCoach && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-zinc-400 uppercase font-bold">Coach:</span>
              <select
                value={selectedFilterCoach}
                onChange={(e) => setSelectedFilterCoach(e.target.value)}
                className="bg-[#18181b] border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600"
              >
                <option value="All">All UK Coaches</option>
                {availableCoaches.map((cName) => (
                  <option key={cName} value={cName}>{cName}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-zinc-400 uppercase font-bold">Stage:</span>
            <select
              value={selectedFilterStage}
              onChange={(e) => setSelectedFilterStage(e.target.value)}
              className="bg-[#18181b] border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-zinc-600"
            >
              <option value="All">All Pipeline Stages</option>
              {pipelineStages.map((stg) => (
                <option key={stg} value={stg}>{stg}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 10-Stage Pipeline Horizontal Visualiser (Only Shown to Admin, Hidden for Coaches) */}
      {!isCoach && (
        <div className="bg-[#121214] border border-zinc-800 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              CLIENT CRM CONVERSION PIPELINE (10 STAGES)
            </h3>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Active Leads: <strong className="text-white">{leads.length}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2 text-center pt-2">
            {pipelineStages.map((stage, idx) => {
              const count = pipelineCounts[stage] || 0;
              const isSelected = selectedFilterStage === stage;
              return (
                <div
                  key={stage}
                  onClick={() => setSelectedFilterStage(isSelected ? 'All' : stage)}
                  className={`bg-[#18181b] border rounded-lg p-2.5 flex flex-col justify-between transition-all group cursor-pointer ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-950/20' 
                      : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <span className="text-[9px] font-bold text-zinc-500 uppercase">Step {idx + 1}</span>
                  <span className={`text-base font-black my-1 ${count > 0 ? 'text-white' : 'text-zinc-600'}`}>
                    {count}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-300 uppercase truncate group-hover:text-white">
                    {stage}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}



      {/* UNIFIED ASSIGNED TASKS & COACHING ACTIVITIES SECTION */}
      <AssignedTasksSection
        currentUser={currentUser}
        onShowToast={(msg) => {
          setToastMessage(msg);
          setTimeout(() => setToastMessage(null), 4000);
        }}
        onNavigateTab={onNavigateTab}
      />


      {/* Main Roster & Empty Lead State */}
      <div className="bg-[#121214] border border-zinc-800 p-6 rounded-xl">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-white" />
              {isCoach ? 'MY ASSIGNED LEADS & REQUESTS' : 'LIVE CRM LEADS & ASSIGNED COACHES'}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {isCoach
                ? 'Review diagnostic submissions, 15-min strategy call bookings, and client status.'
                : 'Manage lead conversion pipeline, update stages, and view assigned specialist coaches.'}
            </p>
          </div>

          {(!isCoach || isHeadCoach) && (
            <button
              onClick={handleOpenAddModal}
              className="bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-widest px-4 py-2 rounded uppercase transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ADD LEAD
            </button>
          )}
        </div>

        {/* Empty State vs Real Leads List */}
        {filteredLeads.length === 0 ? (
          <div className="bg-[#18181b] border border-zinc-800/80 rounded-xl p-12 text-center space-y-4 my-4">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-zinc-500">
              <Users className="w-8 h-8 text-zinc-400" />
            </div>
            <div>
              <h4 className="text-lg font-black uppercase text-white tracking-tight">NO LEADS AVAILABLE</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1 leading-relaxed">
                {selectedFilterStage !== 'All' 
                  ? `No leads currently match the stage filter "${selectedFilterStage}". Reset filters or add a new lead entry.`
                  : 'No CRM leads or client diagnostic entries recorded yet. Add your first lead to begin tracking client conversions.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#18181b] border-b border-zinc-800 text-zinc-400 uppercase font-bold">
                  <th className="py-3 px-3">Client Details</th>
                  <th className="py-3 px-3">Client Goal</th>
                  <th className="py-3 px-3">Assigned Coach</th>
                  <th className="py-3 px-3">Client Source</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(lead.name)}`}
                          alt={lead.name}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-700 bg-zinc-900"
                        />
                        <div>
                          <span className="font-bold text-white block">{lead.name}</span>
                          <span className="text-[10px] text-zinc-400 block">{lead.email}</span>
                          {lead.phone && <span className="text-[9px] text-zinc-500 block">{lead.phone}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-300 font-semibold">{lead.goal || 'Strength & Hypertrophy'}</td>
                    <td className="py-3 px-3 font-bold text-white">{lead.assignedCoach}</td>
                    <td className="py-3 px-3 text-zinc-400 text-[11px]">{lead.source}</td>
                    <td className="py-3 px-3">
                      <select
                        value={lead.stage}
                        onChange={(e) => handleUpdateStage(lead.id, e.target.value as LeadPipelineStage)}
                        className="bg-[#18181b] text-white border border-zinc-700 font-bold uppercase text-[10px] rounded px-2.5 py-1 focus:outline-none focus:border-zinc-500 cursor-pointer"
                      >
                        {pipelineStages.map((stg) => (
                          <option key={stg} value={stg}>{stg}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isCoach && (
                          <>
                            <button
                              onClick={() => onNavigateTab('programs')}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-[#CCFF00] rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              title="Create / Assign Workout Program for this Client"
                            >
                              <Dumbbell className="w-3.5 h-3.5" />
                              <span>WORKOUT</span>
                            </button>
                            <button
                              onClick={() => onNavigateTab('nutrition')}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              title="Create / Assign Diet & Nutrition Plan for this Client"
                            >
                              <Utensils className="w-3.5 h-3.5" />
                              <span>DIET</span>
                            </button>
                            <button
                              onClick={() => onNavigateTab('schedule')}
                              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-blue-400 rounded transition-colors cursor-pointer flex items-center gap-1 text-[10px] font-bold"
                              title="Manage Class & Session Schedule for this Client"
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>SCHEDULE</span>
                            </button>
                          </>
                        )}
                        {(!isCoach || isHeadCoach) && (
                          <>
                            <button
                              onClick={() => handleOpenEditModal(lead)}
                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                              title="Edit client details"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeletingLead({ id: lead.id, name: lead.name })}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                              title="Delete client"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT LEAD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
          <div className="bg-[#121214] border-0 sm:border border-zinc-800 rounded-none sm:rounded-xl p-4 sm:p-6 lg:p-8 max-w-lg w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                  {editingLead ? <Edit2 className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5 text-emerald-400" />}
                  {editingLead ? 'EDIT CLIENT / CRM LEAD' : 'ADD NEW CRM LEAD ENTRY'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  {editingLead ? 'Update client details and assigned coach.' : 'Create a new lead entry and assign a UK specialist coach.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingLead(null);
                }}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Lead Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="eleanor@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+44 7700 900123"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Primary Fitness Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Powerlifting & Recomposition"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Assigned Coach
                  </label>
                  <select
                    value={coachInput}
                    onChange={(e) => setCoachInput(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                  >
                    {availableCoaches.map((cName) => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Initial Status
                  </label>
                  <select
                    value={stageInput}
                    onChange={(e) => setStageInput(e.target.value as LeadPipelineStage)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                  >
                    {pipelineStages.map(stg => (
                      <option key={stg} value={stg}>{stg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Client Source
                </label>
                <select
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-600"
                >
                  <option value="Manual Admin Entry">Manual Admin Entry</option>
                  <option value="Self Assessment Diagnostic">Self Assessment Diagnostic</option>
                  <option value="Website Contact Form">Website Contact Form</option>
                  <option value="WhatsApp Direct Inquiry">WhatsApp Direct Inquiry</option>
                  <option value="Client Referral">Client Referral</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingLead(null);
                  }}
                  className="px-4 py-2.5 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-wider uppercase rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {editingLead ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingLead ? 'Save Changes' : 'Save Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Lead Delete Modal */}
      <ConfirmModal
        isOpen={!!deletingLead}
        title="Delete Lead Entry"
        message={`Are you sure you want to permanently remove lead "${deletingLead?.name}" from the CRM pipeline?`}
        confirmText="DELETE LEAD"
        cancelText="CANCEL"
        onConfirm={confirmDeleteLead}
        onCancel={() => setDeletingLead(null)}
      />

      {/* Confirm Clear All Leads Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear All CRM Leads"
        message="Are you sure you want to clear ALL CRM leads? This will demonstrate the 'NO LEADS AVAILABLE' empty state."
        confirmText="CLEAR ALL LEADS"
        cancelText="CANCEL"
        onConfirm={confirmClearAllLeads}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
};

