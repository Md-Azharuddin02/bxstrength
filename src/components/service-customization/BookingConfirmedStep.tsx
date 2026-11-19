import React from "react";
import {
  ArrowRight,
  Award,
  Calendar,
  Check,
  Clock,
  Coins,
  Mail,
  User as UserIcon,
} from "lucide-react";

interface BookingConfirmedStepProps {
  confirmedOrderId: string;
  servicesCount: number;
  totalDurationLabel: string;
  bookingDate: string;
  displayTotalPrice: number;
  onGoToDashboard: () => void;
}

// STEP 4: CONFIRMED / COMPLETED SECTION
export const BookingConfirmedStep: React.FC<BookingConfirmedStepProps> = ({
  confirmedOrderId,
  servicesCount,
  totalDurationLabel,
  bookingDate,
  displayTotalPrice,
  onGoToDashboard,
}) => {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-4 py-1">
      {/* Celebratory radiating burst rays with lime checkmark circle */}
      <div className="payment-success-badge relative w-[4.5rem] h-[4.5rem] sm:w-20 sm:h-20 mx-auto flex items-center justify-center">
        <svg
          className="payment-success-rays absolute inset-0 w-full h-full text-[#CCFF00]"
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Cardinal rays */}
          <line
            x1="50"
            y1="5"
            x2="50"
            y2="10"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="50"
            y1="90"
            x2="50"
            y2="95"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="5"
            y1="50"
            x2="10"
            y2="50"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="90"
            y1="50"
            x2="95"
            y2="50"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Diagonal rays */}
          <line
            x1="18"
            y1="18"
            x2="22"
            y2="22"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="78"
            y1="22"
            x2="82"
            y2="18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="18"
            y1="82"
            x2="22"
            y2="78"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <line
            x1="78"
            y1="78"
            x2="82"
            y2="82"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <div className="payment-success-mark w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#CCFF00] flex items-center justify-center text-black shadow-[0_0_30px_rgba(204,255,0,0.45)]">
          <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5] text-black" />
        </div>
      </div>

      {/* Title & Subtitle */}
      <div>
        <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Thank You!
        </h3>
        <p className="text-zinc-400 text-xs sm:text-sm mt-1">
          Your booking request has been received.
        </p>
      </div>

      {/* Receipt Summary Card */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#0e1319] border border-zinc-800 text-left text-xs space-y-2 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-zinc-400">
            <UserIcon className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Booking Reference</span>
          </div>
          <span className="font-black text-white text-xs sm:text-sm">
            {confirmedOrderId}
          </span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-zinc-400">
            <Award className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Services</span>
          </div>
          <span className="font-bold text-white text-xs">
            {servicesCount} services (
            {totalDurationLabel})
          </span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-zinc-400">
            <Calendar className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Date</span>
          </div>
          <span className="font-bold text-white text-xs">
            {bookingDate}
          </span>
        </div>

        <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Time (Your Local Time)</span>
          </div>
          <span className="font-bold text-white text-xs">
            10:00 (Your Local Time)
          </span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-zinc-400">
            <Coins className="w-4 h-4 text-zinc-400 shrink-0" />
            <span>Total Paid</span>
          </div>
          <span className="text-base sm:text-lg font-black text-white">
            £{displayTotalPrice}
          </span>
        </div>
      </div>

      {/* Mandated User Copy Box */}
      <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-left space-y-2">
        <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider text-center text-[#CCFF00]">
          We’ll Contact You Soon
        </h4>
        <p className="text-xs text-zinc-300 leading-relaxed text-center sm:text-left">
          Thank you for booking with BXStrength. Our team will now
          confirm your session date and time and send you the final
          booking details, including the joining link and any required
          information, via email or WhatsApp.
        </p>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 leading-relaxed text-center sm:text-left pt-1 border-t border-zinc-800/80">
          If you have any specific request, feel free to reply once you
          receive our confirmation message.
        </p>
      </div>

      <button
        type="button"
        onClick={onGoToDashboard}
        className="w-full bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs sm:text-sm uppercase tracking-wider py-3 px-3 sm:px-4 rounded-xl flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-md transition-all active:scale-[0.98]"
      >
        <span>Go to Dashboard</span>
        <ArrowRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[3]" />
      </button>

      {/* Customer Support Email Address */}
      <div className="pt-1 text-center">
        <p className="text-xs text-zinc-400 flex items-center justify-center gap-1.5 flex-wrap">
          <Mail className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
          <span>Customer Support:</span>
          <a
            href="mailto:support@bxstrength.com"
            className="font-bold text-[#CCFF00] hover:underline"
          >
            support@bxstrength.com
          </a>
        </p>
      </div>
    </div>
  );
};
