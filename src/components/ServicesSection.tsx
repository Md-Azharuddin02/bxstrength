import React from 'react';
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
        <TrainYourWaySection symbol={symbol} onChoose={handleChoose} />
        <PersonalisedSupportSection symbol={symbol} onChoose={handleChoose} />
        <CommitAndSaveSection symbol={symbol} onChoose={handleChoose} />
      </div>
    </section>
  );
};
