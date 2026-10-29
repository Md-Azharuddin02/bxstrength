import React, { useEffect, useRef, useState } from 'react';

// Muted background video that downloads only when it nears the screen and pauses when it leaves,
// so videos far down the page don't cost visitors who never scroll to them.
export const LazyVideo: React.FC<{ src: string; className?: string }> = ({ src, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearScreen, setNearScreen] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!('IntersectionObserver' in window)) {
      setNearScreen(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearScreen(true);
        video.play().catch(() => {}); // autoplay can be refused (e.g. low-power mode); the poster frame stays
      } else {
        video.pause();
      }
    }, { rootMargin: '200px' });
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      src={nearScreen ? src : undefined}
      muted
      loop
      playsInline
      autoPlay
      preload="none"
      className={className}
    />
  );
};
