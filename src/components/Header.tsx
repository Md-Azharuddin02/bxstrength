import React, { useState, useEffect } from 'react';
import { ViewPage } from '../types';
import { useAuth } from '../context/AuthContext';
import { Dumbbell, Menu, X, Calendar, Phone, Search, LogIn, UserPlus, LayoutDashboard } from 'lucide-react';
import { normalizeRole } from '../routes/RequireRole';
interface HeaderProps {
  currentPage: ViewPage | null;
  onNavigate: (page: ViewPage) => void;
  onOpenBooking: () => void;
  onOpenAssessment: () => void;
  onOpenSearch: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

const SERVICES_SECTION_ID = 'services-section';

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onNavigate,
  onOpenBooking,
  onOpenAssessment,
  onOpenSearch,
  onOpenLogin,
  onOpenRegister
}) => {
  const { user, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [servicesActive, setServicesActive] = useState(false);

  useEffect(() => {
    if (currentPage !== 'home') setServicesActive(false);
  }, [currentPage]);

  useEffect(() => {
    let ticking = false;

    const updateScrollProgress = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const currentScroll = window.scrollY;
      if (totalHeight > 0) {
        setScrollProgress(Math.min(Math.max(currentScroll / totalHeight, 0), 1));
      } else {
        setScrollProgress(0);
      }

      if (currentScroll > 40) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollProgress);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateScrollProgress();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems: { label: string; page: ViewPage }[] = [
    { label: 'HOME', page: 'home' },
    { label: 'ABOUT', page: 'about' },
    { label: 'SERVICES', page: 'home' },
    { label: 'COACHES', page: 'trainers' },
    { label: 'BLOG', page: 'blog' },
    { label: 'CONTACT', page: 'contact' },
  ];

  const handleNav = (page: ViewPage, targetElementId?: string) => {
    setServicesActive(targetElementId === SERVICES_SECTION_ID);
    onNavigate(page);
    setMobileMenuOpen(false);
    if (targetElementId) {
      setTimeout(() => {
        const elem = document.getElementById(targetElementId);
        if (elem) elem.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getRoleBadgeLabel = (): string => {
    switch (normalizeRole(user?.role)) {
      case 'customersupport':
      case 'support':   return 'CUSTOMER SUPPORT PORTAL';
      case 'admin':     return 'ADMIN PORTAL';
      case 'headcoach': return 'HEAD COACH PORTAL';
      case 'coach':     return 'COACH PORTAL';
      default:          return 'CLIENT PORTAL';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a] transition-all duration-300">
      {/* Precision UK Executive Scroll Hairline */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-zinc-950/80 z-[100] pointer-events-none overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-300 shadow-[0_0_8px_rgba(16,185,129,0.7)] transition-transform duration-75 ease-out will-change-transform"
          style={{
            transform: `scaleX(${scrollProgress})`,
            transformOrigin: 'left'
          }}
        />
      </div>

      {/* 1. TOP ANNOUNCEMENT & CONTACT BAR */}
      <div className="hidden md:block bg-[#121214] text-zinc-400 text-xs py-1.5 px-6 border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            {/* <span className="text-[#CCFF00] font-black uppercase text-[11px] tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#CCFF00] animate-pulse" />
              UK &amp; INDIA DIGITAL PERFORMANCE &amp; BOXING PLATFORM
            </span> */}
          </div>

          <div className="flex items-center gap-4 text-xs">
            {isAuthenticated ? (
              <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                <span>Welcome,</span>
                <strong className="text-white uppercase font-black">{user?.name}</strong>
              </span>
            ) : (
              <div className="flex items-center gap-3 text-zinc-300 font-bold uppercase">
                <button
                  onClick={onOpenLogin}
                  className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-zinc-400" /> Sign In
                </button>
                <span className="text-zinc-700">|</span>
                <button
                  onClick={onOpenRegister}
                  className="text-white hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" /> Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER BRAND & ACTION BAR */}
      <div className={`transition-all duration-300 border-b border-zinc-800 ${scrolled ? 'py-2.5 bg-[#0a0a0a]/95 backdrop-blur-md' : 'py-4'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <button 
            onClick={() => handleNav('home')} 
            className="flex items-center gap-3 group text-left focus:outline-none cursor-pointer"
            id="brand-logo"
            aria-label="BxStrength Home"
          >
            <img 
              src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1789566029/WhatsApp_Image_2026-09-08_at_10.50.41_AM.png" 
              alt="BxStrength Logo" 
              className="h-10 sm:h-14 md:h-16 lg:h-18 w-auto max-w-[220px] sm:max-w-[280px] md:max-w-[340px] object-contain rounded-lg shadow-lg group-hover:opacity-90 transition-all"
            />
          </button>

          {/* Primary Action Suite */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={onOpenSearch}
              className="bg-[#141416] hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs tracking-wider px-3.5 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              title="Search BxStrength Health & Symptom Database"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span className="hidden md:inline text-xs font-bold uppercase tracking-wider text-zinc-300">SEARCH</span>
            </button>

            <button
              onClick={onOpenBooking}
              className="bg-white hover:bg-zinc-200 text-black font-black text-xs tracking-wider uppercase px-5 py-2.5 rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              BOOK FREE CONSULTATION
            </button>

            {isAuthenticated && user ? (
              <button
                onClick={() => handleNav('dashboard')}
                className="bg-[#18181b] hover:bg-zinc-800 text-white rounded-lg transition-all ml-1 border border-zinc-700/80 px-3 py-1.5 flex items-center gap-2.5 cursor-pointer shadow-sm group"
                title={`Logged in as ${user.name} - Open ${getRoleBadgeLabel()}`}
              >
                <img
                  src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover border border-zinc-600 group-hover:border-white transition-colors"
                />
                <div className="text-left flex flex-col">
                  <span className="text-xs font-black uppercase text-white tracking-wide truncate max-w-[130px] leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                    {getRoleBadgeLabel()}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="text-zinc-300 hover:text-white font-bold text-xs tracking-wider uppercase px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80 ml-1"
                title="Sign In to Account"
              >
                <LogIn className="w-4 h-4" />
                <span>SIGN IN</span>
              </button>
            )}
          </div>

          {/* Mobile menu toggle & quick actions */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={onOpenSearch}
              className="p-2 text-emerald-400 hover:text-white bg-[#141416] border border-zinc-800 rounded-lg cursor-pointer flex items-center justify-center"
              aria-label="Search Platform"
              title="Search"
            >
              <Search className="w-4 h-4" />
            </button>

            {isAuthenticated ? (
              <button
                onClick={() => handleNav('dashboard')}
                className="bg-[#18181b] text-white p-1.5 rounded-lg border border-zinc-700 flex items-center gap-1.5 cursor-pointer"
                title="Open Dashboard"
              >
                <img
                  src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || '')}`}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="bg-[#18181b] border border-zinc-700 text-white text-[11px] font-bold px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer uppercase shadow-sm active:scale-95"
                title="Sign In"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>LOGIN</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-zinc-300 hover:text-white focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. DEDICATED SUB-NAVBAR FOR SPACED & UNCLUTTERED LINKS */}
      {/*<div className="hidden lg:block bg-[#121214]/90 backdrop-blur-sm border-b border-zinc-800/80 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center gap-8">
            {navItems.map((item) => {
              const isActive =item.label === 'SERVICES' && currentPage === item.page;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.label === 'SERVICES') {
                      handleNav('home', 'services-section');
                    } else {
                      handleNav(item.page);
                    }
                  }}
                  className={`text-xs font-black tracking-widest uppercase transition-all px-3 py-1.5 rounded-md cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>*/}
      <div className="hidden lg:block bg-[#121214]/90 backdrop-blur-sm border-b border-zinc-800/80 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center gap-8">
            {navItems.map((item) => {
              const isActive =
                item.label === 'SERVICES'
                  ? currentPage === 'home' && servicesActive
                  : item.label === 'HOME'
                  ? currentPage === 'home' && !servicesActive
                  : currentPage === item.page;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.label === 'SERVICES') {
                      handleNav('home', SERVICES_SECTION_ID);
                    } else {
                      handleNav(item.page);
                    }
                  }}
                  className={`text-xs font-black tracking-widest uppercase transition-colors duration-200 px-3 py-1.5 rounded-md cursor-pointer flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-zinc-800 text-white shadow-sm border-zinc-700'
                      : 'text-zinc-400 border-transparent hover:text-white hover:bg-zinc-800/50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
      

      {/* 4. MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#121214] border-b border-zinc-800 px-6 py-6 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => {
              {/*<button
                key={item.label}
                onClick={() => {
                  if (item.label === 'SERVICES') {
                    handleNav('home', 'services-section');
                  } else {
                    handleNav(item.page);
                  }
                }}
                className={`text-left text-xs font-black tracking-widest py-2.5 uppercase border-b border-zinc-800 flex items-center justify-between ${
                  currentPage === item.page ? 'text-white' : 'text-zinc-400'
                }`}
              >
                <span>{item.label}</span>
              </button>
            ))}*/}
              const isActive =
                item.label === 'SERVICES'
                  ? currentPage === 'home' && servicesActive
                  : item.label === 'HOME'
                  ? currentPage === 'home' && !servicesActive
                  : currentPage === item.page;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    if (item.label === 'SERVICES') {
                      handleNav('home', SERVICES_SECTION_ID);
                    } else {
                      handleNav(item.page);
                    }
                  }}
                  className={`text-left text-xs font-black tracking-widest py-2.5 uppercase border-b border-zinc-800 flex items-center justify-between ${
                    isActive ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  <span>{item.label}</span>
                </button>
              );
            })}


            <div className="pt-4 flex flex-col gap-2.5">
              {isAuthenticated && user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleNav('dashboard');
                  }}
                  className="w-full bg-[#18181b] border border-zinc-700 text-white p-3 rounded-lg flex items-center justify-between cursor-pointer mb-1"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover border border-zinc-600"
                    />
                    <div className="text-left">
                      <span className="text-xs font-black uppercase text-white block">{user.name}</span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase">{getRoleBadgeLabel()}</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 uppercase">OPEN →</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2 mb-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="bg-[#18181b] border border-zinc-700 text-white text-xs font-bold tracking-wider py-3 rounded-lg uppercase flex items-center justify-center gap-1.5 shadow-sm active:bg-zinc-800"
                  >
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    <span>SIGN IN</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenRegister();
                    }}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs tracking-wider py-3 rounded-lg uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-[0.99]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>SIGN UP</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenBooking();
                }}
                className="w-full bg-white text-black text-xs font-black tracking-widest py-3 rounded-lg uppercase text-center flex items-center justify-center gap-2 shadow-md"
              >
                <Calendar className="w-4 h-4" /> BOOK FREE CONSULTATION
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};



