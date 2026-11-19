import { useEffect, useRef } from "react";

interface DialogBehaviorOptions {
  isOpen: boolean;
  suspended: boolean;
  onClose: () => void;
  isProcessing: boolean;
}

// Dialog behaviour: focus moves in and stays in, Escape closes, the page behind doesn't scroll.
// Latest values live in a ref so re-renders don't re-run the effect and steal focus.
export const useDialogBehavior = ({
  isOpen,
  suspended,
  onClose,
  isProcessing,
}: DialogBehaviorOptions) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const dialogLatest = useRef({ onClose, isProcessing });
  dialogLatest.current = { onClose, isProcessing };

  useEffect(() => {
    if (!isOpen || suspended) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      const dialog = dialogRef.current;
      if (!dialog) return;
      if (e.key === "Escape") {
        // Never close mid-payment: the Razorpay window is still open
        if (dialogLatest.current.isProcessing) return;
        e.preventDefault();
        dialogLatest.current.onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const outside = !dialog.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen, suspended]);

  return dialogRef;
};
