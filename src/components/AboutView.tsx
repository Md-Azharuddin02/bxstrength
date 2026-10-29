import React from 'react';
import { ViewPage } from '../types';
import { 
  ShieldCheck, Award, Users, Flame, HeartPulse, CheckCircle2, Dumbbell, 
  ArrowRight, Video, Target, Zap, Activity, Info, RefreshCw, Layers, UserCheck,
  Compass, TrendingUp, Eye, Building, Mail, Phone, MapPin, FileText, Sparkles, Check
} from 'lucide-react';

interface AboutViewProps {
  onNavigate: (page: ViewPage) => void;
  onOpenBooking: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onNavigate, onOpenBooking }) => {
  const offersList = [
    {
      title: 'Fitness Boxing',
      description: 'Coach-led boxing-inspired fitness sessions focused on movement, coordination, conditioning and technique appropriate to the selected programme.',
      icon: Flame,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      title: 'Strength Training',
      description: 'Structured strength sessions designed around available equipment, experience level and the programme selected by the client.',
      icon: Dumbbell,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      title: 'Functional Training',
      description: 'Practical movement patterns that support general fitness, strength, control and physical capacity.',
      icon: Activity,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10',
      borderColor: 'border-sky-500/20'
    },
    {
      title: 'Mobility & Flexibility',
      description: 'Guided movement and structured stretching to improve range of motion, control, and recovery alongside your core training.',
      icon: HeartPulse,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      title: 'Private Coaching',
      description: 'Live one-to-one virtual sessions for clients who want more individual attention.',
      icon: UserCheck,
      color: 'text-[#CCFF00]',
      bgColor: 'bg-[#CCFF00]/10',
      borderColor: 'border-[#CCFF00]/20'
    },
    {
      title: 'Guided Group Training',
      description: 'Live virtual sessions that combine professional structure with the motivation and accessibility of training with others.',
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    }
  ];

  const philosophyPillars = [
    {
      title: 'Structure Over Random Workouts',
      description: 'Sessions should form part of a clear training direction, not just arbitrary exercise sequences.',
      icon: Target
    },
    {
      title: 'Progress Over Perfection',
      description: 'Clients can start from their current fitness level and build strength & capacity gradually.',
      icon: TrendingUp
    },
    {
      title: 'Technique Before Ego',
      description: 'Quality of movement and joint longevity matter far more than simply doing more volume.',
      icon: ShieldCheck
    },
    {
      title: 'Human Coaching',
      description: 'Live guidance, real-time feedback and direct communication remain central to the BXStrength experience.',
      icon: Users
    },
    {
      title: 'Flexibility Without Confusion',
      description: 'Online delivery makes training easier to access without making the programme vague or unstructured.',
      icon: Compass
    },
    {
      title: 'Respect for Individual Differences',
      description: 'Fitness level, experience, environment and personal goals vary from person to person.',
      icon: UserCheck
    }
  ];

  const clientExpectations = [
    'Clear information about the service being purchased before payment.',
    'Live virtual coaching delivered according to the selected service or Session Pack.',
    'Reasonable support when genuine booking or service issues arise.',
    'Transparent Session Pack validity and cancellation/refund terms.',
    'Respectful treatment of personal and health-related information.',
    'No automatic renewal of launch Session Packs unless BXStrength later introduces a separate recurring product with clear customer consent.',
    'No guarantee of a particular weight, body-composition, strength or performance result; individual outcomes depend on many factors including participation, consistency, nutrition, recovery, health status and lifestyle.'
  ];

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans">
      
      {/* 1. HERO PAGE HEADER */}
      <div className="relative bg-gradient-to-b from-[#141418] via-[#0f0f12] to-[#0a0a0a] text-white py-16 sm:py-24 border-b border-zinc-800/80 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#CCFF00]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight text-center">
            ABOUT BXSTRENGTH
          </h1>

          <h4 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-zinc-300 leading-tight">
            TRAIN BETTER. <span className="text-[#CCFF00]">WHEREVER YOU ARE.</span>
          </h4>

          {/* SUB-HEADLINE (from audit) */}
          <p className="text-zinc-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed font-normal">
            BxStrength provides 1-on-1 coaching engineered for the reality of your day and not the constraints of a commercial gym. We deliver real-time biomechanics, minimalist dumbbell strength, boxing conditioning and many more straight to your screen. No commute, no crowded floors, just precision.
          </p>
        </div>
      </div>

      {/* 2. OVERVIEW & OUR PURPOSE */}
      <section className="py-16 sm:py-20 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-black text-[#CCFF00] uppercase tracking-widest flex items-center gap-2">
                <Target className="w-4 h-4" /> OUR PURPOSE
              </span>

              <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight leading-tight">
                MAKING QUALITY COACHING EASIER TO ACCESS &amp; FIT INTO REAL LIFE
              </h2>

              {/* OUR PURPOSE COPY (from audit) */}
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-normal">
                Most fitness regimes fail for one reason: logistical friction. Packing a kit bag, battling evening traffic, and waiting for gym equipment adds two hours of overhead to a 45-minute workout.
              </p>

              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-normal">
                bxstrength strips the friction away. Your coach is live on your screen, analyzing your joint angles and posture in real time. We make consistency the path of least resistance.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                  <Video className="w-5 h-5 text-[#CCFF00] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-black uppercase text-white">Live Remote Coaching</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Real-time technique corrections &amp; feedback from home or private space.</p>
                  </div>
                </div>
                <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-xl flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-black uppercase text-white">Structured Progression</h3>
                    <p className="text-[11px] text-zinc-400 mt-0.5">Understand what you are doing, why you are doing it &amp; progress responsibly.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Image Feature Card */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl w-full max-w-md group">
                {/* IMAGE REPLACED (from audit): put your home-setup photo/render at public/images/home-coaching-setup.jpg */}
                <img
                  src="/images/home-coaching-setup.jpg"
                  alt="Home workout setup with exercise mat, dumbbells and laptop showing a live 1-on-1 coaching call"
                  className="w-full h-[380px] sm:h-[420px] object-cover filter contrast-105 group-hover:scale-105 transition-transform duration-500"
                />
                <div className="p-4 bg-[#121215] border-t border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00]">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase text-white">100% Live Virtual Coaching</p>
                      <p className="text-[11px] text-zinc-400">Zero Travel • Real Time Guidance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WHY BXSTRENGTH EXISTS */}
      <section className="py-16 sm:py-20 bg-[#0d0d10] border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              OUR CORE PHILOSOPHY
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
              WHY BXSTRENGTH EXISTS
            </h2>
            <div className="w-12 h-1 bg-amber-400 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* CARD 1 (from audit) */}
            <div className="bg-[#121215] border border-zinc-800 p-6 sm:p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black uppercase text-white">Fitness Belongs in Everyday Life</h3>
              <p className="text-zinc-300 text-sm leading-relaxed font-normal">
                Training shouldn't require reorganising your entire day around a commute. We built bxstrength on a simple premise: professional biomechanics and high-intensity coaching belong in your living room, home office, or hotel suite which saves your hours of transit without compromising on coaching quality.
              </p>
            </div>

            {/* CARD 2 (from audit) */}
            <div className="bg-[#121215] border border-zinc-800 p-6 sm:p-8 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black uppercase text-white">Human Interaction &amp; Accountability</h3>
              <p className="text-zinc-300 text-sm leading-relaxed font-normal">
                Generic fitness apps give you spreadsheets and silent videos; we provide live, two-way verbal feedback. Every repetition is observed, every joint angle is corrected, and your progressive overload is tracked in real time. You get the technical experience of an elite private gym from the comfort of home.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 4. OUR COACHING PHILOSOPHY (PILLARS) */}
      <section className="py-16 sm:py-24 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#CCFF00] uppercase tracking-widest">
              SIX CORE PRINCIPLES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
              OUR COACHING PHILOSOPHY
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Principles that shape every session, exercise selection, and client interaction at BXStrength.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {philosophyPillars.map((pillar, idx) => {
              const PillarIcon = pillar.icon;
              return (
                <div key={idx} className="bg-[#121215] border border-zinc-800 p-6 rounded-2xl space-y-3 hover:border-[#CCFF00]/50 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-700 text-[#CCFF00] flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PillarIcon className="w-5 h-5" />
                  </div>
                  {/* BULLET (•) REMOVED (from audit) */}
                  <h3 className="text-base font-black uppercase text-white group-hover:text-[#CCFF00] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-normal">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. WHO WE SERVE */}
      <section className="py-16 sm:py-20 bg-[#0d0d10] border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="bg-gradient-to-r from-zinc-900 via-[#141418] to-zinc-900 border border-zinc-800 p-8 sm:p-10 rounded-3xl max-w-5xl mx-auto space-y-4 shadow-2xl">
            <span className="text-xs font-black text-sky-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-4 h-4" /> TARGET AUDIENCE
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
              WHO WE SERVE
            </h2>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-normal">
              BXStrength is designed for adults who want live virtual coaching and a practical way to train around a busy schedule. Clients may be starting a new fitness routine, returning after time away, looking to add boxing-inspired conditioning, building strength, improving movement quality or simply seeking more structure and accountability in their training.
            </p>
          </div>
        </div>
      </section>

      {/* 6. WHAT WE OFFER (6-card symmetrical grid, Option A) */}
      <section className="py-16 sm:py-24 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black text-sky-400 uppercase tracking-widest">
              OUR PROGRAMMES &amp; DISCIPLINES
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
              WHAT WE OFFER
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Comprehensive coach-led fitness sessions tailored to your available equipment, goals &amp; schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {offersList.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={idx}
                  className="bg-[#121215] border border-zinc-800 hover:border-zinc-700 p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 group hover:-translate-y-1 shadow-xl"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`w-11 h-11 rounded-xl ${item.bgColor} border ${item.borderColor} flex items-center justify-center ${item.color}`}>
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md">
                        LIVE VIRTUAL
                      </span>
                    </div>

                    <h3 className="text-xl font-black uppercase text-white group-hover:text-[#CCFF00] transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Medical Disclaimer Banner */}
          <div className="bg-[#16161a] border border-zinc-800/90 rounded-2xl p-5 sm:p-6 flex items-start gap-4 max-w-4xl mx-auto shadow-lg">
            <Info className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 block">
                SPECIALIST SERVICES &amp; HEALTH NOTICE
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                Any specialist service such as physiotherapy or mental-wellness support will be separately described and, where offered, provided only through appropriately qualified professionals. Standard BXStrength fitness coaching is not medical diagnosis, medical treatment, physiotherapy or mental-health treatment.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 7. HOW OUR COACHING WORKS */}
      <section id="how-coaching-works" className="py-16 sm:py-24 bg-[#0d0d10] border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black text-[#CCFF00] uppercase tracking-widest">
              STEP-BY-STEP PROCESS
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
              HOW OUR COACHING WORKS
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Seamless digital onboarding, live interactive coaching, and responsible training environments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-[#121215] border border-zinc-800 p-6 rounded-2xl space-y-4 relative">
              <span className="text-3xl font-black text-[#CCFF00] block">01</span>
              <h3 className="text-base font-black uppercase text-white">Select Service &amp; Onboard</h3>
              <p className="text-zinc-300 text-xs leading-relaxed font-normal">
                BXStrength currently delivers services virtually. Clients select an available service or Session Pack, complete the required onboarding information, choose or receive an appropriate session time and join the coach online.
              </p>
            </div>

            <div className="bg-[#121215] border border-zinc-800 p-6 rounded-2xl space-y-4 relative">
              <span className="text-3xl font-black text-[#CCFF00] block">02</span>
              <h3 className="text-base font-black uppercase text-white">Join Live Coach Online</h3>
              <p className="text-zinc-300 text-xs leading-relaxed font-normal">
                Depending on the programme, the coach may guide warm-up, technique, exercise selection, progression, mobility, recovery-focused movement and session structure.
              </p>
            </div>

            <div className="bg-[#121215] border border-zinc-800 p-6 rounded-2xl space-y-4 relative">
              <span className="text-3xl font-black text-[#CCFF00] block">03</span>
              <h3 className="text-base font-black uppercase text-white">Safe Training Environment</h3>
              <p className="text-zinc-300 text-xs leading-relaxed font-normal">
                Because coaching takes place remotely, clients play an important role in creating a suitable training environment. We ask clients to provide accurate information about relevant limitations, use suitable equipment where required, maintain adequate space and follow reasonable coaching and safety instructions.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 8. WHAT CLIENTS CAN EXPECT */}
      <section className="py-16 sm:py-24 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">
              TRANSPARENCY &amp; TRUST
            </span>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white tracking-tight">
              WHAT CLIENTS CAN EXPECT
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Our clear commitments to service quality, transparency, and client satisfaction.
            </p>
          </div>

          <div className="bg-[#121215] border border-zinc-800 p-6 sm:p-8 rounded-3xl max-w-4xl mx-auto space-y-4">
            {clientExpectations.map((exp, idx) => (
              <div key={idx} className="flex items-start gap-3.5 pb-3 border-b border-zinc-800/80 last:border-none last:pb-0">
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </div>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-normal">
                  {exp}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 9. OUR VISION */}
      <section className="py-16 sm:py-20 bg-[#0d0d10] border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-zinc-900 via-[#141418] to-zinc-900 border border-zinc-800 p-8 sm:p-10 rounded-3xl max-w-5xl mx-auto space-y-4 shadow-2xl">
            <span className="text-xs font-black text-[#CCFF00] uppercase tracking-widest flex items-center gap-2">
              <Eye className="w-4 h-4" /> LONG-TERM STRATEGY
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase text-white tracking-tight">
              OUR VISION
            </h2>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-normal">
              Our long-term vision is to build BXStrength into a trusted virtual coaching platform that connects clients with quality fitness support regardless of geography. We want to make live coaching more accessible to people who value professional structure but need the convenience of training from home or another suitable location.
            </p>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-normal">
              As BXStrength grows, we intend to expand the depth of our coaching, strengthen our customer-support systems and continue improving the way clients discover, book and experience virtual fitness services.
            </p>
          </div>
        </div>
      </section>

      {/* 10. BUSINESS & LEGAL INFORMATION */}
      <section className="py-16 sm:py-24 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-black text-cyan-400 uppercase tracking-widest">
              LEGAL ENTITY &amp; COMPLIANCE
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight">
              BUSINESS INFORMATION
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm">
              BXStrength is an international digital performance &amp; fitness coaching platform engineered by our Head Coach &amp; Team.
            </p>
          </div>

          <div className="bg-[#121215] border border-zinc-800 p-6 sm:p-8 rounded-3xl max-w-3xl mx-auto space-y-6 shadow-2xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-zinc-500 font-bold uppercase block text-[11px]">Official Brand Identity</span>
                <span className="text-white font-black text-base">BXStrength</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 font-bold uppercase block text-[11px]">Primary Operating Regions</span>
                {/* "& India" REMOVED (from audit) */}
                <span className="text-[#CCFF00] font-bold">United Kingdom</span>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 font-bold uppercase block text-[11px]">Customer Support Email</span>
                <a href="mailto:support@bxstrength.com" className="text-white font-bold hover:text-[#CCFF00] transition-colors">
                  support@bxstrength.com
                </a>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500 font-bold uppercase block text-[11px]">Customer Support Phone</span>
                <a href="tel:+918423594482" className="text-white font-black font-mono hover:text-[#CCFF00] transition-colors">
                  +91-8423594482
                </a>
              </div>
            </div>

            {/* HEADQUARTERS ADDRESS REMOVED (from audit) */}
          </div>

        </div>
      </section>

      {/* 11. CLOSING BRAND TAGLINE BANNER */}
      <div className="bg-[#121214] py-12 border-t border-zinc-800 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-lg sm:text-2xl font-black uppercase text-[#CCFF00] tracking-wider">
            BXSTRENGTH — LIVE COACHING. REAL STRUCTURE. STRONGER MOVEMENT.
          </p>
        </div>
      </div>

    </div>
  );
};