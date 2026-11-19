import React from "react";
import { ArrowLeft, ArrowRight, Info, Lightbulb, Minus, Plus } from "lucide-react";
import { CUSTOM_ELEMENTS } from "./constants";

interface CustomPlanStepProps {
  elementQuantities: Record<string, number>;
  updateElementQuantity: (id: string, delta: number) => void;
  totalSelectedCount: number;
  customPlanTotalMinutes: number;
  customPlanTotalPrice: number;
  onBack: () => void;
  onNext: () => void;
}

export const CustomPlanStep: React.FC<CustomPlanStepProps> = ({
  elementQuantities,
  updateElementQuantity,
  totalSelectedCount,
  customPlanTotalMinutes,
  customPlanTotalPrice,
  onBack,
  onNext,
}) => {
  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Header Section: Left Title & Right "How it works?" box */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-2 border-b border-zinc-800/80">
        {/* Left: BX Custom Title & Subtitle */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
              BX <span className="text-[#CCFF00]">CUSTOM</span>
            </h2>
            <span className="text-[10px] sm:text-xs font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Tailored Plan
            </span>
          </div>
          <h3 className="text-xs sm:text-sm font-black text-zinc-200 uppercase tracking-wider">
            BUILD YOUR OWN BX SESSION.
          </h3>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Choose only the training elements you need. Each element
            has a fixed time and price.
          </p>
        </div>

        {/* Right: "How it works?" Reference Card */}
        <div className="bg-[#101218] border border-zinc-800 rounded-2xl p-3 sm:p-4 shrink-0 lg:max-w-md w-full lg:w-auto shadow-md">
          <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-zinc-800/80">
            <div className="w-5 h-5 rounded-md bg-[#CCFF00]/15 flex items-center justify-center text-[#CCFF00]">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-white">
              How it works?
            </span>
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-zinc-400">
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[9px] flex items-center justify-center shrink-0">
                1
              </span>
              <span className="truncate">
                Select the services you want
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[9px] flex items-center justify-center shrink-0">
                2
              </span>
              <span className="truncate">
                Set the quantity for each service
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[9px] flex items-center justify-center shrink-0">
                3
              </span>
              <span className="truncate">
                Review your plan and total time
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[9px] flex items-center justify-center shrink-0">
                4
              </span>
              <span className="truncate">
                Proceed to booking and payment
              </span>
            </li>
          </ol>
        </div>
      </div>

      {/* 3-Column Elements Grid matching Target Screenshot format */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {CUSTOM_ELEMENTS.map((element) => {
          const qty = elementQuantities[element.id] || 0;
          const isSelected = qty > 0;
          const IconComp = element.icon;

          return (
            <div
              key={element.id}
              role="group"
              tabIndex={0}
              onClick={() => {
                if (!isSelected)
                  updateElementQuantity(element.id, 1);
              }}
              onKeyDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  (event.key === "Enter" || event.key === " ") &&
                  !isSelected
                ) {
                  event.preventDefault();
                  updateElementQuantity(element.id, 1);
                }
              }}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isSelected
                  ? "bg-[#181822] border-[#CCFF00] shadow-[0_0_18px_-4px_rgba(204,255,0,0.28)]"
                  : "bg-[#101218] border-zinc-800/90 hover:border-zinc-700/80"
              }`}
            >
              {/* Top: Icon + Title + Description */}
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 transition-colors ${
                    isSelected
                      ? "bg-[#CCFF00]/15 text-[#CCFF00]"
                      : "bg-zinc-800/80 text-zinc-400"
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white tracking-tight leading-snug">
                    {element.name}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                    {element.description}
                  </p>
                </div>
              </div>

              {/* Bottom Bar: Duration | Price and Quantity Controls */}
              <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 mt-auto">
                {/* Left: Duration | Price */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-zinc-400 font-semibold">
                    {element.durationLabel}
                  </span>
                  <span className="text-zinc-700 font-bold">|</span>
                  <span className="font-black text-white text-sm">
                    £{element.price}
                  </span>
                </div>

                {/* Right: Quantity Stepper (- 0 +) */}
                <div className="flex items-center bg-[#0a0a0f] border border-zinc-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateElementQuantity(element.id, -1);
                    }}
                    disabled={qty === 0}
                    className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer ${
                      qty === 0
                        ? "text-zinc-600 cursor-not-allowed"
                        : "text-zinc-300 hover:text-white hover:bg-zinc-800"
                    }`}
                    aria-label={`Decrease ${element.name} quantity`}
                  >
                    <Minus className="w-5 h-5" strokeWidth={2.5} />
                  </button>

                  <span
                    className={`w-8 text-center text-xs font-black select-none ${isSelected ? "text-[#CCFF00]" : "text-zinc-400"}`}
                  >
                    {qty}
                  </span>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      updateElementQuantity(element.id, 1);
                    }}
                    className="w-8 h-8 rounded flex items-center justify-center text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                    aria-label={`Increase ${element.name} quantity`}
                  >
                    <Plus className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Info Card spanning remaining 2 columns in the bottom row on desktop */}
        <div className="col-span-1 md:col-span-2 lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#101218] border border-zinc-800/90 flex items-center gap-3.5 shadow-md">
          <div className="w-9 h-9 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/25 flex items-center justify-center text-[#CCFF00] shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-xs text-zinc-300 leading-relaxed">
            <p className="font-semibold text-white">
              Your total session time will be the sum of all
              selected services.
            </p>
            <p className="text-zinc-400 text-[11px] mt-0.5">
              There is no fixed duration — we'll create a session
              that fits your plan.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={onBack}
            className="px-4 sm:px-5 py-3 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-300 flex items-center gap-1.5 sm:gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-3 text-sm sm:text-base pl-2">
            <span className="text-zinc-300 font-semibold">
              Total Time:{" "}
              <strong className="font-bold text-white">
                {customPlanTotalMinutes} min
              </strong>
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-300 font-semibold">
              Price:{" "}
              <strong className="font-bold text-white">
                £{customPlanTotalPrice}
              </strong>
            </span>
          </div>
        </div>

        <span className="relative w-full sm:w-auto group">
          <button
            type="button"
            onClick={onNext}
            disabled={totalSelectedCount === 0}
            aria-describedby={
              totalSelectedCount === 0
                ? "service-selection-alert"
                : undefined
            }
            className={`w-full sm:w-auto font-black text-xs sm:text-sm uppercase tracking-wider py-3 sm:py-3.5 px-5 sm:px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md ${
              totalSelectedCount > 0
                ? "bg-[#CCFF00] hover:bg-[#b8e600] text-black cursor-pointer"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700/50"
            }`}
          >
            <span>NEXT: CHECKOUT &amp; TERMS</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
          {totalSelectedCount === 0 && (
            <span
              id="service-selection-alert"
              role="alert"
              className="pointer-events-none absolute bottom-full right-0 z-20 mb-2.5 flex w-max max-w-[min(19rem,calc(100vw-3rem))] items-start gap-2.5 rounded-lg border border-[#CCFF00]/35 bg-gradient-to-br from-zinc-800 to-zinc-950 px-4 py-3 text-[13px] font-semibold leading-snug text-white opacity-0 shadow-[0_10px_28px_rgba(0,0,0,0.5)] ring-1 ring-white/10 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:opacity-100 group-focus-within:-translate-y-0.5 group-focus-within:opacity-100 sm:text-sm"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#CCFF00]/15 text-base font-black leading-none text-[#CCFF00] ring-1 ring-[#CCFF00]/30">
                !
              </span>
              <span className="max-w-[15rem]">
                Choose at least one training service before
                continuing to checkout.
              </span>
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
