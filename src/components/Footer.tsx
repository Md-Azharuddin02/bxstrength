import React from 'react';
import { ViewPage } from '../types';
import { Mail, MapPin, ArrowRight } from 'lucide-react';
import { cloudinaryImage } from '../utils/image';

interface FooterProps {
  onNavigate: (page: ViewPage) => void;
}

const svgIcon = (d: string) => ({ className = "" }: { className?: string }) => (
  <svg className={`${className} fill-current`} viewBox="0 0 24 24" aria-hidden="true"><path d={d} /></svg>
);
const FacebookIcon = svgIcon("M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z");
const YoutubeIcon = svgIcon("M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z");
const XIcon = svgIcon("M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z");
const LinkedinIcon = svgIcon("M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z");
const INSTAGRAM_PATH = "M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077";
const InstagramIcon = ({ className = "" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
    <linearGradient id="footer-ig" x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#FEDA75" />
      <stop offset="0.3" stopColor="#FA7E1E" />
      <stop offset="0.55" stopColor="#D62976" />
      <stop offset="0.8" stopColor="#962FBF" />
      <stop offset="1" stopColor="#4F5BD5" />
    </linearGradient>
    <path d={INSTAGRAM_PATH} fill="url(#footer-ig)" />
  </svg>
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
  { name: 'Instagram', href: 'https://www.instagram.com/bxstrength_/', Icon: InstagramIcon, tone: 'text-[#E4405F]' },
  { name: 'Facebook', href: 'https://www.facebook.com/bxstrength', Icon: FacebookIcon, tone: 'text-[#1877F2]' },
  { name: 'YouTube', href: 'https://youtube.com/@BXSTRENGTH', Icon: YoutubeIcon, tone: 'text-[#FF0000]' },
  { name: 'X (Twitter)', href: 'https://www.x.com/Bxstrength_', Icon: XIcon, tone: 'text-black' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/bxstrength/', Icon: LinkedinIcon, tone: 'text-[#0A66C2]' },
  { name: 'Pinterest', href: 'https://www.pinterest.com/bxstrength/', Icon: PinterestIcon, tone: 'text-[#E60023]' },
  { name: 'Threads', href: 'https://www.threads.net/@bxstrength_', Icon: ThreadsIcon, tone: 'text-black' },
  // TODO: confirm the real Telegram handle/channel link
  { name: 'Telegram', href: 'https://t.me/bxstrength', Icon: TelegramIcon, tone: 'text-[#26A5E4]' },
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
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#CCFF00]">
                      <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${tone}`} />
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
