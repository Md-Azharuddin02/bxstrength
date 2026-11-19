import { useState } from "react";

// Agreements start unticked: UK consent must be an active choice, never pre-checked
export const useCheckoutAgreements = () => {
  const [ageConfirmed, setAgeConfirmed] = useState<boolean>(false);
  const [virtualCoachingConfirmed, setVirtualCoachingConfirmed] =
    useState<boolean>(false);
  const [healthConfirmed, setHealthConfirmed] = useState<boolean>(false);
  const [spaceConfirmed, setSpaceConfirmed] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);
  // Optional and never required to pay (marketing consent is kept separate from the Terms)
  const [marketingConsent, setMarketingConsent] = useState<boolean>(false);

  // Agreements must be ticked fresh for every checkout, never carried over from an earlier one
  const resetAgreements = () => {
    setAgeConfirmed(false);
    setVirtualCoachingConfirmed(false);
    setHealthConfirmed(false);
    setSpaceConfirmed(false);
    setTermsAccepted(false);
    setMarketingConsent(false);
  };

  return {
    ageConfirmed,
    setAgeConfirmed,
    virtualCoachingConfirmed,
    setVirtualCoachingConfirmed,
    healthConfirmed,
    setHealthConfirmed,
    spaceConfirmed,
    setSpaceConfirmed,
    termsAccepted,
    setTermsAccepted,
    marketingConsent,
    setMarketingConsent,
    resetAgreements,
  };
};
