import React from "react";
import { Check, ShieldCheck, UserCheck, Video, Zap } from "lucide-react";

interface DisclosuresSectionProps {
  ageConfirmed: boolean;
  setAgeConfirmed: (v: boolean) => void;
  virtualCoachingConfirmed: boolean;
  setVirtualCoachingConfirmed: (v: boolean) => void;
  healthConfirmed: boolean;
  setHealthConfirmed: (v: boolean) => void;
  spaceConfirmed: boolean;
  setSpaceConfirmed: (v: boolean) => void;
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  marketingConsent: boolean;
  setMarketingConsent: (v: boolean) => void;
}

export const DisclosuresSection: React.FC<DisclosuresSectionProps> = ({
  ageConfirmed,
  setAgeConfirmed,
  virtualCoachingConfirmed,
  setVirtualCoachingConfirmed,
  healthConfirmed,
  setHealthConfirmed,
  spaceConfirmed,
  setSpaceConfirmed,
  termsAccepted,
  setTermsAccepted,
  marketingConsent,
  setMarketingConsent,
}) => {
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-white">
          HEALTH &amp; TRAINING DISCLOSURES
        </h4>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#CCFF00]">
          Required To Proceed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
        {/* 1. 18+ CONFIRMATION */}
        <div
          role="checkbox"
          aria-checked={ageConfirmed}
          tabIndex={0}
          onClick={() => setAgeConfirmed(!ageConfirmed)}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              setAgeConfirmed(!ageConfirmed);
            }
          }}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
            ageConfirmed
              ? "bg-[#12141c] border-[#CCFF00]/40 shadow-sm"
              : "bg-[#0f1015] border-zinc-800/80 opacity-75"
          }`}
        >
          <div
            className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
              ageConfirmed
                ? "bg-[#CCFF00] text-black shadow-xs"
                : "border border-zinc-700 bg-zinc-900"
            }`}
          >
            {ageConfirmed && (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              <UserCheck className="w-4 h-4 text-[#CCFF00] shrink-0" />
              <span>18+ CONFIRMATION</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              I confirm I am 18 years of age or older.
            </p>
          </div>
        </div>

        {/* 2. VIRTUAL COACHING */}
        <div
          role="checkbox"
          aria-checked={virtualCoachingConfirmed}
          tabIndex={0}
          onClick={() =>
            setVirtualCoachingConfirmed(!virtualCoachingConfirmed)
          }
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              setVirtualCoachingConfirmed(!virtualCoachingConfirmed);
            }
          }}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
            virtualCoachingConfirmed
              ? "bg-[#12141c] border-[#CCFF00]/40 shadow-sm"
              : "bg-[#0f1015] border-zinc-800/80 opacity-75"
          }`}
        >
          <div
            className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
              virtualCoachingConfirmed
                ? "bg-[#CCFF00] text-black shadow-xs"
                : "border border-zinc-700 bg-zinc-900"
            }`}
          >
            {virtualCoachingConfirmed && (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              <Video className="w-4 h-4 text-[#CCFF00] shrink-0" />
              <span>VIRTUAL SESSIONS</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              Live interactive sessions with expert UK trainers at home.
            </p>
          </div>
        </div>

        {/* 3. HEALTH DISCLOSURE */}
        <div
          role="checkbox"
          aria-checked={healthConfirmed}
          tabIndex={0}
          onClick={() => setHealthConfirmed(!healthConfirmed)}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              setHealthConfirmed(!healthConfirmed);
            }
          }}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
            healthConfirmed
              ? "bg-[#12141c] border-[#CCFF00]/40 shadow-sm"
              : "bg-[#0f1015] border-zinc-800/80 opacity-75"
          }`}
        >
          <div
            className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
              healthConfirmed
                ? "bg-[#CCFF00] text-black shadow-xs"
                : "border border-zinc-700 bg-zinc-900"
            }`}
          >
            {healthConfirmed && (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              <ShieldCheck className="w-4 h-4 text-[#CCFF00] shrink-0" />
              <span>HEALTH DISCLOSURE</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              I confirm there are no medical conditions preventing
              participation.
            </p>
          </div>
        </div>

        {/* 4. SAFE TRAINING SPACE */}
        <div
          role="checkbox"
          aria-checked={spaceConfirmed}
          tabIndex={0}
          onClick={() => setSpaceConfirmed(!spaceConfirmed)}
          onKeyDown={(event) => {
            if (event.key === " " || event.key === "Enter") {
              event.preventDefault();
              setSpaceConfirmed(!spaceConfirmed);
            }
          }}
          className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
            spaceConfirmed
              ? "bg-[#12141c] border-[#CCFF00]/40 shadow-sm"
              : "bg-[#0f1015] border-zinc-800/80 opacity-75"
          }`}
        >
          <div
            className={`w-5 h-5 rounded mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
              spaceConfirmed
                ? "bg-[#CCFF00] text-black shadow-xs"
                : "border border-zinc-700 bg-zinc-900"
            }`}
          >
            {spaceConfirmed && (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-white">
              <Zap className="w-4 h-4 text-[#CCFF00] shrink-0" />
              <span>SAFE TRAINING SPACE</span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
              I have a safe and suitable space to train at home.
            </p>
          </div>
        </div>
      </div>

      {/* Additional Terms agreement */}
      <div className="p-3.5 rounded-xl bg-[#0e1319] border border-zinc-800/80 flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-zinc-300">
        {/* Only the box toggles; the sentence holds the terms link */}
        <label className="mt-0.5 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            aria-labelledby="checkout-terms-text"
            className="peer sr-only"
          />
          <span
            className={`w-4 h-4 rounded flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#CCFF00] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0e1319] ${
              termsAccepted
                ? "bg-[#CCFF00] text-black"
                : "border border-zinc-700 bg-zinc-900"
            }`}
          >
            {termsAccepted && (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </span>
        </label>
        <span id="checkout-terms-text" className="leading-relaxed">
          I agree to the{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-bold underline underline-offset-2 hover:text-[#CCFF00]"
          >
            Terms &amp; Conditions,
          </a>{" "}
          <a
            href="/onboarding-terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-bold underline underline-offset-2 hover:text-[#CCFF00]"
          >
            Onboarding & Checkout Policies,
          </a>{" "}
          and{" "}
          <a
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white font-bold underline underline-offset-2 hover:text-[#CCFF00]"
          >
            Privacy Policies.
          </a>{" "}
          {/* and cancellation policy. */}
        </span>
      </div>
      {/* Optional marketing consent: same box-only toggle as the terms row */}
      <div className="p-3.5 rounded-xl bg-[#0e1319] border border-zinc-800/80 flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-zinc-300">
        <label className="mt-0.5 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            aria-labelledby="checkout-marketing-title checkout-marketing-text"
            className="peer sr-only"
          />
          <span
            className={`w-4 h-4 rounded flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[#CCFF00] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0e1319] ${
              marketingConsent
                ? "bg-[#CCFF00] text-black"
                : "border border-zinc-700 bg-zinc-900"
            }`}
          >
            {marketingConsent && (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            )}
          </span>
        </label>
        <div className="leading-relaxed">
          <p
            id="checkout-marketing-title"
            className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-zinc-400"
          >
            Optional Marketing Consent
          </p>
          <p id="checkout-marketing-text" className="mt-0.5">
            I would like to receive BXStrength offers, training
            updates and marketing communications. I understand that I
            can unsubscribe at any time.
          </p>
        </div>
      </div>
    </div>
  );
};
