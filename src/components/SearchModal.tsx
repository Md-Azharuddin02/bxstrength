import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Calendar, User as UserIcon, Clock, ArrowRight, Dumbbell, Shield, BookOpen, TrendingUp, ShieldCheck, AlertCircle, Command, Activity, HeartPulse, Send, CheckCircle2, MessageSquare, HelpCircle } from 'lucide-react';
import { 
  CLASSES_DATA, 
  SERVICES_DATA, 
  BLOG_POSTS_DATA, 
  MEMBERSHIP_PLANS,
  TRAINERS_DATA
} from '../data/gymData';
import { FitnessClass, Trainer, ServiceItem, BlogPost, MembershipPlan, ViewPage, User } from '../types';
import { VelocityAPI } from '../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: ViewPage, elementId?: string) => void;
  onOpenBookingWithClass: (className: string) => void;
  onOpenBookingWithTrainer: (trainerName: string) => void;
  onSelectPlan: (planName: string) => void;
  onSelectBlogPost: (postId: string) => void;
}

export interface HealthSymptomTopic {
  id: string;
  keywords: string[];
  title: string;
  category: string;
  summary: string;
  recommendedCoach: string;
  relatedTopics: string[];
  protocolGuide: string;
}

export const HEALTH_SYMPTOM_DATABASE: HealthSymptomTopic[] = [
  {
    id: 'knee-pain',
    keywords: ['knee', 'knee pain', 'patellar', 'joint pain', 'squat pain', 'stairs'],
    title: 'Knee Joint Rehabilitation & Patellar Biomechanics',
    category: 'Joint & Structural Health',
    summary: 'Custom low-impact loading, quad vmo strengthening, and patellar tracking correction for squatting and stair pain.',
    recommendedCoach: 'Head Coach & Team',
    relatedTopics: [
      'VMO Activation Drills',
      'Joint Mobility & Cartilage Decompression',
      'Low-Impact Recomposition Protocol'
    ],
    protocolGuide: 'Patellar tendonitis and meniscus strain usually stem from hip mobility restrictions and VMO weakness. Our protocol rebuilding includes targeted isometric holds, posterior chain balance, and biomechanical video screening.'
  },
  {
    id: 'back-pain',
    keywords: ['back', 'back pain', 'lower back', 'spine', 'l4', 'l5', 'posture', 'scalliosis'],
    title: 'Lower Back Rehabilitation & L4-L5 Spinal Decompression',
    category: 'Postural & Spinal Health',
    summary: 'Core bracing, glute activation, and pelvic alignment to eliminate chronic lower back tightness during sitting or lifting.',
    recommendedCoach: 'Head Coach & Team',
    relatedTopics: [
      'Intra-Abdominal Pressure (IAP) Bracing',
      'Posterior Chain Alignment',
      'Ergonomic Posture Restructuring'
    ],
    protocolGuide: 'Lower back discomfort is often caused by weak deep abdominal stabilizers (transverse abdominis) and glute amnesia. We utilize McGill-3 bracing, thoracic spine mobilization, and controlled deadlift hip-hinge patterning.'
  },
  {
    id: 'pcos-period-cycle',
    keywords: ['period', 'periods', 'pcos', 'pcod', 'cycle', 'menstrual', 'female', 'women', 'hormones', 'estrogen', 'progesterone', 'cramps'],
    title: 'PCOS & Female Menstrual Cycle Synchronized Training',
    category: 'Women\'s Metabolic & Hormonal Health',
    summary: 'Periodized training aligned with Follicular, Ovulatory, and Luteal phases to manage PCOS, normalize period regularity, and reduce inflammation.',
    recommendedCoach: 'Sadeem',
    relatedTopics: [
      'Luteal Phase Progesterone Nutrition',
      'Insulin Sensitivity for PCOS',
      'Cortisol Mitigation in Female Athletes'
    ],
    protocolGuide: 'The female menstrual cycle directly impacts insulin sensitivity, ligament laxity, and metabolic rate. We structure high-intensity work during the Follicular phase and prioritize deload recovery during the Luteal phase to support cycle regularity.'
  },
  {
    id: 'fat-loss-130',
    keywords: ['fat loss', 'weight loss', '130kg', 'obesity', 'overweight', 'recomp', 'belly fat', 'diet'],
    title: 'Executive Metabolic Reset (130kg ➔ 80kg Protocol)',
    category: 'Sustained Weight Loss & Recomposition',
    summary: 'Structured fat loss protocol going from 130kg down to 80kg fit weight while preserving joint health and metabolic function.',
    recommendedCoach: 'Sadeem',
    relatedTopics: [
      'Visceral Fat Mobilization',
      'Non-Exercise Activity Thermogenesis (NEAT)',
      'High-Protein Macro Calculation'
    ],
    protocolGuide: 'Sustained weight loss from 130kg to 80kg requires non-linear caloric wave periodization, strength maintenance to prevent muscle wasting, and daily steps tracking (NEAT optimization).'
  },
  {
    id: 'shoulder-impingement',
    keywords: ['shoulder', 'rotator cuff', 'impingement', 'overhead', 'deltoid', 'collarbone'],
    title: 'Rotator Cuff & Shoulder Overhead Mobility Rehab',
    category: 'Upper Body Biomechanics',
    summary: 'Scapular rhythm restoration, rotator cuff strengthening, and thoracic mobility to restore pain-free pressing.',
    recommendedCoach: 'Head Coach & Team',
    relatedTopics: [
      'Scapular Upward Rotation Drills',
      'Subscapularis & Infraspinatus Firing',
      'Overhead Lockout Stability'
    ],
    protocolGuide: 'Overhead shoulder pinching occurs when the humeral head pinches the subacromial bursa. We restore thoracic extension, strengthen the serratus anterior, and re-educate shoulder pressing mechanics.'
  },
  {
    id: 'postpartum-core',
    keywords: ['pregnancy', 'postpartum', 'post-pregnancy', 'pelvic', 'diastasis', 'mom'],
    title: 'Post-Pregnancy Core & Pelvic Floor Restoration',
    category: 'Female Recovery & Core Integrity',
    summary: 'Diastasis recti recovery, pelvic floor re-education, and safe return to heavy lifting post-delivery.',
    recommendedCoach: 'Moheeb Khan',
    relatedTopics: [
      'Diastasis Recti Core Realignment',
      'Pelvic Pressure Management',
      'Safe Return to Strength Training'
    ],
    protocolGuide: 'Postpartum recovery requires strict intra-abdominal pressure regulation to prevent hernia or pelvic floor strain. We prioritize gentle transverse abdominis re-education before introducing progressive barbell loads.'
  }
];

export const POPULAR_SEARCH_SUGGESTIONS = [
  'Knee Pain', 
  'Back Pain', 
  'Periods Cycle & PCOS', 
  'Fat Loss (130kg to 80kg)', 
  'Shoulder Rehab',
  'Head Coach & Team'
];

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenBookingWithClass,
  onOpenBookingWithTrainer,
  onSelectPlan,
  onSelectBlogPost
}) => {
  const [query, setQuery] = useState('');
  const [showConsultForm, setShowConsultForm] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<HealthSymptomTopic | null>(null);

  // String Capture Consultation Form State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [consultSuccess, setConsultSuccess] = useState(false);

  const [results, setResults] = useState<{
    symptoms: HealthSymptomTopic[];
    classes: FitnessClass[];
    trainers: User[];
    services: ServiceItem[];
    blogs: BlogPost[];
    plans: MembershipPlan[];
  }>({
    symptoms: [],
    classes: [],
    trainers: [],
    services: [],
    blogs: [],
    plans: []
  });

  const [dbCoaches, setDbCoaches] = useState<User[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Load real coaches from database on open
  useEffect(() => {
    if (!isOpen) return;
    const loadRealCoaches = async () => {
      try {
        const res = await fetch('/api/users');
        if (res.ok) {
          const rawUsers = await res.json();
          if (Array.isArray(rawUsers)) {
            const coaches = rawUsers.filter((u: any) => u.role === 'coach' || u.role === 'admin');
            setDbCoaches(coaches.map((u: any) => ({
              id: String(u.id || `coach-${Date.now()}`),
              name: String(u.name || u.email || 'Coach'),
              email: String(u.email || ''),
              role: (u.role || 'coach') as any,
              coachPosition: u.coach_position || u.coachPosition || (u.role === 'HeadCoach' ? 'Coach' : ''),
              phone: u.phone || '',
              avatarUrl: u.avatar_url || u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name || u.email)}`,
              fitnessGoals: u.fitness_goals || u.fitnessGoals || 'Strength & Biomechanics',
              isVerified: true,
              status: u.status || 'active',
              createdAt: u.created_at || new Date().toISOString()
            })));
            return;
          }
        }
      } catch {}

      const localUsers = VelocityAPI.getUsers().filter(u => u.role === 'coach' || u.role === 'admin');
      setDbCoaches(localUsers);
    };

    loadRealCoaches();
  }, [isOpen]);

  // Popular search recommendations including health symptoms
  const popularSearches = [
    'Knee Pain', 
    'Back Pain', 
    'Periods Cycle & PCOS', 
    'Fat Loss (130kg to 80kg)', 
    'Shoulder Rehab',
    'Head Coach & Team'
  ];

  // Handle escape key closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setShowConsultForm(false);
      setConsultSuccess(false);
      setSelectedTopic(null);
    }
  }, [isOpen]);

  // Handle clicks outside the modal content box
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Perform search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults({ symptoms: [], classes: [], trainers: [], services: [], blogs: [], plans: [] });
      setSelectedTopic(null);
      return;
    }

    const cleanQuery = query.toLowerCase().trim();
    const searchTerms = [cleanQuery];

    if (cleanQuery.includes('gym') || cleanQuery.includes('muscle') || cleanQuery.includes('lift') || cleanQuery.includes('strength')) {
      searchTerms.push('strength', 'hypertrophy', 'weight');
    }
    if (cleanQuery.includes('trainer') || cleanQuery.includes('coach') || cleanQuery.includes('instructor')) {
      searchTerms.push('fitness trainer', 'coaching', 'specialist');
    }

    const matchesQuery = (text: string) => {
      return searchTerms.some(term => text.toLowerCase().includes(term));
    };

    // Filter Health Symptom Database
    const matchedSymptoms = HEALTH_SYMPTOM_DATABASE.filter(topic => 
      topic.keywords.some(kw => cleanQuery.includes(kw) || kw.includes(cleanQuery)) ||
      matchesQuery(topic.title) ||
      matchesQuery(topic.summary) ||
      matchesQuery(topic.category)
    );

    // Auto-select primary symptom topic if matched
    if (matchedSymptoms.length > 0) {
      setSelectedTopic(matchedSymptoms[0]);
    } else {
      setSelectedTopic(null);
    }

    // Filter Classes
    const matchedClasses = CLASSES_DATA.filter(cls => 
      matchesQuery(cls.title) || 
      matchesQuery(cls.description) || 
      matchesQuery(cls.category) || 
      matchesQuery(cls.trainerName)
    );

    // Filter Expert Coaches from Database or Static Data
    const coachPool: User[] = dbCoaches.length > 0 
      ? dbCoaches 
      : TRAINERS_DATA.map(t => ({
          id: t.id,
          name: t.name,
          email: `${t.name.toLowerCase().replace(/\s+/g, '.')}@bxstrength.com`,
          role: 'coach',
          coachPosition: t.role,
          avatarUrl: t.image,
          isVerified: true,
          status: 'active',
          createdAt: new Date().toISOString()
        }));

    const matchedTrainers = coachPool.filter(coach => 
      matchesQuery(coach.name) || 
      matchesQuery(coach.role) || 
      matchesQuery(coach.coachPosition || '') || 
      matchesQuery(coach.email)
    );

    // Filter Services
    const matchedServices = SERVICES_DATA.filter(svc => 
      matchesQuery(svc.title) || 
      (svc.description ? matchesQuery(svc.description) : false) || 
      (svc.benefits ? svc.benefits.some(ben => matchesQuery(ben)) : false) ||
      (svc.whatYouGet ? (Array.isArray(svc.whatYouGet) ? svc.whatYouGet.some(w => matchesQuery(w)) : matchesQuery(svc.whatYouGet)) : false)
    );

    // Filter Blogs
    const matchedBlogs = BLOG_POSTS_DATA.filter(post => 
      matchesQuery(post.title) || 
      matchesQuery(post.excerpt) || 
      matchesQuery(post.content) || 
      matchesQuery(post.category)
    );

    // Filter Plans
    const matchedPlans = MEMBERSHIP_PLANS.filter(plan => 
      matchesQuery(plan.name) || 
      plan.features.some(feat => matchesQuery(feat))
    );

    setResults({
      symptoms: matchedSymptoms,
      classes: matchedClasses,
      trainers: matchedTrainers,
      services: matchedServices,
      blogs: matchedBlogs,
      plans: matchedPlans
    });
  }, [query]);

  // String Capture Submission Handler to database & CRM Pipeline
  const handleStringCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail) return;

    setIsSubmitting(true);

    const capturedSubject = `HEALTH QUERY: "${query || 'General Symptom Search'}"`;
    const capturedMessage = `CAPTURED QUERY STRING: "${query}"\n\nClient Notes: ${additionalNotes || 'N/A'}\nPhone: ${clientPhone || 'Not provided'}`;

    try {
      // Save directly in local store
      VelocityAPI.createEnquiry({
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
        subject: capturedSubject,
        message: capturedMessage
      });

      // Post to PostgreSQL API
      await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clientName,
          email: clientEmail,
          phone: clientPhone,
          subject: capturedSubject,
          message: capturedMessage
        })
      }).catch(() => {});

      setConsultSuccess(true);
      setIsSubmitting(false);
    } catch {
      setConsultSuccess(true);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const totalResults = 
    results.symptoms.length +
    results.classes.length + 
    results.trainers.length + 
    results.services.length + 
    results.blogs.length + 
    results.plans.length;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center p-0 sm:p-4 md:p-6 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div 
        ref={modalRef}
        className="bg-[#121214] text-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl rounded-none sm:rounded-xl shadow-2xl border-0 sm:border border-zinc-800 overflow-hidden flex flex-col my-0 sm:my-8 animate-in slide-in-from-top-6 duration-200"
      >
        {/* Search Input Bar Header */}
        <div className="relative border-b border-zinc-800 flex items-center bg-[#18181b] px-5 py-4">
          <Search className="w-5 h-5 text-emerald-400 mr-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search symptoms, joint issues, PCOS cycle, coaches... (e.g. Knee pain, Back pain, Period cycle)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-bold text-white placeholder-zinc-500 focus:outline-none py-1"
          />
          {query && (
            <button 
              onClick={() => {
                setQuery('');
                setShowConsultForm(false);
              }}
              className="text-xs text-zinc-400 hover:text-white mr-3 uppercase font-black cursor-pointer"
            >
              Clear
            </button>
          )}
          <span className="hidden sm:inline-block text-[10px] font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded border border-zinc-700 mr-2">
            ESC
          </span>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800 cursor-pointer"
            title="Close Search"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Direct String Capture Consultation Modal Overrider */}
          {showConsultForm ? (
            <div className="bg-[#18181c] border border-emerald-800/80 rounded-xl p-6 space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-black uppercase text-white tracking-tight">
                    CONSULT BXSTRENGTH EXPERTS FOR THIS ISSUE
                  </h3>
                </div>
                <button
                  onClick={() => setShowConsultForm(false)}
                  className="text-xs text-zinc-400 hover:text-white uppercase font-bold"
                >
                  Back to Search
                </button>
              </div>

              {consultSuccess ? (
                <div className="text-center py-8 space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                  <h4 className="text-xl font-black text-white uppercase">INQUIRY SUBMITTED SUCCESSFULLY!</h4>
                  <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed">
                    Our Senior Biomechanics & Health Specialists have captured your inquiry regarding <strong className="text-emerald-400">"{query}"</strong>. A coach will review your details and reach out within 2 hours.
                  </p>
                  <button
                    onClick={() => {
                      setShowConsultForm(false);
                      setConsultSuccess(false);
                      onClose();
                    }}
                    className="mt-4 bg-emerald-400 text-black text-xs font-black px-6 py-2.5 rounded uppercase tracking-wider cursor-pointer"
                  >
                    Done & Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleStringCaptureSubmit} className="space-y-4">
                  <div className="bg-zinc-900 border border-zinc-800 p-3 rounded text-xs">
                    <span className="text-zinc-400 uppercase font-bold block mb-1">Captured Search Issue:</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">"{query}"</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Alex Morgan"
                        className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-xs text-white outline-none rounded focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-xs text-white outline-none rounded focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+44 7123 456789"
                        className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-xs text-white outline-none rounded focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400 tracking-wider mb-1">
                        Symptom Duration / Details
                      </label>
                      <input
                        type="text"
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                        placeholder="e.g. 3 months knee discomfort when squatting"
                        className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 text-xs text-white outline-none rounded focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-black tracking-widest py-3 rounded uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'SENDING INQUIRY TO COACHES...' : 'SUBMIT QUERY TO EXPERT COACHES'}</span>
                  </button>
                </form>
              )}
            </div>
          ) : !query.trim() ? (
            /* Default state: show popular suggestions */
            <div className="space-y-6">
              <div className="flex items-center gap-1.5 text-xs font-black text-zinc-400 uppercase tracking-widest">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>POPULAR SYMPTOM & HEALTH SEARCHES</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularSearches.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3.5 py-2 bg-[#18181b] hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 text-xs font-bold uppercase tracking-wider transition-colors rounded-lg cursor-pointer flex items-center gap-1.5"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>

              {/* Featured Health Symptom Topics Directory */}
              <div className="space-y-3 pt-4 border-t border-zinc-800">
                <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                  <span>FEATURED HEALTH & REHABILITATION TOPICS</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {HEALTH_SYMPTOM_DATABASE.slice(0, 4).map((topic) => (
                    <div
                      key={topic.id}
                      onClick={() => setQuery(topic.keywords[0])}
                      className="bg-[#18181b] border border-zinc-800 hover:border-zinc-600 p-4 rounded-xl space-y-2 cursor-pointer group transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900">
                          {topic.category}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
                      </div>
                      <h5 className="text-xs font-black text-white uppercase group-hover:text-emerald-400 transition-colors leading-tight">
                        {topic.title}
                      </h5>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed font-normal">
                        {topic.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Results display grouped by category */
            <div className="space-y-6">
              
              {/* Top Banner: Informational Protocol Guidance */}
              <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-emerald-400" />
                    <span>SCIENTIFIC RECOVERY &amp; DIAGNOSTIC GUIDES FOR "{query.toUpperCase()}"</span>
                  </h4>
                  <p className="text-[11px] text-zinc-300">
                    Review clinical protocols, periodized training adjustments, and biomechanical guides compiled by BxStrength specialists.
                  </p>
                </div>
              </div>

              {/* Group: Primary Symptom Topic Match & Related Topics */}
              {results.symptoms.length > 0 && selectedTopic && (
                <div className="bg-[#18181c] border border-emerald-900/80 rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-800">
                        HEALTH DIAGNOSTIC TOPIC
                      </span>
                      <h4 className="text-base font-black text-white uppercase mt-1">
                        {selectedTopic.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Lead Coach: <strong className="text-white">{selectedTopic.recommendedCoach}</strong>
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                    {selectedTopic.protocolGuide}
                  </p>

                  {/* Related Topics & Recommendations (Clickable) */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-2">
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider flex items-center gap-1">
                      <HelpCircle className="w-3 h-3 text-emerald-400" />
                      <span>RELATED TOPICS & SCIENTIFIC GUIDES:</span>
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTopic.relatedTopics.map((rel, idx) => (
                        <button
                          key={idx}
                          onClick={() => setQuery(rel)}
                          className="text-[10px] font-bold text-zinc-300 bg-zinc-900 hover:bg-zinc-800 hover:text-emerald-400 border border-zinc-800 px-3 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>{rel}</span>
                          <ArrowRight className="w-3 h-3 text-zinc-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Group: Real Database Coaches */}
              {results.trainers.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>DATABASE VERIFIED COACHES ({results.trainers.length})</span>
                  </h4>
                  <div className="grid gap-2">
                    {results.trainers.map(trainer => (
                      <div 
                        key={trainer.id}
                        className="bg-[#18181b] border border-zinc-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-zinc-700 transition-colors"
                      >
                        <div className="flex gap-3 items-center">
                          <img 
                            src={trainer.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(trainer.name)}`} 
                            alt={trainer.name} 
                            className="w-10 h-10 object-cover rounded-full border border-zinc-700"
                          />
                          <div className="space-y-0.5">
                            <h5 className="text-sm font-black text-white uppercase group-hover:text-emerald-400 transition-colors">
                              {trainer.name}
                            </h5>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900/60">
                                {trainer.coachPosition || 'HeadCoach'}
                              </span>
                              <span className="text-[9px] text-zinc-400 font-mono">{trainer.email}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-extrabold uppercase text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded">
                            Verified Credentials
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                query.toLowerCase().includes('coach') || query.toLowerCase().includes('david') || query.toLowerCase().includes('trainer') ? (
                  <div className="bg-[#18181b] border border-zinc-800/80 p-4 rounded-lg text-center space-y-1">
                    <UserIcon className="w-5 h-5 text-zinc-500 mx-auto" />
                    <p className="text-xs text-zinc-300 font-bold uppercase">No coaches currently available in database</p>
                    <p className="text-[11px] text-zinc-500 font-normal">Coach credentials and professional qualifications available upon dynamic database update.</p>
                  </div>
                ) : null
              )}

              {/* Group: Blog Posts & Scientific Research */}
              {results.blogs.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                    <span>ARTICLES & RECOVERY GUIDES ({results.blogs.length})</span>
                  </h4>
                  <div className="grid gap-2">
                    {results.blogs.map(blog => (
                      <div 
                        key={blog.id}
                        className="bg-[#18181b] border border-zinc-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-zinc-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                              {blog.category}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-medium">{blog.date}</span>
                          </div>
                          <h5 className="text-sm font-black text-white uppercase group-hover:text-emerald-400 transition-colors leading-tight">
                            {blog.title}
                          </h5>
                          <p className="text-xs text-zinc-400 font-normal line-clamp-1">{blog.excerpt}</p>
                        </div>
                        <button
                          onClick={() => {
                            onClose();
                            onSelectBlogPost(blog.id);
                          }}
                          className="bg-white hover:bg-zinc-200 text-black text-[10px] font-black tracking-widest px-4 py-2 rounded uppercase transition-colors self-start sm:self-center flex items-center gap-1 cursor-pointer"
                        >
                          READ ARTICLE <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group: Services */}
              {results.services.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black uppercase text-zinc-400 tracking-widest border-b border-zinc-800 pb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>BESPOKE SERVICES ({results.services.length})</span>
                  </h4>
                  <div className="grid gap-2">
                    {results.services.map(svc => (
                      <div 
                        key={svc.id}
                        className="bg-[#18181b] border border-zinc-800 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 group hover:border-zinc-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <h5 className="text-sm font-black text-white uppercase group-hover:text-emerald-400 transition-colors">
                            {svc.title}
                          </h5>
                          <p className="text-xs text-zinc-400 font-normal line-clamp-1">{svc.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            onClose();
                            onNavigate('home', 'services-section');
                          }}
                          className="bg-white hover:bg-zinc-200 text-black text-[10px] font-black tracking-widest px-4 py-2 rounded uppercase transition-colors self-start sm:self-center cursor-pointer"
                        >
                          VIEW SERVICE
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};
