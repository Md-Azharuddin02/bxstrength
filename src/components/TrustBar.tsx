import React, { useState, useEffect, useRef } from 'react';
import { Award, Users, CheckCircle, ShieldCheck, Globe } from 'lucide-react';

interface CounterProps {
  targetNumber: number | null;
  prefix?: string;
  suffix?: string;
  fallbackValue: string;
  isVisible: boolean;
  duration?: number;
  triggerKey?: number;
}

const CounterValue: React.FC<CounterProps> = ({
  targetNumber,
  prefix = '',
  suffix = '',
  fallbackValue,
  isVisible,
  duration = 20000,
  triggerKey = 0,
}) => {
  const [count, setCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isVisible || targetNumber === null) return;

    setIsFinished(false);
    setCount(0);

    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic formula for premium deceleration feel
      const easeOutCubic = 1 - Math.pow(1 - progress, 2);
      const currentCount = Math.floor(easeOutCubic * targetNumber);

      setCount(currentCount);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(targetNumber);
        setIsFinished(true);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isVisible, targetNumber, duration, triggerKey]);

  if (targetNumber === null) {
    return (
      <span className="text-sm font-black tracking-tight text-white uppercase group-hover:text-amber-300 transition-colors duration-300">
        {fallbackValue}
      </span>
    );
  }

  const formattedCount = count.toLocaleString();

  return (
    <span
      className={`text-sm font-black tracking-tight uppercase tabular-nums transition-all duration-300 ${
        isFinished
          ? 'text-white group-hover:text-amber-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]'
          : 'text-amber-400 font-extrabold scale-105'
      }`}
    >
      {prefix}
      {formattedCount}
      {suffix}
    </span>
  );
};

export const TrustBar: React.FC<{ ready?: boolean }> = ({ ready = true }) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hoverCounts, setHoverCounts] = useState<{ [key: number]: number }>({});

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

  const handleMouseEnter = (idx: number) => {
    setHoverCounts((prev) => ({
      ...prev,
      [idx]: (prev[idx] || 0) + 1,
    }));
  };

  const trustItems = [
    {
      icon: Award,
      targetNumber: 10,
      suffix: '+ YEARS',
      fallbackValue: '10+ YEARS',
      label: 'Elite Coaching Experience',
    },
    {
      icon: Users,
      targetNumber: 1000,
      suffix: '+ CLIENTS',
      fallbackValue: '1,000+ CLIENTS',
      label: 'Transformed Worldwide',
    },
    {
      icon: CheckCircle,
      targetNumber: 99,
      suffix: '% SATISFACTION',
      fallbackValue: '99% SATISFACTION',
      label: 'Client Transformation Rate',
    },
    {
      icon: ShieldCheck,
      targetNumber: null,
      fallbackValue: 'EXPERT VERIFIED',
      label: 'Verified Master Coaches',
    },
    {
      icon: Globe,
      targetNumber: null,
      fallbackValue: 'GLOBAL VIRTUAL',
      label: '100% Bespoke Virtual Coaching',
    },
  ];

  return (
    <section ref={sectionRef} className="w-full bg-[#121214] border-y border-zinc-800 py-6 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6 text-center">
          {trustItems.map((item, idx) => {
            const IconComponent = item.icon;
            const triggerKey = hoverCounts[idx] || 0;

            return (
              <div
                key={idx}
                //onMouseEnter={() => handleMouseEnter(idx)}
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
                <CounterValue
                  targetNumber={item.targetNumber}
                  suffix={item.suffix}
                  fallbackValue={item.fallbackValue}
                  isVisible={isVisible}
                  triggerKey={triggerKey}
                  duration={2200}
                />
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


