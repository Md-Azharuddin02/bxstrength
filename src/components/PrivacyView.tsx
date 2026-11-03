import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, Eye, Server, UserCheck, Key, FileCheck, Building,
  Mail, Phone, MapPin, AlertCircle, Info, FileText, CheckCircle2, Globe,
  CreditCard, RefreshCw, Scale, HeartPulse, Search, HelpCircle, AlertTriangle
} from 'lucide-react';

export const PrivacyView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const privacySections = [
    {
      id: 'priv-1',
      num: '1',
      title: 'Who We Are',
      icon: Building,
      content: (
        <div className="space-y-3">
          <p>
            BXStrength is a premier international digital performance &amp; fitness coaching platform serving athletes across the United Kingdom and India.
          </p>
          <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-2 text-xs">
            <p className="flex items-start gap-2 text-zinc-300">
              <MapPin className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
              <span>Headquarters Address:</span>
              <strong className="text-white">185/A, Street No. 3, Zakir Nagar, Okhla, New Delhi - 110025, India</strong>
            </p>
            <p className="flex items-center gap-2 text-zinc-300">
              <Mail className="w-4 h-4 text-[#CCFF00]" />
              <span>Privacy &amp; Support Email:</span>
              <a href="mailto:support@bxstrength.com" className="text-white font-bold underline">support@bxstrength.com</a>
            </p>
            <p className="flex items-center gap-2 text-zinc-300">
              <Phone className="w-4 h-4 text-[#CCFF00]" />
              <span>Customer Support Phone:</span>
              <a href="tel:+918423594482" className="text-white font-mono font-bold">+91-8423594482</a>
            </p>
            <p className="flex items-center gap-2 text-zinc-300">
              <UserCheck className="w-4 h-4 text-[#CCFF00]" />
              <span>Grievance Contact:</span>
              <strong className="text-white">Grievance Officer / Customer Resolution Team</strong>
            </p>
            <p className="flex items-center gap-2 text-zinc-300">
              <Mail className="w-4 h-4 text-[#CCFF00]" />
              <span>Grievance Email:</span>
              <a href="mailto:grievance@bxstrength.com" className="text-[#CCFF00] font-bold underline">grievance@bxstrength.com</a>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'priv-2',
      num: '2',
      title: 'Scope',
      icon: FileText,
      content: (
        <p>
          This Policy applies to personal information processed by BXStrength in connection with its website, virtual fitness services, customer support, booking, payments, marketing and related business operations. Third-party platforms used by BXStrength may also process information under their own privacy policies.
        </p>
      )
    },
    {
      id: 'priv-3',
      num: '3',
      title: 'Information We May Collect',
      icon: Eye,
      content: (
        <div className="space-y-4">
          <p>We may collect and process different categories of information depending on how you interact with BXStrength:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1.5">
              <strong className="text-[#CCFF00] font-black uppercase block text-[11px]">3.1 Identity &amp; Contact Information</strong>
              <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                <li>Full Name</li>
                <li>Email address</li>
                <li>Phone / WhatsApp number</li>
                <li>Country or general location information supplied by you</li>
                <li>Account or booking identifiers</li>
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1.5">
              <strong className="text-[#CCFF00] font-black uppercase block text-[11px]">3.2 Booking &amp; Service Information</strong>
              <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                <li>Services and Session Packs purchased</li>
                <li>Session dates, times and attendance</li>
                <li>Coach assignment details</li>
                <li>Customer-support communications</li>
                <li>Programme preferences &amp; stated fitness goals</li>
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1.5">
              <strong className="text-[#CCFF00] font-black uppercase block text-[11px]">3.3 Fitness &amp; Health-Related Information</strong>
              <p className="text-zinc-300 leading-relaxed">
                To support responsible remote fitness coaching, BXStrength may ask for limited information about fitness experience, injuries, restrictions, relevant medical conditions, pregnancy status where relevant, exercise readiness or other information that may affect participation. We aim to collect only information reasonably necessary for the purpose.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1.5">
              <strong className="text-[#CCFF00] font-black uppercase block text-[11px]">3.4 Payment &amp; Transaction Information</strong>
              <p className="text-zinc-300 leading-relaxed">
                BXStrength may receive transaction references, payment status, amount, currency, payment method category, refund status and related billing information. Complete payment-card details are generally handled directly by the authorised payment provider rather than stored by BXStrength.
              </p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1.5">
              <strong className="text-[#CCFF00] font-black uppercase block text-[11px]">3.5 Website, Device &amp; Usage Information</strong>
              <ul className="list-disc pl-4 space-y-1 text-zinc-300">
                <li>IP address or approximate network location</li>
                <li>Browser and device information</li>
                <li>Website interactions and pages viewed</li>
                <li>Cookie and analytics identifiers</li>
                <li>Security and fraud-prevention telemetry</li>
              </ul>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-1.5">
              <strong className="text-[#CCFF00] font-black uppercase block text-[11px]">3.6 &amp; 3.7 Preferences &amp; Media</strong>
              <p className="text-zinc-300 leading-relaxed">
                We record communication and marketing consent choices. If you voluntarily provide a testimonial, review, transformation image, audio, video or other media, BXStrength may process that material based on appropriate separate permission.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'priv-4',
      num: '4',
      title: 'How We Use Personal Information',
      icon: Server,
      content: (
        <div className="space-y-3">
          <p>We use your personal information for specific, lawful purposes including:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-zinc-300">
            {[
              'To create and manage bookings and customer accounts.',
              'To provide purchased virtual fitness services and customer support.',
              'To tailor sessions within the scope of the selected programme and information supplied.',
              'To manage payments, refunds, reconciliation, fraud prevention and transaction records.',
              'To communicate booking confirmations, reminders, operational notices and service updates.',
              'To respond to questions, complaints and grievance requests.',
              'To maintain website security, prevent misuse and improve service reliability.',
              'To analyse website use and improve BXStrength services, where permitted.',
              'To send marketing communications where the required permission exists.',
              'To comply with legal, accounting, tax, regulatory and dispute-resolution obligations.',
              'To use approved testimonials or media for marketing where appropriate permission has been obtained.'
            ].map((item, idx) => (
              <div key={idx} className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: 'priv-5',
      num: '5',
      title: 'Lawful Grounds for Processing',
      icon: Scale,
      content: (
        <p>
          Depending on the jurisdiction and purpose, BXStrength may process personal information because it is necessary to perform a contract with you, because we have a legal obligation, because we have a legitimate business interest that is not overridden by your rights, or because you have given consent. Where consent is used, you may withdraw it for future processing, subject to legal and operational limitations.
        </p>
      )
    },
    {
      id: 'priv-6',
      num: '6',
      title: 'Health Information and Other Sensitive Data',
      icon: HeartPulse,
      content: (
        <div className="space-y-3">
          <p>
            Health-related information can receive enhanced legal protection. For UK customers, information concerning physical or mental health may be special-category personal data. Where required, BXStrength will identify both an appropriate lawful basis and a separate condition for processing such information. For voluntary fitness-readiness and health information, BXStrength may rely on explicit consent where appropriate and will seek to limit collection to information reasonably necessary for participation and safety-related coaching decisions.
          </p>
          <div className="bg-amber-950/40 border border-amber-800/60 p-4 rounded-xl text-xs text-amber-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-black uppercase text-amber-300 mb-0.5">Medical Records Notice:</strong>
              You should not send BXStrength detailed medical records unless we specifically request information that is genuinely necessary. Standard BXStrength coaches are not providing medical diagnosis or treatment.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'priv-7',
      num: '7',
      title: 'Payment Providers',
      icon: CreditCard,
      content: (
        <p>
          Payments may be processed by authorised third-party payment providers such as Razorpay, Cashfree or another approved provider. These providers may collect payment credentials, device information and transaction data directly. Their processing is governed by their own privacy notices and legal obligations. BXStrength receives only the information reasonably required to confirm, reconcile, support or refund a transaction.
        </p>
      )
    },
    {
      id: 'priv-8',
      num: '8',
      title: 'Coaches, Contractors and Service Providers',
      icon: UserCheck,
      content: (
        <p>
          BXStrength may share limited personal information with coaches, customer-support personnel, technology providers, booking systems, video-conferencing providers, hosting providers, analytics services, communications providers or professional advisers where reasonably necessary. Access should be limited to what is required for the relevant role or service.
        </p>
      )
    },
    {
      id: 'priv-9',
      num: '9',
      title: 'International Processing and Transfers',
      icon: Globe,
      content: (
        <p>
          BXStrength operates from India and serves customers internationally. Personal information may therefore be processed in India and in other countries where BXStrength service providers operate. Where applicable data-protection law requires safeguards for international transfers, BXStrength will use an appropriate transfer mechanism or other lawful safeguard.
        </p>
      )
    },
    {
      id: 'priv-10',
      num: '10',
      title: 'Cookies and Similar Technologies',
      icon: ShieldCheck,
      content: (
        <div className="space-y-3">
          <p>
            BXStrength may use cookies and similar technologies for essential website operation, security, preferences, analytics and marketing. Strictly necessary technologies may operate without optional consent where legally permitted. For UK visitors, non-essential analytics or advertising cookies will be managed through an appropriate consent mechanism where required.
          </p>
          <p className="text-xs text-zinc-400">
            Where a cookie preference tool is available, visitors should be able to accept or reject non-essential categories and change their choices later.
          </p>
        </div>
      )
    },
    {
      id: 'priv-11',
      num: '11',
      title: 'Marketing Communications',
      icon: Mail,
      content: (
        <p>
          Marketing consent is separate from acceptance of the Terms. Where required, BXStrength will ask customers to actively opt in to promotional messages. You can unsubscribe from marketing at any time using the method provided in the communication or by contacting <a href="mailto:support@bxstrength.com" className="text-[#CCFF00] font-bold underline">support@bxstrength.com</a>. Operational messages about a booking, payment, safety matter or service are not treated as optional marketing.
        </p>
      )
    },
    {
      id: 'priv-12',
      num: '12',
      title: 'Photos, Videos, Reviews and Transformation Stories',
      icon: Lock,
      content: (
        <p>
          BXStrength will not treat purchase of a service as automatic permission to use a customer’s image, voice, review or transformation story for advertising. Where BXStrength wishes to publish identifiable customer media or testimonials, separate permission will be obtained where required. A customer may contact BXStrength to discuss withdrawal of future marketing use; withdrawal does not necessarily affect processing that was lawful before withdrawal or material already required to be retained for legal reasons.
        </p>
      )
    },
    {
      id: 'priv-13',
      num: '13',
      title: 'Data Retention',
      icon: RefreshCw,
      content: (
        <p>
          BXStrength keeps personal information only for as long as reasonably necessary for the purpose for which it was collected, including service delivery, customer support, tax/accounting records, dispute handling, fraud prevention and legal compliance. Health-readiness information should not be retained longer than reasonably necessary for the coaching and legal purpose for which it was collected.
        </p>
      )
    },
    {
      id: 'priv-14',
      num: '14',
      title: 'Security',
      icon: Key,
      content: (
        <div className="space-y-3">
          <p>
            BXStrength uses reasonable administrative, organisational and technical measures intended to protect personal information against unauthorised access, loss, misuse, alteration or disclosure.
          </p>
          <div className="bg-emerald-950/40 border border-emerald-800/60 p-3.5 rounded-xl text-xs text-emerald-200">
            <strong className="block font-black uppercase text-emerald-400 mb-0.5">Account Protection:</strong>
            No online system can be guaranteed to be completely secure, so customers should also protect passwords, devices and account access.
          </div>
        </div>
      )
    },
    {
      id: 'priv-15',
      num: '15',
      title: 'Your Rights',
      icon: UserCheck,
      content: (
        <div className="space-y-3">
          <p>
            Depending on the law that applies to you, you may have rights relating to access, correction, deletion, restriction, objection, portability, withdrawal of consent or complaint to a data-protection authority.
          </p>
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-2 text-xs text-zinc-300">
            <strong className="text-[#CCFF00] font-black uppercase block text-[11px]">UK &amp; International Data Rights:</strong>
            <p>
              UK customers may have rights under UK data-protection law, including access, rectification, erasure, restriction, objection and data portability. You may also complain to the <strong>UK Information Commissioner’s Office (ICO)</strong> if you believe your rights have been infringed.
            </p>
            <p className="pt-1">
              Customers whose personal data is processed under applicable Indian data-protection law may exercise rights and grievance mechanisms available under that law as provisions apply.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'priv-16',
      num: '16',
      title: 'Exercising Privacy Rights',
      icon: Mail,
      content: (
        <p>
          To make a privacy request, contact <a href="mailto:support@bxstrength.com" className="text-[#CCFF00] font-bold underline">support@bxstrength.com</a> and clearly describe the request. BXStrength may take reasonable steps to verify identity before responding, particularly where disclosure, deletion or account changes could affect security or another person’s rights.
        </p>
      )
    },
    {
      id: 'priv-17',
      num: '17',
      title: 'Children',
      icon: Info,
      content: (
        <p>
          BXStrength launch services are intended for adults aged 18 or over. We do not knowingly offer standard launch services to children. If BXStrength introduces a youth service in the future, separate age-appropriate privacy, consent and safeguarding measures will be implemented.
        </p>
      )
    },
    {
      id: 'priv-18',
      num: '18',
      title: 'Automated Decision-Making',
      icon: Server,
      content: (
        <p>
          BXStrength does not intend to make solely automated decisions using customer health or fitness information that produce legal or similarly significant effects. If this changes, the Privacy Policy will be updated and any additional legal safeguards will be implemented.
        </p>
      )
    },
    {
      id: 'priv-19',
      num: '19',
      title: 'Complaints and Grievances',
      icon: HelpCircle,
      content: (
        <div className="space-y-3">
          <p>
            Please provide enough information for BXStrength to understand the concern. We will review privacy complaints in good faith and respond within the timeframe required by applicable law:
          </p>
          <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-2 text-xs">
            <p className="flex items-center gap-2 text-zinc-300">
              <Mail className="w-4 h-4 text-[#CCFF00]" />
              <span>Privacy / Support Email:</span>
              <a href="mailto:support@bxstrength.com" className="text-white font-bold underline">support@bxstrength.com</a>
            </p>
            <p className="flex items-center gap-2 text-zinc-300">
              <Phone className="w-4 h-4 text-[#CCFF00]" />
              <span>Customer Support Phone:</span>
              <a href="tel:+918423594482" className="text-white font-mono font-bold">+91-8423594482</a>
            </p>
            <p className="flex items-center gap-2 text-zinc-300">
              <UserCheck className="w-4 h-4 text-[#CCFF00]" />
              <span>Grievance Contact:</span>
              <strong className="text-white">Grievance Officer / Customer Resolution Team</strong>
            </p>
            <p className="flex items-center gap-2 text-zinc-300">
              <Phone className="w-4 h-4 text-[#CCFF00]" />
              <span>Grievance Email:</span>
              <a href="mailto:Grievance@bxstrength.com" className="text-white font-mono font-bold">Grievance@bxstrength.com</a>
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'priv-20',
      num: '20',
      title: 'Changes to This Privacy Policy',
      icon: RefreshCw,
      content: (
        <p>
          BXStrength may update this Privacy Policy to reflect changes in services, technology, legal requirements or providers. The latest version will be published with an updated effective date. Where a change materially affects how personal information is used and law requires additional notice or consent, BXStrength will take appropriate steps.
        </p>
      )
    }
  ];

  const filteredPrivacySections = searchQuery.trim() === ''
    ? privacySections
    : privacySections.filter(sec => 
        sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sec.num.includes(searchQuery)
      );

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans">
      
      {/* 1. HEADER BANNER */}
      <div className="relative bg-gradient-to-b from-[#141418] via-[#0f0f12] to-[#0a0a0a] text-white py-16 sm:py-24 border-b border-zinc-800/80 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#CCFF00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            PRIVACY POLICY
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            This Privacy Policy explains how BXStrength collects, uses, stores and shares personal information when you visit BXStrength.com, contact us, create an account, complete fitness onboarding, book or purchase a service, participate in virtual training, communicate with customer support or interact with BXStrength marketing.
          </p>

          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-zinc-500 font-mono">
            <span>Effective Date: 23 September 2026</span>
            <span>•</span>
            <span>Version 1.0</span>
            <span>•</span>
            <span>7Seas Exim trading as BXStrength</span>
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
              placeholder="Search 20 Privacy Clauses (e.g. Health Data, Rights, Cookies)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00] transition-colors"
            />
          </div>

          <div className="text-xs text-zinc-400 font-medium">
            Showing <span className="text-[#CCFF00] font-bold">{filteredPrivacySections.length}</span> of 20 Privacy Sections
          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-8">
        
        {filteredPrivacySections.map((sec) => {
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
                    <span>{sec.num}. {sec.title}</span>
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

        {filteredPrivacySections.length === 0 && (
          <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-white">No privacy sections match "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-[#CCFF00] font-bold underline"
            >
              Clear Search Query
            </button>
          </div>
        )}

      </main>

      {/* 4. FOOTER BUSINESS NOTICE */}
      <footer className="bg-[#121214] py-10 border-t border-zinc-800 text-center text-xs text-zinc-400 space-y-2">
        <p className="font-bold text-white">
          BXStrength Performance Coaching • Effective Date: 23 September 2026
        </p>
        <p>
          Privacy &amp; Support Email: <a href="mailto:support@bxstrength.com" className="text-[#CCFF00] underline">support@bxstrength.com</a> | Phone: <a href="tel:+918423594482" className="text-white font-mono hover:text-[#CCFF00]">+91-8423594482</a> | Grievance Email: <a href="mailto:grievance@bxstrength.com" className="text-[#CCFF00] font-bold underline">grievance@bxstrength.com</a>
        </p>
      </footer>

    </div>
  );
};
