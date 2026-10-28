import React, { useState, useEffect, useId } from 'react';
import { ConsultationBooking } from '../types';
import { VelocityAPI, getApiUrl, apiFetch } from '../services/api';
import { sendConsultationConfirmationEmail } from '../services/emailService';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, User, CheckCircle2, X, Dumbbell, ShieldCheck, Bell, Info, ArrowLeft, Phone, Mail, Award, Check, Flame, AlertTriangle, LayoutDashboard } from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToDashboard: () => void;
  preSelectedClass?: string;
  preSelectedTrainer?: string;
}

export interface GoalOption {
  title: string;
  category: string;
  defaultDuration: number; // minutes
  durationText: string;
  description: string;
}

export const ALL_GOALS_SERVICES: GoalOption[] = [
  { title: 'Fitness Boxing', category: 'Individual Service', defaultDuration: 20, durationText: '20 Min', description: 'Technical boxing, conditioning, footwork, power and endurance.' },
  { title: 'Strength Training', category: 'Individual Service', defaultDuration: 20, durationText: '20 Min', description: 'Build progressive strength, muscle tone, and structural balance.' },
  { title: 'Mobility & Recovery', category: 'Individual Service', defaultDuration: 20, durationText: '20 Min', description: 'Targeted mobility drills, dynamic stretching, and tissue recovery.' },
  { title: 'Flexibility Training', category: 'Individual Service', defaultDuration: 20, durationText: '20 Min', description: 'Increase joint range of motion, reduce stiffness and posture stress.' },
  { title: 'Mindset & Wellness', category: 'Individual Service', defaultDuration: 20, durationText: '20 Min', description: 'Stress management protocols, breathwork, and mental fortitude.' },
  { title: 'Custom Basic', category: 'Custom', defaultDuration: 15, durationText: '15 Min', description: 'One tailored focus designed specifically around your single goal.' },
  { title: 'Custom Focus', category: 'Custom', defaultDuration: 30, durationText: '30 Min', description: 'Bespoke programme with individual goal mapping and support work.' },
  { title: 'Custom Performance', category: 'Custom', defaultDuration: 45, durationText: '45 Min', description: 'Any two focus areas combined into advanced personal programming.' },
  { title: 'Custom Complete', category: 'Custom', defaultDuration: 60, durationText: '60 Min', description: 'Up to 4 focus areas combined into one comprehensive master plan.' },
  { title: 'BX Basic Care', category: 'Core Package', defaultDuration: 15, durationText: '15 Min', description: 'Entry level standard package with focused technique guidance.' },
  { title: 'BX Focus', category: 'Core Package', defaultDuration: 30, durationText: '30 Min', description: 'Goal-based training combining primary focus + supporting drills.' },
  { title: 'BX Performance', category: 'Core Package', defaultDuration: 45, durationText: '45 Min', description: 'Structured multi-focus performance session with technique correction.' },
  { title: 'BX Complete', category: 'Core Package', defaultDuration: 60, durationText: '60 Min', description: 'Flagship full-body session with strength, conditioning & mobility.' },
  { title: 'BX Weekly 3', category: 'Programme', defaultDuration: 30, durationText: '30 Min', description: '3-session weekly programme for consistency and momentum.' },
  { title: 'BX Monthly 12', category: 'Programme', defaultDuration: 45, durationText: '45 Min', description: '12-session monthly high-volume progress coaching program.' },
];

export interface SlotOption {
  timeStr: string;
  label: string;
  isAvailable: boolean;
  isBufferBlocked: boolean;
}

export const generateAvailableTimeSlots = (
  selectedDateStr: string,
  durationMinutes: number
): { slots: SlotOption[]; bufferTimeString: string; isToday: boolean } => {
  const slots: SlotOption[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const isToday = selectedDateStr === todayStr;

  // 1-Hour Buffer limit: Current Time + 60 minutes
  const bufferLimitTime = new Date(now.getTime() + 60 * 60 * 1000);
  const bufferTimeString = bufferLimitTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

  // For Future Dates: 5:00 AM (5) to 8:00 PM (20)
  // For Same Day (Today): Generates up to 11:45 PM so slots after 1-hr buffer (e.g. 9:00 PM if booked at 8:00 PM) are available
  const startHour = 5;
  const endHour = isToday ? 23 : 20;

  // Step interval matches selected exercise duration (15 min, 20 min, or 30 min)
  let stepMinutes = 15;
  if (durationMinutes === 20) {
    stepMinutes = 20;
  } else if (durationMinutes >= 30) {
    stepMinutes = 30;
  }

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += stepMinutes) {
      if (!isToday && hour === endHour && min > 0) break; // Cap future dates at 8:00 PM

      const slotStart = new Date(`${selectedDateStr}T00:00:00`);
      slotStart.setHours(hour, min, 0, 0);

      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);

      const startTimeFormatted = slotStart.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      const endTimeFormatted = slotEnd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      const label = `${startTimeFormatted} - ${endTimeFormatted}`;

      let isAvailable = true;
      let isBufferBlocked = false;

      if (isToday) {
        if (slotStart.getTime() < bufferLimitTime.getTime()) {
          isAvailable = false;
          isBufferBlocked = true;
        }
      }

      slots.push({
        timeStr: label,
        label,
        isAvailable,
        isBufferBlocked
      });
    }
  }

  return { slots, bufferTimeString, isToday };
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onNavigateToDashboard,
  preSelectedClass,
  preSelectedTrainer
}) => {
  const { user } = useAuth();
  const todayStr = new Date().toISOString().split('T')[0];

  const [userName, setUserName] = useState(user?.name || '');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [userPhone, setUserPhone] = useState(user?.phone || '');
  const [goal, setGoal] = useState<string>(preSelectedClass || 'Fitness Boxing');
  const [selectedDuration, setSelectedDuration] = useState<number>(20);
  const [selectedTrainer, setSelectedTrainer] = useState(preSelectedTrainer || 'Assigned Lead Coach');
  
  const [confirmedBooking, setConfirmedBooking] = useState<ConsultationBooking & { duration?: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const nameInputId = useId();
  const emailInputId = useId();
  const phoneInputId = useId();
  const goalInputId = useId();

  // Auto-fill logged in user details
  useEffect(() => {
    if (isOpen && user) {
      setUserName(prev => prev || user.name || '');
      setUserEmail(prev => prev || user.email || '');
      setUserPhone(prev => prev || user.phone || '');
    }
  }, [isOpen, user]);

  useEffect(() => {
    if (preSelectedTrainer) {
      setSelectedTrainer(preSelectedTrainer);
    }
  }, [preSelectedTrainer]);

  // Update default duration when goal changes
  useEffect(() => {
    const matched = ALL_GOALS_SERVICES.find(g => g.title.toLowerCase() === goal.toLowerCase());
    if (matched) {
      setSelectedDuration(matched.defaultDuration);
    }
  }, [goal]);

  // Auto-dismiss the error toast after a few seconds
  useEffect(() => {
    if (!submitError) return;
    const t = setTimeout(() => setSubmitError(null), 6000);
    return () => clearTimeout(t);
  }, [submitError]);

  if (!isOpen) return null;

  const resetForm = () => {
    setUserName('');
    setUserEmail('');
    setUserPhone('');
    setGoal('Fitness Boxing');
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const durationText = `${selectedDuration} Min`;
    const newBooking: ConsultationBooking & { duration?: string } = {
      id: 'BX-CONS-' + Math.floor(100000 + Math.random() * 900000),
      clientName: userName,
      clientEmail: userEmail,
      clientPhone: userPhone,
      goal,
      duration: durationText,
      coachPreference: selectedTrainer,
      date: 'To be scheduled',
      timeSlot: 'To be scheduled',
      status: 'Confirmed',
      remindersSent: { h24: true, h2: true, m30: true },
      createdAt: new Date().toISOString()
    };

    // Store in Local Enquiries & DB
    try {
      VelocityAPI.createEnquiry({
        name: userName,
        email: userEmail,
        phone: userPhone,
        subject: `Free Consultation (${durationText}): ${goal}`,
        message: `[FREE CONSULTATION BOOKED]\nRef: ${newBooking.id}\nGoal/Exercise: ${goal}\nDuration: ${durationText}\nPreferred schedule: To be arranged by the coaching team\nAssigned Coach: ${selectedTrainer}`
      });
    } catch (err) {
      console.error('Consultation enquiry save error:', err);
    }

    // Sync to the backend (best-effort). The lead is already captured locally above,
    // and the app is offline-first, so a network error / server outage (5xx / 503)
    // must NOT block the user — it syncs later. Only a genuine server rejection of the
    // submitted data (4xx) counts as a real failure.
    let status = 0;
    try {
      const res = await apiFetch(getApiUrl('/api/consultations'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          phone: userPhone,
          goal,
          duration: durationText,
          coachPreference: selectedTrainer,
          preferredDate: 'To be scheduled',
          preferredTime: 'To be scheduled'
        })
      });
      status = res.status;
    } catch (e: any) {
      status = 0; // network / offline — handled as a soft success below
      console.error('[Consultation submit] network error:', e?.message);
    }

    if (status >= 400 && status < 500) {
      console.error('[Consultation submit rejected] HTTP', status);
      setSubmitError(status === 429
        ? 'Too many attempts. Please wait a moment and try again.'
        : 'We couldn’t submit your request. Please double-check your details and try again.');
      return;
    }

    // Send confirmation email + admin notification (best-effort).
    sendConsultationConfirmationEmail({
      bookingId: newBooking.id,
      clientName: userName,
      clientEmail: userEmail,
      clientPhone: userPhone,
      goal,
      duration: durationText,
      coachPreference: selectedTrainer,
      date: 'To be scheduled',
      timeSlot: 'To be scheduled'
    }).catch(() => {});

    setSubmitError(null);
    resetForm();
    setConfirmedBooking(newBooking);
  };

  const resetAndClose = () => {
    setConfirmedBooking(null);
    onClose();
  };

  const goToDashboard = () => {
    setConfirmedBooking(null);
    onNavigateToDashboard();
  };

  const selectedGoalObj = ALL_GOALS_SERVICES.find(g => g.title.toLowerCase() === goal.toLowerCase());

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-white flex flex-col overflow-y-auto animate-in slide-in-from-bottom-6 duration-300">

      {/* Floating error toast (auto-dismisses, closable) */}
      {submitError && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] w-[calc(100%-2rem)] max-w-md animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-start gap-3 bg-[#1a1012]/95 backdrop-blur-xl border border-red-700/70 px-4 py-3.5 rounded-2xl shadow-2xl shadow-red-950/40">
            <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-700/60 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-red-100 uppercase tracking-wide">Submission failed</p>
              <p className="text-xs text-red-300/90 mt-0.5 leading-relaxed">{submitError}</p>
            </div>
            <button type="button" onClick={() => setSubmitError(null)} className="text-red-400/70 hover:text-red-100 transition-colors shrink-0 cursor-pointer" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-0.5 mt-1.5 mx-1 rounded-full bg-red-500/70 origin-left animate-[bx-toast-timer_6s_linear_forwards]" />
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#121214]/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={resetAndClose}
            className="p-2 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl transition-all flex items-center gap-2 cursor-pointer text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">BACK</span>
          </button>
          <div className="h-6 w-px bg-zinc-800 hidden sm:block" />
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#CCFF00] text-black flex items-center justify-center font-black shrink-0">
              <Dumbbell className="w-5 h-5 transform -rotate-45" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black uppercase tracking-wider text-white leading-tight">
                
                15-MIN FREE DEMO SESSION
              </h1>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Select your exercise protocol, session duration &amp; 1-hour buffer time slot
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={resetAndClose}
          className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer rounded-xl hover:bg-zinc-800 flex items-center gap-1.5 text-xs font-bold"
        >
          <span className="hidden sm:inline">CLOSE</span>
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        
        {confirmedBooking ? (
          /* FULL PAGE CONFIRMATION VIEW */
          <div className="max-w-xl mx-auto bg-[#121214] border border-zinc-800 rounded-3xl p-6 sm:p-10 text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-200 my-4">
            <div className="w-20 h-20 bg-emerald-950/40 border border-emerald-800 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/30">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-[11px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-950/60 px-4 py-1.5 rounded-full border border-emerald-800">
                REQUEST RECEIVED
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase mt-4">
                CONSULTATION REQUESTED!
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                We've received your request. Our team will contact you at <strong className="text-white">{confirmedBooking.clientEmail}</strong> to schedule your free 15-min session.
              </p>
            </div>

            {/* Voucher Details */}
            <div className="bg-[#18181b] p-6 rounded-2xl border border-zinc-800 text-left space-y-4 shadow-xl">
              <div className="flex justify-between items-center pb-4 border-b border-zinc-800">
                <div>
                  <span className="text-[10px] font-bold text-zinc-500 uppercase block">BOOKING REF</span>
                  <span className="text-sm font-mono font-bold text-[#CCFF00] tracking-wider">
                    {confirmedBooking.id}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-full uppercase">
                  RECEIVED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold">CLIENT NAME</p>
                  <p className="font-bold text-white uppercase text-sm mt-0.5">{confirmedBooking.clientName}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold">PRIMARY EXERCISE / GOAL</p>
                  <p className="font-bold text-[#CCFF00] uppercase text-sm mt-0.5">{confirmedBooking.goal}</p>
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] uppercase font-bold">SESSION DURATION</p>
                  <p className="font-bold text-white uppercase mt-0.5">{confirmedBooking.duration || '20 Min'}</p>
                </div>
                <div className="col-span-full bg-zinc-900/90 p-4 rounded-xl border border-zinc-800/90">
                  <p className="text-zinc-500 text-[10px] uppercase font-bold">SCHEDULING</p>
                  <p className="font-bold text-[#CCFF00] text-sm mt-0.5">Our team will contact you to arrange your session time.</p>
                </div>
              </div>
            </div>

            <button
              onClick={goToDashboard}
              className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs tracking-widest py-4 uppercase rounded-xl transition-all shadow-xl shadow-[#CCFF00]/10 cursor-pointer flex items-center justify-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              GO TO DASHBOARD
            </button>
          </div>
        ) : (
          /* FULL PAGE FORM EXPERIENCE */
          <form onSubmit={handleBookingSubmit} className="space-y-8 pb-12">

            {/* Banner info */}
            <div className="bg-gradient-to-r from-zinc-900 via-[#141417] to-zinc-900 p-6 rounded-3xl border border-zinc-800/80 shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-bold uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>1-on-1 Free Personal Consultation</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                  Schedule Your Strategy &amp; Assessment Session
                </h2>
              </div>

              <div className="flex items-center gap-3 shrink-0 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                <ShieldCheck className="w-8 h-8 text-[#CCFF00]" />
                <div className="text-[11px]">
                  <p className="font-bold text-white">100% Free &amp; No Obligation</p>
                  <p className="text-zinc-400">Direct Head Coach Assignment</p>
                </div>
              </div>
            </div>

            {/* Section 1: Client Information */}
            <section className="bg-[#121214] p-6 sm:p-8 rounded-3xl border border-zinc-800/80 space-y-6 shadow-xl">
              <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 text-[#CCFF00] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Your Contact Details</h3>
                  <p className="text-xs text-zinc-400">Where we should send your calendar invite &amp; session confirmation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor={nameInputId} className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    FULL NAME *
                  </label>
                  <input
                    id={nameInputId}
                    type="text"
                    required
                    placeholder="e.g. Alexander Vance"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor={emailInputId} className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    EMAIL ADDRESS *
                  </label>
                  <input
                    id={emailInputId}
                    type="email"
                    required
                    placeholder="alexander@domain.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor={phoneInputId} className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                    PHONE / WHATSAPP *
                  </label>
                  <input
                    id={phoneInputId}
                    type="tel"
                    required
                    placeholder="+91 8423594482"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3 text-xs font-semibold text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Primary Goal Selection (15 Services) */}
            {/* <section className="bg-[#121214] p-6 sm:p-8 rounded-3xl border border-zinc-800/80 space-y-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 text-[#CCFF00] flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-white">Select Primary Exercise Goal</h3>
                    <p className="text-xs text-zinc-400">Choose from all 15 specialized BxStrength protocols</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold text-[#CCFF00] bg-[#CCFF00]/10 px-3 py-1 rounded-full border border-[#CCFF00]/30 hidden sm:inline-block">
                  15 Protocols Available
                </span>
              </div>

              <div>
                <label htmlFor={goalInputId} className="block text-[11px] font-bold uppercase tracking-wider text-zinc-300 mb-2">
                  PRIMARY GOAL / EXERCISE PROTOCOL *
                </label>
                <select
                  id={goalInputId}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-[#18181b] border border-zinc-800 rounded-xl px-4 py-3.5 text-xs font-bold text-white focus:outline-none focus:border-[#CCFF00] transition-colors cursor-pointer"
                >
                  {ALL_GOALS_SERVICES.map((g) => (
                    <option key={g.title} value={g.title}>
                      {g.title} ({g.category}) — Standard {g.durationText}
                    </option>
                  ))}
                </select>
              </div>

              {selectedGoalObj && (
                <div className="bg-[#18181b] p-4 rounded-2xl border border-zinc-800/80 flex items-start gap-3">
                  <Award className="w-5 h-5 text-[#CCFF00] shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-white">{selectedGoalObj.title}</p>
                      <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
                        {selectedGoalObj.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{selectedGoalObj.description}</p>
                  </div>
                </div>
              )}
            </section> */}

            <div>
              Add box for the user input
            </div>


            {/* Submission CTA Bar */}
            <div className="pt-4 space-y-4">
              <button
                type="submit"
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-sm tracking-widest py-4 sm:py-5 rounded-2xl uppercase shadow-2xl shadow-[#CCFF00]/15 transition-all cursor-pointer flex items-center justify-center gap-3"
                id="btn-confirm-booking-submit"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>REQUEST MY FREE CONSULTATION</span>
              </button>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#CCFF00]" /> Email Confirmation
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#CCFF00]" /> Admin Notification Alert
                </span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-[#CCFF00]" /> Zero Cost &amp; No Obligation
                </span>
              </div>
            </div>

          </form>
        )}

      </main>
    </div>
  );
};
