import React from "react";
import { X } from "lucide-react";

interface CheckoutHeaderProps {
  onClose: () => void;
}

export const CheckoutHeader: React.FC<CheckoutHeaderProps> = ({ onClose }) => {
  return (
    <div className="px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between border-b border-zinc-800/80 shrink-0">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <img
          src="https://res.cloudinary.com/yuyxn5b0/image/upload/v1789566029/WhatsApp_Image_2026-09-08_at_10.50.41_AM.png"
          alt="BX Strength"
          className="h-9 sm:h-10 w-auto max-w-[185px] object-contain"
        />
      </div>

      <button
        onClick={onClose}
        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
        aria-label="Close modal"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};
