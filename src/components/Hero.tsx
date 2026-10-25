import React, { useState, useEffect, useRef } from 'react';

interface HeroProps {
  onOpenBooking?: () => void;
  onOpenAssessment?: () => void;
}

export const Hero: React.FC<HeroProps> = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const images: string[] = [
    'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790509654/WhatsApp_Image_2026-09-27_at_5.09.18_PM.jpg?auto=format&q=80&w=2000',
    'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789572014/Hero_1.png?auto=format&q=80&w=2000',
    'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789572007/Hero_2.png?auto=format&q=80&w=2000',
    'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789572010/Hero_3.png?auto=format&q=80&w=2000',
    'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789572008/Hero_4.png?auto=format&q=80&w=2000',
    'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789401194/sl4.jpg?auto=format&q=80&w=2000',
  ];

  // Preload all slideshow images eagerly on mount to eliminate any loading flickering
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // Automatic slideshow timer - rotates slide every 4 seconds continuously
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused, images.length]);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  // Touch Swipe Handlers for Mobile Devices
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    if (distance > 50) {
      handleNext(); // Swiped left -> next slide
    } else if (distance < -50) {
      handlePrev(); // Swiped right -> prev slide
    }
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  return (
    <section 
      id="main-content" 
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[420px] sm:h-[540px] md:h-[640px] lg:h-[720px] bg-black overflow-hidden border-b border-zinc-800/80 font-sans select-none flex items-center justify-center shrink-0"
    >
      {/* Hidden H1 for SEO & Screen Reader Accessibility */}
      <h1 className="sr-only">
        BxStrength — UK &amp; India Digital Coaching, Boxing, Strength &amp; Fitness Platform
      </h1>

      {/* DYNAMIC RESPONSIVE AUTOMATIC SLIDESHOW IMAGES */}
      {images.map((imgUrl, idx) => {
        const isActive = idx === currentSlide;
        return (
          <div
            key={idx}
            className={`absolute inset-0 w-full h-full flex items-center justify-center transition-opacity duration-1000 ease-in-out pointer-events-none ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Soft Ambient Background Blur fill so there are no empty side gaps */}
            <img
              src={imgUrl}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-25 scale-105 pointer-events-none"
            />

            {/* Main Uncropped Image Display */}
            <div className="relative z-10 w-full h-full flex items-center justify-center px-4 sm:px-8 py-4 sm:py-6">
              <img
                src={imgUrl}
                alt={`BxStrength Training Slide ${idx + 1}`}
                title="BxStrength — Premier Digital Coaching, Boxing & Fitness"
                className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-2xl brightness-100 contrast-105 rounded-xl sm:rounded-2xl"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        );
      })}

      {/* Subtle Top & Bottom Gradient Overlay for Seamless Integration */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-black/30 pointer-events-none z-20" />

      {/* SLIDE INDICATOR BULLETS (BOTTOM BAR) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2.5">
        {images.map((_, idx) => {
          const isActive = idx === currentSlide;
          return (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                isActive
                  ? 'w-9 bg-[#CCFF00] shadow-[0_0_12px_#CCFF00]'
                  : 'w-2.5 bg-zinc-600 hover:bg-zinc-400'
              }`}
            />
          );
        })}
      </div>

    </section>
  );
};
