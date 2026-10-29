import React, { useState, useEffect } from 'react';
import { CoachAssignment, CoachAssignmentType, AssignmentStatus, User, WorkoutProgram, NutritionPlan, ClassSchedule } from '../../types';
import { VelocityAPI } from '../../services/api';
import { 
  Dumbbell, Calendar, Utensils, UserCheck, CheckSquare, Clock, ShieldCheck, 
  AlertTriangle, CheckCircle2, XCircle, Send, Edit, Eye, X, MessageSquare, Filter, Layers, ChevronRight, Activity, Plus
} from 'lucide-react';

interface AssignedTasksSectionProps {
  currentUser?: User;
  onShowToast: (msg: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const AssignedTasksSection: React.FC<AssignedTasksSectionProps> = ({
  currentUser,
  onShowToast,
  onNavigateTab
}) => {
  const user = currentUser || VelocityAPI.getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const isHeadCoach = user?.role === 'headcoach' || (user?.role === 'coach' && Boolean(
    user.coachPosition && (
      user.coachPosition.toLowerCase() === 'head coach' ||
      user.coachPosition.toLowerCase() === 'headcoach' ||
      user.coachPosition.toLowerCase() === 'chief athletic officer'
    )
  ));
  const isHeadCoachOrAdmin = isAdmin || isHeadCoach || !user;

  const [assignments, setAssignments] = useState<CoachAssignment[]>([]);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');

  // Managing / Viewing Modal
  const [viewingAssignment, setViewingAssignment] = useState<CoachAssignment | null>(null);

  // Action Notes Modal
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: 'accept' | 'request_changes' | 'reject' | 'submit_review' | 'headcoach_approve';
    assignment: CoachAssignment;
  } | null>(null);
  const [actionNotes, setActionNotes] = useState('');

  // Create Assignment Modal (for Admin & Head Coach)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newInstructions, setNewInstructions] = useState('');
  const [newType, setNewType] = useState<CoachAssignmentType>('task');
  const [newAssignedCoach, setNewAssignedCoach] = useState('Shaban Faridi');
  const [newClientName, setNewClientName] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const coachOptions = React.useMemo(() => {
    const list: string[] = ['Shaban Faridi', 'Sadeem', 'Moheeb Khan'];
    try {
      const allUsers = VelocityAPI.getUsers();
      if (Array.isArray(allUsers)) {
        allUsers
          .filter((u) => u.role === 'coach' || u.role === 'headcoach' || u.role === 'admin')
          .forEach((u) => {
            if (u.name) list.push(u.name);
          });
      }
    } catch {}
    return Array.from(new Set(list.filter(Boolean)));
  }, []);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    VelocityAPI.saveCoachAssignment({
      title: newTitle.trim(),
      description: newDescription.trim(),
      instructions: newInstructions.trim(),
      assignmentType: newType,
      assignedCoachName: newAssignedCoach,
      clientName: newClientName.trim() || 'Client',
      clientEmail: newClientEmail.trim() || undefined,
      priority: newPriority,
      status: 'assigned',
      assignedByName: user?.name || 'Admin',
      assignedByRole: isHeadCoach ? 'Head Coach' : isAdmin ? 'Admin' : 'Coach'
    });

    onShowToast(`✓ Assigned "${newTitle}" to ${newAssignedCoach}!`);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDescription('');
    setNewInstructions('');
    setNewClientName('');
    setNewClientEmail('');
    loadAssignments();
  };

  const loadAssignments = async () => {
    try {
      const coachFilter = isHeadCoachOrAdmin ? undefined : user?.name;
      const data = await VelocityAPI.fetchCoachAssignments(coachFilter);
      setAssignments(data);
    } catch {
      setAssignments([]);
    }
  };

  useEffect(() => {
    loadAssignments();
    const handleUpdate = () => loadAssignments();
    window.addEventListener('bxstrength_assignments_updated', handleUpdate);
    window.addEventListener('bxstrength_programs_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    const interval = setInterval(() => { if (!document.hidden) loadAssignments(); }, 15000); // paused in background tabs

    return () => {
      window.removeEventListener('bxstrength_assignments_updated', handleUpdate);
      window.removeEventListener('bxstrength_programs_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      clearInterval(interval);
    };
  }, [user?.id, user?.name]);

  const filteredAssignments = assignments.filter((asgn) => {
    const matchType = selectedType === 'ALL' || asgn.assignmentType.toUpperCase() === selectedType;
    const matchStatus = selectedStatus === 'ALL' || (asgn.status || 'assigned').toUpperCase() === selectedStatus;
    const matchPriority = selectedPriority === 'ALL' || (asgn.priority || 'medium').toUpperCase() === selectedPriority;
    return matchType && matchStatus && matchPriority;
  });

  const getTypeIcon = (type: CoachAssignmentType) => {
    switch (type) {
      case 'workout_program':
        return <Dumbbell className="w-4 h-4 text-pink-400" />;
      case 'class_schedule':
        return <Calendar className="w-4 h-4 text-amber-400" />;
      case 'nutrition_plan':
        return <Utensils className="w-4 h-4 text-emerald-400" />;
      case 'consultation':
        return <UserCheck className="w-4 h-4 text-sky-400" />;
      default:
        return <CheckSquare className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTypeBadge = (type: CoachAssignmentType) => {
    switch (type) {
      case 'workout_program':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-pink-950/80 text-pink-300 border border-pink-800/80 rounded">Workout Program</span>;
      case 'class_schedule':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-950/80 text-amber-300 border border-amber-800/80 rounded">Class Schedule</span>;
      case 'nutrition_plan':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 rounded">Nutrition Plan</span>;
      case 'consultation':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-sky-950/80 text-sky-300 border border-sky-800/80 rounded">Consultation</span>;
      default:
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-purple-950/80 text-purple-300 border border-purple-800/80 rounded">Training Task</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'urgent':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-950 text-red-400 border border-red-800 rounded animate-pulse">URGENT</span>;
      case 'high':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-orange-950 text-orange-400 border border-orange-800 rounded">HIGH</span>;
      case 'medium':
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded">MEDIUM</span>;
      default:
        return <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-gray-800 text-gray-400 border border-gray-700 rounded">LOW</span>;
    }
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'assigned':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-amber-950/80 text-amber-300 border border-amber-800 rounded flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" /> Assigned — Pending Review
          </span>
        );
      case 'coach_accepted':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-blue-950/80 text-blue-300 border border-blue-800 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-blue-400" /> Accepted & In Progress
          </span>
        );
      case 'in_progress':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-sky-950/80 text-sky-300 border border-sky-800 rounded flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-400" /> In Progress
          </span>
        );
      case 'headcoach_review':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-purple-950/80 text-purple-300 border border-purple-800 rounded flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-purple-400 animate-pulse" /> Submitted for Review
          </span>
        );
      case 'approved':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800 rounded flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Head Coach Approved
          </span>
        );
      case 'published_to_client':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-teal-950/80 text-teal-300 border border-teal-800 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-teal-400" /> Published to Client
          </span>
        );
      case 'change_requested':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-orange-950/80 text-orange-300 border border-orange-800 rounded flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-400" /> Revisions Requested
          </span>
        );
      case 'coach_rejected':
      case 'rejected':
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-red-950/80 text-red-300 border border-red-800 rounded flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-400" /> Rejected
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-gray-800 text-gray-300 border border-gray-700 rounded">
            {status}
          </span>
        );
    }
  };

  const handleExecuteAction = () => {
    if (!actionModal) return;
    const { type, assignment } = actionModal;

    if (type === 'accept') {
      VelocityAPI.updateCoachAssignmentStatus(assignment.id, 'coach_accepted', actionNotes || 'Coach accepted assignment');
      onShowToast(`Accepted assignment "${assignment.title}"`);
    } else if (type === 'reject') {
      VelocityAPI.updateCoachAssignmentStatus(assignment.id, 'coach_rejected', actionNotes || 'Assignment rejected');
      onShowToast(`Rejected assignment "${assignment.title}"`);
    } else if (type === 'request_changes') {
      VelocityAPI.updateCoachAssignmentStatus(assignment.id, 'change_requested', actionNotes || 'Requested revisions');
      onShowToast(`Requested changes on "${assignment.title}"`);
    } else if (type === 'submit_review') {
      VelocityAPI.updateCoachAssignmentStatus(assignment.id, 'headcoach_review', actionNotes || 'Submitted for Head Coach approval');
      onShowToast(`Submitted "${assignment.title}" for Head Coach review`);
    } else if (type === 'headcoach_approve') {
      VelocityAPI.updateCoachAssignmentStatus(assignment.id, 'approved', actionNotes || 'Approved by Head Coach');
      onShowToast(`Head Coach approved "${assignment.title}"`);
    }

    setActionModal(null);
    loadAssignments();
  };

  const handlePublishToClient = (asgn: CoachAssignment) => {
    VelocityAPI.updateCoachAssignmentStatus(asgn.id, 'published_to_client', 'Published to client dashboard', true);
    onShowToast(`Published "${asgn.title}" live to ${asgn.clientName || 'Client Dashboard'}!`);
    loadAssignments();
  };

  return (
    <div className="bg-[#121214] border border-zinc-800 p-6 rounded-xl space-y-5 shadow-2xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-[#CCFF00] text-black font-extrabold rounded">
              COACH WORKSPACE
            </span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
              Live Head Coach Sync
            </span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#CCFF00]" />
            ASSIGNED TASKS & COACHING ACTIVITIES ({filteredAssignments.length})
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
            Real-time coaching assignments from Head Coach Shaban Faridi. Review, manage, update, and publish workout programs, class schedules, diet plans, consultations, and tasks.
          </p>
        </div>

        {/* Filter Type Pills & Assign Button */}
        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {isHeadCoachOrAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-wider px-3.5 py-1.5 rounded uppercase transition-all shadow-md cursor-pointer flex items-center gap-1.5 mr-1"
            >
              <Plus className="w-3.5 h-3.5 text-black" />
              <span>ASSIGN TO COACH</span>
            </button>
          )}

          {[
            { id: 'ALL', label: 'ALL' },
            { id: 'WORKOUT_PROGRAM', label: 'WORKOUTS' },
            { id: 'CLASS_SCHEDULE', label: 'CLASSES' },
            { id: 'NUTRITION_PLAN', label: 'NUTRITION' },
            { id: 'CONSULTATION', label: 'CALLS' },
            { id: 'TASK', label: 'TASKS' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id)}
              className={`px-3 py-1.5 text-[11px] font-black uppercase rounded transition-all cursor-pointer ${
                selectedType === tab.id
                  ? 'bg-white text-black font-extrabold shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Assignment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAssignments.length === 0 ? (
          <div className="col-span-full bg-zinc-950 border border-zinc-800 p-12 text-center text-zinc-500 rounded-xl space-y-2">
            <Layers className="w-10 h-10 mx-auto text-zinc-600" />
            <h3 className="text-xs font-black uppercase text-zinc-400 tracking-wider">NO COACH ASSIGNMENTS FOUND</h3>
            <p className="text-[11px] text-zinc-500 max-w-md mx-auto">
              Any workout programs, class schedules, nutrition plans, consultations, or tasks assigned by Head Coach will appear here automatically.
            </p>
          </div>
        ) : (
          filteredAssignments.map((asgn) => {
            const isApprovedOrPublished = asgn.status === 'approved' || asgn.status === 'published_to_client' || asgn.isPublishedToClient;
            const canPublish = isApprovedOrPublished || isHeadCoachOrAdmin;

            return (
              <div
                key={asgn.id}
                className="bg-[#18181b] border border-zinc-800 p-5 rounded-xl flex flex-col justify-between hover:border-zinc-700 transition-all shadow-lg relative"
              >
                <div>
                  {/* Top Bar: Type, Priority, Assigner */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 bg-zinc-900/90 p-2.5 border border-zinc-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getTypeBadge(asgn.assignmentType)}
                      {getPriorityBadge(asgn.priority || 'medium')}
                    </div>
                    <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                      Assigned by {asgn.assignedByName} ({asgn.assignedByRole})
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-black uppercase text-white mb-1 flex items-center gap-2">
                    {getTypeIcon(asgn.assignmentType)}
                    {asgn.title}
                  </h3>
                  {asgn.description && (
                    <p className="text-xs text-zinc-400 mb-3 line-clamp-2">{asgn.description}</p>
                  )}

                  {/* Client & Service Badge */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-zinc-900 p-2 border border-zinc-800 rounded">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">CLIENT NAME</span>
                      <span className="font-bold text-emerald-400 truncate block">{asgn.clientName && asgn.clientName !== 'Group Class Athletes' ? asgn.clientName : 'All Clients'}</span>
                      {asgn.clientEmail && <span className="text-[10px] text-zinc-500 font-mono truncate block">{asgn.clientEmail}</span>}
                    </div>

                    <div className="bg-zinc-900 p-2 border border-zinc-800 rounded">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase block">ASSIGNED COACH & SERVICE</span>
                      <span className="font-bold text-amber-300 truncate block">{asgn.assignedCoachName}</span>
                      <span className="text-[10px] text-zinc-400 truncate block">{asgn.serviceName || 'BxStrength Protocol'}</span>
                    </div>
                  </div>

                  {/* Status & Instructions */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      {getStatusBadge(asgn.status || 'assigned')}
                      <span className="text-[10px] font-mono text-zinc-500">
                        {new Date(asgn.assignedAt || asgn.createdAt).toLocaleDateString()} {new Date(asgn.assignedAt || asgn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {asgn.instructions && (
                      <div className="bg-zinc-950 p-2.5 border border-zinc-800/80 rounded text-[11px] text-zinc-300">
                        <span className="font-bold text-amber-400 block text-[10px] uppercase mb-0.5">Focus Instructions:</span>
                        {asgn.instructions}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="pt-3 border-t border-zinc-800 space-y-2">
                  {/* Row 1: Coach Review & Approval Actions */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(asgn.status === 'assigned' || asgn.status === 'change_requested' || !asgn.status) && (
                      <>
                        <button
                          onClick={() => setActionModal({ isOpen: true, type: 'accept', assignment: asgn })}
                          className="bg-emerald-800 hover:bg-emerald-700 text-white text-[11px] font-bold px-2.5 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accept Assignment
                        </button>
                        <button
                          onClick={() => setActionModal({ isOpen: true, type: 'request_changes', assignment: asgn })}
                          className="bg-orange-950 hover:bg-orange-900 text-orange-300 border border-orange-800 text-[11px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Request Revisions
                        </button>
                        <button
                          onClick={() => setActionModal({ isOpen: true, type: 'reject', assignment: asgn })}
                          className="bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-[11px] font-bold px-2.5 py-1 rounded transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {(asgn.status === 'coach_accepted' || asgn.status === 'in_progress') && (
                      <button
                        onClick={() => setActionModal({ isOpen: true, type: 'submit_review', assignment: asgn })}
                        className="bg-purple-900 hover:bg-purple-800 text-purple-100 border border-purple-700 text-[11px] font-bold px-3 py-1 rounded flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Submit for Review
                      </button>
                    )}

                    {(asgn.status === 'headcoach_review' || isHeadCoachOrAdmin) && asgn.status !== 'approved' && asgn.status !== 'published_to_client' && (
                      <button
                        onClick={() => setActionModal({ isOpen: true, type: 'headcoach_approve', assignment: asgn })}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black px-3 py-1 rounded flex items-center gap-1 shadow transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Head Coach Approve
                      </button>
                    )}
                  </div>

                  {/* Row 2: Manage Details & Publish to Client */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setViewingAssignment(asgn)}
                      className="text-[11px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/40 px-2.5 py-1 border border-sky-800/60 rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> View / Manage Content
                    </button>

                    {asgn.isPublishedToClient ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 border border-emerald-800 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Live on Client Portal (v{asgn.version || 1}.0)
                      </span>
                    ) : (
                      <button
                        onClick={() => handlePublishToClient(asgn)}
                        disabled={!canPublish}
                        className={`text-[11px] font-black px-3 py-1 uppercase flex items-center gap-1.5 rounded transition-all ${
                          canPublish
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
                        }`}
                        title={canPublish ? 'Publish content to client' : 'Approval required before publishing'}
                      >
                        <Send className="w-3 h-3" /> Send to Client
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action Notes Modal */}
      {actionModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-md bg-[#111111] text-white border-0 sm:border border-zinc-800 p-4 sm:p-6 shadow-2xl rounded-none sm:rounded-xl overflow-y-auto flex flex-col justify-center">
            <button onClick={() => setActionModal(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black uppercase text-white mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              {actionModal.type === 'accept' && 'ACCEPT ASSIGNMENT'}
              {actionModal.type === 'request_changes' && 'REQUEST REVISIONS'}
              {actionModal.type === 'reject' && 'REJECT ASSIGNMENT'}
              {actionModal.type === 'submit_review' && 'SUBMIT FOR HEAD COACH REVIEW'}
              {actionModal.type === 'headcoach_approve' && 'HEAD COACH APPROVAL'}
            </h3>

            <p className="text-xs text-zinc-400 mb-4">
              Assignment: <strong className="text-white">{actionModal.assignment.title}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Internal Feedback / Notes
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter specific comments or rationale..."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white p-3 text-xs outline-none rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setActionModal(null)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteAction}
                  className="px-5 py-2 bg-[#E52165] hover:bg-[#c41551] text-white text-xs font-black uppercase rounded-lg shadow cursor-pointer"
                >
                  Confirm & Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed View / Manage Modal */}
      {viewingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-2xl bg-[#111114] text-white border-0 sm:border border-zinc-800 p-4 sm:p-6 shadow-2xl rounded-none sm:rounded-xl overflow-y-auto space-y-4 flex flex-col">
            <button onClick={() => setViewingAssignment(null)} className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2 mb-1">
                {getTypeBadge(viewingAssignment.assignmentType)}
                {getPriorityBadge(viewingAssignment.priority)}
                {getStatusBadge(viewingAssignment.status)}
              </div>
              <h3 className="text-xl font-black uppercase text-white flex items-center gap-2 mt-1">
                {getTypeIcon(viewingAssignment.assignmentType)}
                {viewingAssignment.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-900 p-3 border border-zinc-800 rounded-lg">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">ASSIGNMENT DETAILS</span>
                <p className="text-zinc-300">{viewingAssignment.description || 'No description provided.'}</p>
                {viewingAssignment.instructions && (
                  <p className="text-amber-300 mt-2 bg-zinc-950 p-2 rounded border border-zinc-800">{viewingAssignment.instructions}</p>
                )}
              </div>

              <div className="bg-zinc-900 p-3 border border-zinc-800 rounded-lg space-y-1.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">LINKED METADATA</span>
                <div className="flex justify-between text-zinc-400">
                  <span>Assigned By:</span>
                  <strong className="text-white">{viewingAssignment.assignedByName} ({viewingAssignment.assignedByRole})</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Assigned Coach:</span>
                  <strong className="text-amber-300">{viewingAssignment.assignedCoachName}</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Target Athlete:</span>
                  <strong className="text-emerald-400">{viewingAssignment.clientName || 'Client Athlete'}</strong>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Assigned Date:</span>
                  <span className="font-mono text-zinc-200">{new Date(viewingAssignment.assignedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Custom Details Drawer for Specific Types */}
            {viewingAssignment.details && (
              <div className="bg-zinc-950 p-4 border border-zinc-800 rounded-lg text-xs space-y-2">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Content / Technical Payload:</span>
                <pre className="text-[11px] font-mono text-zinc-300 bg-zinc-900 p-3 rounded overflow-x-auto">
                  {JSON.stringify(viewingAssignment.details, null, 2)}
                </pre>
              </div>
            )}

            <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
              {onNavigateTab && (
                <button
                  onClick={() => {
                    const tabMap: Record<string, string> = {
                      workout_program: 'programs',
                      class_schedule: 'schedule',
                      nutrition_plan: 'nutrition',
                      consultation: 'enquiries'
                    };
                    onNavigateTab(tabMap[viewingAssignment.assignmentType] || 'programs');
                    setViewingAssignment(null);
                  }}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase px-4 py-2 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 text-[#CCFF00]" /> Open Dedicated {viewingAssignment.assignmentType.toUpperCase().replace('_', ' ')} Tab
                </button>
              )}

              <button
                onClick={() => setViewingAssignment(null)}
                className="bg-white text-black text-xs font-black uppercase px-5 py-2 rounded-lg cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Create New Coach Assignment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-lg bg-[#111114] text-white border-0 sm:border border-zinc-800 p-4 sm:p-6 shadow-2xl rounded-none sm:rounded-xl space-y-4 overflow-y-auto flex flex-col animate-in zoom-in-95 duration-200">
            <button onClick={() => setShowCreateModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white cursor-pointer">
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-zinc-800 pb-3">
              <h3 className="text-lg font-black uppercase text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#CCFF00]" /> ASSIGN TO HEAD COACH OR COACH
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Assign a workout program, nutrition plan, class schedule, consultation, or custom task to any registered coach or head coach.
              </p>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Assignment Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Hypertrophy Protocol & Client Onboarding"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Assignment Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as CoachAssignmentType)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-zinc-600"
                  >
                    <option value="task">General Coaching Task</option>
                    <option value="workout_program">Workout Program</option>
                    <option value="nutrition_plan">Nutrition Plan</option>
                    <option value="class_schedule">Class Schedule</option>
                    <option value="consultation">Consultation & Strategy Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Assign To Coach *
                  </label>
                  <select
                    value={newAssignedCoach}
                    onChange={(e) => setNewAssignedCoach(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-zinc-600"
                  >
                    {coachOptions.map((cName) => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Target Client Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eleanor Vance"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white outline-none focus:border-zinc-600"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">URGENT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-zinc-300 mb-1">
                  Focus Instructions & Details
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide specific directions or guidelines for the assigned coach..."
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-white text-black text-xs font-black uppercase rounded-lg shadow cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-4 h-4 text-black" /> Save & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
