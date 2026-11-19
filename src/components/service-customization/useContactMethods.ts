import { useState, useEffect } from "react";
import type { AuthUser } from "./types";
import type { ContactMethod } from "./constants";

// Mode of Contact state (auto-populated if user already has it on profile). Multi-select.
export const useContactMethods = (user: AuthUser) => {
  const initialMethods = (): ContactMethod[] =>
    user?.contactMethods?.length
      ? user.contactMethods
      : user?.preferredContactMethod && user.preferredContactMethod !== "all"
        ? [user.preferredContactMethod]
        : user?.preferredContactMethod === "all"
          ? ["whatsapp", "call", "email"]
          : [];
  const [selectedMethods, setSelectedMethods] =
    useState<ContactMethod[]>(initialMethods());
  const [contactPhoneInput, setContactPhoneInput] = useState<string>(
    user?.phone || "",
  );
  // WhatsApp: is the profile phone also the WhatsApp number? If not, collect a separate one.
  const [whatsappIsCurrent, setWhatsappIsCurrent] = useState<boolean>(
    !user?.whatsappNumber || user.whatsappNumber === user.phone,
  );
  const [whatsappNumberInput, setWhatsappNumberInput] = useState<string>(
    user?.whatsappNumber || user?.phone || "",
  );

  // Keep contact selection synced when user logs in
  useEffect(() => {
    setSelectedMethods(initialMethods());
    if (user?.phone) setContactPhoneInput(user.phone);
    if (user?.whatsappNumber) setWhatsappNumberInput(user.whatsappNumber);
    setWhatsappIsCurrent(
      !user?.whatsappNumber || user.whatsappNumber === user.phone,
    );
  }, [user]);

  const toggleMethod = (m: ContactMethod) =>
    setSelectedMethods((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    );

  const effectiveWhatsapp = whatsappIsCurrent
    ? user?.phone || ""
    : whatsappNumberInput.trim();
  const contactSelectionValid =
    selectedMethods.length > 0 &&
    (!selectedMethods.includes("whatsapp") || effectiveWhatsapp.length > 0) &&
    (!selectedMethods.includes("call") ||
      (contactPhoneInput || user?.phone || "").trim().length > 0);

  // Back to what the profile has, every time the checkout opens
  const resetContactState = () => {
    setSelectedMethods(initialMethods());
    if (user?.phone) setContactPhoneInput(user.phone);
    setWhatsappNumberInput(user?.whatsappNumber || user?.phone || "");
    setWhatsappIsCurrent(
      !user?.whatsappNumber || user.whatsappNumber === user.phone,
    );
  };

  return {
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
  };
};
