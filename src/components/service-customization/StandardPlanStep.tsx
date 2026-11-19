import React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { StandardServiceDetails } from "./packageDetails";

interface StandardPlanStepProps {
  standardDetails: StandardServiceDetails;
  onBack: () => void;
  onNext: () => void;
}

export const StandardPlanStep: React.FC<StandardPlanStepProps> = ({
  standardDetails,
  onBack,
  onNext,
}) => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Step 1 of 1 & Lime Line */}
      <div>
        <div className="w-full h-1 bg-[#CCFF00] rounded-full mb-4 sm:mb-6" />
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
          {standardDetails.title}
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 sm:mt-2">
          {standardDetails.description}
        </p>
      </div>

      {/* Summary Card */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#0e1319] border border-zinc-800/90 shadow-xl space-y-3 sm:space-y-4 my-4 sm:my-6">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-zinc-400 font-medium">
            Service Duration
          </span>
          <span className="font-black text-white uppercase tracking-wide">
            {standardDetails.duration}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-zinc-400 font-medium">Format</span>
          <span className="font-bold text-[#CCFF00]">
            {standardDetails.format}
          </span>
        </div>
        <div className="pt-3.5 sm:pt-4 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
            TOTAL PRICE
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white">
            £{standardDetails.price}
          </span>
        </div>
      </div>

      {/* Bottom Action Bar */}
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
          onClick={onNext}
          className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 px-4 sm:px-6 rounded-xl transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-md"
        >
          <span>NEXT: CHECKOUT &amp; TERMS</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
