// Cloudinary only resizes/converts when the transformation is in the path; the Unsplash-style
// `?auto=format&w=800` query on our URLs is ignored, so the full original (up to ~2 MB) was sent.
export const cloudinaryImage = (url: string, width: number): string => {
  if (!url.includes('res.cloudinary.com') || !url.includes('/image/upload/')) return url;
  const [base] = url.split('?');
  return base.replace('/image/upload/', `/image/upload/f_auto,q_auto,c_limit,w_${width}/`);
};

const RESIZE_SEGMENT = /\/image\/upload\/f_auto,q_auto,c_limit,w_\d+\//;

export const originalFromResized = (url: string): string | null =>
  RESIZE_SEGMENT.test(url) ? url.replace(RESIZE_SEGMENT, '/image/upload/') : null;

// Cloudinary can briefly 404 while it first generates a resized copy; fall back to the original
// so a visitor never sees a broken image. Image errors don't bubble, hence the capture listener.
export const installResizedImageFallback = (): void => {
  window.addEventListener('error', (event) => {
    const img = event.target;
    if (!(img instanceof HTMLImageElement)) return;
    const original = originalFromResized(img.currentSrc || img.src);
    if (original) img.src = original;
  }, true);
};
