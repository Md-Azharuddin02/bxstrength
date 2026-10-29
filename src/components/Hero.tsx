import React from 'react';

interface HeroProps {
  onOpenBooking?: () => void;
  onOpenAssessment?: () => void;
}

// Paste your Cloudinary video link here
const HERO_VIDEO_URL = 'https://res.cloudinary.com/nz0ptuar/video/upload/q_auto,f_auto/v1792846778/hero.mp4';


export const Hero: React.FC<HeroProps> = () => {
  return (
    <section
      id="main-content"
      className="relative w-full min-h-[420px] h-[83svh] bg-black overflow-hidden border-b border-zinc-800/80 font-sans select-none flex items-center justify-center shrink-0"
    >
      {/* Hidden H1 for SEO & Screen Reader Accessibility */}
      <h1 className="sr-only">
        BxStrength — UK Digital Coaching, Boxing, Strength &amp; Fitness Platform
      </h1>

      {/* Hero video clip */}
      <video
        src={HERO_VIDEO_URL}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Subtle Top & Bottom Gradient Overlay for Seamless Integration */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-black/30 pointer-events-none z-20" />
    </section>
  );
};
