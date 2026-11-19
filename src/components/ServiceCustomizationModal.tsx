import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VelocityAPI } from '../services/api';
import { openRazorpayCheckout } from '../services/razorpayService';
import { canUseMockPayments } from '../services/mockPayment';
import { calculateCustomPlanTotals, getServicePlanType, SERVICE_PLAN_PRICES } from '../services/servicePricing';
import type { ServiceInfo } from './service-customization/types';
import { getPackageLineItems, getStandardServiceDetails } from './service-customization/packageDetails';
import { buildCheckoutNotes, recordPaidBooking } from './service-customization/paymentHelpers';
import { getModalMaxWidth } from './service-customization/getModalMaxWidth';
import { usePlanSelections } from './service-customization/usePlanSelections';
import { useCheckoutAgreements } from './service-customization/useCheckoutAgreements';
import { useContactMethods } from './service-customization/useContactMethods';
import { useDialogBehavior } from './service-customization/useDialogBehavior';
import { PlanUnavailableDialog } from './service-customization/PlanUnavailableDialog';
import { CheckoutHeader } from './service-customization/CheckoutHeader';
import { CheckoutStepper } from './service-customization/CheckoutStepper';
import { StandardPlanStep } from './service-customization/StandardPlanStep';
import { CustomPlanStep } from './service-customization/CustomPlanStep';
import { WeeklyPlanStep } from './service-customization/WeeklyPlanStep';
import { MonthlyPlanStep } from './service-customization/MonthlyPlanStep';
import { CheckoutTermsStep } from './service-customization/CheckoutTermsStep';
import { PaymentStep } from './service-customization/PaymentStep';
import { BookingConfirmedStep } from './service-customization/BookingConfirmedStep';

// Other files import these types from here
export type { CustomTrainingElement, CustomDurationOption } from './service-customization/constants';

interface ServiceCustomizationModalProps {
  isOpen: boolean;
  suspended?: boolean;
  onClose: () => void;
  onRequireLogin: () => void;
  service: ServiceInfo | null;
  onNavigateToDashboard?: () => void;
  initialCustomerEmail?: string;
}

export const ServiceCustomizationModal: React.FC<
  ServiceCustomizationModalProps
> = ({
  isOpen,
  suspended = false,
  onClose,
  service,
  onNavigateToDashboard,
  onRequireLogin,
}) => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Multi-tier Navigation:
  // 3-step streamlined flow across all 8 services:
  // Step 1: CHECKOUT WITH CHECKBOX (Included services preview + disclosures & terms checkbox)
  // Step 2: PAYMENT (Pixel-accurate matching reference image with 2 columns, red pay button)
  // Step 3: CONFIRMED (Pixel-accurate matching reference image with receipt card, required messages, 2 horizontal buttons, support email)
  const [mainStage, setMainStage] = useState<number>(1);
  const [continueToPaymentAfterLogin, setContinueToPaymentAfterLogin] =
    useState(false);

  // What the customer picked in the custom, weekly and monthly planners
  const {
    elementQuantities,
    updateElementQuantity,
    weeklySessions,
    setWeeklySessions,
    monthlySessions,
    setMonthlySessions,
    resetSelections,
  } = usePlanSelections();

  // Agreements start unticked: UK consent must be an active choice, never pre-checked
  const { resetAgreements, ...agreementState } = useCheckoutAgreements();

  // Mode of Contact state (auto-populated if user already has it on profile). Multi-select.
  const {
    selectedMethods,
    toggleMethod,
    contactPhoneInput,
    setContactPhoneInput,
    whatsappIsCurrent,
    setWhatsappIsCurrent,
    whatsappNumberInput,
    setWhatsappNumberInput,
    effectiveWhatsapp,
    contactSelectionValid,
    resetContactState,
  } = useContactMethods(user);

  // Payment states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const canTestMockPayment = canUseMockPayments(
    import.meta.env.MODE !== 'production',
    import.meta.env.VITE_ENABLE_MOCK_PAYMENTS,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPaymentSuccess, setIsPaymentSuccess] = useState<boolean>(false);
  const [isSuccessAnimationVisible, setIsSuccessAnimationVisible] =
    useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string>("");
  const [bookingDate, setBookingDate] = useState<string>("");

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setMainStage(1);
      setContinueToPaymentAfterLogin(false);
      setErrorMessage(null);
      setIsPaymentSuccess(false);
      setIsSuccessAnimationVisible(false);
      resetSelections();
      setConfirmedOrderId("");
      // Agreements must be ticked fresh for every checkout, never carried over from an earlier one
      resetAgreements();
      setBookingDate(
        new Date().toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      );
      resetContactState();
    }
    // Not keyed on `user`: saving the contact mode updates the user and would restart checkout at step 1
  }, [isOpen, service?.title]);

  useEffect(() => {
    if (!isSuccessAnimationVisible) return;
    const timeoutId = window.setTimeout(() => {
      setIsSuccessAnimationVisible(false);
      setIsPaymentSuccess(true);
      setMainStage(4);
    }, 450);

    return () => window.clearTimeout(timeoutId);
  }, [isSuccessAnimationVisible]);

  useEffect(() => {
    if (isOpen && user && continueToPaymentAfterLogin) {
      setContinueToPaymentAfterLogin(false);
      setMainStage(3);
    }
  }, [isOpen, user, continueToPaymentAfterLogin]);

  useEffect(() => {
    if (isOpen && mainStage === 3 && !user) {
      setMainStage(2);
      setContinueToPaymentAfterLogin(true);
      onRequireLogin();
    }
  }, [isOpen, mainStage, user]);

  // Focus trap, Escape to close, no page scroll behind the dialog
  const dialogRef = useDialogBehavior({ isOpen, suspended, onClose, isProcessing });

  const continueToPayment = async () => {
    if (user) {
      // Persist the chosen contact methods + WhatsApp number to the profile
      if (selectedMethods.length > 0) {
        // Legacy single-value field: 'all' when every method is picked, else the first choice
        const legacy = selectedMethods.length >= 3 ? "all" : selectedMethods[0];
        try {
          await updateProfile({
            contactMethods: selectedMethods,
            preferredContactMethod: legacy,
            ...(selectedMethods.includes("whatsapp") && effectiveWhatsapp
              ? { whatsappNumber: effectiveWhatsapp }
              : {}),
            ...(contactPhoneInput && contactPhoneInput !== user.phone
              ? { phone: contactPhoneInput }
              : {}),
          });
        } catch (err) {
          console.warn("Failed to update contact methods on profile:", err);
        }
      }
      setMainStage(3);
      return;
    }

    setContinueToPaymentAfterLogin(true);
    onRequireLogin();
  };

  if (!isOpen || suspended || !service) return null;

  // Same exact-name lookup the server prices with, so the page and the charge can't disagree
  const planType = getServicePlanType(service.title || "");
  if (!planType) {
    return <PlanUnavailableDialog onClose={onClose} />;
  }
  const isCustomPlan = planType === "custom";
  const isWeeklyPlan = planType === "weekly";
  const isMonthlyPlan = planType === "monthly";

  // Custom Plan Selected Elements & Calculation
  const customPlanTotals = calculateCustomPlanTotals(elementQuantities);
  const totalSelectedCount = customPlanTotals.count;
  const customPlanTotalMinutes = customPlanTotals.durationMinutes;
  const customPlanTotalPrice = customPlanTotals.price;

  // Total Price determination
  const displayTotalPrice = isCustomPlan
    ? customPlanTotalPrice
    : SERVICE_PLAN_PRICES[planType];

  const packageDetails = getPackageLineItems({
    planType,
    weeklySessions,
    elementQuantities,
    customPlanTotalMinutes,
    totalSelectedCount,
  });

  const standardDetails = getStandardServiceDetails({
    planType,
    service,
    displayTotalPrice,
  });

  // Handle Razorpay Checkout Initiation
  const handleProceedToPayment = async (simulateSuccess = false) => {
    if (!user) {
      onRequireLogin();
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const clientEmail = user?.email || "guest@bxstrength.com";
    const clientName = user?.name || "Client Athlete";
    const clientPhone = user?.phone || "";

    try {
      await openRazorpayCheckout({
        simulateSuccess,
        amount: displayTotalPrice,
        currency: "GBP",
        country: "GB",
        name: "BxStrength Performance",
        description: service.title,
        userEmail: clientEmail,
        userName: clientName,
        userPhone: clientPhone,
        notes: buildCheckoutNotes({
          serviceTitle: service.title,
          planType,
          elementQuantities,
          customPlanTotalMinutes,
          weeklySessions,
          monthlySessions,
          packageDetails,
        }),
        onSuccess: async (res) => {
          setIsProcessing(false);
          if (!res.razorpay_order_id) {
            setErrorMessage(
              "Payment received but we could not confirm your order reference. Please contact support before paying again.",
            );
            return;
          }
          setConfirmedOrderId(res.razorpay_order_id);
          setIsSuccessAnimationVisible(true);

          // The server creates the subscription when it verifies the payment; pull it into the local cache
          // Record the dynamic Paid Package Booking in database
          try {
            recordPaidBooking({
              orderId: res.razorpay_order_id,
              paymentId: res.razorpay_payment_id,
              user,
              clientName,
              clientEmail,
              clientPhone,
              service,
              displayTotalPrice,
              planType,
              elementQuantities,
              customPlanTotalMinutes,
              weeklySessions,
              monthlySessions,
              packageDetails,
              selectedMethods,
              agreements: {
                ageConfirmed: agreementState.ageConfirmed,
                virtualCoachingConfirmed: agreementState.virtualCoachingConfirmed,
                healthConfirmed: agreementState.healthConfirmed,
                spaceConfirmed: agreementState.spaceConfirmed,
                termsAccepted: agreementState.termsAccepted,
                marketingConsent: agreementState.marketingConsent,
              },
            });
          } catch (createErr) {
            console.warn('Failed to build paid booking payload:', createErr);
          }

          VelocityAPI.fetchSubscriptions().catch(() => {});
        },
        onFailure: (err) => {
          setIsProcessing(false);
          setErrorMessage(
            err?.message || "Payment could not be completed. Please try again.",
          );
        },
        onDismiss: () => {
          setIsProcessing(false);
        },
      });
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(
        err?.message || "Could not launch payment gateway. Please try again.",
      );
    }
  };

  // Redirection Handlers for Completed Section
  const handleRedirectHome = () => {
    onClose();
    navigate("/dashboard");
    if (onNavigateToDashboard) onNavigateToDashboard();
  };

  const modalMaxWidth = getModalMaxWidth({
    mainStage,
    isCustomPlan,
    isWeeklyPlan,
    isMonthlyPlan,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Checkout: ${service.title}`}
        tabIndex={-1}
        className={`relative w-full ${modalMaxWidth} max-h-[94vh] flex flex-col bg-[#0c0d12] border border-zinc-800 rounded-2xl shadow-2xl my-auto transition-all outline-none`}
      >
        <CheckoutHeader onClose={onClose} />

        <CheckoutStepper mainStage={mainStage} isPaymentSuccess={isPaymentSuccess} />

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-4 sm:mx-6 mt-3 sm:mt-4 p-3 sm:p-3.5 bg-red-950/40 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2 shrink-0">
            <Info className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden flex-1">

          {mainStage === 1 && (
            <div className="space-y-5 sm:space-y-6">

              {!isCustomPlan && !isWeeklyPlan && !isMonthlyPlan && (
                <StandardPlanStep
                  standardDetails={standardDetails}
                  onBack={onClose}
                  onNext={() => setMainStage(2)}
                />
              )}

              {isCustomPlan && (
                <CustomPlanStep
                  elementQuantities={elementQuantities}
                  updateElementQuantity={updateElementQuantity}
                  totalSelectedCount={totalSelectedCount}
                  customPlanTotalMinutes={customPlanTotalMinutes}
                  customPlanTotalPrice={customPlanTotalPrice}
                  onBack={onClose}
                  onNext={() => setMainStage(2)}
                />
              )}

              {isWeeklyPlan && (
                <WeeklyPlanStep
                  weeklySessions={weeklySessions}
                  setWeeklySessions={setWeeklySessions}
                  onBack={onClose}
                  onNext={() => setMainStage(2)}
                />
              )}

              {isMonthlyPlan && (
                <MonthlyPlanStep
                  monthlySessions={monthlySessions}
                  setMonthlySessions={setMonthlySessions}
                  onBack={onClose}
                  onNext={() => setMainStage(2)}
                />
              )}
            </div>
          )}

          {mainStage === 2 && (
            <CheckoutTermsStep
              serviceTitle={service.title}
              displayTotalPrice={displayTotalPrice}
              user={user}
              contact={{
                selectedMethods,
                onToggleMethod: toggleMethod,
                whatsappIsCurrent,
                setWhatsappIsCurrent,
                whatsappNumberInput,
                setWhatsappNumberInput,
                contactPhoneInput,
                setContactPhoneInput,
              }}
              agreements={agreementState}
              proceedDisabled={
                !agreementState.termsAccepted ||
                !agreementState.ageConfirmed ||
                !agreementState.virtualCoachingConfirmed ||
                !agreementState.healthConfirmed ||
                !agreementState.spaceConfirmed ||
                Boolean(user && !contactSelectionValid)
              }
              onBack={() => setMainStage(1)}
              onProceed={continueToPayment}
            />
          )}

          {mainStage === 3 && user && (
            <PaymentStep
              serviceTitle={service.title}
              packageDetails={packageDetails}
              showEdit={isCustomPlan || isWeeklyPlan || isMonthlyPlan}
              displayTotalPrice={displayTotalPrice}
              isProcessing={isProcessing}
              canTestMockPayment={canTestMockPayment}
              isSuccessAnimationVisible={isSuccessAnimationVisible}
              onEdit={() => setMainStage(1)}
              onBack={() => setMainStage(2)}
              onPay={() => void handleProceedToPayment()}
              onSimulatePay={() => void handleProceedToPayment(true)}
            />
          )}

          {(mainStage === 4 || isPaymentSuccess) && (
            <BookingConfirmedStep
              confirmedOrderId={confirmedOrderId}
              servicesCount={packageDetails.servicesCount}
              totalDurationLabel={packageDetails.totalDurationLabel}
              bookingDate={bookingDate}
              displayTotalPrice={displayTotalPrice}
              onGoToDashboard={handleRedirectHome}
            />
          )}
        </div>
      </div>
    </div>
  );
};
