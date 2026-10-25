import React, { useState, useEffect, useCallback, FC, FormEvent, ChangeEvent } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../services/api';
import { X, Mail, CheckCircle2, ArrowRight, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin: () => void;
}

export const ForgotPasswordModal: FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onOpenLogin
}) => {
  const { resetPassword } = useAuth();

  const [step, setStep] = useState<'request' | 'email_dispatched' | 'set_new_password' | 'success'>('request');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetTokenFromUrl, setResetTokenFromUrl] = useState<string>('');

  const handleCloseAll = useCallback(() => {
    setStep('request');
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseAll();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const urlStr = window.location.href;
    if (urlStr.includes('reset-password') || urlStr.includes('token=')) {
      // The reset link carries its params in the hash: #reset-password?email=..&token=..
      const afterHash = window.location.hash + window.location.search;
      const q = afterHash.indexOf('?');
      const params = new URLSearchParams(q >= 0 ? afterHash.slice(q + 1) : '');
      const urlEmail = params.get('email');
      const token = params.get('token');
      if (urlEmail) setEmail(urlEmail);
      if (token) setResetTokenFromUrl(token);
      setStep('set_new_password');
    }

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleCloseAll]);

  if (!isOpen) return null;

  const handleRequestSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    try {
      setErrorMsg(null);
      setLoading(true);

      // Call backend Express Server API to generate token & send email via Brevo API v3
      const res = await fetch(getApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch password reset email via Brevo API.');
      }

      setStep('email_dispatched');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to dispatch reset link email.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setErrorMsg('Please enter your new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    try {
      setErrorMsg(null);
      setLoading(true);
      
      // Call backend API endpoint to update password in database
      const res = await fetch(getApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, token: resetTokenFromUrl })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Password reset failed on server.');
      }

      // Call AuthContext to sync client-side state
      await resetPassword(email, newPassword).catch(() => {});

      setStep('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Password update failed.';
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-lg bg-[#121214] text-white border-0 sm:border border-zinc-800 shadow-2xl rounded-none sm:rounded-xl overflow-hidden font-sans flex flex-col">
        
        {/* Top Branding Header */}
        <div className="bg-[#18181b] p-5 flex items-center justify-between border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center p-1 bg-[#0a0a0c] border border-zinc-800 rounded-lg shadow-sm">
              <img 
                src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1789566029/WhatsApp_Image_2026-09-08_at_10.50.41_AM.png" 
                alt="BxStrength Logo" 
                className="h-9 w-auto max-w-[150px] object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                }}
              />
              <div className="logo-fallback hidden items-center gap-1 px-2 py-0.5 font-black text-sm text-white tracking-tighter uppercase">
                <span>BX<span className="text-[#CCFF00]">STRENGTH</span></span>
              </div>
            </div>
            <div className="border-l border-zinc-700 pl-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">ACCOUNT RECOVERY</h3>
              <p className="text-[10px] text-zinc-400">Password Reset Service</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseAll}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close recovery modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8 space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-red-950/60 border border-red-800 text-red-300 text-xs font-bold rounded-lg flex items-center gap-2">
              <Lock className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: REQUEST EMAIL */}
          {step === 'request' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                  RESET YOUR PASSWORD
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enter your registered account email address. We'll send you a secure link to reset your password.
                </p>
              </div>

              <div>
                <label htmlFor="recovery-email" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Registered Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="recovery-email"
                    type="email"
                    value={email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    placeholder="e.g. user@gmail.com"
                    className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white pl-10 pr-4 py-2.5 text-xs font-bold rounded-lg outline-none placeholder-zinc-500"
                    required
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-widest py-3 uppercase transition-all rounded-lg cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <span>SENDING RESET LINK...</span>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 text-black" />
                      <span>SEND RESET LINK</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleCloseAll();
                    onOpenLogin();
                  }}
                  className="w-full text-center text-xs font-bold text-zinc-400 hover:text-white py-2 uppercase transition-colors cursor-pointer"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: CLEAN EMAIL DISPATCHED CONFIRMATION */}
          {step === 'email_dispatched' && (
            <div className="space-y-6 text-center py-2 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                <Mail className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-black uppercase tracking-tight text-white">
                  CHECK YOUR INBOX
                </h2>
                <p className="text-xs text-zinc-300 max-w-sm mx-auto leading-relaxed">
                  We've sent a password reset email to <strong className="text-white font-mono">{email}</strong>. Please check your inbox and click the reset link to choose a new password.
                </p>
              </div>

              <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-4 text-left space-y-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px] uppercase tracking-wider">
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  For your security, the reset link will expire in <strong>10 minutes</strong>. If you don't see the email within a minute, please check your spam or junk folder.
                </p>
              </div>

              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseAll();
                    onOpenLogin();
                  }}
                  className="w-full bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-widest py-3 uppercase transition-all rounded-lg cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <span>RETURN TO SIGN IN</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer uppercase"
                >
                  Didn't get an email? Resend
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SET NEW PASSWORD */}
          {step === 'set_new_password' && (
            <form onSubmit={handleResetSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-400 tracking-wider bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded inline-block mb-2">
                  🔒 SECURE RESET SESSION ACTIVE
                </span>
                <h2 className="text-xl font-black uppercase tracking-tight text-white mb-1">
                  CREATE NEW PASSWORD
                </h2>
                <p className="text-xs text-zinc-400">
                  Account: <strong className="text-white font-mono">{email || 'Verified BxStrength Member'}</strong>
                </p>
              </div>

              <div>
                <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white pl-10 pr-10 py-2.5 text-xs font-bold rounded-lg outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-zinc-300 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full bg-[#18181b] border border-zinc-800 focus:border-zinc-600 text-white pl-10 pr-10 py-2.5 text-xs font-bold rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-widest py-3 uppercase transition-all rounded-lg cursor-pointer flex items-center justify-center gap-2 shadow-md"
                >
                  {loading ? (
                    <span>UPDATING PASSWORD...</span>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>RESET PASSWORD & SIGN IN</span>
                    </>
                  )}
                </button>

                {errorMsg && (
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg(null);
                      setStep('request');
                    }}
                    className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold py-2.5 rounded-lg uppercase transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>Request New Reset Link</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* STEP 4: SUCCESS CONFIRMATION */}
          {step === 'success' && (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase text-white tracking-tight">PASSWORD UPDATED SUCCESSFULLY!</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                  Your new password is now active for <strong className="text-white">{email}</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleCloseAll();
                  onOpenLogin();
                }}
                className="bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-widest py-3 px-8 uppercase transition-all rounded-lg cursor-pointer shadow-md inline-flex items-center gap-2"
              >
                <span>SIGN IN WITH NEW PASSWORD</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

