import React, { useState, useEffect, useRef } from 'react';
import { Award, Users, CheckCircle, ShieldCheck, Globe } from 'lucide-react';

export const TrustBar: React.FC<{ ready?: boolean }> = ({ ready = true }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      {
        threshold: 0.15,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const trustItems = [
    {
      icon: Award,
      value: '10+ YEARS',
      label: 'Elite Coaching Experience',
    },
    {
      icon: Users,
      value: '1,000+ CLIENTS',
      label: 'Transformed Worldwide',
    },
    {
      icon: CheckCircle,
      value: '99% SATISFACTION',
      label: 'Client Transformation Rate',
    },
    {
      icon: ShieldCheck,
      value: 'EXPERT VERIFIED',
      label: 'Verified Master Coaches',
    },
    {
      icon: Globe,
      value: 'GLOBAL VIRTUAL',
      label: '100% Bespoke Virtual Coaching',
    },
  ];

  return (
    <section ref={sectionRef} className="w-full bg-[#121214] border-y border-zinc-800 py-6 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 text-center">
          {trustItems.map((item, idx) => {
            const IconComponent = item.icon;

            return (
              <div
                key={idx}
                className={`flex flex-col items-center justify-center p-3 rounded-xl group cursor-pointer transition-all duration-300 hover:bg-zinc-800/50 hover:border-zinc-700/60 border border-transparent transform ${
                  idx === 4 ? 'col-span-2 sm:col-span-1 lg:col-span-1' : ''
                } ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: `${idx * 100}ms` }}
              >
                <div className="w-10 h-10 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center mb-2 group-hover:border-amber-400 group-hover:bg-amber-500/10 transition-all duration-300 group-hover:scale-110">
                  <IconComponent className="w-5 h-5 text-white group-hover:text-amber-400 transition-all duration-300 group-hover:rotate-12" />
                </div>
                {/* Static figures; the glow appears only on hover */}
                <span className="text-sm font-black tracking-tight text-white uppercase tabular-nums transition-all duration-300 group-hover:text-amber-300 group-hover:drop-shadow-[0_0_8px_rgba(252,211,77,0.6)]">
                  {item.value}
                </span>
                <span className="text-[11px] font-medium text-zinc-400 mt-0.5 group-hover:text-zinc-300 transition-colors duration-300">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};


