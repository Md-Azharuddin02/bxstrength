import React, { useState, useEffect, useMemo } from 'react';
import { AthleteAssessment, User } from '../../types';
import { VelocityAPI } from '../../services/api';
import { normalizeRole } from '../../utils/auth';
import {
  ClipboardCheck, Clock, UserCheck, CheckCircle2, Phone, Mail, Award,
  Search, RefreshCw, X, ExternalLink, MessageSquare, AlertCircle,
  Check, User as UserIcon, Trash2, Activity, ShieldCheck, HeartPulse
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface FreeAssessmentsViewProps {
  user: User;
  coaches: User[];
  onShowToast: (msg: string) => void;
}

export const FreeAssessmentsView: React.FC<FreeAssessmentsViewProps> = ({
  user,
  coaches,
  onShowToast
}) => {
  const normRole = normalizeRole(user.role);
  const isAdmin = normRole === 'admin';
  const isHeadCoach = normRole === 'headcoach' || (normRole === 'coach' && Boolean(
    user.coachPosition && (
      user.coachPosition.toLowerCase().includes('head') ||
      user.coachPosition.toLowerCase().includes('chief')
    )
  ));
  const isCoach = normRole === 'coach';
  const isHeadCoachOrAdmin = isAdmin || isHeadCoach;

  const [assessments, setAssessments] = useState<AthleteAssessment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'headcoach' | 'coaches' | 'completed'>('all');

  // Assign Modal State
  const [assignTarget, setAssignTarget] = useState<AthleteAssessment | null>(null);
  const [selectedCoachId, setSelectedCoachId] = useState<string>('');
  const [selectedCoachName, setSelectedCoachName] = useState<string>('');
  const [assignNotes, setAssignNotes] = useState<string>('');
  const [isSubmittingAssign, setIsSubmittingAssign] = useState<boolean>(false);

  // Review / Status Update Modal State
  const [reviewTarget, setReviewTarget] = useState<AthleteAssessment | null>(null);
  const [newStatus, setNewStatus] = useState<string>('Reviewed');
  const [recommendedPlan, setRecommendedPlan] = useState<string>('');
  const [coachFeedback, setCoachFeedback] = useState<string>('');
  const [coachNotes, setCoachNotes] = useState<string>('');
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [dbCoaches, setDbCoaches] = useState<User[]>([]);

  useEffect(() => {
    VelocityAPI.fetchUsers().then(uList => {
      const staff = uList.filter(u => {
        const r = normalizeRole(u.role);
        return r === 'coach' || r === 'headcoach';
      });
      if (staff.length > 0) setDbCoaches(staff);
    }).catch(() => {});
  }, []);

  // Available Specialist Coaches (strictly real users from DB with role === 'coach', excluding Head Coach and Admins)
  const availableSpecialistCoaches = useMemo(() => {
    const combined = [...coaches, ...dbCoaches];
    const uniqueMap = new Map<string, { id: string; name: string; position: string; email: string }>();

    combined.forEach(c => {
      const r = normalizeRole(c.role);
      const isSelf = c.id === user.id || (c.email && c.email.toLowerCase() === user.email.toLowerCase());
      const isHeadCoachRole = r === 'headcoach' || (c.name && c.name.toLowerCase().includes('head coach'));
      const isAdminRole = r === 'admin';

      if (r === 'coach' && !isSelf && !isHeadCoachRole && !isAdminRole) {
        uniqueMap.set(c.id, {
          id: c.id,
          name: c.name,
          position: c.coachPosition || 'Specialist Coach',
          email: c.email
        });
      }
    });

    return Array.from(uniqueMap.values());
  }, [coaches, dbCoaches, user]);

  const loadAssessments = async () => {
    setIsLoading(true);
    try {
      const data = await VelocityAPI.fetchAssessments();
      setAssessments(data);
    } catch (e: any) {
      console.error('Error fetching assessments:', e);
      onShowToast('Could not refresh diagnostic assessments from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
    const handleSync = () => loadAssessments();
    window.addEventListener('bxstrength_assessments_updated', handleSync);
    return () => {
      window.removeEventListener('bxstrength_assessments_updated', handleSync);
    };
  }, []);

  // Filter based on user role (coach vs headcoach/admin)
  const roleFiltered = useMemo(() => {
    if (isHeadCoachOrAdmin) return assessments;
    // Specialist coach only sees assessments assigned to them
    return assessments.filter(a => {
      const isIdMatch = a.assignedCoachId && a.assignedCoachId === user.id;
      const isNameMatch = a.assignedCoachName && a.assignedCoachName.toLowerCase().trim() === user.name.toLowerCase().trim();
      return isIdMatch || isNameMatch;
    });
  }, [assessments, isHeadCoachOrAdmin, user]);

  // Tab Filtering & Search Filtering
  const displayedAssessments = useMemo(() => {
    return roleFiltered.filter(a => {
      // Tab filter
      if (filterTab === 'pending') {
        if (a.status !== 'Pending') return false;
      } else if (filterTab === 'headcoach') {
        const isHead = a.assignedCoachName && (
          a.assignedCoachName.toLowerCase().includes('head coach') ||
          a.assignedCoachName.toLowerCase().includes('azhar')
        );
        if (!isHead) return false;
      } else if (filterTab === 'coaches') {
        const isHead = a.assignedCoachName && (
          a.assignedCoachName.toLowerCase().includes('head coach') ||
          a.assignedCoachName.toLowerCase().includes('azhar')
        );
        if (!a.assignedCoachName || isHead) return false;
      } else if (filterTab === 'completed') {
        if (a.status !== 'Completed' && a.status !== 'Reviewed') return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = a.clientName.toLowerCase().includes(q);
        const matchEmail = a.clientEmail.toLowerCase().includes(q);
        const matchPhone = a.clientPhone?.toLowerCase().includes(q);
        const matchGoal = a.primaryGoal.toLowerCase().includes(q);
        const matchId = a.id.toLowerCase().includes(q);
        const matchCoach = a.assignedCoachName?.toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchGoal || matchId || matchCoach;
      }

      return true;
    });
  }, [roleFiltered, filterTab, searchTerm]);

  // KPI calculations
  const totalCount = roleFiltered.length;
  const pendingCount = roleFiltered.filter(a => a.status === 'Pending').length;
  const headCoachCount = roleFiltered.filter(a => a.assignedCoachName && (
    a.assignedCoachName.toLowerCase().includes('head coach') ||
    a.assignedCoachName.toLowerCase().includes('azhar')
  )).length;
  const coachesCount = roleFiltered.filter(a => {
    const isHead = a.assignedCoachName && (
      a.assignedCoachName.toLowerCase().includes('head coach') ||
      a.assignedCoachName.toLowerCase().includes('azhar')
    );
    return a.assignedCoachName && !isHead;
  }).length;
  const completedCount = roleFiltered.filter(a => a.status === 'Completed' || a.status === 'Reviewed').length;

  // Handle "Take Myself" (Self-assign to Head Coach)
  const handleSelfAssign = async (assessment: AthleteAssessment) => {
    const coachDisplayName = isHeadCoach ? 'Head Coach' : user.name;
    try {
      await VelocityAPI.assignAssessment(assessment.id, {
        assignedCoachId: user.id,
        assignedCoachName: coachDisplayName,
        assignedBy: user.name,
        notes: `${user.name} claimed this diagnostic assessment directly for athletic review.`
      });
      onShowToast(`Assessment ${assessment.id} successfully claimed by ${coachDisplayName}!`);
      loadAssessments();
    } catch (e: any) {
      onShowToast(e.message || 'Failed to claim assessment');
    }
  };

  // Open delegation modal
  const handleOpenAssignModal = (assessment: AthleteAssessment) => {
    setAssignTarget(assessment);
    const defaultCoach = availableSpecialistCoaches[0];
    if (defaultCoach) {
      setSelectedCoachId(defaultCoach.id);
      setSelectedCoachName(defaultCoach.name);
    } else {
      setSelectedCoachId('');
      setSelectedCoachName('');
    }
    setAssignNotes('');
  };

  // Confirm delegation to coach
  const handleConfirmAssign = async () => {
    if (!assignTarget || !selectedCoachName) {
      onShowToast('Please select a specialist coach to assign.');
      return;
    }

    setIsSubmittingAssign(true);
    try {
      await VelocityAPI.assignAssessment(assignTarget.id, {
        assignedCoachId: selectedCoachId || null,
        assignedCoachName: selectedCoachName,
        assignedBy: isHeadCoach ? 'Head Coach' : user.name,
        notes: assignNotes.trim() || undefined
      });

      onShowToast(`Assessment ${assignTarget.id} delegated to ${selectedCoachName}!`);
      setAssignTarget(null);
      loadAssessments();
    } catch (e: any) {
      onShowToast(e.message || 'Failed to delegate assessment');
    } finally {
      setIsSubmittingAssign(false);
    }
  };

  // Open Review / Feedback Modal
  const handleOpenReviewModal = (assessment: AthleteAssessment) => {
    setReviewTarget(assessment);
    setNewStatus(assessment.status === 'Pending' ? 'Reviewed' : assessment.status);
    setRecommendedPlan(assessment.recommendedPlan || '');
    setCoachFeedback(assessment.coachFeedback || '');
    setCoachNotes(assessment.coachNotes || '');
  };

  // Confirm Review / Feedback
  const handleConfirmReview = async () => {
    if (!reviewTarget) return;

    setIsSubmittingReview(true);
    try {
      await VelocityAPI.updateAssessmentStatus(reviewTarget.id, {
        status: newStatus,
        recommendedPlan: recommendedPlan.trim() || undefined,
        coachFeedback: coachFeedback.trim() || undefined,
        coachNotes: coachNotes.trim() || undefined
      });

      onShowToast(`Assessment ${reviewTarget.id} updated to ${newStatus}! Client notified via email.`);
      setReviewTarget(null);
      loadAssessments();
    } catch (e: any) {
      onShowToast(e.message || 'Failed to update assessment review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await VelocityAPI.deleteAssessment(deletingId);
      onShowToast('Assessment record deleted.');
      setDeletingId(null);
      loadAssessments();
    } catch (e: any) {
      onShowToast(e.message || 'Failed to delete assessment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#121214] border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 px-2 py-0.5 border border-[#CCFF00]/30 rounded uppercase">
              {isHeadCoach ? 'HEAD COACH PIPELINE • SEPARATE ASSESSMENTS' : isCoach ? 'COACH DELEGATED ASSESSMENTS' : 'ADMIN ATHLETE ASSESSMENTS'}
            </span>
            <span className="text-[10px] font-bold text-zinc-400 font-mono">
              {totalCount} Total Diagnostic Intakes
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <ClipboardCheck className="w-6 h-6 text-[#CCFF00]" />
            ATHLETE DIAGNOSTIC ASSESSMENTS
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            {isHeadCoachOrAdmin
              ? 'Separate lead management for athletes who submitted the 5-Min Self-Assessment. Review movement goals, injury history, self-assign, or delegate to specialist coaches.'
              : 'Review diagnostic profiles assigned to you by the Head Coach. Provide customized exercise recommendations and feedback.'}
          </p>
        </div>

        <button
          onClick={loadAssessments}
          disabled={isLoading}
          className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-black uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-[#CCFF00] ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Intakes</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">TOTAL ASSESSMENTS</span>
          <span className="text-2xl font-black text-white mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-[#121214] border border-amber-500/30 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">PENDING ACTION</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{pendingCount}</span>
        </div>
        <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">TAKEN BY HEAD COACH</span>
          <span className="text-2xl font-black text-white mt-1 block">{headCoachCount}</span>
        </div>
        <div className="bg-[#121214] border border-blue-500/30 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">COACH DELEGATED</span>
          <span className="text-2xl font-black text-blue-400 mt-1 block">{coachesCount}</span>
        </div>
        <div className="bg-[#121214] border border-emerald-500/30 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">REVIEWED / COMPLETED</span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">{completedCount}</span>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#121214] border border-zinc-800 p-3 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by athlete name, email, phone, goal, or ref..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#CCFF00]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'pending', 'headcoach', 'coaches', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`text-[10px] font-black uppercase px-3 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterTab === tab
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab === 'headcoach' ? 'HEAD COACH' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Assessment Cards List */}
      {isLoading ? (
        <div className="text-center py-12 text-zinc-500 bg-[#121214] border border-zinc-800 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#CCFF00]" />
          <p className="text-xs uppercase font-bold tracking-wider">Loading diagnostic assessments...</p>
        </div>
      ) : displayedAssessments.length === 0 ? (
        <div className="text-center py-16 bg-[#121214] border border-dashed border-zinc-800 rounded-2xl space-y-3">
          <ClipboardCheck className="w-10 h-10 text-zinc-600 mx-auto" />
          <h3 className="text-sm font-black text-white uppercase">No Diagnostic Assessments Found</h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            {searchTerm ? 'No assessments match your search query.' : 'When clients complete the 5-min self-assessment on the website, their full diagnostic profiles will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedAssessments.map(a => {
            const isPending = a.status === 'Pending';
            const isAssigned = a.status === 'Assigned';
            const isReviewed = a.status === 'Reviewed';
            const isCompleted = a.status === 'Completed';
            const hasInjuryFlag = a.hasInjury && a.hasInjury.toLowerCase() !== 'no' && a.hasInjury.toLowerCase() !== 'none';

            return (
              <div
                key={a.id}
                className={`bg-[#121214] border p-5 sm:p-6 rounded-2xl transition-all space-y-4 ${
                  isReviewed || isCompleted
                    ? 'border-emerald-800/60 shadow-lg shadow-emerald-950/10'
                    : isAssigned
                    ? 'border-blue-700/60'
                    : 'border-amber-600/60'
                }`}
              >
                {/* Top Line: Ref ID, Status, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 border border-amber-800/80 rounded">
                      REF: {a.id}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      isReviewed || isCompleted
                        ? 'bg-emerald-500 text-black'
                        : isAssigned
                        ? 'bg-blue-600 text-white'
                        : 'bg-amber-500 text-black'
                    }`}>
                      {isCompleted ? '✓ COMPLETED' : isReviewed ? '● REVIEWED' : isAssigned ? '● COACH ASSIGNED' : '● PENDING ACTION'}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400 uppercase">
                      Contact: {a.preferredContactMethod || 'Call'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="text-[10px] font-mono">{new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isHeadCoachOrAdmin && (
                      <button
                        onClick={() => setDeletingId(a.id)}
                        className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                        title="Delete Assessment Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Athlete Contact Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white uppercase">{a.clientName}</h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" /> {a.clientEmail}
                      </span>
                      {a.clientPhone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" /> {a.clientPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current Assigned Coach */}
                  <div className="bg-zinc-900/80 border border-zinc-800 px-4 py-2.5 rounded-xl shrink-0">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block mb-0.5">Assigned Specialist</span>
                    <span className={`text-xs font-black uppercase ${a.assignedCoachName ? 'text-white' : 'text-amber-400'}`}>
                      {a.assignedCoachName || 'Unassigned (Action Pending)'}
                    </span>
                  </div>
                </div>

                {/* Diagnostic Data Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs pt-1">
                  <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Primary Goal</span>
                    <span className="font-bold text-[#CCFF00] block mt-0.5 truncate">{a.primaryGoal}</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Main Obstacle</span>
                    <span className="font-bold text-white block mt-0.5 truncate">{a.mainObstacle || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Experience</span>
                    <span className="font-bold text-white block mt-0.5 truncate">{a.experienceLevel || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Commitment</span>
                    <span className="font-bold text-white block mt-0.5 truncate">{a.weeklyCommitment || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Location</span>
                    <span className="font-bold text-white block mt-0.5 truncate">{a.trainingLocation || 'N/A'}</span>
                  </div>
                  <div className="bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-800/80">
                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Equipment</span>
                    <span className="font-bold text-white block mt-0.5 truncate">{a.equipment || 'N/A'}</span>
                  </div>
                </div>

                {/* Medical / Injury Warning Banner */}
                {hasInjuryFlag && (
                  <div className="bg-amber-950/30 border border-amber-600/50 p-3 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-400 uppercase text-[10px] block">ATHLETE INJURY / RESTRICTION FLAG:</strong>
                      <span>{a.hasInjury}</span>
                    </div>
                  </div>
                )}

                {/* Coach Feedback & Recommendations block if present */}
                {(a.recommendedPlan || a.coachFeedback) && (
                  <div className="bg-emerald-950/20 border border-emerald-800/60 p-4 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">COACHING RECOMMENDATIONS &amp; PROTOCOL</span>
                    </div>
                    {a.recommendedPlan && (
                      <p className="text-white">
                        <strong className="text-zinc-400 uppercase text-[10px] block">Recommended Protocol:</strong>
                        {a.recommendedPlan}
                      </p>
                    )}
                    {a.coachFeedback && (
                      <p className="text-zinc-300">
                        <strong className="text-zinc-400 uppercase text-[10px] block">Coach Diagnostic Notes:</strong>
                        {a.coachFeedback}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons Footer */}
                <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[10px] text-zinc-400">
                    {a.assignedBy && (
                      <span>Assigned by <strong>{a.assignedBy}</strong> {a.assignedAt ? `on ${new Date(a.assignedAt).toLocaleDateString()}` : ''}</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Head Coach / Admin Actions */}
                    {isHeadCoachOrAdmin && isPending && (
                      <>
                        <button
                          onClick={() => handleSelfAssign(a)}
                          className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4" />
                          <span>Take Myself</span>
                        </button>

                        <button
                          onClick={() => handleOpenAssignModal(a)}
                          className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-lg transition-all border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <UserIcon className="w-4 h-4 text-[#CCFF00]" />
                          <span>Assign to Coach</span>
                        </button>
                      </>
                    )}

                    {isHeadCoachOrAdmin && isAssigned && (
                      <button
                        onClick={() => handleOpenAssignModal(a)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs uppercase px-3 py-1.5 rounded-lg transition-all border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#CCFF00]" />
                        <span>Re-assign Coach</span>
                      </button>
                    )}

                    {/* Review / Provide Feedback Button (Available to Head Coach, Admin, or the assigned Coach) */}
                    <button
                      onClick={() => handleOpenReviewModal(a)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase px-4 py-2 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>{isReviewed || isCompleted ? 'Update Review' : 'Provide Feedback'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ASSIGN TO COACH MODAL */}
      {assignTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-zinc-800 text-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#CCFF00]" />
                DELEGATE ASSESSMENT TO SPECIALIST COACH
              </h3>
              <button onClick={() => setAssignTarget(null)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-xs">
                <p><strong>Athlete:</strong> {assignTarget.clientName} ({assignTarget.clientEmail})</p>
                <p><strong>Primary Goal:</strong> {assignTarget.primaryGoal}</p>
                <p><strong>Experience:</strong> {assignTarget.experienceLevel || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  SELECT SPECIALIST COACH *
                </label>
                {availableSpecialistCoaches.length === 0 ? (
                  <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-xs text-amber-200">
                    No specialist coaches found with role 'coach' in the database.
                  </div>
                ) : (
                  <select
                    value={selectedCoachId}
                    onChange={(e) => {
                      setSelectedCoachId(e.target.value);
                      const found = availableSpecialistCoaches.find(c => c.id === e.target.value);
                      if (found) setSelectedCoachName(found.name);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#CCFF00]"
                  >
                    {availableSpecialistCoaches.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  INSTRUCTIONS FOR COACH (OPTIONAL)
                </label>
                <textarea
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Please review client's shoulder restriction and recommend our beginner boxing mobility protocol."
                  rows={3}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs p-3 rounded-lg focus:outline-none focus:border-[#CCFF00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setAssignTarget(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAssign}
                disabled={isSubmittingAssign || availableSpecialistCoaches.length === 0}
                className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSubmittingAssign ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Confirm Delegation</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW / FEEDBACK MODAL */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-zinc-800 text-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-emerald-400" />
                PROVIDE ATHLETIC DIAGNOSTIC FEEDBACK
              </h3>
              <button onClick={() => setReviewTarget(null)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-xs">
                <p><strong>Athlete:</strong> {reviewTarget.clientName} ({reviewTarget.clientEmail})</p>
                <p><strong>Goal:</strong> {reviewTarget.primaryGoal} | <strong>Level:</strong> {reviewTarget.experienceLevel}</p>
                {reviewTarget.hasInjury && <p className="text-amber-300"><strong>Injuries:</strong> {reviewTarget.hasInjury}</p>}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  UPDATE STATUS *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-emerald-400"
                >
                  <option value="Reviewed">Reviewed (Feedback Ready)</option>
                  <option value="Completed">Completed (Roadmap Finalized)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  RECOMMENDED TRAINING PROTOCOL / PACKAGE
                </label>
                <input
                  type="text"
                  value={recommendedPlan}
                  onChange={(e) => setRecommendedPlan(e.target.value)}
                  placeholder="e.g. 1-on-1 Boxing Conditioning + Mobility 3x/week"
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  COACH DIAGNOSTIC FEEDBACK (SENT TO CLIENT)
                </label>
                <textarea
                  value={coachFeedback}
                  onChange={(e) => setCoachFeedback(e.target.value)}
                  placeholder="Provide detailed feedback on athlete's movement goals, injury management, and next steps..."
                  rows={4}
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs p-3 rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-zinc-400 mb-1">
                  INTERNAL COACH NOTES (STAFF ONLY)
                </label>
                <input
                  type="text"
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  placeholder="Internal notes for Head Coach / trainers..."
                  className="w-full bg-zinc-900 border border-zinc-700 text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setReviewTarget(null)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                disabled={isSubmittingReview}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase px-5 py-2.5 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                {isSubmittingReview ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Save Review &amp; Notify Client</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        title="Delete Assessment Record"
        message="Are you sure you want to delete this athlete assessment record? This action cannot be undone."
        confirmText="Delete Assessment"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};
