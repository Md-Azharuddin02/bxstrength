import React from 'react';
import { ViewPage } from '../types';
import { Mail, MapPin, ArrowRight, Instagram, Facebook, Youtube, X, Linkedin } from 'lucide-react';
import { cloudinaryImage } from '../utils/image';

interface FooterProps {
  onNavigate: (page: ViewPage) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (page: ViewPage) => {
    onNavigate(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#0a0a0a] text-zinc-400 pt-16 pb-8 border-t border-zinc-800 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Footer Grid - Balanced 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 pb-12 border-b border-zinc-800">
          
          {/* Column 1: BRAND ABOUT & DIRECT CONTACT */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img 
                src={cloudinaryImage("https://res.cloudinary.com/yuyxn5b0/image/upload/v1789566029/WhatsApp_Image_2026-09-08_at_10.50.41_AM.png", 480)} 
                alt="BxStrength Logo" 
                className="h-12 sm:h-14 md:h-16 w-auto max-w-[240px] object-contain rounded-lg shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                onClick={() => handleNav('home')}
              />
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed">
              BXStrength is a trading brand operated by 7Seas Exim, India. Live virtual fitness coaching available to clients across the United Kingdom.
            </p>

            <div className="space-y-3.5 text-xs pt-1">
              <p className="flex items-center gap-2.5 text-zinc-300">
                <MapPin className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>New Delhi, India.</span>
              </p>

              <p className="flex items-center gap-2.5 text-zinc-300">
                <Mail className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <a href="mailto:support@bxstrength.com" className="hover:text-[#CCFF00] transition-colors font-bold text-white">support@bxstrength.com</a>
              </p>
            </div>
          </div>

          {/* Column 2: PLATFORM NAVIGATION */}
          <div className="space-y-4">
            <h3 className="text-white text-xs font-black uppercase tracking-wider border-b border-zinc-800 pb-2">
              PLATFORM NAVIGATION
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => handleNav('home')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <ArrowRight className="w-3 h-3 text-zinc-500" /> Home
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('services')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <ArrowRight className="w-3 h-3 text-zinc-500" /> Service
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('about')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <ArrowRight className="w-3 h-3 text-zinc-500" /> About
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('trainers')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <ArrowRight className="w-3 h-3 text-zinc-500" /> Coaches
                </button>
              </li>
              
              {/* <li>
                <button onClick={() => handleNav('trainers')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <ArrowRight className="w-3 h-3 text-zinc-500" /> Coaching Roster
                </button>
              </li> */}

              <li>
                <button onClick={() => handleNav('blog')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <ArrowRight className="w-3 h-3 text-zinc-500" /> Blog
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('contact')} className="hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer">
                  <ArrowRight className="w-3 h-3 text-zinc-500" /> Contact Us
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: CONNECT & SOCIAL MEDIA */}
          <div className="space-y-4">
            <h3 className="text-white text-xs font-black uppercase tracking-wider border-b border-zinc-800 pb-2">
              CONNECT &amp; SOCIAL MEDIA
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Follow BxStrength for workout techniques, fight training highlights, macro tips, and real athlete transformations.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Instagram */}
              <a
                href="https://www.instagram.com/bxstrength_/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#18181b] hover:bg-zinc-800/90 border border-zinc-800 hover:border-[#CCFF00]/60 p-2.5 rounded-xl transition-all group overflow-hidden"
                title="Follow BxStrength on Instagram"
              >
                <div className="w-7 h-7 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-[#CCFF00] transition-colors truncate">Instagram</p>
                  {/*<p className="text-[10px] text-zinc-400 font-mono truncate">@bxstrength_</p>*/}
                </div>
              </a>

              {/* Facebook */}
              <a
                href="https://www.facebook.com/bxstrength"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#18181b] hover:bg-zinc-800/90 border border-zinc-800 hover:border-[#CCFF00]/60 p-2.5 rounded-xl transition-all group overflow-hidden"
                title="Follow BxStrength on Facebook"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Facebook className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-[#CCFF00] transition-colors truncate">Facebook</p>
                  {/*<p className="text-[10px] text-zinc-400 font-mono truncate">@bxstrength</p>*/}
                </div>
              </a>

              {/* YouTube */}
              <a
                href="https://youtube.com/@BXSTRENGTH"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#18181b] hover:bg-zinc-800/90 border border-zinc-800 hover:border-[#CCFF00]/60 p-2.5 rounded-xl transition-all group overflow-hidden"
                title="Subscribe to BxStrength on YouTube"
              >
                <div className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Youtube className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-[#CCFF00] transition-colors truncate">YouTube</p>
                  {/*<p className="text-[10px] text-zinc-400 font-mono truncate">@BXSTRENGTH</p>*/}
                </div>
              </a>

              {/* X (Twitter) */}
              <a
                href="https://www.x.com/Bxstrength_"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#18181b] hover:bg-zinc-800/90 border border-zinc-800 hover:border-[#CCFF00]/60 p-2.5 rounded-xl transition-all group overflow-hidden"
                title="Follow BxStrength on X (Twitter)"
              >
                <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                  <X className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-[#CCFF00] transition-colors truncate">X (Twitter)</p>
                  {/*<p className="text-[10px] text-zinc-400 font-mono truncate">@Bxstrength_</p>*/}
                </div>
              </a>

              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/bxstrength/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#18181b] hover:bg-zinc-800/90 border border-zinc-800 hover:border-[#CCFF00]/60 p-2.5 rounded-xl transition-all group overflow-hidden"
                title="Follow BxStrength on LinkedIn"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 group-hover:scale-110 transition-transform">
                  <Linkedin className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-[#CCFF00] transition-colors truncate">LinkedIn</p>
                  {/*<p className="text-[10px] text-zinc-400 font-mono truncate">/bxstrength</p>*/}
                </div>
              </a>

              {/* Pinterest */}
              <a
                href="https://www.pinterest.com/bxstrength/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 bg-[#18181b] hover:bg-zinc-800/90 border border-zinc-800 hover:border-[#CCFF00]/60 p-2.5 rounded-xl transition-all group overflow-hidden"
                title="Follow BxStrength on Pinterest"
              >
                <div className="w-7 h-7 rounded-lg bg-red-600/10 border border-red-600/30 flex items-center justify-center text-red-500 shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-[#CCFF00] transition-colors truncate">Pinterest</p>
                  {/*<p className="text-[10px] text-zinc-400 font-mono truncate">/bxstrength</p>*/}
                </div>
              </a>

              {/* Threads */}
              <a
                href="https://www.threads.net/@bxstrength_"
                target="_blank"
                rel="noopener noreferrer"
                className="col-span-2 flex items-center justify-center gap-2.5 bg-[#18181b] hover:bg-zinc-800/90 border border-zinc-800 hover:border-[#CCFF00]/60 p-2.5 rounded-xl transition-all group overflow-hidden"
                title="Follow BxStrength on Threads"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#CCFF00] shrink-0 group-hover:scale-110 transition-transform">
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                   <path d="M18.263 11.097c-.03-3.486-1.92-5.586-5.111-5.586-2.13 0-3.922.963-4.863 2.499l2.062 1.438c.535-.843 1.272-1.543 2.628-1.543 1.528 0 2.318.85 2.544 2.431a15 15 0 0 0-2.236-.173c-4.125 0-6.068 1.867-6.068 4.336s1.943 3.99 4.804 3.99c3.139 0 5.013-2.115 5.781-4.735.798.361 1.348 1.204 1.348 2.47 0 3.387-3.907 5.232-7.22 5.232-4.885 0-8.077-3.207-8.077-8.424 0-6.392 4.223-10.487 9.9-10.487 3.808 0 5.69 1.671 6.97 3.914l2.108-1.475C21.44 2.078 18.331 0 13.663 0 6.227 0 1.168 5.277 1.168 12.934c0 7 4.953 11.066 10.856 11.066 4.878 0 9.809-2.846 9.809-7.716 0-2.545-1.46-4.231-3.569-5.187m-6.33 4.855c-1.077 0-2.026-.512-2.026-1.453 0-1.483 1.822-1.934 3.606-1.934.678 0 1.34.045 1.927.173-.422 1.927-1.671 3.215-3.508 3.214Z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-[#CCFF00] transition-colors truncate">Threads</p>
                  {/*<p className="text-[10px] text-zinc-400 font-mono truncate">@bxstrength_</p>*/}
                </div>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p className="text-center sm:text-left">
            © 2026 BxStrength. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 text-xs">
            <button onClick={() => handleNav('terms')} className="hover:text-white transition-colors cursor-pointer">Terms</button>
            <span>•</span>
            <button onClick={() => handleNav('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy</button>
            <span>•</span>
            <button onClick={() => handleNav('onboarding_terms')} className="hover:text-[#CCFF00] text-zinc-300 font-bold transition-colors cursor-pointer">Onboarding &amp; Checkout Policies</button>
            <span>•</span>
            <span className="text-zinc-400">support@bxstrength.com</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
