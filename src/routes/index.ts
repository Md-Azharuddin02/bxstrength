import { ViewPage } from '../types';

// Har ViewPage ka apna URL. Naya ViewPage add karoge to TypeScript yahan error dega.
export const PAGE_PATHS: Record<ViewPage, string> = {
  home: '/',
  about: '/about',
  services: '/services',
  pricing: '/pricing',
  schedule: '/schedule',
  trainers: '/coaches',
  blog: '/blog',
  contact: '/contact',
  dashboard: '/dashboard',
  admin: '/admin',
  terms: '/terms',
  privacy: '/privacy',
  onboarding_terms: '/onboarding-terms',
  support_dashboard: '/support',
};

// URL se wapas ViewPage nikalta hai. Pehchana na gaya to 'home'.
export const pathToPage = (pathname: string): ViewPage => {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const match = (Object.keys(PAGE_PATHS) as ViewPage[]).find(
    (key) => PAGE_PATHS[key] === clean
  );
  return match ?? 'home';
};