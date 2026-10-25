import { ViewPage } from '../types';

export const PAGE_PATHS: Record<ViewPage, string> = {
  home: '/',
  about: '/about',
  services: '/services',
  pricing: '/pricing',
  schedule: '/services',
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

// Sections that own sub-paths: /blog/:postId, /dashboard/..., etc.
const PREFIX_PAGES: ViewPage[] = ['blog', 'dashboard', 'admin', 'support_dashboard'];

const normalize = (p: string) => {
  const lower = p.toLowerCase();
  return lower.length > 1 ? lower.replace(/\/+$/, '') : lower;
};

// null = no known page (404), so callers don't mistake it for home
export const pathToPage = (pathname: string): ViewPage | null => {
  const clean = normalize(pathname);
  const keys = Object.keys(PAGE_PATHS) as ViewPage[];

  const exact = keys.find((k) => PAGE_PATHS[k] === clean);
  if (exact) return exact;

  return PREFIX_PAGES.find((k) => clean.startsWith(PAGE_PATHS[k] + '/')) ?? null;
};