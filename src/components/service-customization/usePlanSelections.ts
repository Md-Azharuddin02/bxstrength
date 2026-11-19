import { useState } from "react";
import { DEFAULT_MONTHLY_SESSIONS, DEFAULT_WEEKLY_SESSIONS } from "./constants";

// What the customer has picked in the custom, weekly and monthly planners
export const usePlanSelections = () => {
  // --- Custom Plan State ---
  const [elementQuantities, setElementQuantities] = useState<
    Record<string, number>
  >({});

  const updateElementQuantity = (id: string, delta: number) => {
    setElementQuantities((prev) => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  // --- Weekly Plan State (3 sessions) ---
  // Guided Warm-Up is pre-selected in all 3 sessions; each item represents the 1 extra focus selected
  const [weeklySessions, setWeeklySessions] = useState<string[]>([
    ...DEFAULT_WEEKLY_SESSIONS,
  ]);

  // --- Monthly Plan State (12 sessions) ---
  // Each of the 12 sessions includes 1 Guided Warm-Up + 1 Chosen Service + 1 Cool-Down & Recovery
  const [monthlySessions, setMonthlySessions] = useState<string[]>([
    ...DEFAULT_MONTHLY_SESSIONS,
  ]);
  const [openMonthlyDropdownIdx, setOpenMonthlyDropdownIdx] = useState<
    number | null
  >(null);

  const resetSelections = () => {
    setOpenMonthlyDropdownIdx(null);
    setElementQuantities({});
    setWeeklySessions([...DEFAULT_WEEKLY_SESSIONS]);
  };

  return {
    elementQuantities,
    updateElementQuantity,
    weeklySessions,
    setWeeklySessions,
    monthlySessions,
    setMonthlySessions,
    openMonthlyDropdownIdx,
    resetSelections,
  };
};
