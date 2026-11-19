import React from "react";
import { ArrowLeft, ArrowRight, Check, Clock, Coins, Lock, Pencil } from "lucide-react";
import type { PackageDetails } from "./packageDetails";

interface PaymentStepProps {
  serviceTitle: string;
  packageDetails: PackageDetails;
  showEdit: boolean;
  displayTotalPrice: number;
  isProcessing: boolean;
  canTestMockPayment: boolean;
  isSuccessAnimationVisible: boolean;
  onEdit: () => void;
  onBack: () => void;
  onPay: () => void;
  onSimulatePay: () => void;
}

// STEP 3: PAYMENT
export const PaymentStep: React.FC<PaymentStepProps> = ({
  serviceTitle,
  packageDetails,
  showEdit,
  displayTotalPrice,
  isProcessing,
  canTestMockPayment,
  isSuccessAnimationVisible,
  onEdit,
  onBack,
  onPay,
  onSimulatePay,
}) => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header inside Payment stage */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white mt-1">
            <span className="text-[#CCFF00]">BX</span>{" "}
            {serviceTitle.replace(/^BX\s*/i, "")}
          </h2>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-zinc-400 mt-0.5">
            COMPLETE YOUR BOOKING
          </p>
        </div>
      </div>

      {/* Responsive Column Layout: 1 col on mobile & tablet, 2 cols on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-stretch">
        {/* Left Column: Booking Summary */}
        <div className="flex h-full flex-col">
          <div className="flex flex-1 flex-col gap-3 sm:gap-4 rounded-2xl bg-[#0e1319] border border-zinc-800/90 p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                Booking Summary
              </h4>
              {showEdit && (
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-xs font-bold text-[#CCFF00] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-[#CCFF00]" />
                  <span>Edit</span>
                </button>
              )}
            </div>

            {/* Service Rows with Application Theme Lime Icons */}
            <div className="space-y-2.5 sm:space-y-3">
              {packageDetails.items.map((item, idx) => {
                const IconComp = item.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <IconComp className="w-4 h-4 text-[#CCFF00] shrink-0" />
                      <span className="font-bold text-white truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-2">
                      <span className="font-bold text-white text-right">
                        {item.price.startsWith("£")
                          ? "Included"
                          : item.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Totals */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Clock className="w-4 h-4 text-[#CCFF00] shrink-0" />
                  <span>Total Session Time</span>
                </div>
                <span className="font-bold text-white">
                  {packageDetails.totalDurationLabel}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Coins className="w-4 h-4 text-[#CCFF00] shrink-0" />
                  <span>Total Price</span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-white">
                  £{displayTotalPrice}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onBack}
              className="mt-auto pt-3 px-3.5 sm:px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-300 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* Right Column: Payment Method */}
        <div className="flex h-full flex-col p-4 sm:p-5 rounded-2xl bg-[#0e1319] border border-zinc-800/90 shadow-xl space-y-4 sm:space-y-5">
          <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
            Payment Method
          </h4>

          {/* Option 1: Card / UPI / International Card (Selected) */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-start gap-2.5 sm:gap-3">
              {/* Theme Lime radio button */}
              <div className="w-4 h-4 rounded-full border-2 border-[#CCFF00] flex items-center justify-center shrink-0 mt-0.5">
                <div className="w-2 h-2 rounded-full bg-[#CCFF00]" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white">
                  Credit / Debit Card
                </p>
                <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-0.5">
                  Secure payment powered by Razorpay
                </p>
              </div>
            </div>

            {/* Payment Logos Pill Row - Responsive wrap */}
            <div className="flex items-center gap-1.5 sm:gap-2 pt-1 flex-wrap pl-0 sm:pl-7">
              {/* VISA */}
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-white text-[#1a1f71] font-black text-[10px] tracking-tight border border-zinc-200 shadow-xs">
                VISA
              </span>

              {/* Mastercard */}
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-white border border-zinc-200 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-[#eb001b]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#f79e1b] -ml-1.5 opacity-90" />
              </span>

              {/* AMEX */}
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-[#007bc1] text-white font-extrabold text-[9px] tracking-tight shadow-xs">
                AMEX
              </span>

              {/* JCB */}
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white border border-zinc-200 shadow-xs">
                <span className="w-1 h-2.5 rounded-xs bg-[#005a9c]" />
                <span className="w-1 h-2.5 rounded-xs bg-[#d9272e]" />
                <span className="w-1 h-2.5 rounded-xs bg-[#00873c]" />
                <span className="text-[9px] font-black text-zinc-900 ml-0.5">
                  JCB
                </span>
              </span>

              {/* Apple Pay */}
              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-black text-white text-[9px] font-bold border border-zinc-700 shadow-xs">
                <span></span>Pay
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={isProcessing}
            onClick={onPay}
            className="w-full bg-[#CCFF00] hover:bg-[#b8e600] active:scale-[0.99] disabled:opacity-50 text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3.5 sm:py-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(204,255,0,0.3)]"
          >
            <span>
              {isProcessing
                ? "Processing..."
                : `Pay £${displayTotalPrice}`}
            </span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
          {canTestMockPayment && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={onSimulatePay}
              className="w-full border border-amber-400/60 bg-amber-400/10 hover:bg-amber-400/20 disabled:opacity-50 text-amber-200 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-colors"
            >
              Simulate successful payment (test only)
            </button>
          )}
          

          {/* Security indicator */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] text-zinc-400 text-center">
            <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>
              Your payment information is secure and encrypted.
            </span>
          </div>
        </div>

        {isSuccessAnimationVisible && (
          <div
            role="status"
            aria-live="assertive"
            aria-label="Payment successful. Opening your thank-you page."
            className="absolute inset-0 z-[60] flex items-center justify-center rounded-2xl bg-black/60 p-4 text-center backdrop-blur-sm"
          >
            <div className="payment-success-alert flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-[#CCFF00]/40 bg-[#101318] px-6 py-7 shadow-[0_20px_80px_rgba(0,0,0,0.65)]">
              <div className="payment-success-overlay-icon relative flex h-20 w-20 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#CCFF00]/25 border-t-[#CCFF00] payment-success-spinner" />
                {Array.from({ length: 16 }, (_, index) => (
                  <span
                    key={index}
                    className="payment-success-firework-particle"
                    style={
                      {
                        "--burst-angle": `${index * 22.5}deg`,
                        "--burst-distance": `${42 + (index % 3) * 10}px`,
                        "--burst-delay": `${(index % 4) * 25}ms`,
                      } as React.CSSProperties
                    }
                  />
                ))}
                <div className="payment-success-overlay-check flex h-14 w-14 items-center justify-center rounded-full bg-[#CCFF00] text-black shadow-[0_0_35px_rgba(204,255,0,0.45)]">
                  <Check className="h-8 w-8 stroke-[4]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <h2 className="text-xl font-black text-white sm:text-2xl">
                  Payment Successful
                </h2>
                <p className="text-sm text-zinc-400">
                  Taking you to your thank-you page…
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
