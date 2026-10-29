import React, { lazy } from "react";
import { Routes, Route, Navigate, useParams, useNavigate } from "react-router-dom";

import { Trainer, ViewPage } from "../types";

import { HomePage } from "../pages/HomePage";


import ProtectedRoute from "../components/ProtectedRoute";
import RoleDashboard from "../components/RoleDashboard";

// Home stays in the main bundle; every other page loads when first visited
const ServicesPage = lazy(() => import("../pages/ServicesPage").then(m => ({ default: m.ServicesPage })));
const CoachesPage = lazy(() => import("../pages/CoachesPage").then(m => ({ default: m.CoachesPage })));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));
const AboutView = lazy(() => import("../components/AboutView").then(m => ({ default: m.AboutView })));
const BlogView = lazy(() => import("../components/BlogView").then(m => ({ default: m.BlogView })));
const ContactView = lazy(() => import("../components/ContactView").then(m => ({ default: m.ContactView })));
const TermsView = lazy(() => import("../components/TermsView").then(m => ({ default: m.TermsView })));
const PrivacyView = lazy(() => import("../components/PrivacyView").then(m => ({ default: m.PrivacyView })));
const OnboardingTermsView = lazy(() => import("../components/OnboardingTermsView").then(m => ({ default: m.OnboardingTermsView })));

function BlogPostRoute() {
  const { postId } = useParams();
  const navigate = useNavigate();
  return (
    <BlogView
      key={postId}
      initialSelectedPostId={postId ?? null}
      onClearInitialPost={() => navigate("/blog")}
    />
  );
}

interface AppRoutesProps {
  ready: boolean;
  onNavigate: (page: ViewPage) => void;
  onOpenBooking: () => void;
  onOpenBookingFresh: () => void;
  onOpenAssessment: () => void;
  onSelectService: (service: any) => void;
  onOpenBookingWithTrainer: (trainerName: string) => void;
  onSelectTrainer: (trainer: Trainer) => void;

  clientPortal: React.ReactNode;
  coachPortal: React.ReactNode;
  headCoachPortal: React.ReactNode;
  adminPortal: React.ReactNode;
  supportPortal: React.ReactNode;
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
        element={
          <AboutView
            onNavigate={p.onNavigate}
            onOpenBooking={p.onOpenBooking}
          />
        }
      />

      <Route
        path="/services"
        element={
          <ServicesPage
            onOpenBooking={p.onOpenBooking}
            onSelectService={p.onSelectService}
          />
        }
      />

      <Route path="/schedule" element={<Navigate to="/services" replace />} />

      <Route
        path="/pricing"
        element={<Navigate to="/services" replace />}
      />

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
            initialSelectedPostId={null} 
            onClearInitialPost={() => {}}
          />
        }
      />
      <Route path="/blog/:postId" element={<BlogPostRoute />} />
      <Route path="/contact" element={<ContactView />} />
      <Route path="/terms" element={<TermsView />} />
      <Route path="/privacy" element={<PrivacyView />} />
      <Route
        path="/onboarding-terms"
        element={<OnboardingTermsView />}
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RoleDashboard
              clientPortal={p.clientPortal}
              coachPortal={p.coachPortal}
              headCoachPortal={p.headCoachPortal}
              adminPortal={p.adminPortal}
              supportPortal={p.supportPortal}
            />
          </ProtectedRoute>
        }
      />

      <Route path="/admin" element={<Navigate to="/dashboard" replace />} />

      <Route path="/coach" element={<Navigate to="/dashboard" replace />} />

      <Route path="/headcoach" element={<Navigate to="/dashboard" replace />} />

      <Route path="/support" element={<Navigate to="/dashboard" replace />} />

      <Route path="/reset-password" element={<Navigate to="/" replace />} />
      
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}