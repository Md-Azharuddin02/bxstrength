import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ContactMethodCard } from "./ContactMethodCard";
import { DisclosuresSection } from "./DisclosuresSection";
import type { AuthUser } from "./types";

interface CheckoutTermsStepProps {
  serviceTitle: string;
  displayTotalPrice: number;
  user: AuthUser;
  contact: Omit<React.ComponentProps<typeof ContactMethodCard>, "user">;
  agreements: React.ComponentProps<typeof DisclosuresSection>;
  proceedDisabled: boolean;
  onBack: () => void;
  onProceed: () => void;
}

// STEP 2: CHECKOUT & ACCEPT TERMS
export const CheckoutTermsStep: React.FC<CheckoutTermsStepProps> = ({
  serviceTitle,
  displayTotalPrice,
  user,
  contact,
  agreements,
  proceedDisabled,
  onBack,
  onProceed,
}) => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header matching screenshot */}
      <div>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight">
          Checkout &amp; Accept Terms
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5">
          Confirm your training agreement and health disclosures before
          proceeding.
        </p>
      </div>

      {/* Card 1: Plan Selected & Amount */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0e1319] border border-zinc-800/90 shadow-xl flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            PLAN SELECTED
          </span>
          <span className="text-sm sm:text-lg lg:text-xl font-black text-white uppercase tracking-tight">
            {serviceTitle.toUpperCase()}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
            AMOUNT
          </span>
          <span className="text-xl sm:text-2xl lg:text-3xl font-black text-[#CCFF00]">
            £{displayTotalPrice}
          </span>
        </div>
      </div>

      {/* Card 2: Mode of Contact - Shown when logged in */}
      {user && <ContactMethodCard user={user} {...contact} />}

      {/* Card 3: 4 Checkbox Disclosures matching user screenshot in a 2x2 grid */}
      <DisclosuresSection {...agreements} />

      {/* Action Bar */}
      <div className="flex flex-row items-center justify-between gap-2.5 sm:gap-3 pt-4 border-t border-zinc-800/80">
        <button
          type="button"
          onClick={onBack}
          className="px-4 sm:px-5 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          disabled={proceedDisabled}
          onClick={onProceed}
          className="bg-[#CCFF00] hover:bg-[#b8e600] disabled:opacity-50 text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md"
        >
          <span>PROCEED TO PAYMENT</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
