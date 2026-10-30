import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, ChevronRight, ChevronLeft, Dumbbell, ShieldCheck, Flame, ArrowRight, Activity, Clock, Target, UserCheck } from 'lucide-react';
import { SelfAssessmentData } from '../types';
import { VelocityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isValidUkMobile, UK_PHONE_ERROR_MSG } from '../utils/phoneValidation';
import { PhoneInput } from './PhoneInput';
import { apiFetch, getApiUrl } from '../services/core/http';
import { loadAssessmentDraft, saveAssessmentDraft } from '../utils/assessmentDraft';

// Equipment options depend on where the client trains
const EQUIPMENT_BY_LOCATION: Record<string, { title: string; desc: string }[]> = {
  Home: [
    { title: 'No Equipment', desc: 'Bodyweight & functional exercises' },
    { title: 'Dumbbells', desc: 'Fixed or adjustable dumbbells' },
    { title: 'Resistance Bands', desc: 'Resistance & mobility bands' },
    { title: 'Exercise Mat', desc: 'Floor, core & mobility work' },
    { title: 'Bench', desc: 'Flat or adjustable bench' },
    { title: 'Boxing Equipment', desc: 'Heavy bag, gloves & wraps' },
  ],
  Gym: [
    { title: 'Full Gym Access', desc: 'Barbells, machines & cardio equipment' },
    { title: 'Free Weights', desc: 'Dumbbells, barbells & kettlebells' },
    { title: 'Resistance Machines', desc: 'Cable & plate-loaded machines' },
    { title: 'Functional Training Area', desc: 'Open space, sleds, boxes & turf' },
    { title: 'Boxing Equipment', desc: 'Bags, gloves & pads' },
    { title: 'Limited / Basic Gym', desc: 'A few machines & light weights' },
  ],
  Hybrid: [
    { title: 'Dumbbells at Home', desc: 'Free weights for home sessions' },
    { title: 'Resistance Bands', desc: 'Resistance & mobility bands' },
    { title: 'Exercise Mat', desc: 'Floor, core & mobility work' },
    { title: 'Bench', desc: 'Flat or adjustable bench' },
    { title: 'Boxing Equipment', desc: 'Heavy bag, gloves & wraps' },
    { title: 'Full Gym Access', desc: 'Barbells, machines & cardio on gym days' },
  ],
};

interface SelfAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteAndBookConsultation: (assessment: SelfAssessmentData) => void;
}

export const SelfAssessmentModal: React.FC<SelfAssessmentModalProps> = ({
  isOpen,
  onClose,
  onCompleteAndBookConsultation,
}) => {
  const { user } = useAuth();
  const [step, setStep] = useState<number>(() => loadAssessmentDraft()?.step ?? 1);
  const [formData, setFormData] = useState<SelfAssessmentData>(
    () =>
      loadAssessmentDraft()?.formData ?? {
    goal: '',
    fitnessLevel: '',
    trainingDays: '',
    trainingLocation: '',
    equipment: '',
    trainingInterest: '',
    hasInjury: '',
    obstacle: '',
    experience: '',
    commitment: '',
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    preferredContactMethod: '',
    submittedAt: '',
  },
);

  // Auto-fill user details whenever user or modal state updates
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user, isOpen]);

  const [isCompleted, setIsCompleted] = useState<boolean>(
    () => loadAssessmentDraft()?.isCompleted ?? false,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    saveAssessmentDraft({ formData, step, isCompleted });
  }, [formData, step, isCompleted]);

  if (!isOpen) return null;

  const totalSteps = 7;

  const handleSelectGoal = (goal: string) => {
    setFormData((prev) => ({ ...prev, goal }));
    setStep(2);
  };

  const handleSelectFitnessLevel = (fitnessLevel: string) => {
    setFormData((prev) => ({ ...prev, fitnessLevel, experience: fitnessLevel }));
    setStep(3);
  };

  const handleSelectTrainingDays = (trainingDays: string) => {
    setFormData((prev) => ({ ...prev, trainingDays, commitment: `${trainingDays} Days/Wk` }));
    setStep(4);
  };

  const handleSelectTrainingLocation = (trainingLocation: string) => {
    // A new location has different equipment, so an earlier pick no longer applies
    setFormData((prev) => ({
      ...prev,
      trainingLocation,
      equipment: prev.trainingLocation === trainingLocation ? prev.equipment : '',
    }));
    setStep(5);
  };

  const handleSelectEquipment = (equipment: string) => {
    setFormData((prev) => ({ ...prev, equipment }));
    setStep(6);
  };

  const handleSelectHasInjury = (hasInjury: string) => {
    setFormData((prev) => ({ ...prev, hasInjury }));
    setStep(7);
  };

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone && !isValidUkMobile(formData.phone)) {
      alert(UK_PHONE_ERROR_MSG);
      return;
    }
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await apiFetch(getApiUrl('/api/assessments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          preferredContactMethod: formData.preferredContactMethod,
          primaryGoal: formData.goal,
          mainObstacle: formData.obstacle,
          experienceLevel: formData.fitnessLevel,
          weeklyCommitment: formData.trainingDays,
          trainingLocation: formData.trainingLocation,
          equipment: formData.equipment,
          trainingInterest: formData.trainingInterest,
          hasInjury: formData.hasInjury,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Could not save your assessment. Please try again.');
      }

      const finalAssessment = { ...formData, submittedAt: new Date().toISOString() };
      try {
        VelocityAPI.createEnquiry({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          preferredContactMethod: formData.preferredContactMethod || undefined,
          subject: `Diagnostic Assessment: ${formData.goal}`,
          message: `[SELF ASSESSMENT DIAGNOSTIC]\n1. Main Goal: ${formData.goal}\n2. Fitness Level: ${formData.fitnessLevel || 'N/A'}\n3. Training Days/Wk: ${formData.trainingDays || 'N/A'}\n4. Training Location: ${formData.trainingLocation || 'N/A'}\n5. Equipment: ${formData.equipment || 'N/A'}\n6. Injury/Medical Restriction: ${formData.hasInjury || 'N/A'}\n7. Preferred Contact Method: ${formData.preferredContactMethod}`,
        });
      } catch (error) {
        console.error('Diagnostic enquiry local sync error:', error);
      }
      setFormData(finalAssessment);
      setIsCompleted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save your assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalBooking = () => {
    onCompleteAndBookConsultation(formData);
    onClose();
    setStep(1);
    setIsCompleted(false);
  };

  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-2xl bg-[#121214] text-white border-0 sm:border border-zinc-800 shadow-2xl rounded-none sm:rounded-2xl overflow-hidden flex flex-col">
        
        {/* Modal Sticky Top Header */}
        <div className="px-5 py-4 bg-[#18181b] border-b border-zinc-800/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#CCFF00] text-black flex items-center justify-center font-black">
              <Dumbbell className="w-4 h-4 transform -rotate-45" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">BxStrength Self-Assessment</h3>
              <p className="text-[10px] sm:text-[11px] text-zinc-400 font-medium">Personalised Fitness &amp; Training Assessment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close Assessment"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Container with Scroll */}
        <div className="p-5 sm:p-8 overflow-y-auto flex-1">
          {!isCompleted ? (
            <div>
              {/* Single Navigation Header Bar */}
              <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handleGoBack}
                      className="flex items-center gap-1 text-xs font-black uppercase tracking-wider text-zinc-200 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg border border-zinc-700 transition-all cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#CCFF00]" />
                      <span>Back</span>
                    </button>
                  )}
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
                    STEP {step} OF {totalSteps} {step === 7 && '(FINAL DETAILS)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-[#CCFF00]">{progressPercent}%</span>
                  <div className="w-20 sm:w-28 bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#CCFF00] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* QUESTION 1: MAIN GOAL */}
              {step === 1 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest block mb-1">
                      QUESTION 1 OF 6
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white mb-1.5">
                      What is your main goal?
                    </h2>
                    <p className="text-xs text-zinc-400">Select the primary outcome you want to achieve with BxStrength coaching.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { title: 'Fat loss', desc: 'Reduce body fat & lean recomposition' },
                      { title: 'Strength', desc: 'Build raw strength & compound power' },
                      { title: 'Boxing', desc: 'Technique, speed & fight conditioning' },
                      { title: 'Mobility', desc: 'Flexibility, joint health & posture' },
                      { title: 'General fitness', desc: 'Stamina, energy & overall health' },
                      { title: 'Muscle gain', desc: 'Hypertrophy & muscle mass development' },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleSelectGoal(item.title)}
                        className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between group cursor-pointer ${
                          formData.goal === item.title
                            ? 'border-[#CCFF00] bg-zinc-800/90 shadow-md'
                            : 'border-zinc-800 bg-[#18181b] hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold uppercase text-white group-hover:text-[#CCFF00] flex items-center justify-between">
                            {item.title}
                            <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#CCFF00] group-hover:translate-x-0.5 transition-all" />
                          </p>
                          <p className="text-[11px] text-zinc-400 mt-1">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTION 2: FITNESS LEVEL */}
              {step === 2 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest block mb-1">
                      QUESTION 2 OF 6
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white mb-1.5">
                      What is your current fitness level?
                    </h2>
                    <p className="text-xs text-zinc-400">Be honest — we tailor programs for absolute beginners to advanced athletes.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { title: 'Beginner', desc: 'New to fitness or returning after a long break' },
                      { title: 'Intermediate', desc: 'Train regularly with basic exercise knowledge' },
                      { title: 'Advanced', desc: 'Consistent athlete seeking peak performance' },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleSelectFitnessLevel(item.title)}
                        className={`p-5 rounded-xl text-left border transition-all group cursor-pointer ${
                          formData.fitnessLevel === item.title
                            ? 'border-[#CCFF00] bg-zinc-800/90 shadow-md'
                            : 'border-zinc-800 bg-[#18181b] hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <p className="text-base font-bold uppercase text-white group-hover:text-[#CCFF00] flex items-center justify-between">
                          {item.title}
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#CCFF00] group-hover:translate-x-0.5 transition-all" />
                        </p>
                        <p className="text-xs text-zinc-400 mt-1.5">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTION 3: TRAINING DAYS */}
              {step === 3 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest block mb-1">
                      QUESTION 3 OF 6
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white mb-1.5">
                      How many days per week can you train?
                    </h2>
                    <p className="text-xs text-zinc-400">Select your realistic weekly training frequency.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { title: '1', label: '1 Day / Wk', desc: 'High-efficiency session' },
                      { title: '2', label: '2 Days / Wk', desc: 'Balanced schedule' },
                      { title: '3', label: '3 Days / Wk', desc: 'Optimal progression' },
                      { title: '4+', label: '4+ Days / Wk', desc: 'Performance protocol' },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleSelectTrainingDays(item.title)}
                        className={`p-5 rounded-xl text-center border transition-all group cursor-pointer ${
                          formData.trainingDays === item.title
                            ? 'border-[#CCFF00] bg-zinc-800/90 shadow-md'
                            : 'border-zinc-800 bg-[#18181b] hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <span className="text-3xl font-black text-white group-hover:text-[#CCFF00] block mb-1">
                          {item.title}
                        </span>
                        <p className="text-xs font-bold uppercase text-zinc-300">{item.label}</p>
                        <p className="text-[10px] text-zinc-400 mt-1">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTION 4: TRAINING LOCATION */}
              {step === 4 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest block mb-1">
                      QUESTION 4 OF 6
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white mb-1.5">
                      Where will you train?
                    </h2>
                    <p className="text-xs text-zinc-400">We design workouts specifically for your training environment.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { title: 'Home', desc: 'At-home workouts with bodyweight or home gear' },
                      { title: 'Gym', desc: 'Commercial gym or fitness facility access' },
                      { title: 'Hybrid', desc: 'Combination of home and gym workouts' },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleSelectTrainingLocation(item.title)}
                        className={`p-5 rounded-xl text-left border transition-all group cursor-pointer ${
                          formData.trainingLocation === item.title
                            ? 'border-[#CCFF00] bg-zinc-800/90 shadow-md'
                            : 'border-zinc-800 bg-[#18181b] hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <p className="text-base font-bold uppercase text-white group-hover:text-[#CCFF00] flex items-center justify-between">
                          {item.title}
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#CCFF00] group-hover:translate-x-0.5 transition-all" />
                        </p>
                        <p className="text-xs text-zinc-400 mt-1.5">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTION 5: EQUIPMENT */}
              {step === 5 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest block mb-1">
                      QUESTION 5 OF 6
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white mb-1.5">
                      What equipment do you have?
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Select the equipment available for your {(formData.trainingLocation || 'Home').toLowerCase()} training.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(EQUIPMENT_BY_LOCATION[formData.trainingLocation] ?? EQUIPMENT_BY_LOCATION.Home).map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleSelectEquipment(item.title)}
                        className={`p-4 rounded-xl text-left border transition-all group cursor-pointer ${
                          formData.equipment === item.title
                            ? 'border-[#CCFF00] bg-zinc-800/90 shadow-md'
                            : 'border-zinc-800 bg-[#18181b] hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <p className="text-sm font-bold uppercase text-white group-hover:text-[#CCFF00] flex items-center justify-between">
                          {item.title}
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-[#CCFF00] group-hover:translate-x-0.5 transition-all" />
                        </p>
                        <p className="text-[11px] text-zinc-400 mt-1">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* QUESTION 6: INJURY / MEDICAL RESTRICTIONS */}
              {step === 6 && (
                <div className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest block mb-1">
                      QUESTION 6 OF 6
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white mb-1.5">
                      Do you currently have an injury, significant pain, medical restriction, or recent surgery?
                    </h2>
                    <p className="text-xs text-zinc-400">Our physiotherapy expertise helps adapt exercise around any physical limitation.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { title: 'Yes', desc: 'I have an injury, pain, or medical condition to accommodate' },
                      { title: 'No', desc: 'I have no injuries or medical restrictions' },
                    ].map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => handleSelectHasInjury(item.title)}
                        className={`p-6 rounded-xl text-left border transition-all group cursor-pointer ${
                          formData.hasInjury === item.title
                            ? 'border-[#CCFF00] bg-zinc-800/90 shadow-md'
                            : 'border-zinc-800 bg-[#18181b] hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <span className="text-2xl font-black uppercase text-white group-hover:text-[#CCFF00] block mb-1">
                          {item.title}
                        </span>
                        <p className="text-xs text-zinc-400">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 7: CONTACT DETAILS & REPORT GENERATION */}
              {step === 7 && (
                <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-150">
                  <div>
                    <span className="text-[10px] font-black text-[#CCFF00] uppercase tracking-widest block mb-1">
                      FINAL STEP 7 OF 7
                    </span>
                    <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white mb-1.5">
                      Generate Your Diagnostic Report
                    </h2>
                    <p className="text-xs text-zinc-400">Enter your details so your assigned head coach can review your profile before your 15-min session.</p>
                  </div>

                  <div className="space-y-4 bg-[#18181b] p-5 rounded-xl border border-zinc-800">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-[#121214] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="client@domain.com"
                          className="w-full bg-[#121214] border border-zinc-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
                        />
                      </div>
                        <PhoneInput
                          value={formData.phone}
                          onChange={(val) => setFormData({ ...formData, phone: val })}
                          label="Mobile Phone Number"
                          required
                        />
                    </div>

                    <fieldset className="space-y-2">
                      <legend className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                        Preferred Mode of Contact <span className="text-[#CCFF00]">*</span>
                      </legend>
                      <div className="flex flex-wrap gap-3 sm:gap-5">
                        {[
                          { value: 'whatsapp', label: 'WhatsApp' },
                          { value: 'email', label: 'Email' },
                          { value: 'call', label: 'Call' },
                        ].map((method) => (
                          <label key={method.value} className="inline-flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                            <input
                              type="radio"
                              name="preferredContactMethod"
                              value={method.value}
                              checked={formData.preferredContactMethod === method.value}
                              onChange={() => setFormData({ ...formData, preferredContactMethod: method.value as 'whatsapp' | 'email' | 'call' })}
                              required
                              className="h-4 w-4 accent-[#CCFF00]"
                            />
                            {method.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>

                  <div className="pt-2">
                    {submitError && (
                      <p role="alert" className="mb-3 text-sm text-red-400">{submitError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs tracking-widest uppercase py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-wait"
                    >
                      <Activity className="w-4 h-4" />
                      <span>{isSubmitting ? 'SAVING YOUR ASSESSMENT…' : 'SUBMIT & VIEW DIAGNOSTIC RESULT'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* COMPLETED ASSESSMENT RESULT */
            <div aria-live="polite" className="text-center py-4 space-y-6 animate-in zoom-in-95 duration-200">
              <div className="assessment-success-stage relative h-20 w-20 flex items-center justify-center mx-auto">
                <div className="assessment-success-icon relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[#CCFF00] flex items-center justify-center">
                  <CheckCircle2 className="assessment-success-mark w-8 h-8 text-[#CCFF00]" />
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">
                  QUALIFIED MATCH: 98% COACHING COMPATIBILITY
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-3">
                  Assessment Complete, {formData.name.split(' ')[0]}!
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto mt-2 leading-relaxed">
                  Based on your primary goal of <strong className="text-[#CCFF00] font-bold">{formData.goal}</strong> and training preferences, you qualify for a complimentary 15-minute 1-on-1 session with our Head Coach.
                </p>
              </div>

              <div className="assessment-offer-reveal relative overflow-hidden rounded-2xl border border-[#CCFF00]/35 bg-gradient-to-br from-[#1a2011] via-[#11150d] to-[#101013] p-5 sm:p-6 text-left shadow-[0_12px_36px_rgba(0,0,0,0.35)]">
                <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full bg-[#CCFF00]/10 blur-3xl" />
                <div className="relative flex items-start gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#CCFF00]/30 bg-[#CCFF00]/10 text-[#CCFF00]">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="inline-flex rounded-full border border-[#CCFF00]/30 bg-[#CCFF00]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#CCFF00]">
                      Your complimentary session
                    </span>
                    <h3 className="mt-2 text-lg sm:text-xl font-black tracking-tight text-white">
                      Claim your free 15-minute session
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-zinc-300">
                      Meet your coach, talk through your goal, and get a clear first step for your training.
                    </p>
                  </div>
                </div>
              </div>

              {/* Assessment summary pill cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-left text-xs bg-[#18181b] p-4 rounded-xl border border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Goal</span>
                  <span className="font-bold text-white truncate block">{formData.goal || 'General'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Level</span>
                  <span className="font-bold text-white truncate block">{formData.fitnessLevel || 'Beginner'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Frequency</span>
                  <span className="font-bold text-white truncate block">{formData.trainingDays ? `${formData.trainingDays} Days/Wk` : '3 Days'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Location</span>
                  <span className="font-bold text-white truncate block">{formData.trainingLocation || 'Home'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Equipment</span>
                  <span className="font-bold text-white truncate block">{formData.equipment || 'None'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Contact Method</span>
                  <span className="font-bold text-white truncate block capitalize">{formData.preferredContactMethod === 'whatsapp' ? 'WhatsApp' : formData.preferredContactMethod || 'Not selected'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Injury / Medical</span>
                  <span className="font-bold text-white truncate block">{formData.hasInjury || 'No'}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleFinalBooking}
                  className="w-full sm:w-auto bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs tracking-widest uppercase px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                >
                 REQUEST MY FREE 15-MIN DEMO
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto text-zinc-400 hover:text-white font-bold text-xs tracking-wider uppercase px-4 py-3 cursor-pointer"
                >
                  CLOSE
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
