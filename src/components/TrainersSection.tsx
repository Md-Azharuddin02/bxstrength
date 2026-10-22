import React, { useState, useEffect, useRef } from 'react';
import { Trainer, ViewPage } from '../types';
import { BxTrainer, TRAINERS_DATA } from '../data/gymData';
import { Star, Calendar, ShieldCheck, Globe, Clock, Award, Trophy, CheckCircle2, X, ExternalLink, Database, RefreshCw, ChevronLeft, ChevronRight, Film } from 'lucide-react';

interface TrainersSectionProps {
  onSelectTrainer: (trainer: Trainer) => void;
  onNavigate: (page: ViewPage) => void;
  onOpenBookingWithTrainer?: (trainerName: string) => void;
}

const VideoCarousel: React.FC<{ videos: string[]; poster: string }> = ({ videos, poster }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollTo = (index: number) => {
    if (index < 0 || index >= videos.length) return;
    setCurrentIndex(index);
    if (scrollRef.current) {
      const targetChild = scrollRef.current.children[index] as HTMLElement;
      if (targetChild) {
        targetChild.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-800/80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="w-4.5 h-4.5 text-[#CCFF00]" />
          <p className="text-xs sm:text-sm font-black uppercase text-[#CCFF00] tracking-wider">
            TRAINING &amp; ATHLETE PERFORMANCE CLIPS ({videos.length})
          </p>
        </div>

        {/* Carousel Prev/Next Buttons */}
        {videos.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mr-2">
              {currentIndex + 1} / {videos.length}
            </span>
            <button
              onClick={() => scrollTo(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 hover:border-[#CCFF00] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg"
              title="Previous Video"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTo(currentIndex + 1)}
              disabled={currentIndex === videos.length - 1}
              className="p-2 rounded-full bg-zinc-900 border border-zinc-700 text-white hover:bg-zinc-800 hover:border-[#CCFF00] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-lg"
              title="Next Video"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Slideable Scroll Container */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-none py-3 scroll-smooth"
        onScroll={(e) => {
          const target = e.currentTarget;
          const scrollPosition = target.scrollLeft;
          const itemWidth = target.clientWidth * 0.75;
          const newIndex = Math.round(scrollPosition / itemWidth);
          if (newIndex >= 0 && newIndex < videos.length && newIndex !== currentIndex) {
            setCurrentIndex(newIndex);
          }
        }}
      >
        {videos.map((vidUrl, idx) => (
          <div
            key={idx}
            className="flex-shrink-0 w-[90%] sm:w-[75%] md:w-[65%] snap-center rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl relative group transition-all duration-300"
          >
            <video
              controls
              preload="metadata"
              playsInline
              className="w-full max-h-[360px] sm:max-h-[420px] object-cover rounded-2xl"
              poster={poster}
            >
              <source src={vidUrl} type="video/mp4" />
              Your browser does not support HTML5 video playback.
            </video>
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-[#CCFF00] border border-zinc-800 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-wider shadow-lg">
              CLIP {idx + 1} OF {videos.length}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {videos.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          {videos.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex ? 'w-8 bg-[#CCFF00]' : 'w-2 bg-zinc-800 hover:bg-zinc-700'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TrainersSection: React.FC<TrainersSectionProps> = ({
  onSelectTrainer,
  onNavigate,
  onOpenBookingWithTrainer
}) => {
  const [selectedTrainerForProfile, setSelectedTrainerForProfile] = useState<BxTrainer | null>(null);
  const [trainers, setTrainers] = useState<BxTrainer[]>(TRAINERS_DATA);
  const [lightboxMedia, setLightboxMedia] = useState<{ type: 'photo' | 'video'; url: string } | null>(null);

  useEffect(() => {
    setTrainers(TRAINERS_DATA);
  }, []);

  return (
    <section id="trainers-section" className="py-12 sm:py-20 bg-[#0a0a0a] text-white border-b border-zinc-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-16 space-y-3">
          <span className="text-[10px] sm:text-[11px] font-black tracking-widest text-[#CCFF00] uppercase bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-full inline-block">
            EXPERT PERFORMANCE &amp; COMBAT COACHES
          </span>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white uppercase tracking-tight">
            MEET OUR COACHES
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Our head coaches combine 10+ years of boxing instruction, strength &amp; conditioning, and physiotherapy-based rehabilitation.
          </p>
        </div>

        {/* Coach Cards List */}
        {trainers.length === 0 ? (
          <div className="text-center py-12 px-4 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl max-w-md mx-auto space-y-2">
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">No coach data available</h3>
          </div>
        ) : (
          <div className="space-y-16 lg:space-y-24">
          {trainers.map((trainer: BxTrainer) => {
            const headlines: Record<string, string> = {
              'Head Coach & Team': 'HEAD COACH | BOXING INSTRUCTOR | PHYSIOTHERAPY PROFESSIONAL',
              'Sadeem': 'FITNESS TRAINER | STRENGTH & CONDITIONING COACH | VIRTUAL FITNESS COACH',
              'Moheeb Khan': 'FITNESS TRAINER | STRENGTH & CONDITIONING COACH | VIRTUAL FITNESS COACH',
            };
            const headline = trainer.headline || headlines[trainer.name] || headlines[trainer.id] || 'THE ARCHITECT OF PERFORMANCE';

            return (
              <div
                key={trainer.id}
                className="w-full flex flex-col lg:flex-row items-stretch gap-8 lg:gap-14 bg-transparent border-0 py-4"
              >
                {/* Left Column: Borderless Coach Portrait Image matching sample */}
                <div
                  onClick={() => setSelectedTrainerForProfile(trainer)}
                  className="w-full lg:w-[440px] flex-shrink-0 relative rounded-2xl overflow-hidden aspect-[4/5] sm:h-[500px] lg:h-[530px] bg-zinc-950 shadow-2xl cursor-pointer group"
                  title="Click to view qualifications & photo gallery"
                >
                  <img
                    src={trainer.image}
                    alt={trainer.name}
                    className={`w-full h-full object-cover ${trainer.imagePosition || 'object-top'} filter contrast-105 brightness-95 transition-transform duration-700 group-hover:scale-105`}
                  />
                  {/* Subtle bottom vignette gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                  {/* Expand Hover Badge */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md text-[#CCFF00] border border-zinc-800 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 shadow-lg">
                    <ExternalLink className="w-3.5 h-3.5" /> VIEW PROFILE &amp; PHOTOS
                  </div>

                  {/* Bottom Left Overlay Badge & Name matching uploaded sample */}
                  <div className="absolute bottom-6 left-6 right-6 text-left z-10">
                    <span className="inline-block bg-black/75 backdrop-blur-md text-[#CCFF00] border border-zinc-800/80 text-[10px] font-black tracking-widest px-3 py-1 rounded-md uppercase mb-2">
                      {trainer.coachPosition || (trainer.role.toLowerCase().includes('head') ? 'HEADCOACH' : 'COACH')}
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight uppercase leading-none">
                      {trainer.name}
                    </h3>
                  </div>
                </div>

                {/* Right Column: Editorial Bio, Headline, Stats & CTAs */}
                <div className="flex-grow flex flex-col justify-between text-left space-y-6">
                  <div>
                    {/* Headline Title in Lime-Yellow */}
                    <h4 className="text-[#CCFF00] font-serif tracking-widest text-sm sm:text-base font-bold uppercase mb-4">
                      {headline}
                    </h4>

                    {/* Paragraph Bio matching sample formatting */}
                    <div className="text-zinc-300 text-xs sm:text-sm font-normal leading-relaxed space-y-4 max-w-3xl">
                      <p>{trainer.bio}</p>
                      {trainer.secondaryBio ? (
                        <p>{trainer.secondaryBio}</p>
                      ) : (
                        <p>
                          His methodology bridges the gap between traditional strength training and the chaotic demands of high-performance conditioning. Whether peaking for elite competition or building a foundation for sustainable power, {trainer.name.split(' ')[0]} applies a data-driven, precision-focused approach to every session.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Two Side-by-Side Stat Cards matching sample */}
                  <div className="grid grid-cols-2 gap-4 max-w-xl">
                    <div className="bg-[#141416] p-5 rounded-2xl border-0 shadow-inner flex flex-col justify-between">
                      <Clock className="w-5 h-5 text-[#CCFF00]" />
                      <div className="mt-3">
                        <p className="text-2xl sm:text-3xl font-black text-white">{trainer.experienceYears}+</p>
                        <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                          YEARS EXPERIENCE
                        </p>
                      </div>
                    </div>

                    <div className="bg-[#141416] p-5 rounded-2xl border-0 shadow-inner flex flex-col justify-between">
                      <Trophy className="w-5 h-5 text-[#CCFF00]" />
                      <div className="mt-3">
                        <p className="text-2xl sm:text-3xl font-black text-white">{trainer.clientsServed ? `${trainer.clientsServed}+` : '1000+'}</p>
                        <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
                          CLIENTS SERVED GLOBALLY
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Pill Button */}
                  <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                    <button
                      onClick={() => setSelectedTrainerForProfile(trainer)}
                      className="w-full sm:w-auto bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs tracking-widest uppercase px-7 py-3.5 rounded-full flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer shadow-lg shadow-[#CCFF00]/10"
                    >
                      <span>VIEW QUALIFICATIONS &amp; PHOTOS</span>
                      <span className="text-base font-extrabold">→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )}

      </div>

      {/* COACH CREDENTIALS & CERTIFICATES FULL PAGE MODAL */}
      {selectedTrainerForProfile && (
        <div className="fixed inset-0 z-[100] w-full h-full bg-[#0a0a0a] text-white overflow-y-auto animate-in fade-in duration-300">
          {/* Sticky Full Page Top Header Bar */}
          <div className="sticky top-0 z-50 bg-[#121214]/95 backdrop-blur-lg border-b border-zinc-800/80 px-4 sm:px-8 py-4 flex items-center justify-between shadow-2xl">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#CCFF00] animate-pulse" />
              <span className="text-xs sm:text-sm font-black tracking-widest text-[#CCFF00] uppercase">
                VERIFIED COACH PROFILE &amp; QUALIFICATIONS
              </span>
            </div>
            <button
              onClick={() => setSelectedTrainerForProfile(null)}
              className="bg-zinc-800/90 hover:bg-zinc-700 text-white font-bold text-xs uppercase tracking-wider px-4 py-2.5 rounded-full border border-zinc-700/80 flex items-center gap-2 transition-all cursor-pointer shadow-lg hover:border-zinc-500"
            >
              <span>← CLOSE PROFILE</span>
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </div>

          {/* Main Full Page Content Container */}
          <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 sm:py-14 space-y-12 pb-24">
            
            {/* Coach Hero Header Card */}
            <div className="bg-[#121214] border border-zinc-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-3xl pointer-events-none" />

              {/* Coach Avatar Portrait (Click to Expand in Lightbox) */}
              <div 
                onClick={() => setLightboxMedia({ type: 'photo', url: selectedTrainerForProfile.image })}
                className="relative shrink-0 cursor-pointer group"
                title="Click to view full image"
              >
                <img
                  src={selectedTrainerForProfile.image}
                  alt={selectedTrainerForProfile.name}
                  className={`w-36 h-36 sm:w-44 sm:h-44 rounded-2xl object-cover ${selectedTrainerForProfile.imagePosition || 'object-top'} border-4 border-[#CCFF00] shadow-2xl group-hover:scale-105 transition-transform duration-300`}
                />
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[10px] font-black uppercase text-black bg-[#CCFF00] px-2.5 py-1 rounded-md shadow-lg flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 text-black" /> EXPAND
                  </span>
                </div>
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-black border border-zinc-700 text-[#CCFF00] text-[10px] font-black uppercase px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                  VERIFIED MASTER COACH
                </span>
              </div>

              {/* Coach Primary Bio & Title Details */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="space-y-1">
                  <span className="bg-zinc-900 border border-zinc-800 text-[#CCFF00] text-[10px] font-black tracking-widest px-3 py-1 rounded-md uppercase inline-block">
                    {selectedTrainerForProfile.coachPosition || (selectedTrainerForProfile.role.toLowerCase().includes('head') ? 'HEADCOACH' : 'COACH')}
                  </span>
                  <h2 className="text-3xl sm:text-5xl font-serif font-black text-white uppercase tracking-tight">
                    {selectedTrainerForProfile.name}
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-emerald-400 uppercase tracking-wider">
                    {selectedTrainerForProfile.role}
                  </p>
                </div>

                {/* Key Stat Badges */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs pt-1">
                  <span className="bg-zinc-800/90 border border-zinc-700 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#CCFF00]" />
                    {selectedTrainerForProfile.experienceYears}+ Years Experience
                  </span>
                  <span className="bg-amber-950/60 border border-amber-800/80 text-amber-300 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {selectedTrainerForProfile.rating.toFixed(1)} Rating
                  </span>
                  <span className="bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                    {selectedTrainerForProfile.clientsServed ? `${selectedTrainerForProfile.clientsServed}+` : '1,000+'} Clients Served
                  </span>
                </div>

                {/* Full Bio Paragraphs */}
                <div className="text-zinc-300 text-xs sm:text-sm font-normal leading-relaxed space-y-3 pt-2 max-w-3xl border-t border-zinc-800/80">
                  <p>{selectedTrainerForProfile.bio}</p>
                  {selectedTrainerForProfile.secondaryBio && (
                    <p className="text-zinc-400">{selectedTrainerForProfile.secondaryBio}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Languages & International Reach Banner */}
            <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">Languages Spoken:</span>
                {selectedTrainerForProfile.languages.map((lang, idx) => (
                  <span key={idx} className="bg-zinc-800 text-zinc-200 font-bold px-3 py-1 rounded-lg border border-zinc-700">
                    {lang}
                  </span>
                ))}
              </div>
              {selectedTrainerForProfile.internationalReach && selectedTrainerForProfile.internationalReach.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-[#CCFF00] font-bold uppercase tracking-wider text-[11px]">Global Virtual Reach:</span>
                  {selectedTrainerForProfile.internationalReach.map((country, idx) => (
                    <span key={idx} className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                      🌐 {country}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Detailed Credentials & Qualifications Multi-Column Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Left Column: Expertise, Specializations & Virtual Skills */}
              <div className="space-y-8">
                {/* Core Skills & Expertise */}
                {selectedTrainerForProfile.coreExpertise && selectedTrainerForProfile.coreExpertise.length > 0 && (
                  <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                      <Award className="w-5 h-5 text-[#CCFF00]" />
                      CORE EXPERTISE &amp; SKILLS
                    </h3>
                    <div className="space-y-2.5">
                      {selectedTrainerForProfile.coreExpertise.map((item, idx) => (
                        <div key={idx} className="bg-zinc-900/90 border border-zinc-800/80 p-3.5 rounded-xl flex items-start gap-3">
                          <span className="text-[#CCFF00] font-bold text-sm mt-0.5">•</span>
                          <span className="text-xs sm:text-sm font-medium text-zinc-200 leading-relaxed">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specializations / Special Populations */}
                {selectedTrainerForProfile.specialPopulations && selectedTrainerForProfile.specialPopulations.length > 0 && (
                  <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      SPECIALIZATIONS &amp; REHABILITATION
                    </h3>
                    <div className="grid grid-cols-1 gap-2.5">
                      {selectedTrainerForProfile.specialPopulations.map((item, idx) => (
                        <div key={idx} className="bg-zinc-900/90 border border-zinc-800/80 p-3 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-semibold text-zinc-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Virtual Coaching Skills */}
                {selectedTrainerForProfile.virtualCoachingSkills && selectedTrainerForProfile.virtualCoachingSkills.length > 0 && (
                  <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                      <Globe className="w-5 h-5 text-sky-400" />
                      VIRTUAL &amp; REMOTE COACHING CAPABILITIES
                    </h3>
                    <div className="space-y-2.5">
                      {selectedTrainerForProfile.virtualCoachingSkills.map((skill, idx) => (
                        <div key={idx} className="bg-zinc-900/90 border border-zinc-800/80 p-3 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium text-zinc-200">
                          <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Certifications, Experience & Achievements */}
              <div className="space-y-8">
                {/* Verified Certifications List */}
                <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                    <ShieldCheck className="w-5 h-5 text-[#CCFF00]" />
                    CERTIFICATIONS &amp; QUALIFICATIONS
                  </h3>
                  <div className="space-y-2.5">
                    {(selectedTrainerForProfile.certifications || [selectedTrainerForProfile.certification]).map((cert, idx) => (
                      <div key={idx} className="bg-zinc-900/90 border border-zinc-800/80 p-3.5 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-bold text-zinc-100">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Professional Experience */}
                {selectedTrainerForProfile.professionalExperience && selectedTrainerForProfile.professionalExperience.length > 0 && (
                  <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                      <Clock className="w-5 h-5 text-purple-400" />
                      PROFESSIONAL EXPERIENCE
                    </h3>
                    <div className="space-y-2.5">
                      {selectedTrainerForProfile.professionalExperience.map((exp, idx) => (
                        <div key={idx} className="bg-zinc-900/90 border border-zinc-800/80 p-3.5 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-semibold text-zinc-200">
                          <span className="text-purple-400 font-bold">•</span>
                          <span>{exp}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Achievements List */}
                <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2.5 border-b border-zinc-800 pb-3">
                    <Trophy className="w-5 h-5 text-amber-400" />
                    KEY ACHIEVEMENTS &amp; MILESTONES
                  </h3>
                  <div className="space-y-2.5">
                    {(selectedTrainerForProfile.achievements || ['Over 98% Client Goal Success Rate', 'Verified UK Master Coach']).map((ach, idx) => (
                      <div key={idx} className="bg-zinc-900/90 border border-zinc-800/80 p-3.5 rounded-xl flex items-center gap-3">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium text-zinc-200">{ach}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Coach Physique & Fitness Media Gallery Showcase (Photos & Videos) */}
            {((selectedTrainerForProfile.galleryPhotos && selectedTrainerForProfile.galleryPhotos.length > 0) ||
              (selectedTrainerForProfile.galleryVideos && selectedTrainerForProfile.galleryVideos.length > 0)) && (
              <div className="bg-[#121214] border border-zinc-800/80 rounded-3xl p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-4 gap-2">
                  <h3 className="text-base font-black uppercase tracking-wider text-white flex items-center gap-2.5">
                    <Award className="w-5 h-5 text-[#CCFF00]" />
                    ATHLETE PHYSIQUE &amp; CONDITIONING GALLERY
                  </h3>
                  <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Click Any Image To Expand</span>
                </div>

                {/* Photos Grid */}
                {selectedTrainerForProfile.galleryPhotos && selectedTrainerForProfile.galleryPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedTrainerForProfile.galleryPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxMedia({ type: 'photo', url: photo })}
                        className="group relative rounded-2xl overflow-hidden aspect-square border border-zinc-800 bg-zinc-950 cursor-pointer shadow-lg"
                        title="Click to expand photo"
                      >
                        <img
                          src={photo}
                          alt={`${selectedTrainerForProfile.name} Physique ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-3">
                          <span className="text-[10px] font-black uppercase text-black bg-[#CCFF00] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> CLICK TO EXPAND
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Videos Showcase Carousel */}
                {selectedTrainerForProfile.galleryVideos && selectedTrainerForProfile.galleryVideos.length > 0 && (
                  <VideoCarousel
                    videos={selectedTrainerForProfile.galleryVideos}
                    poster={selectedTrainerForProfile.image}
                  />
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Full-Screen Coach Gallery Lightbox Preview Overlay (z-[200] ensures it opens on top of all modals) */}
      {lightboxMedia && (
        <div 
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 select-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center justify-center"
          >
            {/* Top Toolbar */}
            <div className="w-full flex items-center justify-between mb-3 text-zinc-400 text-xs font-mono font-bold uppercase">
              <span className="text-[#CCFF00] tracking-wider font-sans font-black">
                {selectedTrainerForProfile ? `${selectedTrainerForProfile.name} — Full Media View` : 'Coach Media View'}
              </span>
              <button
                onClick={() => setLightboxMedia(null)}
                className="text-white bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700 px-4 py-2 rounded-full shadow-2xl cursor-pointer flex items-center gap-1.5 hover:text-[#CCFF00] hover:border-[#CCFF00] transition-all"
              >
                <span>CLOSE</span>
                <X className="w-4 h-4 text-[#CCFF00]" />
              </button>
            </div>

            {/* Main Media Content Box */}
            <div className="relative w-full flex items-center justify-center">
              {lightboxMedia.type === 'photo' ? (
                <img
                  src={lightboxMedia.url}
                  alt="Coach Gallery Full Preview"
                  className="max-h-[82vh] max-w-full object-contain rounded-2xl border border-zinc-800 shadow-2xl animate-in zoom-in-95 duration-300"
                />
              ) : (
                <video
                  controls
                  autoPlay
                  className="max-h-[82vh] w-full object-contain rounded-2xl border border-zinc-800 shadow-2xl"
                >
                  <source src={lightboxMedia.url} type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
