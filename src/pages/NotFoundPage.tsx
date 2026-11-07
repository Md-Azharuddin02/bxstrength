import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, ArrowRight, Dumbbell, Users, BookOpen, Mail } from 'lucide-react';

const quickLinks = [
  { to: '/services', label: 'Services', desc: 'Explore training plans', icon: Dumbbell },
  { to: '/coaches', label: 'Coaches', desc: 'Meet the team', icon: Users },
  { to: '/blog', label: 'Blog', desc: 'Tips & insights', icon: BookOpen },
  { to: '/contact', label: 'Contact', desc: 'Get in touch', icon: Mail },
];

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative bg-[#0a0a0a] min-h-[80vh] overflow-hidden flex items-center justify-center px-5 py-16 text-white">
      {/* Ambient lime glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[520px] rounded-full bg-[#CCFF00]/10 blur-[120px]"
      />

      <div className="relative w-full max-w-3xl text-center">
        <p className="text-[#CCFF00] text-[11px] sm:text-xs font-black uppercase tracking-[0.3em] mb-3">
          Error 404
        </p>

        {/* Oversized 404 with a soft lime echo behind it */}
        <div className="relative inline-block select-none leading-none">
          <span
            aria-hidden
            className="absolute inset-0 text-[24vw] sm:text-[180px] font-black tracking-tighter text-[#CCFF00]/10 blur-[2px]"
          >
            404
          </span>
          <h1 className="relative text-[24vw] sm:text-[180px] font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-zinc-600">
            404
          </h1>
        </div>

        <h2 className="mt-1 text-2xl sm:text-4xl font-black uppercase tracking-tight">
          This round <span className="text-[#CCFF00]">missed</span>
        </h2>
        <p className="mt-3 text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed">
          The page you&rsquo;re looking for ducked, dodged, or never existed.
          Let&rsquo;s get you back in the ring.
        </p>

        {/* Primary actions */}
        <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#CCFF00] hover:bg-[#b8e600] text-black text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-md"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-zinc-600 text-white text-xs font-black uppercase tracking-wider px-6 py-3.5 rounded-xl transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-4">
            Or jump to
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map(({ to, label, desc, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className="group bg-[#121215] border border-zinc-800 rounded-2xl p-4 text-left transition-all duration-300 hover:border-[#CCFF00]/40 hover:-translate-y-1 shadow-lg"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#CCFF00]/10 text-[#CCFF00] mb-3 transition-colors group-hover:bg-[#CCFF00]/20">
                  <Icon className="w-4 h-4" />
                </span>
                <p className="text-sm font-black uppercase tracking-wide text-white flex items-center gap-1">
                  {label}
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-600 transition-all group-hover:text-[#CCFF00] group-hover:translate-x-0.5" />
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
