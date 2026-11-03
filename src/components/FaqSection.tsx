import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
  cta?: { label: string; href: string; variant: 'button' | 'link' };
}

export const FaqSection: React.FC<{ onOpenConsultation: () => void; onOpenAssessment: () => void }> = ({
  onOpenConsultation,
  onOpenAssessment,
}) => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const [showAllFaqs, setShowAllFaqs] = useState<boolean>(false);

  const faqs: FaqItem[] = [
    {
      question: 'Why choose BXStrength for live virtual fitness coaching?',
      answer:
        'BXStrength combines live coach-led sessions, flexible home, gym and hybrid training, multiple fitness disciplines, transparent programme options, a 60-second BX Fitness Assessment and a free 15-minute demo within one virtual coaching experience.',
    },
    {
      question: 'How does live virtual personal training with BXStrength work?',
      answer:
        'BXStrength provides live virtual fitness coaching to clients across the UK. You begin with our 60-second BX Fitness Assessment, which helps us understand your goals, current fitness level, training location and available equipment. You can then request a free 15-minute demo before choosing a suitable BXStrength programme. Paid sessions are scheduled with our team after payment confirmation.',
    },
    {
      question: 'Can I train with BXStrength from anywhere in the UK?',
      answer:
        'Yes. BXStrength sessions are delivered live online, so you can train from anywhere in the UK with a suitable internet connection and an appropriate training space.\n\nYou can train from home, your gym, or use a hybrid setup depending on your routine and available equipment.',
    },
    {
      question: 'Are BXStrength sessions personalised to my goals and fitness level?',
      answer:
        'Yes. Your training is planned around factors such as your fitness goals, current ability, selected programme, training environment and available equipment.\n\nThe level and structure of coaching can vary depending on the BXStrength programme you choose.',
    },
    {
      question: 'What happens during the 60-second BX Fitness Assessment?',
      answer:
        'The BX Fitness Assessment asks about your primary goal, current fitness level, preferred training location and available equipment.\n\nAfter completing it, you can view your initial BX Fitness Assessment and request a free 15-minute demo with BXStrength.',
    },
    {
      question: 'Can I try BXStrength before buying a programme?',
      answer:
        'Yes. After completing your BX Fitness Assessment, you can request a free 15-minute BXStrength demo session.\n\nOur team will contact you to arrange a suitable date and time and provide the joining details.',
    },
    {
      question: 'What happens during my first live coaching session?',
      answer:
        'Your first paid session follows the structure of the BXStrength programme you have selected. Your coach will guide you through the planned session, help you understand the exercises and provide live feedback during your training.\n\nBefore the session, our team will confirm the date, time and joining details with you.',
    },
    {
      question: 'Can a BXStrength coach guide my exercise technique online?',
      answer:
        'During live virtual sessions, your coach can provide real-time verbal and visual guidance based on what can be observed through the video session.\n\nHowever, virtual coaching has limitations compared with in-person physical assessment, so customers should train within their own ability and follow the relevant health and safety guidance.',
    },
    {
      question: 'Can I train from home without gym equipment?',
      answer:
        'Yes. BXStrength can support home-based training depending on the programme and your fitness goals.\n\nDuring the assessment, you can tell us what equipment you have available. This may include no equipment, dumbbells, resistance bands, an exercise mat, a bench or boxing equipment.\n\nIf you also have access to a gym, you can choose a gym or hybrid training setup.',
    },
    {
      question: 'What types of training does BXStrength offer?',
      answer:
        'BXStrength offers live virtual coaching across:\n\nStrength Training\nFitness Boxing\nFunctional Training\nMobility\nFlexibility\nMindset & Wellness\n\nDifferent BXStrength programmes include different combinations of these training areas.',
    },
    {
      question: 'Can I combine different types of training in one BXStrength programme?',
      answer:
        'Yes, depending on the programme you choose.\nBX Performance and BX Complete combine multiple training areas, while BX Custom allows you to build a more personalised training combination from selected BXStrength services.\n\nWeekly Flex and Monthly Flex also allow different training focuses within their applicable session structure.',
    },
    {
      question: 'Does BXStrength provide personalised diet or nutrition plans?',
      answer:
        'At present, BXStrength does not offer personalised nutrition or diet-plan services as part of its core coaching programmes.\nOur primary focus is live virtual fitness coaching across strength, fitness boxing, functional training, mobility, flexibility and wellness.',
    },
    {
      question: 'How is my progress monitored?',
      answer:
        'Progress can be reviewed through your training consistency, programme participation, coach observations and the goals discussed as part of your BXStrength journey.\nProgress will vary between individuals depending on factors such as consistency, programme choice, training history, lifestyle and personal circumstances.',
    },
    {
      question: 'How long will it take to see results?',
      answer:
        'There is no single guaranteed timeframe.\n\nFitness progress varies from person to person depending on factors including training consistency, starting fitness level, programme selection, recovery, lifestyle and individual response.\nBXStrength focuses on structured coaching and sustainable progress rather than promising results within a fixed number of days or weeks.',
    },
    {
      question: 'Can BXStrength help me lose fat or build muscle?',
      answer:
        'BXStrength programmes can support fitness goals such as improving strength, conditioning and overall physical fitness.\nHowever, individual outcomes vary and BXStrength does not guarantee a specific amount of fat loss, muscle gain or transformation within a fixed period.',
    },
    {
      question: 'What if I have an injury, health condition or physical limitation?',
      answer:
        'Please tell us about any relevant injury, limitation or health concern during onboarding or before your session.\n\nBXStrength coaches may adapt fitness activities where appropriate within the scope of virtual fitness coaching, but BXStrength is not a medical, diagnostic or emergency healthcare service.\n\nWhere necessary, customers should seek advice from an appropriate qualified healthcare professional before training.',
    },
    {
      question: 'How often is my training approach reviewed?',
      answer:
        'Your training approach may be reviewed according to your selected programme, progress, feedback and changing training needs.\nAny adjustments remain subject to the structure and scope of the BXStrength programme you have purchased.',
    },
    {
      question: 'How much does BXStrength virtual coaching cost?',
      answer:
        'BXStrength offers different live virtual coaching options, with UK-facing prices displayed in GBP(£).\n\nProgramme options include individual sessions, BX Custom, BX Weekly Flex and BX Monthly Flex.\n\nFor the latest programme details and pricing, please refer to the BXStrength programme section before purchase.',
      cta: { label: 'EXPLORE BX PROGRAMMES', href: '/services', variant: 'button' },
    },
    {
      question: 'How are paid BXStrength sessions scheduled?',
      answer:
        'For paid programmes, payment is completed before the final session date and time are arranged.\n\nOnce payment is successfully confirmed, the BXStrength team will contact you to arrange a suitable session and provide the joining details.',
    },
    {
      question: 'Are BXStrength programme prices shown in pounds sterling?',
      answer:
        "Yes. BXStrength's UK-facing programme prices are displayed in GBP(£).\n\nAny applicable programme duration, session allowance and validity information should be reviewed before completing your purchase.",
    },
    {
      question: 'Is BXStrength a physical gym in the UK?',
      answer:
        'No. BXStrength provides live virtual fitness coaching to clients across the United Kingdom.\n\nBXStrength is operated by 7Seas Exim, India, and customers can access eligible coaching sessions online from home, a gym or another suitable training environment.',
      cta: { label: 'View our programmes →', href: '/services', variant: 'link' },
    },
  ];

  const displayedFaqs = showAllFaqs ? faqs : faqs.slice(0, 4);

  return (
    <section className="w-full bg-[#121214] py-20 text-white border-b border-zinc-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-[11px] font-black tracking-widest text-[#CCFF00] uppercase bg-zinc-800/90 border border-zinc-700/80 px-3.5 py-1.5 rounded-full inline-block mb-3 shadow-sm">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
            CLEAR ANSWERS TO YOUR COACHING QUESTIONS
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-3 max-w-2xl mx-auto">
            Get clear, honest answers to all your training, program, and membership questions before starting your journey with BxStrength.
          </p>
        </div>

        <div className="space-y-4">
          {displayedFaqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-white hover:text-zinc-200 transition-colors cursor-pointer"
                >
                  <span className="uppercase tracking-tight flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-black flex items-center justify-center text-[#CCFF00]">
                      ?
                    </span>
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-400 flex-shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-zinc-300 leading-relaxed border-t border-zinc-800/60 animate-in fade-in duration-200">
                    <p className="pl-9 whitespace-pre-line">{faq.answer}</p>
                    {faq.cta && (
                      <div className="pl-9 pt-4">
                        <a
                          href={faq.cta.href}
                          className={
                            faq.cta.variant === 'button'
                              ? 'inline-block bg-[#CCFF00] hover:bg-[#b8e600] text-black font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all cursor-pointer shadow-lg'
                              : 'inline-block text-[#CCFF00] hover:text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer'
                          }
                        >
                          {faq.cta.label}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* View All FAQs Toggle Button */}
        <div className="text-center mt-6">
          <button
            onClick={() => setShowAllFaqs(!showAllFaqs)}
            className="bg-zinc-800 hover:bg-zinc-700 text-[#CCFF00] border border-zinc-700 font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all cursor-pointer shadow-lg inline-flex items-center gap-2"
          >
            <span>{showAllFaqs ? 'SHOW LESS FAQS' : `VIEW ALL FAQS (${faqs.length} QUESTIONS)`}</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showAllFaqs ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </section>
  );
};
