import React, { useState, useEffect, useRef } from 'react';
import { Testimonial } from '../types';
import { VelocityAPI, getApiUrl, decodeHtmlEntities } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Star, Quote, ChevronLeft, ChevronRight, ChevronDown, Plus, X, CheckCircle2, 
  MessageSquarePlus, Trophy, ShieldCheck, Upload, Image as ImageIcon, 
  Trash2, AlertCircle, Maximize2 
} from 'lucide-react';

import { Skeleton } from './ui/Skeleton';

export const TestimonialsSection: React.FC = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Review Form States
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Photo Upload States (Strict 500KB Limit)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string | null>(null);
  const [photoFileSize, setPhotoFileSize] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [selectedZoomImage, setSelectedZoomImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRealReview = (r: Testimonial) => {
    if (!r || !r.name) return false;
    const lower = r.name.toLowerCase();
    return !lower.includes('test') && r.id !== 'rev-1' && r.id !== 'rev-2' && r.id !== 'rev-3' && r.id !== 't1' && r.id !== 't2' && r.id !== 't3';
  };

  const fetchReviews = async () => {
    try {
      const apiUrl = getApiUrl('/api/reviews');
      const res = await fetch(apiUrl);
      if (res.ok) {
        const serverReviews: Testimonial[] = await res.json();
        const seenIds = new Set<string>();
        const seenContent = new Set<string>();
        const unique: Testimonial[] = [];

        serverReviews.filter(isRealReview).forEach(item => {
          const cleanName = decodeHtmlEntities(item.name);
          const cleanRole = decodeHtmlEntities(item.role || 'BxStrength Athlete');
          const cleanComment = decodeHtmlEntities(item.comment);
          const contentKey = `${cleanName.toLowerCase().trim()}:::${cleanComment.trim()}`;
          if (!seenIds.has(item.id) && !seenContent.has(contentKey)) {
            seenIds.add(item.id);
            seenContent.add(contentKey);
            unique.push({
              ...item,
              name: cleanName,
              role: cleanRole,
              comment: cleanComment
            });
          }
        });
        setReviews(unique);
        localStorage.setItem('bxstrength_client_reviews', JSON.stringify(unique));
      } else {
        const localReviews = VelocityAPI.getReviews().filter(isRealReview);
        setReviews(localReviews);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      const localReviews = VelocityAPI.getReviews().filter(isRealReview);
      setReviews(localReviews);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleOpenModal = () => {
    if (user) {
      setName(user.name);
      setRole('BxStrength Executive Client');
    }
    handleRemovePhoto();
    setShowModal(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setPhotoError(null);
    if (!file) return;

    // Strict 500 KB Image Upload Limit (500 * 1024 = 512,000 bytes)
    const maxBytes = 500 * 1024;
    if (file.size > maxBytes) {
      const sizeKB = (file.size / 1024).toFixed(1);
      setPhotoError(`Selected image is ${sizeKB} KB, which exceeds the 500 KB limit. Please choose a smaller photo.`);
      setPhotoPreview(null);
      setPhotoFileName(null);
      setPhotoFileSize(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setPhotoFileName(file.name);
    setPhotoFileSize(Math.round(file.size / 1024));

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoFileName(null);
    setPhotoFileSize(null);
    setPhotoError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const touchStartX = useRef<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsExpanded(false);
  }, [currentIndex]);


  useEffect(() => {
    if (reviews.length <= 1 || showModal || isPaused || isExpanded) return;

    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 4000);

    return () => clearTimeout(timer);

  }, [currentIndex, reviews, showModal, isPaused, isExpanded]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!name.trim() || !comment.trim()) return;

    if (photoError) return;

    try {
      setIsSubmitting(true);
      const avatarUrl = photoPreview || user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;
      const reviewId = `rev-${Date.now()}`;

      // Save to Local Store for instant client availability
      VelocityAPI.addReview({
        id: reviewId,
        name: name.trim(),
        role: role.trim() || 'BxStrength Athlete',
        rating,
        comment: comment.trim(),
        avatar: avatarUrl
      });

      // Sync with Server DB
      try {
        const apiUrl = getApiUrl('/api/reviews');
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: reviewId,
            name: name.trim(),
            role: role.trim() || 'BxStrength Athlete',
            rating,
            comment: comment.trim(),
            avatar: avatarUrl
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Server review save error:', errorData.error);
        }
      } catch (netErr) {
        console.error('Network error saving review:', netErr);
      }

      await fetchReviews();
      setCurrentIndex(0);
      setShowModal(false);
      setName('');
      setRole('');
      setRating(5);
      setComment('');
      handleRemovePhoto();
      setToastMsg('Thank you! Your review has been saved and published live!');
      setTimeout(() => setToastMsg(null), 4500);
    } catch (err: any) {
      console.error('Failed to post review:', err);
      setPhotoError(err.message || 'Failed to post review. Please ensure your image is under 500 KB.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextTestimonial = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevTestimonial = () => {
    if (reviews.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const formatAvatarSrc = (avatar: string) => {
    if (avatar && avatar.includes('data:image')) {
      return avatar.replace(/&#x2F;/g, '/').replace(/&amp;/g, '&');
    }
    return avatar;
  };

  const current = reviews.length > 0 ? reviews[currentIndex] || reviews[0] : null;

  return (
    <section className="py-12 sm:py-20 bg-[#0a0a0a] text-white border-b border-zinc-800 relative font-sans overflow-hidden">
      
      {/* Dedicated Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-4 sm:right-6 z-50 max-w-[calc(100vw-2rem)] bg-[#18181b] border-l-4 border-emerald-500 text-white px-4 sm:px-5 py-3 sm:py-3.5 shadow-2xl rounded-r-lg flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wide truncate">{toastMsg}</span>
          <button onClick={() => setToastMsg(null)} className="ml-1 text-zinc-400 hover:text-white cursor-pointer shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 w-full">
        
        {/* Section Heading & Write Review CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4 sm:gap-6 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 shrink-0" />
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-[#CCFF00]">REAL ATHLETE FEEDBACK</span>
            </div>
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-white break-words">
              WHAT OUR CLIENTS SAY
            </h2>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-widest px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl transition-all cursor-pointer shadow-lg inline-flex items-center justify-center gap-2.5 shrink-0 w-full sm:w-auto active:scale-95"
          >
            <Plus className="w-4 h-4 text-black shrink-0" />
            <span>WRITE A CLIENT REVIEW</span>
          </button>
        </div>

        {/* Loading Skeleton */}
        {isLoading ? (
          <div className="max-w-4xl mx-auto bg-[#121214] border border-zinc-800 p-5 sm:p-12 relative shadow-2xl rounded-2xl space-y-4 w-full overflow-hidden">
            <Skeleton className="h-10 w-10 mx-auto rounded-full bg-zinc-800" />
            <Skeleton className="h-6 w-48 mx-auto bg-zinc-800" />
            <Skeleton className="h-20 w-full bg-zinc-800" />
            <Skeleton className="h-12 w-12 rounded-full mx-auto bg-zinc-800" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-8 sm:py-12 px-4 sm:px-6 bg-[#121214] border border-zinc-800 rounded-2xl space-y-3 w-full overflow-hidden">
            <MessageSquarePlus className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">No Client Reviews Published Yet</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Be the first member to share your transformation experience with photo! Click the button above to write a review.
            </p>
          </div>
        ) : current ? (
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={(e) => {
              touchStartX.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const diff = e.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(diff) > 50) {
                if (diff < 0) nextTestimonial();
                else prevTestimonial();
              }
              touchStartX.current = null;
            }}
            className="w-full max-w-6xl mx-auto"
          >
            {/* Stage: all cards share one grid cell, so the height fits the tallest card */}
            <div className="grid overflow-hidden py-4">
              {reviews.map((r, i) => {
                const n = reviews.length;
                const half = Math.floor(n / 2);
                const offset = ((i - currentIndex + n + half) % n) - half;
                const isActive = offset === 0;
                const isNear = Math.abs(offset) === 1;
                const avatar = formatAvatarSrc(r.avatar);

                return (
                  <div
                    key={r.id}
                    aria-hidden={!isActive}
                    onClick={() => {
                      if (offset === 1) nextTestimonial();
                      else if (offset === -1) prevTestimonial();
                    }}
                    className={`col-start-1 row-start-1 justify-self-center w-[78%] sm:w-[56%] lg:w-[50%] transition-all duration-700 ease-out ${
                      isActive
                        ? 'z-10 opacity-100 blur-0'
                        : isNear
                        ? 'z-0 opacity-60 blur-[1px] cursor-pointer select-none hover:opacity-80'
                        : 'z-0 opacity-0 pointer-events-none'
                    }`}
                    style={{
                      transform: `translateX(${offset * 82}%) scale(${isActive ? 1 : 0.9})`,
                    }}
                  >
                    <div
                      className={`h-full bg-[#121214] border p-5 sm:p-10 text-center rounded-2xl shadow-2xl transition-colors duration-700 ${
                        isActive ? 'border-zinc-700' : 'border-zinc-800'
                      }`}
                    >
                      <Quote className="w-8 h-8 sm:w-12 sm:h-12 text-zinc-700 mx-auto mb-2 sm:mb-3 opacity-50" />

                      {/* Star Rating */}
                      <div className="flex justify-center gap-1 sm:gap-1.5 text-amber-400 mb-2 sm:mb-4">
                        {[...Array(5)].map((_, s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 sm:w-5 sm:h-5 ${
                              s < r.rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 fill-zinc-800'
                            }`}
                          />
                        ))}
                      </div>

                      {/* Review comment with Read Full Review */}
                      <div className="my-3 sm:my-5 px-1 max-w-3xl mx-auto flex flex-col items-center min-h-[110px] sm:min-h-[130px] justify-center">
                        <div
                          className={`w-full text-center transition-all duration-300 ${
                            isActive && isExpanded
                              ? 'max-h-56 sm:max-h-64 overflow-y-auto pr-1'
                              : 'line-clamp-3 sm:line-clamp-4 overflow-hidden'
                          }`}
                        >
                          <p className="text-zinc-200 text-sm sm:text-base lg:text-lg font-medium leading-relaxed italic break-words">
                            "{r.comment}"
                          </p>
                        </div>

                        {isActive && r.comment && r.comment.length > 130 && (
                          <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mt-2.5 text-[11px] sm:text-xs font-bold font-mono uppercase tracking-wider text-[#CCFF00] hover:text-[#b8e600] inline-flex items-center gap-1.5 cursor-pointer bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 px-3 py-1 rounded-full transition-all shadow-sm active:scale-95"
                          >
                            <span>{isExpanded ? 'Read Less' : 'Read Full Review...'}</span>
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </div>

                      {/* Avatar, name, role */}
                      <div className="flex flex-col items-center justify-center gap-2.5 sm:gap-3 max-w-full px-2 mt-2">
                        <div
                          className="relative group cursor-pointer"
                          onClick={() => isActive && avatar && setSelectedZoomImage(avatar)}
                          title="Click to view full photo"
                        >
                          <img
                            src={avatar}
                            alt={r.name}
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-emerald-500 shadow-xl bg-zinc-900 group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                        <div className="max-w-full">
                          <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight flex flex-wrap items-center justify-center gap-1.5 break-words">
                            <span>{r.name}</span>
                            {avatar.includes('data:image') && (
                              <span className="text-[9px] font-mono bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                                PHOTO VERIFIED
                              </span>
                            )}
                          </h3>
                          <p className="text-[11px] sm:text-xs font-bold text-emerald-400 uppercase tracking-wider mt-0.5 break-words">
                            {r.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Arrows with counter */}
            {reviews.length > 1 && (
              <div className="mt-6 sm:mt-8 flex justify-center items-center gap-4 w-full">
                <button
                  onClick={prevTestimonial}
                  className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#CCFF00] text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-md"
                  aria-label="Previous Testimonial"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-xs font-mono font-bold text-zinc-400 tabular-nums min-w-[56px] text-center">
                  {currentIndex + 1} / {reviews.length}
                </span>
                <button
                  onClick={nextTestimonial}
                  className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 hover:border-[#CCFF00] text-white flex items-center justify-center transition-all cursor-pointer shrink-0 active:scale-95 shadow-md"
                  aria-label="Next Testimonial"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        ) : null}

      </div>

      {/* WRITE REVIEW MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-[#121214] text-white border border-zinc-800 shadow-2xl rounded-xl overflow-hidden font-sans max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="bg-[#18181b] p-5 flex items-center justify-between border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black uppercase text-white tracking-wider">WRITE A CLIENT REVIEW</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. David Vance"
                  className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white px-3.5 py-2.5 text-xs font-bold rounded-lg outline-none placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Member Role / Transformation Result (Optional)
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. Lost 10kg Body Fat & Gained Strength"
                  className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white px-3.5 py-2.5 text-xs font-bold rounded-lg outline-none placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-2">
                  Star Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-zinc-700 fill-zinc-900'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-mono font-bold text-amber-400 ml-2">
                    {rating} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Photo Upload Option with Strict 500KB Limit */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5 flex items-center justify-between">
                  <span>Customer Photo / Result (Optional)</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                    MAX 500 KB
                  </span>
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handlePhotoChange}
                  className="hidden"
                />

                {photoPreview ? (
                  <div className="relative bg-[#18181b] border border-emerald-500/50 rounded-xl p-3 flex items-center gap-3">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="w-14 h-14 rounded-lg object-cover border border-zinc-700 bg-zinc-900 shadow-md"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{photoFileName || 'Uploaded Photo'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-900/40 px-1.5 py-0.5 rounded border border-emerald-700/50">
                          {photoFileSize} KB / 500 KB max
                        </span>
                        <span className="text-[10px] text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Size OK
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-1.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800/60 text-red-300 rounded-lg transition-colors cursor-pointer"
                      title="Remove photo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-zinc-700 hover:border-emerald-500 bg-[#18181b] hover:bg-zinc-900/80 p-4 rounded-xl text-center cursor-pointer transition-all group"
                  >
                    <div className="flex flex-col items-center justify-center gap-1.5">
                      <div className="w-9 h-9 rounded-full bg-zinc-800 group-hover:bg-emerald-950/80 group-hover:border group-hover:border-emerald-500/40 flex items-center justify-center transition-colors">
                        <Upload className="w-4 h-4 text-zinc-400 group-hover:text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold text-zinc-300 group-hover:text-white uppercase tracking-wider">
                        Click to upload customer photo
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        PNG, JPG, WEBP • Strict limit: max 500 KB
                      </span>
                    </div>
                  </div>
                )}

                {photoError && (
                  <div className="mt-2 p-2.5 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="font-semibold">{photoError}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Your Review & Feedback *
                </label>
                <textarea
                  required
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your transformation experience, coaching quality, and facility feedback..."
                  className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white p-3 text-xs font-medium rounded-lg outline-none placeholder-zinc-500 resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-zinc-700 text-zinc-400 hover:text-white text-xs font-bold uppercase rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !!photoError}
                  className="px-6 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-black tracking-wider uppercase rounded-lg transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  {isSubmitting ? 'PUBLISHING...' : 'PUBLISH REVIEW LIVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULLSCREEN IMAGE ZOOM MODAL */}
      {selectedZoomImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedZoomImage(null)}
        >
          <div 
            className="relative max-w-2xl max-h-[85vh] bg-[#121214] border border-zinc-800 p-2 rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedZoomImage(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedZoomImage}
              alt="Customer Review Photo"
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </section>
  );
};