import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Clock, Trophy } from 'lucide-react';
import { ViewPage } from '../types';
import { BxTrainer, TRAINERS_DATA } from '../data/gymData';
import { TrainersSection } from './TrainersSection';
import { cloudinaryImage } from '../utils/image';

interface TrainersCompactProps {
  onNavigate: (page: ViewPage) => void;
  onOpenBookingWithTrainer?: (trainerName: string) => void;
}

export const TrainerCompact: React.FC<TrainersCompactProps> = ({
  onNavigate,
}) => {
  const [openProfileId, setOpenProfileId] = useState<string | null>(null);
  const [cardsInView, setCardsInView] = useState(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  // Animate the cards up when the section scrolls into view
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setCardsInView(true); io.disconnect(); } },
      { rootMargin: '-60px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const openCoachesPage = () => {
    onNavigate('trainers');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getBadge = (t: BxTrainer) =>
    t.coachPosition || (t.role.toLowerCase().includes('head') ? 'HEADCOACH' : 'COACH');

  return (
    <section id="coaches-section" className="scroll-mt-24 w-full bg-[#0a0a0a] text-white py-10 sm:py-14 border-b border-zinc-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/20 px-3 py-1 rounded-full mb-2">
              Expert Performance &amp; Combat Coaches
            </span>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight">
              MEET OUR COACHES
            </h2>
          </div>
          <button
            onClick={openCoachesPage}
            className="self-start sm:self-auto inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#CCFF00] hover:text-white transition-colors cursor-pointer"
          >
            View all coaches
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile: swipe strip. Desktop: 3 columns */}
        <div ref={gridRef} className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TRAINERS_DATA.map((trainer: BxTrainer, idx: number) => (
            <div
              key={trainer.id}
              onClick={() => setOpenProfileId(trainer.id)}
              style={{ transitionDelay: `${idx * 120}ms` }}
              className={`group relative min-w-[78%] sm:min-w-[46%] md:min-w-0 snap-center h-[360px] sm:h-[400px] rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00]/60 transition-all duration-500 ease-out cursor-pointer shadow-xl will-change-transform ${cardsInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
              <img
                src={cloudinaryImage(trainer.image, 640)}
                loading="lazy"
                decoding="async"
                alt={trainer.name}
                className={`absolute inset-0 w-full h-full object-cover ${trainer.imagePosition || 'object-top'} group-hover:scale-105 transition-transform duration-500`}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <span className="inline-block text-[9px] font-black uppercase tracking-widest text-black bg-[#CCFF00] px-2 py-0.5 rounded mb-2">
                  {getBadge(trainer)}
                </span>
                <h3 className="text-xl font-black uppercase tracking-tight leading-tight">
                  {trainer.name}
                </h3>
                <p className="text-[11px] text-zinc-300 font-medium mt-0.5 line-clamp-1">
                  {trainer.role}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-zinc-900/80 border border-zinc-700 px-2.5 py-1 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-[#CCFF00]" />
                    {trainer.experienceYears}+ yrs
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold bg-zinc-900/80 border border-zinc-700 px-2.5 py-1 rounded-lg">
                    <Trophy className="w-3.5 h-3.5 text-[#CCFF00]" />
                    {trainer.clientsServed ? `${trainer.clientsServed}+` : '1000+'} clients
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenProfileId(trainer.id);
                  }}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-[11px] uppercase tracking-widest py-2.5 rounded-full transition-all cursor-pointer active:scale-95"
                >
                  <span>VIEW QUALIFICATIONS &amp; PHOTOS</span>
                  <span className="text-base font-extrabold">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opens the full profile page for the clicked coach only */}
      <TrainersSection
        modalOnly
        openTrainerId={openProfileId}
        onCloseProfile={() => setOpenProfileId(null)}
        onSelectTrainer={() => {}}
        onNavigate={onNavigate}
      />
    </section>
  );
};