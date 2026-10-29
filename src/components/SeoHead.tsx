import React, { useEffect } from 'react';
import { ViewPage } from '../types';
import { PAGE_PATHS } from '../routes';

interface SeoHeadProps {
  currentPage: ViewPage | null;
}

const SITE = 'https://bxstrength.com';
const NOINDEX_PAGES: ViewPage[] = ['dashboard', 'admin', 'support_dashboard'];

function setMeta(selector: string, create: () => HTMLElement, attr: string, value: string) {
  let el = document.querySelector(selector) as HTMLElement | null;
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
}

export const SeoHead: React.FC<SeoHeadProps> = ({ currentPage }) => {
  useEffect(() => {
    let title = 'BxStrength — UK Digital Coaching, Boxing, Strength & Fitness Platform';
    let description = 'BxStrength (BX) is the premier UK digital coaching platform for boxing, strength training, physiotherapy rehab, and 1-on-1 expert fitness coaching.';
    let keywords = 'BxStrength, Bx Strength, BX, Strength, fitness, training, boxing, coaches, coach, personal trainer, UK fitness';
    let canonical = `${SITE}/`;
    let noindex = false;

    if (currentPage === null) {
      // Unknown URL (404)
      title = 'Page not found | BxStrength';
      description = 'The page you are looking for does not exist.';
      noindex = true;
    } else {
      canonical = `${SITE}${PAGE_PATHS[currentPage]}`;
      noindex = NOINDEX_PAGES.includes(currentPage);

      switch (currentPage) {
        case 'about':
          title = 'About BxStrength — Premier UK Certified Boxing & Performance Masters';
          description = 'Learn about BxStrength, our UK certified master trainers, clinical physiotherapy standards, and 1,000+ global athlete transformations.';
          keywords = 'About BxStrength, Head Coach & Team, UK fitness coaches, boxing master, physiotherapy professional';
          break;
        case 'trainers':
          title = 'Meet BxStrength Head Coaches — Boxing, Strength & Physiotherapy Masters';
          description = 'Meet our Head Coach & Team (Diploma in Physiotherapy, IG Stadium Boxing) and senior specialists Sadeem & Moheeb Khan. View verified UK credentials.';
          keywords = 'BxStrength coaches, Head Coach & Team, Sadeem, Moheeb Khan, boxing coach, strength specialist';
          break;
        case 'services':
          title = 'Coaching Services & Programs — Boxing, Hypertrophy & Sports Rehab | BxStrength';
          description = 'Discover BxStrength specialized coaching programs: Boxing Technique & Fight Camp, Hypertrophy & Body Recomposition, Tactical Metabolic Blast, and Physical Rehab.';
          keywords = 'boxing services, strength programs, virtual fitness coaching, physiotherapy rehab, BxStrength services';
          break;
        case 'contact':
          title = 'Contact BxStrength — Book 15-Min Strategy Session & Expert Consultation';
          description = 'Get in touch with BxStrength lead coaches and advisory team. Schedule your 15-minute strategy call and receive your custom athletic roadmap.';
          keywords = 'contact BxStrength, book 15-min session, consultation call, UK fitness enquiry';
          break;
        default:
          break;
      }
    }

    document.title = title;

    setMeta('meta[name="description"]', () => Object.assign(document.createElement('meta'), { name: 'description' }), 'content', description);
    setMeta('meta[name="keywords"]', () => Object.assign(document.createElement('meta'), { name: 'keywords' }), 'content', keywords);
    setMeta('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }), 'href', canonical);

    const og = (property: string, value: string) =>
      setMeta(`meta[property="${property}"]`, () => {
        const m = document.createElement('meta');
        m.setAttribute('property', property);
        return m;
      }, 'content', value);
    og('og:title', title);
    og('og:description', description);
    og('og:url', canonical);

    // robots: add noindex for 404 and portal pages, remove it everywhere else
    const robots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      setMeta('meta[name="robots"]', () => Object.assign(document.createElement('meta'), { name: 'robots' }), 'content', 'noindex');
    } else if (robots) {
      robots.remove();
    }
  }, [currentPage]);

  return null;
};