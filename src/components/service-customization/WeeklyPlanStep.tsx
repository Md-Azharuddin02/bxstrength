import React from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { WEEKLY_EXTRA_OPTIONS } from "./constants";

interface WeeklyPlanStepProps {
  weeklySessions: string[];
  setWeeklySessions: (sessions: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}

export const WeeklyPlanStep: React.FC<WeeklyPlanStepProps> = ({
  weeklySessions,
  setWeeklySessions,
  onBack,
  onNext,
}) => {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div>
        <p className="text-[11px] sm:text-xs font-bold text-[#CCFF00] tracking-wider uppercase mb-1.5">
          Step 1 of 3
        </p>
        <div className="w-full h-1 bg-[#CCFF00] rounded-full mb-4 sm:mb-6" />
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase">
          PLAN YOUR 3 SESSIONS
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 sm:mt-2">
          Guided Warm-Up is pre-selected for all 3 sessions. Choose
          1 additional training focus for each session.
        </p>
      </div>

      <div className="p-4 sm:p-5 rounded-2xl bg-[#101218] border border-zinc-800 space-y-4 shadow-lg">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-300 block">
            3 Sessions Breakdown
          </span>
          <span className="text-[11px] sm:text-xs font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2.5 py-1 rounded-full shrink-0">
            10-Day Validity
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-3.5">
          {[0, 1, 2].map((sessionIdx) => (
            <div
              key={sessionIdx}
              className="p-3.5 sm:p-4 rounded-xl bg-[#14151e] border border-zinc-800 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-white block">
                      Session {sessionIdx + 1}
                    </span>
                    <span className="text-[10px] text-zinc-400">
                      1 Warm-Up + 1 Focus
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                    30 min
                  </span>
                </div>

                {/* Pre-selected Warm-Up with zero overlap */}
                <div className="p-2.5 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 flex items-center justify-between gap-2 overflow-hidden">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-5 h-5 rounded-full bg-[#CCFF00] text-black flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate">
                        Guided Warm-Up
                      </p>
                      <p className="text-[9px] text-zinc-400 truncate">
                        Pre-selected for session
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider text-[#CCFF00] bg-[#CCFF00]/20 border border-[#CCFF00]/30 px-2 py-0.5 rounded shrink-0 ml-1">
                    INCLUDED
                  </span>
                </div>
              </div>

              {/* List of 7 options as buttons */}
              <div className="space-y-1.5 pt-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                  Select 1 Extra Focus:
                </p>
                <div className="space-y-1.5 max-h-48 sm:max-h-56 overflow-y-auto pr-0.5">
                  {WEEKLY_EXTRA_OPTIONS.map((opt) => {
                    const isSelected =
                      weeklySessions[sessionIdx] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const updated = [...weeklySessions];
                          updated[sessionIdx] = opt;
                          setWeeklySessions(updated);
                        }}
                        className={`w-full p-2 sm:p-2.5 rounded-lg border text-left text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#181f14] border-[#CCFF00] text-white shadow-[0_0_12px_rgba(204,255,0,0.2)]"
                            : "bg-[#101218] border-zinc-800 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-[#CCFF00] stroke-[3] shrink-0 ml-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
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
