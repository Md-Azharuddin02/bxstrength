import React from "react";
import { AlertCircle } from "lucide-react";

interface PlanUnavailableDialogProps {
  onClose: () => void;
}

export const PlanUnavailableDialog: React.FC<PlanUnavailableDialogProps> = ({
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div
        role="alertdialog"
        aria-labelledby="plan-unavailable-title"
        className="w-full max-w-md bg-[#0c0d12] border border-zinc-800 rounded-2xl p-6 text-center space-y-4"
      >
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <h2
          id="plan-unavailable-title"
          className="text-lg font-black text-white"
        >
          This plan isn't available to buy online
        </h2>
        <p className="text-sm text-zinc-400">
          Please contact us and we'll help you get started.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-wider py-3 px-6 rounded-xl cursor-pointer"
        >
          Close
        </button>
      </div>
    </div>
  );
};
