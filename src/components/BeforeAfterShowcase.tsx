import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, Trophy, ArrowRight, ShieldCheck, CheckCircle2, 
  ChevronLeft, ChevronRight, User, Activity, Maximize2, X 
} from 'lucide-react';
import { cloudinaryImage } from '../utils/image';

interface TransformationSlide {
  id: number;
  image: string;
  beforeImage?: string;
  afterImage?: string;
  clientName: string;
  startingWeight: string;
  currentWeight: string;
  weightChange: string;
  exerciseName: string;
  duration: string;
  badge: string;
  description: string;
}

interface BeforeAfterShowcaseProps {
  onOpenConsultation: () => void;
  onOpenAssessment: () => void;
}

export const BeforeAfterShowcase: React.FC<BeforeAfterShowcaseProps> = ({
  onOpenConsultation,
  onOpenAssessment,
}) => {
  const slides: TransformationSlide[] = [
    {
      id: 1,
      image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790509640/WhatsApp_Image_2026-09-27_at_4.45.24_PM.jpg',
      clientName: 'Fahad Chris',
      startingWeight: '96 kg',
      currentWeight: '76 kg',
      weightChange: '-20 kg Fat Loss',
      exerciseName: 'Boxing Power, Footwork & Compound Lifting',
      duration: '16 Weeks 1-on-1 Personal Coaching',
      badge: 'FEATURED TRANSFORMATION',
      description: 'Achieved 20kg body fat loss while increasing bench press & metabolic endurance under our Head Coach & Team.'
    },
    {
      id: 2,
      image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790509640/WhatsApp_Image_2026-09-27_at_4.49.10_PM.jpg',
      clientName: 'Naail James',
      startingWeight: '92 kg',
      currentWeight: '78 kg',
      weightChange: '-14 kg Fat Loss',
      exerciseName: 'High-Yield Metabolic Blast & Core Stability',
      duration: '12 Weeks Dedicated Coaching',
      badge: 'FAT LOSS & RECOMPOSITION',
      description: 'Dramatic body recomposition with high-yield EPOC interval training and tailored macro nutrition protocol.'
    },
    {
      id: 3,
      image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790509651/WhatsApp_Image_2026-09-27_at_4.59.04_PM.jpg',
      clientName: 'Abdullah Jones',
      startingWeight: '89 kg',
      currentWeight: '75 kg',
      weightChange: '-14 kg Fat Loss',
      exerciseName: 'Progressive Resistance & Heavy Bag Power',
      duration: '16 Weeks Athletic Protocol',
      badge: '14KG FAT LOSS',
      description: 'Added lean athletic muscle while improving joint mobility, shoulder stability, and posture alignment.'
    },
    {
      id: 4,
      image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790532727/WhatsApp_Image_2026-09-27_at_4.41.50_PM.jpg',
      clientName: 'Alex Nicole',
      startingWeight: '88 kg',
      currentWeight: '74 kg',
      weightChange: '-14 kg Fat Loss',
      exerciseName: 'Hypertrophy Conditioning & Functional Strength',
      duration: '14 Weeks Dedicated Coaching',
      badge: 'STRENGTH & CONDITIONING',
      description: 'Built core endurance and lean physique with weekly custom 1-on-1 fight camp sessions.'
    }
  ];

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'full' | 'split'>('full');

  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Auto-play slideshow every 6 seconds
  useEffect(() => {
    if (isPaused || zoomImage) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, slides.length, zoomImage]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const currentSlide = slides[currentIndex];

  return (
    <section className="w-full bg-[#08080a] text-white py-12 sm:py-20 border-b border-zinc-800/80 relative overflow-hidden font-sans select-none">
      
      {/* Ambient Red & Neon Glow Backgrounds */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[400px] bg-[#CCFF00]/5 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#CCFF00]/30 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-8 sm:space-y-12">

        {/* SECTION HEADING */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white break-words">
            Real Client Transformations
          </h2>
        </div>

        {/* STUNNING SPLIT TRANSFORMATION SHOWCASE CARD */}
        <div 
          className="max-w-7xl mx-auto bg-[#0d0d12] rounded-3xl p-4 sm:p-7 shadow-2xl transition-all duration-500 relative overflow-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            
            {/* LEFT SIDE: DUAL BEFORE ---> AFTER IMAGES (BIGGER & PROPER DISPLAY) */}
            <div className="lg:col-span-7 relative w-full rounded-2xl bg-black/80 border border-zinc-800/80 p-3 sm:p-4 shadow-2xl overflow-hidden group">
              
              {slides.map((slide, idx) => {
                const isCurrent = currentIndex === idx;
                const showFullMode = displayMode === 'full' || (!slide.beforeImage && !slide.afterImage && displayMode !== 'split');

                return (
                  <div
                    key={slide.id}
                    className={`transition-opacity duration-700 ease-in-out ${
                      isCurrent ? 'opacity-100 relative z-10 block pointer-events-auto' : 'opacity-0 absolute inset-0 z-0 hidden pointer-events-none'
                    }`}
                  >
                    {showFullMode ? (
                      /* FULL TRANSFORMATION PHOTO FRAME (100% COMPLETE & UNCUT) */
                      <div className="relative w-full h-[280px] sm:h-[380px] lg:h-[440px] rounded-2xl overflow-hidden bg-zinc-950 border border-zinc-800 shadow-2xl group/full flex items-center justify-center p-2">
                        {/* Ambient Glow Backdrop */}
                        <img 
                          src={cloudinaryImage(slide.image, 160)} 
                          alt="" 
                          aria-hidden="true" 
                          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-110 pointer-events-none"
                        />
                        
                        {/* Complete Uncut Foreground Image */}
                        <img 
                          src={cloudinaryImage(slide.image, 1080)} 
                          alt={`${slide.clientName} Complete Transformation`} 
                          title={`${slide.clientName} Complete Transformation`}
                          loading="lazy"
                          className="relative z-10 max-w-full max-h-full w-auto h-auto object-contain rounded-xl drop-shadow-[0_10px_25px_rgba(0,0,0,0.85)] transition-transform duration-500 group-hover/full:scale-[1.01]" 
                        />

                        {/* Top-Left Floating Badge */}
                        <div className="absolute top-3 left-3 z-20 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md border border-zinc-700/80 text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg">
                          <span className="text-red-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            BEFORE <span className="font-mono text-zinc-400 font-normal">({slide.startingWeight})</span>
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#CCFF00]" />
                          <span className="text-[#CCFF00] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#CCFF00]" />
                            AFTER <span className="font-mono text-emerald-300 font-normal">({slide.currentWeight})</span>
                          </span>
                        </div>

                        {/* Bottom-Right Result Pill */}
                        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/90 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold shadow-lg">
                          <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{slide.weightChange}</span>
                        </div>
                      </div>
                    ) : (
                      /* TWO IMAGES SIDE-BY-SIDE: BEFORE ---> AFTER */
                      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 relative items-center">
                        
                        {/* BEFORE IMAGE CONTAINER */}
                        <div className="relative w-full h-[260px] sm:h-[360px] lg:h-[420px] rounded-xl overflow-hidden bg-zinc-950 border border-red-500/40 group/before shadow-lg">
                          {/* BEFORE Badge */}
                          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md border border-red-500/40 text-red-400 text-[10px] sm:text-xs font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                            <span>BEFORE</span>
                            <span className="text-zinc-400 font-mono font-normal ml-0.5">({slide.startingWeight})</span>
                          </div>

                          {/* Image Frame */}
                          <div className="w-full h-full overflow-hidden relative flex items-center justify-center bg-black">
                            <img 
                              src={cloudinaryImage(slide.beforeImage || slide.image, 1080)} 
                              alt={`${slide.clientName} Before`} 
                              title={`${slide.clientName} Before`}
                              loading="lazy"
                              className={`w-full h-full block brightness-105 contrast-105 transition-transform duration-500 group-hover/before:scale-105 ${
                                slide.beforeImage ? 'object-cover object-top' : 'w-[200%] max-w-none object-cover object-left'
                              }`}
                            />
                          </div>
                        </div>

                        {/* CENTER ARROW BADGE: BEFORE ---> AFTER */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
                          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/95 border-2 border-[#CCFF00] text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.5)] flex items-center justify-center font-black">
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#CCFF00]" />
                          </div>
                        </div>

                        {/* AFTER IMAGE CONTAINER */}
                        <div className="relative w-full h-[260px] sm:h-[360px] lg:h-[420px] rounded-xl overflow-hidden bg-zinc-950 border border-[#CCFF00]/50 group/after shadow-lg">
                          {/* AFTER Badge */}
                          <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/85 backdrop-blur-md border border-[#CCFF00]/50 text-[#CCFF00] text-[10px] sm:text-xs font-black uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#CCFF00]" />
                            <span>AFTER</span>
                            <span className="text-emerald-300 font-mono font-normal ml-0.5">({slide.currentWeight})</span>
                          </div>

                          {/* Image Frame */}
                          <div className="w-full h-full overflow-hidden relative flex items-center justify-center bg-black">
                            <img 
                              src={cloudinaryImage(slide.afterImage || slide.image, 1080)} 
                              alt={`${slide.clientName} After`} 
                              title={`${slide.clientName} After`}
                              loading="lazy"
                              className={`w-full h-full block brightness-105 contrast-105 transition-transform duration-500 group-hover/after:scale-105 ${
                                slide.afterImage ? 'object-cover object-top' : 'w-[200%] max-w-none object-cover object-right'
                              }`}
                            />
                          </div>
                        </div>

                      </div>
                    )}
                  </div>
                );
              })}

              {/* Top-Right Control Toolbar (Toggle View & Zoom) */}
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
                {/* View Mode Toggle Pill */}
                <div className="flex items-center bg-black/85 p-1 rounded-lg border border-zinc-700/80 backdrop-blur-md text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('full')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      displayMode === 'full' ? 'bg-[#CCFF00] text-black font-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    FULL PHOTO
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('split')}
                    className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                      displayMode === 'split' ? 'bg-[#CCFF00] text-black font-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    SPLIT VIEW
                  </button>
                </div>

                {/* Zoom Photo Button */}
                <button
                  type="button"
                  onClick={() => setZoomImage(currentSlide.image)}
                  className="p-2 bg-black/85 hover:bg-black text-white rounded-lg backdrop-blur-md border border-zinc-700 transition-colors cursor-pointer shadow-lg"
                  title="Click to view full transformation image in high resolution"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              {/* Left Chevron Navigation Button */}
              <button
                onClick={handlePrev}
                type="button"
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/85 hover:bg-[#CCFF00] hover:text-black border border-zinc-700 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xl backdrop-blur-md hover:scale-110 active:scale-95 z-30"
                aria-label="Previous Transformation"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>

              {/* Right Chevron Navigation Button */}
              <button
                onClick={handleNext}
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/85 hover:bg-[#CCFF00] hover:text-black border border-zinc-700 text-white flex items-center justify-center transition-all duration-200 cursor-pointer shadow-2xl backdrop-blur-md hover:scale-110 active:scale-95 z-30"
                aria-label="Next Transformation"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* RIGHT SIDE: CLEAN MINIMAL HIGHLIGHTS & CTA */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6 text-left p-2 sm:p-4">
              
              {/* Client Name & Key Impact Stat */}
              <div className="space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-xs font-mono font-bold uppercase tracking-wider">
                  <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{currentSlide.weightChange}</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight flex items-center gap-2.5">
                  <User className="w-6 h-6 text-[#CCFF00] shrink-0" />
                  <span>{currentSlide.clientName}</span>
                </h3>
              </div>

              {/* Clean High-Impact Stats Card */}
              <div className="bg-[#121216] border border-zinc-800/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                
                {/* Weight Progress Stat */}
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Weight Progress</span>
                  <div className="text-right font-mono font-black text-sm text-white">
                    <span className="text-red-400">{currentSlide.startingWeight}</span>
                    <span className="text-zinc-500 mx-1.5">➔</span>
                    <span className="text-[#CCFF00]">{currentSlide.currentWeight}</span>
                  </div>
                </div>

                {/* Duration Stat */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Program Duration</span>
                  <span className="text-xs font-extrabold text-zinc-200 font-mono">
                    {currentSlide.duration}
                  </span>
                </div>

              </div>

              {/* Primary Transformation CTA */}
              <button
                onClick={onOpenConsultation}
                className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <span>START YOUR TRANSFORMATION</span>
                <ArrowRight className="w-4 h-4 text-black shrink-0" />
              </button>

              {/* Navigation Indicators */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-mono text-zinc-400 font-bold">
                  TRANSFORMATION {currentIndex + 1} OF {slides.length}
                </span>
                <div className="flex items-center gap-1.5">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                        currentIndex === index
                          ? 'w-6 bg-[#CCFF00]'
                          : 'w-2 bg-zinc-700 hover:bg-zinc-500'
                      }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>

            </div>

          </div>
        </div>

      </div>

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {zoomImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md animate-in fade-in"
          onClick={() => setZoomImage(null)}
        >
          <div 
            className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-5xl bg-[#121214] border-0 sm:border border-zinc-800 p-3 rounded-none sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-center items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/70 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={cloudinaryImage(zoomImage, 1600)}
              alt="Transformation Zoom Preview"
              className="w-full max-h-[85vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </section>
  );
};
