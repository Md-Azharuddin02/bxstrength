import React, { useEffect, useRef } from 'react';
import { Clock, ArrowRight, Check, Minus } from 'lucide-react';
import type { ServiceItem } from './types';
import { trainYourWayServices, trainYourWayFeatures } from './constants/serviceCatalog';

interface SectionProps {
  symbol: string;
  onChoose: (item: ServiceItem) => void;
}

// The quote as three lines; each line slides up into view, staggered. Lime marks the "deep" phrases.
type Piece = { text: string; hl: boolean };
const QUOTE_LINES: Piece[][] = [
  [{ text: 'From ', hl: false }, { text: 'focused strength work', hl: true }, { text: ' to', hl: false }],
  [{ text: 'complete full-body training', hl: true }, { text: ', find the', hl: false }],
  [{ text: 'right session for your ', hl: false }, { text: 'fitness journey.', hl: true }],
];

export const TrainYourWaySection: React.FC<SectionProps> = ({ symbol, onChoose }) => {
  const quoteRef = useRef<HTMLParagraphElement>(null);

  // Replay the slide-up each time the quote scrolls into view.
  useEffect(() => {
    const el = quoteRef.current;
    if (!el) return;
    if (!('IntersectionObserver' in window)) {
      el.classList.add('is-in');
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        // Reveal once and keep it: removing it collapses the quote to a blank reserved band.
        if (e.intersectionRatio >= 0.4) {
          e.target.classList.add('is-in');
          observer.unobserve(e.target);
        }
      }),
      { threshold: [0, 0.4] }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
        <div>
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#CCFF00] mb-2">
              Services
            </p>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
              TRAIN <span className="text-[#CCFF00]">YOUR WAY</span>
            </h2>
            <p className="text-zinc-400 text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2">
              Choose the training plan that fits your goals, time and lifestyle.
            </p>
          </div>

          {/* 4 Cards Grid - Responsive from 1 column (mobile), 2 columns (iPad/tablet), 4 columns (laptop/desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {trainYourWayServices.map((srv, idx) => (
              <div
                key={idx}
                className="service-card-hover bg-[#121215] border border-zinc-800 rounded-2xl p-4 sm:p-4 lg:p-5 flex flex-col justify-between transition-all duration-300 hover:border-zinc-700 hover:-translate-y-1 shadow-lg"
              >
                <div>
                  {/* Title & Subtitle */}
                  <h3 className="text-lg sm:text-xl font-black uppercase tracking-wide text-white">
                    {srv.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-400 mt-1 mb-3 sm:mb-4">
                    {srv.subtitle}
                  </p>

                  {/* Price & Duration */}
                  <div className="flex items-baseline gap-2.5 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-zinc-800/80">
                    <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-none">
                      {symbol}{srv.price}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-zinc-300">
                      <Clock className="w-3.5 h-3.5 text-zinc-400" />
                      {srv.duration}
                    </span>
                  </div>

                  {/* Features — the same canonical list on every card (included = lime, excluded = dimmed),
                      so all four cards are identical height with no voids, at any screen/card size. */}
                  <div className="flex flex-col gap-y-2 mb-3 sm:mb-4">
                    {trainYourWayFeatures.map((feat) => {
                      const IconComponent = feat.icon;
                      const included = srv.includes.includes(feat.key);
                      return (
                        <div
                          key={feat.key}
                          className={`flex min-w-0 items-center gap-2 text-[11px] sm:text-xs font-medium leading-tight ${included ? 'text-zinc-100' : 'text-zinc-600'}`}
                        >
                          <IconComponent className={`w-4 h-4 shrink-0 ${included ? 'text-[#CCFF00]' : 'text-zinc-700'}`} />
                          <span className="min-w-0 truncate">{feat.label}</span>
                          {included ? (
                            <Check className="w-3.5 h-3.5 shrink-0 ml-auto text-[#CCFF00]" />
                          ) : (
                            <Minus className="w-3.5 h-3.5 shrink-0 ml-auto text-zinc-700" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-1">
                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3 pt-2.5 border-t border-zinc-800/80 min-h-[4.75rem]">
                    {srv.description}
                  </p>

                  {/* CTA Button */}
                  <button
                    onClick={() => onChoose(srv)}
                    className="group w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] shadow-md"
                  >
                    <span>{srv.ctaLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-black transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
    </>
  );
};
