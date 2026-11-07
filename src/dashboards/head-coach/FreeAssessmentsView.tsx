import React, { useState, useEffect, useMemo } from 'react';
import { AthleteAssessment, User } from '../../types';
import { VelocityAPI, decodeHtmlEntities } from '../../services/api';
import { normalizeRole } from '../../utils/auth';
import {
  ClipboardCheck, Clock, CheckCircle2, Phone, Mail, Award,
  Search, RefreshCw, X, MessageSquare, AlertCircle,
  Trash2, Activity, HeartPulse, Send, MessageCircle, ExternalLink,
  Edit3, Check, MapPin, Dumbbell, Target, ShieldAlert
} from 'lucide-react';
import { ConfirmModal } from '../../components/ui/ConfirmModal';

interface FreeAssessmentsViewProps {
  user: User;
  coaches?: User[];
  onShowToast: (msg: string) => void;
}


const cleanDisplayName = (name?: string, email?: string) => {
  if (!name) return email ? email.split('@')[0] : 'Athlete';
  const decoded = decodeHtmlEntities(name).replace(/<[^>]*>/g, '').trim();
  return decoded || (email ? email.split('@')[0] : 'Athlete');
};

export const FreeAssessmentsView: React.FC<FreeAssessmentsViewProps> = ({
  user,
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
  const isCustomerSupport = normRole === 'customersupport' || normRole === 'support';
  const canDelete = isAdmin || isHeadCoach;

  const [assessments, setAssessments] = useState<AthleteAssessment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'contacted' | 'completed'>('all');

  // Contact Note Modal State
  const [noteTarget, setNoteTarget] = useState<AthleteAssessment | null>(null);
  const [noteText, setNoteText] = useState<string>('');
  const [noteStatus, setNoteStatus] = useState<string>('Contacted');
  const [isSavingNote, setIsSavingNote] = useState<boolean>(false);

  // Delete Confirm State
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  // Filter based on Tab & Search
  const displayedAssessments = useMemo(() => {
    return assessments.filter(a => {
      // Tab filter
      const normStatus = (a.status || 'Pending').toLowerCase();
      if (filterTab === 'pending') {
        if (normStatus !== 'pending') return false;
      } else if (filterTab === 'contacted') {
        if (normStatus !== 'contacted' && normStatus !== 'reviewed' && normStatus !== 'assigned') return false;
      } else if (filterTab === 'completed') {
        if (normStatus !== 'completed') return false;
      }

      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = a.clientName.toLowerCase().includes(q);
        const matchEmail = a.clientEmail.toLowerCase().includes(q);
        const matchPhone = a.clientPhone?.toLowerCase().includes(q);
        const matchGoal = a.primaryGoal.toLowerCase().includes(q);
        const matchId = a.id.toLowerCase().includes(q);
        const matchLocation = a.trainingLocation?.toLowerCase().includes(q);
        return matchName || matchEmail || matchPhone || matchGoal || matchId || matchLocation;
      }

      return true;
    });
  }, [assessments, filterTab, searchTerm]);

  // KPI calculations
  const totalCount = assessments.length;
  const pendingCount = assessments.filter(a => (a.status || 'Pending').toLowerCase() === 'pending').length;
  const contactedCount = assessments.filter(a => {
    const s = (a.status || '').toLowerCase();
    return s === 'contacted' || s === 'reviewed' || s === 'assigned';
  }).length;
  const completedCount = assessments.filter(a => (a.status || '').toLowerCase() === 'completed').length;

  // Quick Status Update
  const handleQuickStatusUpdate = async (assessment: AthleteAssessment, newStatus: string) => {
    try {
      await VelocityAPI.updateAssessmentStatus(assessment.id, {
        status: newStatus
      });
      onShowToast(`Assessment ${assessment.id} marked as ${newStatus}!`);
      loadAssessments();
    } catch (e: any) {
      onShowToast(e.message || 'Failed to update status');
    }
  };

  // Open Staff Notes Modal
  const handleOpenNoteModal = (assessment: AthleteAssessment) => {
    setNoteTarget(assessment);
    setNoteText(assessment.coachNotes || '');
    setNoteStatus(assessment.status || 'Contacted');
  };

  // Save Staff Notes
  const handleSaveNote = async () => {
    if (!noteTarget) return;
    setIsSavingNote(true);
    try {
      await VelocityAPI.updateAssessmentStatus(noteTarget.id, {
        status: noteStatus,
        coachNotes: noteText.trim() || undefined
      });
      onShowToast(`Staff contact notes saved for ${noteTarget.clientName}!`);
      setNoteTarget(null);
      loadAssessments();
    } catch (e: any) {
      onShowToast(e.message || 'Failed to save notes');
    } finally {
      setIsSavingNote(false);
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
      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-[#121214] border border-zinc-800 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">TOTAL ASSESSMENTS</span>
          <span className="text-2xl font-black text-white mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-[#121214] border border-amber-500/30 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">PENDING ACTION</span>
          <span className="text-2xl font-black text-amber-400 mt-1 block">{pendingCount}</span>
        </div>
        <div className="bg-[#121214] border border-blue-500/30 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">CONTACTED CLIENTS</span>
          <span className="text-2xl font-black text-blue-400 mt-1 block">{contactedCount}</span>
        </div>
        <div className="bg-[#121214] border border-emerald-500/30 p-4 rounded-xl">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">COMPLETED / ENROLLED</span>
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
            placeholder="Search by athlete name, email, phone, goal, location, or ref..."
            className="w-full bg-zinc-900 border border-zinc-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-lg focus:outline-none focus:border-[#CCFF00]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {(['all', 'pending', 'contacted', 'completed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`text-[10px] font-black uppercase px-3.5 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                filterTab === tab
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {tab === 'all' ? 'ALL ASSESSMENTS' : tab === 'pending' ? 'PENDING ACTION' : tab}
            </button>
          ))}

          <button
            onClick={loadAssessments}
            disabled={isLoading}
            className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white transition-all cursor-pointer shrink-0 ml-1"
            title="Refresh Intakes"
          >
            <RefreshCw className={`w-4 h-4 text-[#CCFF00] ${isLoading ? 'animate-spin' : ''}`} />
          </button>
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
            {searchTerm ? 'No assessments match your search query.' : 'When clients complete the 5-min self-assessment on the website, their full diagnostic profiles will appear here for direct contact.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedAssessments.map(a => {
            const rawStatus = (a.status || 'Pending').toLowerCase();
            const isPending = rawStatus === 'pending';
            const isContacted = rawStatus === 'contacted' || rawStatus === 'reviewed' || rawStatus === 'assigned';
            const isCompleted = rawStatus === 'completed';

            const rawContact = (a.preferredContactMethod || 'call').toLowerCase();
            const isWhatsApp = rawContact.includes('whatsapp') || rawContact.includes('what');
            const isCall = rawContact.includes('call') || rawContact.includes('phone');
            const isEmailContact = rawContact.includes('email');

            const cleanPhone = (a.clientPhone || '').replace(/[\s\-\(\)\+]/g, '');
            const hasInjuryFlag = a.hasInjury && a.hasInjury.toLowerCase() !== 'no' && a.hasInjury.toLowerCase() !== 'none' && a.hasInjury.toLowerCase() !== 'not provided';

            // WhatsApp direct chat URL with pre-filled greeting
            const waText = encodeURIComponent(
              `Hello ${a.clientName}! This is the coaching team from BxStrength. We received your 5-minute athletic assessment regarding your primary goal "${a.primaryGoal}". Would you be available for a brief strategy consultation?`
            );
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : null;

            return (
              <div
                key={a.id}
                className={`bg-[#121214] border p-5 sm:p-6 rounded-2xl transition-all space-y-4 shadow-xl ${
                  isCompleted
                    ? 'border-emerald-800/60 shadow-emerald-950/10'
                    : isContacted
                    ? 'border-blue-700/60'
                    : 'border-amber-600/60'
                }`}
              >
                {/* Top Line: Ref ID, Status, Preferred Contact, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300 bg-amber-950/60 px-2.5 py-0.5 border border-amber-800/80 rounded">
                      REF: {a.id}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      isCompleted
                        ? 'bg-emerald-500 text-black'
                        : isContacted
                        ? 'bg-blue-600 text-white'
                        : 'bg-amber-500 text-black'
                    }`}>
                      {isCompleted ? '✓ COMPLETED / ENROLLED' : isContacted ? '● CONTACTED' : '● NEW / PENDING ACTION'}
                    </span>

                    {/* Preferred Contact Badge */}
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded border flex items-center gap-1 ${
                      isWhatsApp
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                        : isCall
                        ? 'bg-blue-950/60 text-blue-300 border-blue-800/80'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    }`}>
                      {isWhatsApp ? <MessageCircle className="w-3 h-3 text-emerald-400" /> : isCall ? <Phone className="w-3 h-3 text-blue-400" /> : <Mail className="w-3 h-3 text-zinc-400" />}
                      <span>Prefers: {a.preferredContactMethod || 'Call'}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span className="text-[10px] font-mono">{new Date(a.createdAt).toLocaleDateString()} {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {canDelete && (
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

                {/* Athlete Contact & Quick Action Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <span>{cleanDisplayName(a.clientName, a.clientEmail)}</span>
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300">
                      <a href={`mailto:${a.clientEmail}`} className="flex items-center gap-1.5 hover:text-[#CCFF00] transition-colors">
                        <Mail className="w-3.5 h-3.5 text-zinc-500" /> {a.clientEmail}
                      </a>
                      {a.clientPhone && (
                        <a href={`tel:${a.clientPhone}`} className="flex items-center gap-1.5 hover:text-[#CCFF00] transition-colors">
                          <Phone className="w-3.5 h-3.5 text-zinc-500" /> {a.clientPhone}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* DIRECT CONTACT ACTION BUTTON (ONLY PREFERRED MODE) */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isWhatsApp && cleanPhone && waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-950/40"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp Client</span>
                      </a>
                    )}

                    {isCall && a.clientPhone && (
                      <a
                        href={`tel:${a.clientPhone}`}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-950/40"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Call Client</span>
                      </a>
                    )}

                    {(isEmailContact || (!isWhatsApp && !isCall) || (isWhatsApp && (!cleanPhone || !waUrl)) || (isCall && !a.clientPhone)) && (
                      <a
                        href={`mailto:${a.clientEmail}?subject=${encodeURIComponent(`BxStrength Athletic Strategy - ${decodeHtmlEntities(a.primaryGoal)}`)}`}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold uppercase px-4 py-2.5 rounded-xl transition-all flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4 text-[#CCFF00]" />
                        <span>Email Client</span>
                      </a>
                    )}
                  </div>
                </div>

                {/* FULL DIAGNOSTIC DATA GRID (ONLY QUESTIONS ANSWERED IN FORM) */}
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-zinc-400 tracking-wider">
                    <Target className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span>Submitted Self-Assessment Intake Parameters</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
                    <div className="bg-black/40 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Primary Goal</span>
                      <span className="font-bold text-[#CCFF00] block mt-0.5">{decodeHtmlEntities(a.primaryGoal || 'General Fitness')}</span>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Experience Level</span>
                      <span className="font-bold text-white block mt-0.5">{decodeHtmlEntities(a.experienceLevel || 'Beginner')}</span>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Weekly Days</span>
                      <span className="font-bold text-white block mt-0.5">{decodeHtmlEntities(a.weeklyCommitment || '3 Days/Wk')}</span>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Location</span>
                      <span className="font-bold text-white block mt-0.5">{decodeHtmlEntities(a.trainingLocation || 'Home')}</span>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-[9px] uppercase font-bold text-zinc-500 block">Equipment</span>
                      <span className="font-bold text-white block mt-0.5">{decodeHtmlEntities(a.equipment || 'Bodyweight / Dumbbells')}</span>
                    </div>
                  </div>
                </div>

                {/* Medical / Injury Warning Banner */}
                {hasInjuryFlag && (
                  <div className="bg-amber-950/40 border border-amber-600/70 p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                    <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-400 uppercase text-[10px] block tracking-wider">ATHLETE INJURY / MEDICAL RESTRICTION:</strong>
                      <span className="mt-0.5 block font-medium">{a.hasInjury}</span>
                    </div>
                  </div>
                )}

                {/* Staff Contact Notes (If Recorded) */}
                {a.coachNotes && (
                  <div className="bg-zinc-900/90 border border-zinc-700 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] font-bold uppercase">
                      <Edit3 className="w-3 h-3 text-[#CCFF00]" />
                      <span>Internal Contact & Follow-up Notes:</span>
                    </div>
                    <p className="text-zinc-200 whitespace-pre-line font-mono text-[11px]">{a.coachNotes}</p>
                  </div>
                )}

                {/* Action Footer: Status Changer & Log Note Button */}
                <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Change Status:</span>
                    <button
                      onClick={() => handleQuickStatusUpdate(a, 'Pending')}
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-all cursor-pointer ${
                        isPending ? 'bg-amber-500 text-black font-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => handleQuickStatusUpdate(a, 'Contacted')}
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-all cursor-pointer ${
                        isContacted ? 'bg-blue-600 text-white font-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Contacted
                    </button>
                    <button
                      onClick={() => handleQuickStatusUpdate(a, 'Completed')}
                      className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded transition-all cursor-pointer ${
                        isCompleted ? 'bg-emerald-500 text-black font-black' : 'bg-zinc-900 text-zinc-400 hover:text-white'
                      }`}
                    >
                      Completed
                    </button>
                  </div>

                  <button
                    onClick={() => handleOpenNoteModal(a)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs uppercase px-3.5 py-1.5 rounded-lg transition-all border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#CCFF00]" />
                    <span>{a.coachNotes ? 'Edit Contact Note' : 'Add Contact Note'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* STAFF CONTACT NOTE MODAL */}
      {noteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#121214] border border-zinc-800 text-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-black uppercase text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#CCFF00]" />
                LOG CONTACT / FOLLOW-UP NOTE
              </h3>
              <button onClick={() => setNoteTarget(null)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800">
                <p><strong>Client:</strong> {noteTarget.clientName}</p>
                <p><strong>Contact:</strong> {noteTarget.clientPhone || noteTarget.clientEmail} ({noteTarget.preferredContactMethod || 'Call'})</p>
                <p><strong>Goal:</strong> {noteTarget.primaryGoal}</p>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Update Status</label>
                <select
                  value={noteStatus}
                  onChange={(e) => setNoteStatus(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-bold focus:outline-none focus:border-[#CCFF00]"
                >
                  <option value="Pending">Pending Action</option>
                  <option value="Contacted">Contacted</option>
                  <option value="Completed">Completed / Enrolled</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-zinc-400 block mb-1">Internal Note / Outcome</label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                  placeholder="e.g. Called client on WhatsApp. Discussed 12-week fat loss program. Client interested, follow-up scheduled for Friday..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
              <button
                onClick={() => setNoteTarget(null)}
                className="px-4 py-2 text-xs font-bold uppercase text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase px-4 py-2 rounded-xl transition-all cursor-pointer shadow flex items-center gap-1.5"
              >
                {isSavingNote ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Save Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE RECORD MODAL */}
      <ConfirmModal
        isOpen={Boolean(deletingId)}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Assessment Record"
        message="Are you sure you want to delete this athlete assessment intake record? This action cannot be undone."
        confirmText="Delete Assessment"
        requireTextConfirm={false}
      />
    </div>
  );
};
