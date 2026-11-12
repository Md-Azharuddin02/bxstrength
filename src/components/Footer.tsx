import React from 'react';
import { ViewPage } from '../types';
import { Mail, MapPin, ArrowRight, Instagram, Facebook, Youtube, X, Linkedin } from 'lucide-react';
import { cloudinaryImage } from '../utils/image';

interface FooterProps {
  onNavigate: (page: ViewPage) => void;
}

const svgIcon = (d: string) => () => (
  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
);
const PinterestIcon = svgIcon("M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z");
const TelegramIcon = svgIcon("M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z");
const ThreadsIcon = svgIcon("M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z");

const NAV_LINKS: { label: string; page: ViewPage }[] = [
  { label: 'Home', page: 'home' },
  { label: 'Service', page: 'services' },
  { label: 'About', page: 'about' },
  { label: 'Coaches', page: 'trainers' },
  { label: 'Blog', page: 'blog' },
  { label: 'Contact Us', page: 'contact' },
];

const SOCIALS = [
  { name: 'Instagram', href: 'https://www.instagram.com/bxstrength_/', Icon: Instagram, tone: 'text-pink-400 border-pink-500/30 bg-pink-500/10' },
  { name: 'Facebook', href: 'https://www.facebook.com/bxstrength', Icon: Facebook, tone: 'text-blue-400 border-blue-500/30 bg-blue-500/10' },
  { name: 'YouTube', href: 'https://youtube.com/@BXSTRENGTH', Icon: Youtube, tone: 'text-red-400 border-red-500/30 bg-red-500/10' },
  { name: 'X (Twitter)', href: 'https://www.x.com/Bxstrength_', Icon: X, tone: 'text-white border-zinc-700 bg-zinc-800' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/bxstrength/', Icon: Linkedin, tone: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  { name: 'Pinterest', href: 'https://www.pinterest.com/bxstrength/', Icon: PinterestIcon, tone: 'text-red-500 border-red-600/30 bg-red-600/10' },
  { name: 'Threads', href: 'https://www.threads.net/@bxstrength_', Icon: ThreadsIcon, tone: 'text-[#CCFF00] border-emerald-500/30 bg-emerald-500/10' },
  // TODO: confirm the real Telegram handle/channel link
  { name: 'Telegram', href: 'https://t.me/bxstrength', Icon: TelegramIcon, tone: 'text-sky-400 border-sky-400/30 bg-sky-400/10' },
];

const HEADING = 'text-white text-sm font-black uppercase tracking-wider pb-3 mb-5 border-b border-zinc-800';
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/70 rounded';

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (page: ViewPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0a0a0a] text-zinc-400 pt-16 pb-8 border-t border-zinc-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-x-12 gap-y-10 pb-12 border-b border-zinc-800">

          {/* Brand & contact */}
          <section className="lg:col-span-5" aria-labelledby="footer-about">
            <h3 id="footer-about" className={HEADING}>Who we are</h3>
            <img
              src={cloudinaryImage("https://res.cloudinary.com/yuyxn5b0/image/upload/v1789566029/WhatsApp_Image_2026-09-08_at_10.50.41_AM.png", 480)}
              alt="BxStrength Logo"
              className="h-12 w-auto max-w-[220px] object-contain mb-5 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => handleNav('home')}
            />
            <p className="text-sm text-zinc-400 leading-relaxed max-w-md mb-6">
              BXStrength is a trading brand operated by 7Seas Exim, India. Live virtual fitness coaching available to clients across the United Kingdom.
            </p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3 text-zinc-300">
                <MapPin className="w-4 h-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
                <span>New Delhi, India</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#CCFF00] shrink-0" aria-hidden="true" />
                <a href="mailto:support@bxstrength.com" className={`font-bold text-white hover:text-[#CCFF00] transition-colors ${FOCUS}`}>support@bxstrength.com</a>
              </li>
            </ul>
          </section>

          {/* Navigation */}
          <nav className="lg:col-span-3" aria-labelledby="footer-nav">
            <h3 id="footer-nav" className={HEADING}>Platform navigation</h3>
            <ul className="space-y-1 text-sm">
              {NAV_LINKS.map(({ label, page }) => (
                <li key={label}>
                  <button onClick={() => handleNav(page)} className={`group flex items-center gap-2 py-1.5 hover:text-white transition-colors cursor-pointer ${FOCUS}`}>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#CCFF00] group-hover:translate-x-0.5 transition-all" aria-hidden="true" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Social */}
          <section className="md:col-span-2 lg:col-span-4" aria-labelledby="footer-social">
            <h3 id="footer-social" className={HEADING}>Connect &amp; social media</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-5">
              Follow BxStrength for workout techniques, fight training highlights, macro tips, and real athlete transformations.
            </p>
            <ul className="grid grid-cols-4 gap-3 max-w-sm">
              {SOCIALS.map(({ name, href, Icon, tone }) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow BxStrength on ${name}`}
                    title={name}
                    className={`flex items-center justify-center w-full h-12 rounded-xl border border-zinc-800 bg-[#18181b] hover:border-[#CCFF00]/60 hover:-translate-y-0.5 transition-all group ${FOCUS}`}
                  >
                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg border ${tone}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-center md:text-left">&copy; 2026 BxStrength. All rights reserved.</p>
          <nav aria-label="Legal">
            <ul className="flex flex-wrap items-center justify-center md:justify-end gap-x-6 gap-y-2">
              <li><button onClick={() => handleNav('terms')} className={`hover:text-white transition-colors cursor-pointer ${FOCUS}`}>Terms</button></li>
              <li><button onClick={() => handleNav('privacy')} className={`hover:text-white transition-colors cursor-pointer ${FOCUS}`}>Privacy</button></li>
              <li><button onClick={() => handleNav('onboarding_terms')} className={`text-zinc-200 font-bold hover:text-[#CCFF00] transition-colors cursor-pointer ${FOCUS}`}>Onboarding &amp; Checkout Policies</button></li>
            </ul>
          </nav>
        </div>

      </div>
    </footer>
  );
};
