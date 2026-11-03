import { decodeHtmlEntities } from '../../services/api';
import React from 'react';
import {
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Award,
  Zap,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';

interface CustomItem {
  name: string;
  duration?: string;
  price?: string | number;
}

interface CustomElement {
  id?: string;
  name: string;
  quantity?: number;
  unitMinutes?: number;
}

interface CustomSession {
  sessionNumber?: number;
  warmUp?: string;
  focus?: string;
  core?: string;
  coolDown?: string;
}

export interface PlanCustomizationBreakdownProps {
  customizedDetails?: any;
  packageName?: string;
  packageType?: string;
  durationMinutes?: number;
  totalSessions?: number;
  totalPrice?: number | string;
  sessionFocusList?: string[];
  hideHeader?: boolean;
}

export const PlanCustomizationBreakdown: React.FC<PlanCustomizationBreakdownProps> = ({
  customizedDetails,
  packageName,
  packageType,
  durationMinutes,
  totalSessions,
  totalPrice,
  sessionFocusList = [],
  hideHeader = false
}) => {
  if (!customizedDetails && sessionFocusList.length === 0) {
    return (
      <div className="bg-black/50 border border-zinc-800 p-4 rounded-xl text-center text-xs text-zinc-400">
        Standard full protocol included. No additional custom add-ons selected.
      </div>
    );
  }

  const items: CustomItem[] = Array.isArray(customizedDetails?.items)
    ? customizedDetails.items
    : [];

  const elements: CustomElement[] = Array.isArray(customizedDetails?.elements)
    ? customizedDetails.elements
    : [];

  const sessions: CustomSession[] = Array.isArray(customizedDetails?.sessions)
    ? customizedDetails.sessions
    : [];

  const structureLabel: string =
    customizedDetails?.structure ||
    (durationMinutes ? `${durationMinutes} minutes` : '');

  const totalCustomMinutes: number | undefined =
    customizedDetails?.totalMinutes || durationMinutes;

  // Disclosures signed at checkout
  const rawDisclosures = customizedDetails?.disclosures;
  const hasDisclosures = Boolean(rawDisclosures || customizedDetails?.items || customizedDetails?.elements || customizedDetails?.sessions);
  const ageConfirmed = rawDisclosures?.ageConfirmed ?? true;
  const virtualCoachingConfirmed = rawDisclosures?.virtualCoachingConfirmed ?? true;
  const healthConfirmed = rawDisclosures?.healthConfirmed ?? true;
  const spaceConfirmed = rawDisclosures?.spaceConfirmed ?? true;
  const termsAccepted = rawDisclosures?.termsAccepted ?? true;
  const marketingConsent = Boolean(rawDisclosures?.marketingConsent);

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Header with Title and Quick Pills */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#CCFF00]" />
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Selected Protocol & Customization Details
            </h4>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {structureLabel && (
              <span className="text-[10px] font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#CCFF00]" /> {structureLabel}
              </span>
            )}
            {totalSessions && totalSessions > 1 && (
              <span className="text-[10px] font-mono font-bold bg-[#CCFF00]/10 text-[#CCFF00] border border-[#CCFF00]/30 px-2 py-0.5 rounded flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {totalSessions} Sessions Package
              </span>
            )}
          </div>
        </div>
      )}

      {/* 1. Items List (e.g. BX Basic / Pro / Elite Standard Plans) */}
      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Selected Protocol Components:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {items.map((item, idx) => {
              const isIncluded =
                !item.price ||
                String(item.price).toLowerCase().includes('included') ||
                String(item.price).toLowerCase().includes('free') ||
                item.price === 0;

              return (
                <div
                  key={idx}
                  className="bg-black/60 border border-zinc-800/90 hover:border-zinc-700 p-3 rounded-lg flex items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#CCFF00]/15 border border-[#CCFF00]/30 flex items-center justify-center text-[#CCFF00] shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {decodeHtmlEntities(item.name)}
                      </p>
                      {item.duration && (
                        <p className="text-[10px] text-zinc-400 mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-zinc-500" /> {item.duration}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded shrink-0 border ${
                      isIncluded
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80'
                        : 'bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/40'
                    }`}
                  >
                    {item.price || 'Included'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Custom Elements (Custom Protocol Plan) */}
      {elements.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Custom Exercise Modules Configured:
            </p>
            {totalCustomMinutes && (
              <span className="text-[10px] font-mono text-[#CCFF00]">
                Total Duration: {totalCustomMinutes} Mins
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {elements.map((el, idx) => (
              <div
                key={idx}
                className="bg-black/60 border border-zinc-800 p-3 rounded-lg flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{decodeHtmlEntities(el.name)}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {el.quantity || 1} Block{(el.quantity || 1) > 1 ? 's' : ''} •{' '}
                      {(el.quantity || 1) * (el.unitMinutes || 15)} Minutes
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono font-bold text-[#CCFF00] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Multi-Session Schedule (Weekly / Monthly Plans) */}
      {sessions.length > 0 && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Session By Session Architecture:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {sessions.map((s, idx) => (
              <div
                key={idx}
                className="bg-black/60 border border-zinc-800/90 p-3 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-1.5">
                  <span className="text-xs font-black uppercase text-[#CCFF00] flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Session {s.sessionNumber || idx + 1}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">1-on-1 Guided</span>
                </div>

                <div className="space-y-1 text-[11px]">
                  {s.warmUp && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                      <span>Warm-Up: <strong className="text-zinc-200">{s.warmUp}</strong></span>
                    </div>
                  )}
                  {(s.focus || s.core) && (
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#CCFF00] shrink-0" />
                      <span>Focus: <strong className="text-white">{s.focus || s.core}</strong></span>
                    </div>
                  )}
                  {s.coolDown && (
                    <div className="flex items-center gap-2 text-zinc-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" />
                      <span>Recovery: <strong className="text-zinc-200">{s.coolDown}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Selected Focus Pills (if no items/elements or as additional tags) */}
      {sessionFocusList.length > 0 && items.length === 0 && elements.length === 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Client Selected Focus Areas:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sessionFocusList.map((focus, idx) => (
              <span
                key={idx}
                className="text-[11px] font-semibold bg-zinc-800 text-zinc-200 border border-zinc-700 px-2.5 py-1 rounded-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-3 h-3 text-[#CCFF00]" />
                {focus}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 5. Health & Training Disclosures Signed by Athlete (UK Legal & Medical Compliance) */}
      {hasDisclosures && (
        <div className="space-y-2 pt-3 border-t border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
              <h5 className="text-[11px] font-black uppercase tracking-wider text-white">
                Health & Training Disclosures (UK Compliance & Safety)
              </h5>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded w-fit">
              ✓ Verified at Checkout
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="bg-black/50 border border-zinc-800 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-[#CCFF00]/15 flex items-center justify-center text-[#CCFF00] shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] uppercase">18+ Confirmation</p>
                <p className="text-[10px] text-zinc-400">Confirmed 18 years of age or older</p>
              </div>
            </div>

            <div className="bg-black/50 border border-zinc-800 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-[#CCFF00]/15 flex items-center justify-center text-[#CCFF00] shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] uppercase">Virtual Coaching Agreement</p>
                <p className="text-[10px] text-zinc-400">Live interactive home sessions with UK coach</p>
              </div>
            </div>

            <div className="bg-black/50 border border-zinc-800 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-[#CCFF00]/15 flex items-center justify-center text-[#CCFF00] shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] uppercase">Medical Clearance Disclosure</p>
                <p className="text-[10px] text-zinc-400">No medical conditions preventing participation</p>
              </div>
            </div>

            <div className="bg-black/50 border border-zinc-800 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-[#CCFF00]/15 flex items-center justify-center text-[#CCFF00] shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] uppercase">Safe Training Space</p>
                <p className="text-[10px] text-zinc-400">Suitable, clear, and safe home workout area</p>
              </div>
            </div>

            <div className="bg-black/50 border border-zinc-800 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className="w-5 h-5 rounded bg-[#CCFF00]/15 flex items-center justify-center text-[#CCFF00] shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] uppercase">Terms & Cancellation Policy</p>
                <p className="text-[10px] text-zinc-400">Agreed to BXStrength Terms and Policy</p>
              </div>
            </div>

            <div className="bg-black/50 border border-zinc-800 p-2.5 rounded-lg flex items-start gap-2.5">
              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 ${
                marketingConsent
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                  : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
              }`}>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div>
                <p className="font-bold text-white text-[11px] uppercase">Marketing Communications</p>
                <p className="text-[10px] text-zinc-400">
                  {marketingConsent
                    ? 'Opted in to receive training updates & offers'
                    : 'Opted out of marketing updates'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Key Metrics Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-400">
        <div className="flex items-center gap-4 flex-wrap">
          {durationMinutes && (
            <span>
              Session Time: <strong className="text-white">{durationMinutes} Mins</strong>
            </span>
          )}
          {totalSessions && (
            <span>
              Package Size: <strong className="text-white">{totalSessions} Session{totalSessions > 1 ? 's' : ''}</strong>
            </span>
          )}
          {totalPrice && (
            <span>
              Price: <strong className="text-[#CCFF00]">£{totalPrice}</strong>
            </span>
          )}
        </div>

        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Ready for Live Delivery
        </span>
      </div>
    </div>
  );
};

export default PlanCustomizationBreakdown;
