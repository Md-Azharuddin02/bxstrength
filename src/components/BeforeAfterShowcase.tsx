import React, { useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cloudinaryImage } from '../utils/image';

interface Transformation {
  id: number;
  // Each photo is a finished 16:9 before/after composite with its own labels
  image: string;
  clientName: string;
  startKg: number;
  currentKg: number;
  weeks: number;
  programme: string;
  focus: string;
  category: string;
  summary: string;
}

const TRANSFORMATIONS: Transformation[] = [

  {
    id: 1,
    image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790509640/WhatsApp_Image_2026-09-27_at_4.49.10_PM.jpg',
    clientName: 'Naail James',
    startKg: 92,
    currentKg: 78,
    weeks: 12,
    programme: 'Dedicated coaching',
    focus: 'Metabolic conditioning & core stability',
    category: 'Body recomposition',
    summary: 'Recomposed his physique with high-output interval training and a tailored nutrition plan.',
  },
  {
    id: 2,
    image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790509651/WhatsApp_Image_2026-09-27_at_4.59.04_PM.jpg',
    clientName: 'Abdullah Jones',
    startKg: 89,
    currentKg: 75,
    weeks: 16,
    programme: 'Athletic protocol',
    focus: 'Progressive resistance & heavy bag power',
    category: 'Fat loss',
    summary: 'Added lean athletic muscle while improving joint mobility, shoulder stability and posture.',
  },
    {
    id: 3,
    image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790509640/WhatsApp_Image_2026-09-27_at_4.45.24_PM.jpg',
    clientName: 'Fahad Chris',
    startKg: 96,
    currentKg: 76,
    weeks: 16,
    programme: '1-on-1 personal coaching',
    focus: 'Boxing power, footwork & compound lifting',
    category: 'Fat loss',
    summary: 'Lost 20 kg of body fat while increasing bench press strength and metabolic endurance.',
  },
  {
    id: 4,
    image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790532727/WhatsApp_Image_2026-09-27_at_4.41.50_PM.jpg',
    clientName: 'Alex Nicole',
    startKg: 88,
    currentKg: 74,
    weeks: 14,
    programme: 'Dedicated coaching',
    focus: 'Hypertrophy conditioning & functional strength',
    category: 'Strength & conditioning',
    summary: 'Built core endurance and a leaner physique through weekly 1-on-1 fight camp sessions.',
  },
];

// Headline figures are derived from the case studies so they can never drift from them
const totalLostKg = TRANSFORMATIONS.reduce((sum, t) => sum + (t.startKg - t.currentKg), 0);
const averageWeeks = TRANSFORMATIONS.reduce((sum, t) => sum + t.weeks, 0) / TRANSFORMATIONS.length;
const SUMMARY_STATS = [
  { value: `${totalLostKg} kg`, label: 'Lost in total' },
  { value: `${TRANSFORMATIONS.length}`, label: 'Client stories' },
  { value: `${Number(averageWeeks.toFixed(1))} wk`, label: 'Average programme' },
];

interface BeforeAfterShowcaseProps {
  onOpenConsultation: () => void;
  onOpenAssessment: () => void;
}

export const BeforeAfterShowcase: React.FC<BeforeAfterShowcaseProps> = ({
  onOpenConsultation,
  onOpenAssessment,
}) => {
  const [index, setIndex] = useState(0);
  const current = TRANSFORMATIONS[index];
  const lostKg = current.startKg - current.currentKg;
  const step = (delta: number) =>
    setIndex((i) => (i + delta + TRANSFORMATIONS.length) % TRANSFORMATIONS.length);
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <section
      aria-labelledby="transformations-heading"
      className="w-full bg-[#08080a] text-white py-16 sm:py-24 border-b border-zinc-800/80 font-sans"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading: title left, headline figures right */}
        <div className="mb-10 sm:mb-14 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500 mb-3">Proven results</p>
            <h2 id="transformations-heading" className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Real client transformations
            </h2>
          </div>
          <dl className="grid grid-cols-3 sm:flex items-stretch gap-4 sm:gap-10 sm:whitespace-nowrap">
            {SUMMARY_STATS.map((stat, i) => (
              <div key={stat.label} className={`flex flex-col-reverse ${i > 0 ? 'pl-4 sm:pl-10 border-l border-zinc-800' : ''}`}>
                <dt className="text-xs text-zinc-500 mt-1">{stat.label}</dt>
                <dd className="text-xl sm:text-2xl font-semibold tracking-tight whitespace-nowrap">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          {/* Photo and thumbnail picker */}
          <div className="lg:col-span-7 space-y-3 sm:space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-zinc-900 ring-1 ring-white/5">
              <img
                key={current.id}
                src={cloudinaryImage(current.image, 1200)}
                alt={`${current.clientName}: before and after ${current.weeks} weeks of coaching`}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover animate-in fade-in duration-500"
              />
            </div>
            <div role="group" aria-label="Choose a client transformation" className="grid grid-cols-4 gap-2 sm:gap-3">
              {TRANSFORMATIONS.map((t, i) => {
                const isActive = i === index;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-pressed={isActive}
                    aria-label={`${t.clientName}, lost ${t.startKg - t.currentKg} kg`}
                    className={`relative aspect-video overflow-hidden rounded-lg transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CCFF00] ${
                      isActive ? 'ring-2 ring-[#CCFF00] ring-offset-2 ring-offset-[#08080a]' : 'opacity-45 hover:opacity-80'
                    }`}
                  >
                    <img src={cloudinaryImage(t.image, 320)} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Story */}
          <div className="lg:col-span-5 lg:pt-2" aria-live="polite">
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-xs text-zinc-500 tracking-widest" aria-hidden="true">
                {pad(index + 1)} / {pad(TRANSFORMATIONS.length)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  aria-label="Previous transformation"
                  className="w-9 h-9 rounded-full border border-zinc-700 text-zinc-300 flex items-center justify-center hover:border-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => step(1)}
                  aria-label="Next transformation"
                  className="w-9 h-9 rounded-full border border-zinc-700 text-zinc-300 flex items-center justify-center hover:border-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">{current.category}</p>
            <h3 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight">{current.clientName}</h3>

            <div className="mt-6 flex items-end gap-4 border-y border-zinc-800 py-5">
              <span className="text-4xl sm:text-5xl font-semibold tracking-tight leading-none">−{lostKg} kg</span>
              <span className="pb-1 text-sm text-zinc-400 leading-snug">
                {current.startKg} kg to {current.currentKg} kg<br />in {current.weeks} weeks
              </span>
            </div>

            <p className="mt-5 text-sm sm:text-base text-zinc-300 leading-relaxed">{current.summary}</p>
            <p className="mt-2 text-sm text-zinc-500">{current.programme} · {current.focus}</p>

            <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
              <button
                type="button"
                onClick={onOpenAssessment}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[#CCFF00] px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-[#b8e600] cursor-pointer"
              >
                Start your transformation
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={onOpenAssessment}
                className="whitespace-nowrap text-sm font-medium text-zinc-400 underline underline-offset-4 decoration-zinc-700 hover:text-white hover:decoration-zinc-400 transition-colors cursor-pointer"
              >
                Take the free assessment
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
