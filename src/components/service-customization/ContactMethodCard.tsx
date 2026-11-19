import React from "react";
import { Check, Mail, MessageSquare, Phone } from "lucide-react";
import { PhoneInput } from "../PhoneInput";
import { contactModeLabel, ContactMethod } from "./constants";
import type { AuthUser } from "./types";

interface ContactMethodCardProps {
  user: NonNullable<AuthUser>;
  selectedMethods: ContactMethod[];
  onToggleMethod: (m: ContactMethod) => void;
  whatsappIsCurrent: boolean;
  setWhatsappIsCurrent: (v: boolean) => void;
  whatsappNumberInput: string;
  setWhatsappNumberInput: (v: string) => void;
  contactPhoneInput: string;
  setContactPhoneInput: (v: string) => void;
}

export const ContactMethodCard: React.FC<ContactMethodCardProps> = ({
  user,
  selectedMethods,
  onToggleMethod,
  whatsappIsCurrent,
  setWhatsappIsCurrent,
  whatsappNumberInput,
  setWhatsappNumberInput,
  contactPhoneInput,
  setContactPhoneInput,
}) => {
  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-[#0e1319] border border-zinc-800/90 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#CCFF00]" />
          <span className="text-xs font-black uppercase tracking-wider text-white">
            CHOOSE MODE OF CONTACT
          </span>
        </div>
        {selectedMethods.length === 0 ? (
          <span className="text-[10px] sm:text-[11px] font-bold text-[#CCFF00] bg-[#CCFF00]/10 border border-[#CCFF00]/30 px-2 py-0.5 rounded">
            Required For Coach Onboarding
          </span>
        ) : (
          <span className="text-[10px] sm:text-[11px] font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-0.5 rounded">
            Selected:{" "}
            <strong className="text-[#CCFF00]">
              {selectedMethods.map(contactModeLabel).join(", ")}
            </strong>
          </span>
        )}
      </div>

      <div className="space-y-3">
        <p className="text-xs text-zinc-400">
          Choose one or more ways your assigned UK coach can connect
          with you for session onboarding, prep drills, and live
          video links:
        </p>

        {/* Three methods on one horizontal row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "whatsapp" as const, label: "WhatsApp", icon: MessageSquare },
            { id: "call" as const, label: "Phone Call", icon: Phone },
            { id: "email" as const, label: "Email", icon: Mail },
          ].map((mode) => {
            const isSelected = selectedMethods.includes(mode.id);
            const IconComp = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => onToggleMethod(mode.id)}
                className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg border text-[11px] sm:text-xs font-bold transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-[#CCFF00]/10 border-[#CCFF00] text-white"
                    : "bg-[#12141c] border-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                <IconComp
                  className={`w-4 h-4 shrink-0 ${isSelected ? "text-[#CCFF00]" : "text-zinc-400"}`}
                />
                <span className="truncate">{mode.label}</span>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 shrink-0 text-[#CCFF00]" strokeWidth={3} />
                )}
              </button>
            );
          })}
        </div>

        {/* Compact confirmation lines for whatever is switched on */}
        {selectedMethods.length > 0 && (
          <div className="space-y-1.5">
            {selectedMethods.includes("whatsapp") && (
              <div className="rounded-lg bg-[#12141c] border border-zinc-800 px-3 py-2 space-y-1.5">
                <div className="flex items-center gap-2 text-[11px]">
                  <MessageSquare className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                  <span className="font-bold text-white truncate">
                    {user.phone
                      ? `WhatsApp: ${user.phone}`
                      : "Add your WhatsApp number"}
                  </span>
                  {user.phone && (
                    <label className="flex items-center gap-1 ml-auto shrink-0 text-[10px] text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={whatsappIsCurrent}
                        onChange={(e) => setWhatsappIsCurrent(e.target.checked)}
                        className="w-3 h-3 accent-[#CCFF00]"
                      />
                      on WhatsApp
                    </label>
                  )}
                </div>
                {(!user.phone || !whatsappIsCurrent) && (
                  <PhoneInput
                    label=""
                    value={whatsappNumberInput}
                    onChange={setWhatsappNumberInput}
                    inputClassName="w-full bg-[#0e1319] border border-zinc-700 rounded-md pl-[104px] pr-2.5 py-1.5 text-[11px] text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#CCFF00]"
                  />
                )}
              </div>
            )}

            {selectedMethods.includes("call") &&
              (user.phone ? (
                <div className="rounded-lg bg-[#12141c] border border-zinc-800 px-3 py-2 flex items-center gap-2 text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                  <span className="font-bold text-white truncate">
                    We'll call you on {user.phone}
                  </span>
                </div>
              ) : (
                <div className="rounded-lg bg-[#12141c] border border-zinc-800 p-2">
                  <PhoneInput
                    label=""
                    value={contactPhoneInput}
                    onChange={setContactPhoneInput}
                    inputClassName="w-full bg-[#0e1319] border border-zinc-700 rounded-md pl-[104px] pr-2.5 py-1.5 text-[11px] text-white placeholder-zinc-500 focus:outline-hidden focus:border-[#CCFF00]"
                  />
                </div>
              ))}

            {selectedMethods.includes("email") && (
              <div className="rounded-lg bg-[#12141c] border border-zinc-800 px-3 py-2 flex items-center gap-2 text-[11px]">
                <Mail className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
                <span className="font-bold text-white truncate">
                  Session links to {user.email}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
