import React, { useState } from 'react';
import { 
  ShieldCheck, FileText, Scale, AlertTriangle, CreditCard, Lock, CheckCircle2, 
  HelpCircle, Clock, RefreshCw, Mail, Phone, Building, Info, AlertCircle,
  UserCheck, Zap, Globe, Award, ChevronRight, Search, Activity, Check, ExternalLink
} from 'lucide-react';

export const OnboardingTermsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    {
      id: 'sec-a',
      num: 'A',
      title: 'First-Time Customer Service & Participation Acknowledgement',
      icon: UserCheck,
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            This module applies once during onboarding before a customer's first paid participation in any BXStrength virtual fitness service. By completing onboarding or purchasing a Session Pack, you acknowledge and agree to the following core participation principles:
          </p>

          <div className="grid grid-cols-1 gap-3 pt-1">
            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-white uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>1. Age Confirmation (18+)</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">
                You confirm that you are 18 years of age or older and possess full legal capacity to enter into binding agreements.
              </p>
            </div>

            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-white uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>2. Remote Live Virtual Coaching Nature</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">
                You understand that BXStrength provides live virtual fitness coaching delivered via video transmission, and that the coach is not physically present in your location to manipulate equipment or physically assist movement.
              </p>
            </div>

            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-white uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>3. Duty of Accurate Medical Information</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">
                You agree to provide accurate, up-to-date, and truthful information about relevant injuries, medical conditions, pregnancy, exercise restrictions, or other health factors that may affect your participation.
              </p>
            </div>

            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-white uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>4. Not Medical Diagnosis, Treatment, or Physiotherapy</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">
                You understand that standard BXStrength fitness coaching is not medical diagnosis, medical treatment, physiotherapy, rehabilitation, or emergency care. You must seek advice from a licensed physician prior to initiating high-intensity physical activity.
              </p>
            </div>

            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-white uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>5. Safe Home Training Area & Suitable Equipment</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">
                You are solely responsible for setting up a clear, non-slippery, hazard-free training area with adequate space and suitable equipment, and you agree to follow reasonable safety instructions provided by the coach.
              </p>
            </div>

            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-white uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>6. Mandatory Stop-Exercise Protocols</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">
                You must stop exercising immediately and seek medical assistance if you experience concerning symptoms such as severe pain, chest discomfort, faintness, shortness of breath, or unusual dizziness during any session.
              </p>
            </div>

            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-white uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>7. No Result Guarantees</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">
                You understand that individual fitness results vary widely depending on genetics, nutrition, consistency, and compliance. BXStrength does not guarantee a specific weight-loss, body composition, strength, or physical appearance outcome.
              </p>
            </div>

            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-1">
              <div className="flex items-center gap-2 font-black text-xs text-white uppercase">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0" />
                <span>8. Fixed Session Pack Validity & Non-Automatic Renewal</span>
              </div>
              <p className="text-xs text-zinc-400 pl-6">
                You understand that Weekly 3 and Monthly 12 are fixed prepaid Session Packs with stated validity periods (10 days and 30 days respectively) and do not automatically renew or charge your card without your active consent.
              </p>
            </div>
          </div>

          <div className="p-3 bg-zinc-900 border border-[#CCFF00]/40 rounded-xl text-xs text-zinc-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#CCFF00] shrink-0" />
            <span><strong>Required Checkbox Text:</strong> "I confirm that the information I have provided is accurate and I wish to participate in BXStrength virtual fitness services."</span>
          </div>
        </div>
      )
    },
    {
      id: 'sec-b',
      num: 'B',
      title: 'Checkout Summary Specifications',
      icon: FileText,
      content: (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Prior to completing any purchase, BXStrength displays full transparent purchase details on the checkout screen immediately above the acceptance checkboxes:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-[#CCFF00]" />
              <span>Service / Session Pack Name</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-[#CCFF00]" />
              <span>Total Number of Sessions Included</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-[#CCFF00]" />
              <span>Session Duration (e.g., 45 mins / 60 mins)</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-[#CCFF00]" />
              <span>Session Pack Validity Period</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-[#CCFF00]" />
              <span>Scheduled Date / Time / Time Zone</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-[#CCFF00]" />
              <span>Price and Currency (GBP / INR)</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'sec-c',
      num: 'C',
      title: 'Mandatory Checkout Acceptance Rules',
      icon: Lock,
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            To enforce legal certainty and prevent non-consensual orders, all mandatory acceptance checkboxes at checkout are subject to strict technical rules:
          </p>

          <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-black uppercase text-[#CCFF00]">Mandatory Declaration Statement:</h4>
            <p className="text-xs text-white font-mono bg-black p-3 rounded-lg border border-zinc-800">
              "I have read and agree to the  Terms & Conditions and Privacy Policy, including the booking, Session Pack validity, cancellation, refund, virtual-participation and health & safety terms that apply to my purchase."
            </p>
          </div>

          <div className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl text-xs text-zinc-300 space-y-1.5">
            <strong className="text-white block uppercase font-bold">Enforcement Rule:</strong>
            <p>
              1. All acceptance checkboxes are <strong>unticked by default</strong> upon modal load.
            </p>
            <p>
              2. The "Pay & Confirm Booking" / "Pay Securely" action button remains <strong>strictly disabled</strong> until the customer manually ticks all required consent checkboxes.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'sec-d',
      num: 'D',
      title: 'UK Early-Start Acknowledgement & Statutory Cancellation Rights',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            For consumers in the United Kingdom purchasing digital or distance coaching services, UK Consumer Law grants a statutory 14-day cancellation right. Where a customer wishes to begin coaching before the 14-day period expires, explicit acknowledgement is required:
          </p>

          <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-black uppercase text-[#CCFF00]">UK Early-Start Declaration:</h4>
            <p className="text-xs text-white font-mono bg-black p-3 rounded-lg border border-zinc-800">
              "I expressly request BXStrength to begin providing my service during any applicable cancellation period. I understand that if I cancel after service has begun, I may be required to pay for service already supplied, and that my cancellation right may end once the service has been fully performed where applicable law permits."
            </p>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            This requirement ensures complete legal clarity regarding service delivery start dates, proportionate reimbursement for completed sessions, and the lawful expiry of cancellation rights after service completion.
          </p>
        </div>
      )
    },
    {
      id: 'sec-e',
      num: 'E',
      title: 'Optional Marketing Consent Policy',
      icon: Mail,
      content: (
        <div className="space-y-3">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            In compliance with GDPR and international data protection laws, marketing consent is kept strictly separate from mandatory contractual terms:
          </p>

          <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-2">
            <h4 className="text-xs font-black uppercase text-[#CCFF00]">Optional Marketing Statement:</h4>
            <p className="text-xs text-white font-mono bg-black p-3 rounded-lg border border-zinc-800">
              "I would like to receive BXStrength offers, training updates and marketing communications. I understand that I can unsubscribe at any time."
            </p>
          </div>

          <p className="text-xs text-zinc-400">
            Marketing consent is voluntary, unticked by default, and does not affect the customer's ability to purchase or access BXStrength training services.
          </p>
        </div>
      )
    },
    {
      id: 'sec-f',
      num: 'F',
      title: 'Payment & Non-Auto Renewal Guarantee',
      icon: CreditCard,
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            BXStrength Session Packs operate on a transparent single-purchase model without hidden recurring billing:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl">
              <span className="text-[10px] font-black uppercase text-[#CCFF00] block mb-1">NO AUTOMATIC CARD CHARGES</span>
              <p className="text-xs text-zinc-300">
                BXStrength launch Session Packs do not automatically renew or charge your credit/debit card upon expiry.
              </p>
            </div>
            <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl">
              <span className="text-[10px] font-black uppercase text-[#CCFF00] block mb-1">RE-PURCHASE AT YOUR PACE</span>
              <p className="text-xs text-zinc-300">
                When a Session Pack expires or sessions are used up, you return to checkout and purchase a new pack whenever you choose.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'sec-g',
      num: 'G',
      title: 'Limitation of Liability & Legal Protection for BXStrength',
      icon: Scale,
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            To protect BXStrength (operated by 7Seas Exim) against invalid claims, the following liability exclusions apply to the fullest extent permitted under applicable governing law:
          </p>

          <div className="space-y-3 text-xs text-zinc-300">
            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl space-y-1">
              <strong className="text-white uppercase block font-bold">1. Home Environment Assumption of Risk</strong>
              <p className="text-zinc-400">
                BXStrength coaches cannot inspect, control, or sanitize a customer's physical premises. You assume all risks associated with your home training setup, floor surface, room space, and local environmental hazards.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl space-y-1">
              <strong className="text-white uppercase block font-bold">2. Failure to Follow Safety Instructions</strong>
              <p className="text-zinc-400">
                BXStrength is not liable for injuries or damages resulting from a customer's failure to follow coach instructions, exceeding physical limits, or concealing medical conditions.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-3.5 rounded-xl space-y-1">
              <strong className="text-white uppercase block font-bold">3. Technical & Internet Disruption</strong>
              <p className="text-zinc-400">
                BXStrength is not responsible for session disruptions caused by customer-side hardware failures, internet outages, bandwidth degradation, or third-party video software errors.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#141418] via-[#121215] to-[#0d0d10] border border-zinc-800 p-5 rounded-xl space-y-3 text-xs">
            <h4 className="font-black text-white uppercase text-xs flex items-center gap-2">
              <Building className="w-4 h-4 text-[#CCFF00]" />
              <span>Official Business &amp; Legal Entity Information</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-300">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Operating Entity</span>
                <span className="text-white font-bold">7Seas Exim trading as BXStrength</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Document Version</span>
                <span className="text-[#CCFF00] font-mono font-bold">Version 1.0 (23 September 2026)</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Headquarters Address</span>
                <span className="text-white">185/A, Street No. 3, Zakir Nagar, Okhla, New Delhi - 110025, India</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Support Contact</span>
                <a href="mailto:support@bxstrength.com" className="text-[#CCFF00] underline font-bold">support@bxstrength.com</a>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase block">Grievance Contact</span>
                <a href="mailto:grievance@bxstrength.com" className="text-[#CCFF00] underline font-bold">grievance@bxstrength.com</a>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const filteredSections = searchQuery.trim() === ''
    ? sections
    : sections.filter(sec => 
        sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.num.includes(searchQuery.toUpperCase())
      );

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans">
      
      {/* 1. HEADER BANNER */}
      <div className="relative bg-gradient-to-b from-[#141418] via-[#0f0f12] to-[#0a0a0a] text-white py-16 sm:py-24 border-b border-zinc-800/80 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#CCFF00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-700 text-[#CCFF00] text-xs font-mono font-bold uppercase rounded-full">
            <ShieldCheck className="w-4 h-4 text-[#CCFF00]" />
            <span>BXSTRENGTH FINAL WEBSITE CONTENT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            CHECKOUT &amp; ONBOARDING POLICIES
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            Official implementation copy for customer service acknowledgement, mandatory checkout declarations, session pack validity, UK early-start consent, and health &amp; safety disclaimers.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-[11px] text-zinc-500 font-mono">
            <span>7Seas Exim trading as BXStrength</span>
            <span>•</span>
            <span>Version 1.0</span>
            <span>•</span>
            <span>23 September 2026</span>
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="sticky top-16 z-30 bg-[#0d0d10]/95 backdrop-blur-md border-b border-zinc-800/90 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Onboarding & Checkout Terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00] transition-colors"
            />
          </div>

          <div className="text-xs text-zinc-400 font-medium">
            Showing <span className="text-[#CCFF00] font-bold">{filteredSections.length}</span> of 7 Policy Modules
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        
        {filteredSections.map((sec) => {
          const SecIcon = sec.icon;
          return (
            <article 
              key={sec.id}
              id={sec.id}
              className="bg-[#121215] border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl transition-all"
            >
              <div className="flex items-center gap-3 border-b border-zinc-800/80 pb-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-700 text-[#CCFF00] flex items-center justify-center shrink-0 font-mono font-bold text-xs">
                  {sec.num}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-black uppercase text-white tracking-tight flex items-center gap-2">
                    <span>Section {sec.num}: {sec.title}</span>
                  </h2>
                </div>
                <SecIcon className="w-5 h-5 text-zinc-500 shrink-0" />
              </div>

              <div className="text-zinc-300 text-xs sm:text-sm leading-relaxed font-normal">
                {sec.content}
              </div>
            </article>
          );
        })}

      </main>

      {/* 4. FOOTER */}
      <footer className="bg-[#121214] py-10 border-t border-zinc-800 text-center text-xs text-zinc-400 space-y-2">
        <p className="font-bold text-white">
          7Seas Exim trading as BXStrength • Checkout &amp; Onboarding Policy Module • Version 1.0 (23 Sept 2026)
        </p>
        <p>
          Support Email: <a href="mailto:support@bxstrength.com" className="text-[#CCFF00] underline">support@bxstrength.com</a> | Grievance Email: <a href="mailto:grievance@bxstrength.com" className="text-[#CCFF00] font-bold underline">grievance@bxstrength.com</a>
        </p>
      </footer>

    </div>
  );
};
