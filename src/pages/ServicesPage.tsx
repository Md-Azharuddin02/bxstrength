import React from 'react';
import { ServicesSection } from '../components/ServicesSection';

interface ServicesPageProps {
  onOpenBooking: () => void;
  onSelectService: (service: any) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onOpenBooking, onSelectService }) => (
  <ServicesSection onOpenBooking={onOpenBooking} onSelectService={onSelectService} />
);