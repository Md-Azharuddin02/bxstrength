import React from 'react';
import { Clock, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';
import type { ServiceItem } from './types';
import { trainYourWayServices } from './constants/serviceCatalog';

interface SectionProps {
  symbol: string;
  onChoose: (item: ServiceItem) => void;
}

export const TrainYourWaySection: React.FC<SectionProps> = ({ symbol, onChoose }) => {

  return (
    <>
        <div>
          {/* Header */}
          <div className="mb-8 sm:mb-10">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 sm:gap-4">
              <div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white">
                  TRAIN <span className="text-[#CCFF00]">YOUR WAY</span>
                </h2>
                <p className="text-zinc-400 text-xs sm:text-sm md:text-base mt-1.5 sm:mt-2">
                  Choose the training plan that fits your goals, time and lifestyle.
                </p>
              </div>
              <p className="text-zinc-400 text-xs sm:text-sm max-w-md text-left leading-relaxed">
                From focused strength work to<br />
                complete full-body training, find<br />
                the right session for your fitness journey.
              </p>
            </div>
          </div>

          {/* 4 Cards Grid - Responsive from 1 column (mobile), 2 columns (iPad/tablet), 4 columns (laptop/desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 items-stretch">
            {trainYourWayServices.map((srv, idx) => (
              <div
                key={idx}
                className="bg-[#121215] border border-zinc-800 rounded-2xl p-4 sm:p-4 lg:p-5 flex flex-col justify-between transition-all duration-300 hover:border-zinc-700 hover:-translate-y-1 shadow-lg"
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

                  {/* Features */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-2 gap-y-1.5 mb-3 sm:mb-4">
                    {srv.features.map((feat, fIdx) => {
                      const IconComponent = feat.icon;
                      return (
                        <div key={fIdx} className="flex min-w-0 items-center gap-2 text-[11px] sm:text-xs font-medium leading-tight text-zinc-200">
                          <IconComponent className="w-4 h-4 text-[#CCFF00] shrink-0" />
                          <span className="min-w-0">{feat.text}</span>
                        </div>
                      );
                    })}

                    {srv.specialBadge && (
                      <div className="mt-2 pt-1 xl:col-span-2">
                        <div className="flex items-center gap-2 px-2.5 sm:px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700/80 text-[10px] sm:text-[11px] font-bold text-white">
                          <ShieldCheck className="w-4 h-4 text-[#CCFF00] shrink-0" />
                          <span>{srv.specialBadge}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-1">
                  {/* Description */}
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3 pt-2.5 border-t border-zinc-800/80">
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
