import React from 'react';
import { ViewPage } from '../types';
import { Hero } from '../components/Hero';
import { TrustBar } from '../components/TrustBar';
import { AssessmentSection } from '../components/AssessmentSection';
import { ServicesSection } from '../components/ServicesSection';
import { BeforeAfterShowcase } from '../components/BeforeAfterShowcase';
import { TransformationJourney } from '../components/TransformationJourney';
import { TrainerCompact } from '../components/TrainerCompact';
import { TestimonialsSection } from '../components/TestimonialsSection';
import { FaqSection } from '../components/FaqSection';

interface HomePageProps {
  ready: boolean;
  onOpenBooking: () => void;        // New booking (selections reset)
  onOpenConsultation: () => void;   // Open booking model 
  onOpenAssessment: () => void;
  onSelectService: (service: any) => void;
  onNavigate: (page: ViewPage) => void;
  onOpenBookingWithTrainer: (trainerName: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  ready,
  onOpenBooking,
  onOpenConsultation,
  onOpenAssessment,
  onSelectService,
  onNavigate,
  onOpenBookingWithTrainer,
}) => (
  <>
    <Hero onOpenBooking={onOpenBooking} onOpenAssessment={onOpenAssessment} />
    <TrustBar ready={ready} />
    <AssessmentSection onOpenAssessment={onOpenAssessment} />
    <ServicesSection onOpenBooking={onOpenBooking} onSelectService={onSelectService} />
    <BeforeAfterShowcase
      onOpenAssessment={onOpenAssessment}
      onOpenConsultation={onOpenConsultation}
    />
    <TransformationJourney
      onOpenAssessment={onOpenAssessment}
      onOpenConsultation={onOpenConsultation}
    />
    <TrainerCompact
      onNavigate={onNavigate}
      onOpenBookingWithTrainer={onOpenBookingWithTrainer}
    />
    <TestimonialsSection />
    <FaqSection
      onOpenConsultation={onOpenConsultation}
      onOpenAssessment={onOpenAssessment}
    />
  </>
);