import React, { useState } from 'react';
import { Play, Maximize2, X, Flame, CalendarCheck, ClipboardList, ArrowUpRight } from 'lucide-react';
import { cloudinaryImage } from '../utils/image';
import { LazyVideo } from './ui/LazyVideo';

interface TransformationJourneyProps {
  onOpenAssessment: () => void;
  onOpenConsultation: () => void;
}

interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  category: string;
}

export const TransformationJourney: React.FC<TransformationJourneyProps> = ({
  onOpenAssessment,
  onOpenConsultation,
}) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  return (
    <section className="w-full bg-[#070708] py-12 sm:py-20 text-white border-b border-zinc-800/80 relative font-sans overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white break-words">
            TRAIN BETTER. WHEREVER YOU ARE.
          </h2>
          {/* <p className="text-zinc-400 text-xs sm:text-base mt-3 font-medium leading-relaxed max-w-2xl mx-auto">
            Live coach-led boxing, strength training, and athlete transformations engineered for real life.
          </p> */}
        </div>

        {/* Les Mills Style Asymmetric 4-Column Responsive Collage Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          
          {/* COLUMN 1 */}
          <div className="flex flex-col gap-4">
            {/* Tall Portrait Video Card */}
            <div 
              onClick={() => setSelectedMedia({
                id: 'v1',
                type: 'video',
                url: 'https://res.cloudinary.com/yuyxn5b0/video/upload/q_auto,f_auto/v1790697693/WhatsApp_Video_2026-09-29_at_8.54.24_PM.mp4',
                title: 'Boxing Mittwork & Reflex Combinations',
                category: 'BOXING CONDITIONING'
              })}
              className="relative h-[380px] sm:h-[460px] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] cursor-pointer group transition-all duration-300 shadow-xl"
            >
              <LazyVideo
                src="https://res.cloudinary.com/yuyxn5b0/video/upload/q_auto,f_auto/v1790697693/WhatsApp_Video_2026-09-29_at_8.54.24_PM.mp4"
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />
              
              {/* Minimalist Pill PLAY Button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/75 backdrop-blur-md border border-zinc-600 text-white px-4 py-2 rounded-full font-mono text-xs font-bold tracking-wider flex items-center gap-2 group-hover:scale-110 group-hover:bg-[#CCFF00] group-hover:text-black transition-all shadow-xl">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY</span>
                </div>
              </div>
            </div>

            {/* Solid Vibrant Coral/Orange Text Card */}
            <div 
              onClick={onOpenConsultation}
              className="relative h-[220px] rounded-3xl bg-[#f95738] p-6 text-white flex flex-col justify-between cursor-pointer group hover:brightness-105 transition-all shadow-xl border border-orange-500/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-orange-100 bg-black/20 px-2.5 py-1 rounded-full">
                  COACH-LED PLATFORM
                </span>
                <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase leading-tight tracking-tight text-white">
                100% Coach-Led Live Online Sessions Built Around Real Life
              </h3>
            </div>
          </div>

          {/* COLUMN 2 */}
          <div className="flex flex-col gap-4">
            {/* Landscape Photo Card */}
            <div 
              onClick={() => setSelectedMedia({
                id: 'img1',
                type: 'image',
                url: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173781/WhatsApp_Image_2026-09-23_at_7.50.17_PM.jpg?auto=format&fit=crop&q=80&w=800',
                title: 'Head Coach & Team',
                category: 'HEAD COACH'
              })}
              className="relative h-[220px] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] cursor-pointer group transition-all duration-300 shadow-xl"
            >
              <img
                src={cloudinaryImage("https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173781/WhatsApp_Image_2026-09-23_at_7.50.17_PM.jpg?auto=format&fit=crop&q=80&w=800", 480)}
                loading="lazy"
                decoding="async"
                alt="Head Coach & Team"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h4 className="text-xs font-black uppercase text-white mt-1">Head Coach & Team (Physiotherapy & Coaching)</h4>
              </div>
            </div>

            {/* Solid Light Sky Blue / Mint Text Card */}
            <div 
              onClick={onOpenAssessment}
              className="relative h-[240px] rounded-3xl bg-[#99f6e4] p-6 text-zinc-950 flex flex-col justify-between cursor-pointer group hover:brightness-105 transition-all shadow-xl border border-teal-300/40"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-900 bg-teal-950/15 px-2.5 py-1 rounded-full">
                  GLOBAL IMPACT
                </span>
                <ArrowUpRight className="w-5 h-5 text-zinc-950 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase leading-tight tracking-tight text-zinc-950">
                1,000+ Global Athlete Transformations Across UK, UAE & Worldwide
              </h3>
            </div>

            {/* Additional Photo Card */}
            <div 
              onClick={() => setSelectedMedia({
                id: 'img2',
                type: 'image',
                url: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173783/WhatsApp_Image_2026-09-23_at_7.50.19_PM_2.jpg?auto=format&fit=crop&q=80&w=800',
                title: 'Strength & Progressive Overload',
                category: 'STRENGTH'
              })}
              className="relative h-[200px] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] cursor-pointer group transition-all duration-300 shadow-xl"
            >
              <img
                src={cloudinaryImage("https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173783/WhatsApp_Image_2026-09-23_at_7.50.19_PM_2.jpg?auto=format&fit=crop&q=80&w=800", 480)}
                loading="lazy"
                decoding="async"
                alt="Strength Training"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#CCFF00] bg-black/60 px-2 py-0.5 rounded-full border border-zinc-700">
                  STRENGTH PROTOCOL
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN 3 */}
          <div className="flex flex-col gap-4">
            {/* Tall Action Photo Card */}
            <div 
              onClick={() => setSelectedMedia({
                id: 'img3',
                type: 'image',
                url: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173784/WhatsApp_Image_2026-09-23_at_7.50.19_PM.jpg?auto=format&fit=crop&q=80&w=800',
                title: 'Tactical Conditioning & Reflex Drills',
                category: 'CONDITIONING'
              })}
              className="relative h-[360px] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] cursor-pointer group transition-all duration-300 shadow-xl"
            >
              <img
                src={cloudinaryImage("https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173784/WhatsApp_Image_2026-09-23_at_7.50.19_PM.jpg?auto=format&fit=crop&q=80&w=800", 480)}
                loading="lazy"
                decoding="async"
                alt="Tactical Conditioning"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#CCFF00] bg-black/60 px-2.5 py-0.5 rounded-full border border-zinc-700">
                  ATHLETE CONDITIONING
                </span>
                <h4 className="text-sm font-black uppercase text-white mt-1">Reflex & Explosive Power</h4>
              </div>
            </div>

            {/* Video Card 2 */}
            <div 
              onClick={() => setSelectedMedia({
                id: 'v2',
                type: 'video',
                url: 'https://res.cloudinary.com/yuyxn5b0/video/upload/q_auto,f_auto/v1789384992/WhatsApp_Video_2026-08-29_at_6.06.53_AM.mp4',
                title: 'Heavy Bag Power Strikes',
                category: 'BOXING POWER'
              })}
              className="relative h-[300px] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] cursor-pointer group transition-all duration-300 shadow-xl"
            >
              <LazyVideo
                src="https://res.cloudinary.com/yuyxn5b0/video/upload/q_auto,f_auto/v1789384992/WhatsApp_Video_2026-08-29_at_6.06.53_AM.mp4"
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 transition-opacity"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black/75 backdrop-blur-md border border-zinc-600 text-white px-4 py-2 rounded-full font-mono text-xs font-bold tracking-wider flex items-center gap-2 group-hover:scale-110 group-hover:bg-[#CCFF00] group-hover:text-black transition-all shadow-xl">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-black/60 px-2.5 py-0.5 rounded-full border border-zinc-700">
                  HEAVY BAG DRILL
                </span>
              </div>
            </div>
          </div>

          {/* COLUMN 4 */}
          <div className="flex flex-col gap-4">
            {/* Deep Dark Teal Solid Color Text Card */}
            <div 
              onClick={onOpenConsultation}
              className="relative h-[220px] rounded-3xl bg-[#044e42] p-6 text-white flex flex-col justify-between cursor-pointer group hover:brightness-105 transition-all shadow-xl border border-emerald-600/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-200 bg-black/20 px-2.5 py-1 rounded-full">
                  STRUCTURED COACHING
                </span>
                <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
              <h3 className="text-lg sm:text-xl font-black uppercase leading-tight tracking-tight text-white">
                Structured Periodized Lifting & Boxing Workouts Without Needing to Organize Life Around a Gym
              </h3>
            </div>

            {/* Tall Portrait Photo Card */}
            <div 
              onClick={() => setSelectedMedia({
                id: 'img4',
                type: 'image',
                url: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173786/WhatsApp_Image_2026-09-23_at_7.50.51_PM.jpg?auto=format&fit=crop&q=80&w=800',
                title: 'Functional Movement & Mobility',
                category: 'FUNCTIONAL QUALITY'
              })}
              className="relative h-[440px] rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-[#CCFF00] cursor-pointer group transition-all duration-300 shadow-xl"
            >
              <img
                src={cloudinaryImage("https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173786/WhatsApp_Image_2026-09-23_at_7.50.51_PM.jpg?auto=format&fit=crop&q=80&w=800", 480)}
                loading="lazy"
                decoding="async"
                alt="Movement Quality"
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#CCFF00] bg-black/60 px-2.5 py-0.5 rounded-full border border-zinc-700">
                  REAL MOVEMENT QUALITY
                </span>
                <h4 className="text-sm font-black uppercase text-white mt-1">Joint Longevity & Postural Form</h4>
              </div>
            </div>
          </div>

        </div>

        {/* CTA Bar
        <div className="mt-12 sm:mt-16 pt-8 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="text-base font-black text-white uppercase tracking-tight">
              READY TO BECOME STRONGER, FITTER & CONFIDENT?
            </h4>
            <p className="text-xs text-zinc-400 font-medium mt-0.5">
              Start with our 5-minute qualified diagnostic or book a 1-on-1 strategy call with our head coach.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onOpenAssessment}
              className="w-full sm:w-auto bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#CCFF00] text-white font-bold text-xs uppercase tracking-wider px-5 py-3.5 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2 active:scale-95"
            >
              <ClipboardList className="w-4 h-4 text-[#CCFF00]" />
              <span>TAKE 5-MIN DIAGNOSTIC</span>
            </button>
            <button
              onClick={onOpenConsultation}
              className="w-full sm:w-auto bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-widest px-6 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg inline-flex items-center justify-center gap-2 active:scale-95"
            >
              <CalendarCheck className="w-4 h-4 text-black" />
              <span>BOOK FREE CONSULTATION</span>
            </button>
          </div>
        </div> */}

      </div>

      {/* FULLSCREEN MEDIA MODAL LIGHTBOX */}
      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setSelectedMedia(null)}
        >
          <div
            className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-4xl bg-[#121214] border-0 sm:border border-zinc-800 rounded-none sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-[#18181b] border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold bg-[#CCFF00] text-black px-2.5 py-0.5 rounded uppercase">
                  {selectedMedia.type}
                </span>
                <h3 className="text-sm font-black text-white uppercase tracking-wider truncate max-w-md">
                  {selectedMedia.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMedia(null)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                aria-label="Close Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content Player / Image View */}
            <div className="relative bg-black flex-1 flex items-center justify-center overflow-hidden min-h-[280px] sm:min-h-[420px] max-h-[70vh]">
              {selectedMedia.type === 'video' ? (
                <video
                  src={selectedMedia.url}
                  controls
                  autoPlay
                  className="w-full max-h-[70vh] object-contain"
                />
              ) : (
                <img
                  src={cloudinaryImage(selectedMedia.url, 1600)}
                  alt={selectedMedia.title}
                  className="w-full max-h-[70vh] object-contain"
                />
              )}
            </div>

            {/* Modal Footer Info */}
            <div className="p-4 bg-[#121214] border-t border-zinc-800 shrink-0 flex items-center justify-between gap-3">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
                {selectedMedia.category}
              </span>
              <button
                onClick={() => setSelectedMedia(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
