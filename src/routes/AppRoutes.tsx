import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Trainer, ViewPage } from '../types';
import { HomePage } from '../pages/HomePage';
import { ServicesPage } from '../pages/ServicesPage';
import { CoachesPage } from '../pages/CoachesPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AboutView } from '../components/AboutView';
import { BlogView } from '../components/BlogView';
import { ContactView } from '../components/ContactView';
import { TermsView } from '../components/TermsView';
import { PrivacyView } from '../components/PrivacyView';
import { OnboardingTermsView } from '../components/OnboardingTermsView';

interface AppRoutesProps {
  ready: boolean;
  onNavigate: (page: ViewPage) => void;
  onOpenBooking: () => void;
  onOpenBookingFresh: () => void;
  onOpenAssessment: () => void;
  onSelectService: (service: any) => void;
  onOpenBookingWithTrainer: (trainerName: string) => void;
  onSelectTrainer: (trainer: Trainer) => void;
  selectedBlogPostId: string | null;
  onClearBlogPost: () => void;
  supportElement: React.ReactNode;
  authRequiredElement: React.ReactNode;
}

export default function AppRoutes(p: AppRoutesProps) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomePage
            ready={p.ready}
            onOpenBooking={p.onOpenBookingFresh}
            onOpenConsultation={p.onOpenBooking}
            onOpenAssessment={p.onOpenAssessment}
            onSelectService={p.onSelectService}
            onNavigate={p.onNavigate}
            onOpenBookingWithTrainer={p.onOpenBookingWithTrainer}
          />
        }
      />
      <Route
        path="/about"
        element={<AboutView onNavigate={p.onNavigate} onOpenBooking={p.onOpenBooking} />}
      />
      <Route
        path="/services"
        element={<ServicesPage onOpenBooking={p.onOpenBooking} onSelectService={p.onSelectService} />}
      />
      <Route
        path="/schedule"
        element={<ServicesPage onOpenBooking={p.onOpenBooking} onSelectService={p.onSelectService} />}
      />
      <Route path="/pricing" element={<Navigate to="/services" replace />} />
      <Route
        path="/coaches"
        element={
          <CoachesPage
            onSelectTrainer={p.onSelectTrainer}
            onNavigate={p.onNavigate}
            onOpenBookingWithTrainer={p.onOpenBookingWithTrainer}
          />
        }
      />
      <Route
        path="/blog"
        element={
          <BlogView
            initialSelectedPostId={p.selectedBlogPostId}
            onClearInitialPost={p.onClearBlogPost}
          />
        }
      />
      <Route path="/contact" element={<ContactView />} />
      <Route path="/terms" element={<TermsView />} />
      <Route path="/privacy" element={<PrivacyView />} />
      <Route path="/onboarding-terms" element={<OnboardingTermsView />} />
      <Route path="/support" element={p.supportElement} />
      <Route path="/dashboard" element={p.authRequiredElement} />
      <Route path="/admin" element={p.authRequiredElement} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}