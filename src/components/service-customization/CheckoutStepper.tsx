import React from "react";
import { Check } from "lucide-react";

interface CheckoutStepperProps {
  mainStage: number;
  isPaymentSuccess: boolean;
}

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({
  mainStage,
  isPaymentSuccess,
}) => {
  return (
    <div
      className={`${mainStage === 4 ? "hidden" : "flex"} items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3.5 border-b border-zinc-800/80 bg-zinc-950/70 overflow-x-auto text-xs no-scrollbar shrink-0 gap-1 sm:gap-2`}
    >
      {/* Step 1: Onboarding */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div
          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-sm transition-all ${
            mainStage === 1
              ? "bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]"
              : mainStage > 1
                ? "bg-[#CCFF00] text-black"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
          }`}
        >
          {mainStage > 1 ? (
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
          ) : (
            "1"
          )}
        </div>
        <div>
          <p
            className={`font-black uppercase tracking-wider text-[10px] sm:text-[11px] ${mainStage >= 1 ? "text-[#CCFF00]" : "text-zinc-400"}`}
          >
            ONBOARDING
          </p>
          <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
            Selected Service 
          </p>
        </div>
      </div>

      <span className="text-zinc-600 font-bold px-1 sm:px-2.5 text-xs sm:text-base shrink-0">
        ›
      </span>

      {/* Step 2: Checkout */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div
          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-sm transition-all ${
            mainStage === 2
              ? "bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]"
              : mainStage > 2
                ? "bg-[#CCFF00] text-black"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
          }`}
        >
          {mainStage > 2 ? (
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
          ) : (
            "2"
          )}
        </div>
        <div>
          <p
            className={`font-black uppercase tracking-wider text-[10px] sm:text-[11px] ${mainStage >= 2 ? "text-[#CCFF00]" : "text-zinc-400"}`}
          >
            CHECKOUT
          </p>
          <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
            Accept Terms
          </p>
        </div>
      </div>

      <span className="text-zinc-600 font-bold px-1 sm:px-2.5 text-xs sm:text-base shrink-0">
        ›
      </span>

      {/* Step 3: Payment */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div
          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-sm transition-all ${
            mainStage === 3
              ? "bg-[#CCFF00] text-black shadow-[0_0_12px_rgba(204,255,0,0.35)]"
              : mainStage > 3
                ? "bg-[#CCFF00] text-black"
                : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
          }`}
        >
          {mainStage > 3 ? (
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
          ) : (
            "3"
          )}
        </div>
        <div>
          <p
            className={`font-black uppercase tracking-wider text-[10px] sm:text-[11px] ${mainStage >= 3 ? "text-[#CCFF00]" : "text-zinc-400"}`}
          >
            PAYMENT
          </p>
          <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
            Pay Securely
          </p>
        </div>
      </div>

      <span className="text-zinc-600 font-bold px-1 sm:px-2.5 text-xs sm:text-base shrink-0">
        ›
      </span>

      {/* Step 4: Confirmed */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <div
          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-[11px] sm:text-sm transition-all ${
            mainStage === 4 || isPaymentSuccess
              ? "bg-[#CCFF00] text-black shadow-[0_0_15px_rgba(204,255,0,0.35)]"
              : "bg-zinc-800 text-zinc-400 border border-zinc-700/60"
          }`}
        >
          {mainStage === 4 || isPaymentSuccess ? (
            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
          ) : (
            "4"
          )}
        </div>
        <div>
          <p
            className={`font-black uppercase tracking-wider text-[10px] sm:text-[11px] ${mainStage === 4 || isPaymentSuccess ? "text-[#CCFF00]" : "text-zinc-400"}`}
          >
            CONFIRMED
          </p>
          <p className="text-[10px] text-zinc-400 font-medium hidden sm:block">
            Session Confirmed
          </p>
        </div>
      </div>
    </div>
  );
};
