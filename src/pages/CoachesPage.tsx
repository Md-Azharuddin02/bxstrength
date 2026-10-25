import React from 'react';
import { Trainer, ViewPage } from '../types';
import { TrainersSection } from '../components/TrainersSection';

interface CoachesPageProps {
  onSelectTrainer: (trainer: Trainer) => void;
  onNavigate: (page: ViewPage) => void;
  onOpenBookingWithTrainer: (trainerName: string) => void;
}

export const CoachesPage: React.FC<CoachesPageProps> = ({
  onSelectTrainer,
  onNavigate,
  onOpenBookingWithTrainer,
}) => (
  <div className="bg-[#0a0a0a] min-h-screen py-12">
    <TrainersSection
      onSelectTrainer={onSelectTrainer}
      onNavigate={onNavigate}
      onOpenBookingWithTrainer={onOpenBookingWithTrainer}
    />
  </div>
);