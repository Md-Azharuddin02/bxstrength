import React, { useState } from 'react';
import { FitnessClass, ViewPage } from '../types';
import { CLASSES_DATA } from '../data/gymData';
import { Flame, Clock, User, ArrowRight, Check } from 'lucide-react';
import { cloudinaryImage } from '../utils/image';

interface FeaturedClassesProps {
  onSelectClass: (cls: FitnessClass) => void;
  onNavigate: (page: ViewPage) => void;
  onOpenBookingWithClass?: (className: string) => void;
}

export const FeaturedClasses: React.FC<FeaturedClassesProps> = ({ 
  onSelectClass, 
  onNavigate,
  onOpenBookingWithClass 
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'ALL CLASSES' },
    { id: 'cycling', label: 'CYCLING' },
    { id: 'strength', label: 'STRENGTH' },
    { id: 'mindbody', label: 'MIND & BODY' },
    { id: 'boxing', label: 'BOXING' },
  ];

  const filteredClasses = activeCategory === 'all'
    ? CLASSES_DATA
    : CLASSES_DATA.filter(c => c.category === activeCategory);

  return (
    <section id="featured-classes-section" className="py-20 bg-[#F8F9FA] border-t border-b border-gray-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black tracking-widest text-[#E52165] uppercase">
            TRAIN WITH PURPOSE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight mt-1">
            FEATURED CLASSES
          </h2>
          <div className="w-12 h-1 bg-[#E52165] mx-auto mt-3"></div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-5 py-2 text-xs font-extrabold tracking-wider uppercase transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#E52165] text-white shadow-md shadow-pink-500/20'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Classes Grid (3-column layout matching screenshot) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClasses.slice(0, 3).map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-none border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full overflow-hidden"
            >
              {/* Class Image Container */}
              <div className="relative h-56 overflow-hidden bg-gray-900">
                <img
                  src={cloudinaryImage(cls.image, 800)}
                  loading="lazy"
                  decoding="async"
                  alt={cls.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>
                
                {/* Intensity Pill */}
                <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 border border-white/20">
                  {cls.intensity}
                </div>

                <div className="absolute bottom-3 right-3 text-white text-xs font-bold bg-[#E52165] px-2.5 py-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {cls.caloriesBurned}
                </div>
              </div>

              {/* Class Body Content */}
              <div className="p-6 flex flex-col flex-grow text-center">
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-3 group-hover:text-[#E52165] transition-colors">
                  {cls.title}
                </h3>

                <p className="text-gray-500 text-xs sm:text-sm leading-relaxed font-normal mb-6 flex-grow">
                  {cls.description}
                </p>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-2 py-3 border-t border-b border-gray-100 text-xs text-gray-600 mb-6 bg-gray-50/80 px-3">
                  <div className="flex items-center justify-center gap-1.5 font-semibold">
                    <Clock className="w-3.5 h-3.5 text-[#E52165]" />
                    <span>{cls.durationMinutes} Mins</span>
                  </div>
                  <div className="flex items-center justify-center gap-1.5 font-semibold">
                    <User className="w-3.5 h-3.5 text-[#E52165]" />
                    <span>{cls.trainerName}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onOpenBookingWithClass) {
                        onOpenBookingWithClass(cls.title);
                      }
                    }}
                    className="flex-1 bg-gray-900 hover:bg-[#E52165] text-white text-xs font-black tracking-widest py-3 uppercase transition-colors"
                  >
                    BOOK SESSION
                  </button>
                  <button
                    onClick={() => onSelectClass(cls)}
                    className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 transition-colors"
                    title="View Class Details"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button
            onClick={() => onNavigate('services')}
            className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-[#E52165] hover:text-[#c41551] uppercase border-b-2 border-[#E52165] pb-1 transition-colors cursor-pointer"
          >
            EXPLORE ALL SERVICES & PROTOCOLS <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
};
