import React, { useEffect, useRef, useState } from 'react';
import { useServiceMarket } from './Services/hooks/useServiceMarket';
import type { ServiceItem } from './Services/types';
import { TrainYourWaySection } from './Services/TrainYourWaySection';
import { PersonalisedSupportSection } from './Services/PersonalisedSupportSection';
import { CommitAndSaveSection } from './Services/CommitAndSaveSection';

export type { ServiceItem } from './Services/types';


interface ServicesSectionProps {
  onOpenBooking: () => void;
  onSelectService?: (service: ServiceItem) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onOpenBooking, onSelectService }) => {
  const marketConfig = useServiceMarket();
  const symbol = marketConfig.symbol || '£';
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [visibleSections, setVisibleSections] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    const sections = sectionRefs.current
      .map((element, index) => ({ element, index }))
      .filter((item): item is { element: HTMLDivElement; index: number } => item.element !== null);
    if (sections.length === 0) return;

    if (!('IntersectionObserver' in window)) {
      setVisibleSections(new Set(sections.map(({ index }) => index)));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = Number((entry.target as HTMLElement).dataset.serviceRevealIndex);
        setVisibleSections((current) => new Set(current).add(index));
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.02 });

    sections.forEach(({ element }) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  const handleChoose = (item: ServiceItem) => {
    if (onSelectService) {
      onSelectService({
        ...item,
        price: Number(item.price) || 0,
        priceGbp: item.priceGbp || Number(item.price) || 0
      });
    } else {
      onOpenBooking();
    }
  };

  return (
    <section id="services-section" className="scroll-mt-24 w-full bg-[#0a0a0a] text-white py-12 sm:py-16 md:py-20 lg:py-24 border-b border-zinc-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14 sm:space-y-18 md:space-y-24">
        <div
          ref={(element) => { sectionRefs.current[0] = element; }}
          data-service-reveal-index="0"
          className={visibleSections.has(0) ? 'service-section-reveal' : ''}
        >
          <TrainYourWaySection symbol={symbol} onChoose={handleChoose} />
        </div>
        <div
          ref={(element) => { sectionRefs.current[1] = element; }}
          data-service-reveal-index="1"
          className={visibleSections.has(1) ? 'service-section-reveal' : ''}
        >
          <PersonalisedSupportSection symbol={symbol} onChoose={handleChoose} />
        </div>
        <div
          ref={(element) => { sectionRefs.current[2] = element; }}
          data-service-reveal-index="2"
          className={visibleSections.has(2) ? 'service-section-reveal' : ''}
        >
          <CommitAndSaveSection symbol={symbol} onChoose={handleChoose} />
        </div>
      </div>
    </section>
  );
};
