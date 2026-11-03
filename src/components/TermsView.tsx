import { 
  ShieldCheck, FileText, Scale, AlertTriangle, CreditCard, Lock, CheckCircle2, 
  HelpCircle, Clock, RefreshCw, Mail, Phone, MapPin, Building, Info, AlertCircle,
  UserCheck, Zap, DollarSign, Globe, Award, ChevronRight, Search, Activity
} from 'lucide-react';
import { useState } from 'react';

export const TermsView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    {
      id: 'sec-1',
      num: '1',
      title: 'Business Identity and Contracting Party',
      icon: Building,
      content: (
        <p>
          BXStrength is a global digital performance &amp; fitness coaching platform headquartered at <strong>185/A, Street No. 3, Zakir Nagar, Okhla, New Delhi - 110025, India</strong>. In these Terms, “BXStrength”, “we”, “us” and “our” refer to the BXStrength organization.
        </p>
      )
    },
    {
      id: 'sec-2',
      num: '2',
      title: 'Acceptance of These Terms',
      icon: FileText,
      content: (
        <p>
          By creating an account, completing onboarding, booking a service, purchasing a Session Pack, checking the required acceptance box at checkout or participating in a BXStrength session, you agree to these Terms and the Privacy Policy. The version displayed or linked at the time of purchase applies to that purchase, subject to any mandatory rights that cannot lawfully be excluded.
        </p>
      )
    },
    {
      id: 'sec-3',
      num: '3',
      title: 'Eligibility',
      icon: UserCheck,
      content: (
        <p>
          BXStrength launch services are intended for customers aged 18 or over. We may introduce separate youth services in the future under additional safeguarding and consent arrangements. You must provide accurate information when booking and must not use another person’s identity or payment details without authority.
        </p>
      )
    },
    {
      id: 'sec-4',
      num: '4',
      title: 'Nature of BXStrength Services',
      icon: Activity,
      content: (
        <div className="space-y-3">
          <p>
            BXStrength currently provides live virtual fitness services. Depending on the selected programme, services may include fitness boxing, strength training, functional training, mobility, flexibility and related fitness coaching. Service descriptions, duration, coach availability, session count, validity and price are shown on the relevant product or checkout page.
          </p>
          <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl text-zinc-300">
            <p className="text-xs leading-relaxed font-medium">
              <strong className="text-amber-400 block mb-1 uppercase font-black">No Result Guarantees Notice:</strong>
              BXStrength does not promise or guarantee a particular weight-loss, body-composition, muscle-gain, strength, athletic or appearance result. Individual outcomes vary according to factors including starting point, consistency, nutrition, recovery, health status, lifestyle, adherence and other circumstances outside BXStrength’s control.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'sec-5',
      num: '5',
      title: 'Fitness Services Are Not Medical Care',
      icon: AlertTriangle,
      content: (
        <div className="space-y-3">
          <p>
            Standard BXStrength fitness services do not provide medical diagnosis, medical treatment, emergency care, physiotherapy or mental-health treatment. If you have a medical condition, injury, pregnancy, recent surgery, unexplained symptoms or any concern about whether exercise is appropriate for you, you should obtain suitable advice from a qualified healthcare professional before participating.
          </p>
          <p className="text-xs text-zinc-400">
            Any specialist service separately described as physiotherapy, rehabilitation or mental-wellness support will be subject to its own scope and must be provided by an appropriately qualified professional. The availability of such a specialist service does not change the nature of standard BXStrength fitness coaching.
          </p>
        </div>
      )
    },
    {
      id: 'sec-6',
      num: '6',
      title: 'Health and Participation Responsibilities',
      icon: ShieldCheck,
      content: (
        <div className="space-y-3">
          <p>
            Before taking part, you may be asked to complete a fitness-readiness or participation acknowledgement. You agree to provide information honestly and to update the coach if a relevant condition, injury or restriction changes.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300 pt-1">
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
              <span>Use a suitable, clear, stable training area with adequate space.</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
              <span>Use appropriate clothing, footwear, and equipment where required.</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
              <span>Follow reasonable coach instructions and exercise within capabilities.</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
              <span>Stop immediately if experiencing pain, chest discomfort, or dizziness.</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
              <span>Contact local emergency services if an urgent medical situation arises.</span>
            </li>
            <li className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#CCFF00] shrink-0 mt-0.5" />
              <span>Do not participate while impaired by alcohol, drugs, or unsafe conditions.</span>
            </li>
          </ul>
          <p className="text-xs text-zinc-400 italic pt-1">
            A remote coach cannot physically inspect or control your environment. You remain responsible for conditions in the space from which you participate, except to the extent applicable law provides otherwise.
          </p>
        </div>
      )
    },
    {
      id: 'sec-7',
      num: '7',
      title: 'Prices, Currency and Taxes',
      icon: DollarSign,
      content: (
        <p>
          The price and currency shown at checkout apply to the selected purchase. BXStrength may offer different prices or currencies for different markets. Any mandatory tax or charge that BXStrength is required to collect will be handled according to applicable law. Your bank, card issuer or payment provider may separately impose foreign-exchange or international-transaction charges; those charges are controlled by the provider, not BXStrength.
        </p>
      )
    },
    {
      id: 'sec-8',
      num: '8',
      title: 'Payment',
      icon: CreditCard,
      content: (
        <div className="space-y-3">
          <p>
            Payment is required through an authorised BXStrength checkout or payment method unless BXStrength confirms another arrangement in writing. Payments may be processed by third-party payment providers such as Razorpay, Cashfree or another approved provider. BXStrength does not need to receive or store your complete card credentials where the payment provider handles them directly.
          </p>
          <p className="text-xs text-zinc-400">
            A booking is not confirmed merely because you started checkout. Confirmation occurs when payment has been successfully authorised or received and BXStrength or its booking system issues a confirmation.
          </p>
        </div>
      )
    },
    {
      id: 'sec-9',
      num: '9',
      title: 'Session Packs - No Automatic Renewal',
      icon: RefreshCw,
      content: (
        <div className="space-y-4">
          <p>
            BXStrength launch Session Packs are prepaid, fixed-session products and do <strong>NOT</strong> automatically renew.
          </p>

          <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-zinc-900/90">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-[#18181c] text-white font-black uppercase text-[11px] border-b border-zinc-800">
                <tr>
                  <th className="p-3">Session Pack</th>
                  <th className="p-3">Included Sessions</th>
                  <th className="p-3">Validity Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                <tr>
                  <td className="p-3 font-bold text-white">Weekly 3 Session Pack</td>
                  <td className="p-3">3 live virtual sessions</td>
                  <td className="p-3 font-mono font-bold text-[#CCFF00]">10 calendar days</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-white">Monthly 12 Session Pack</td>
                  <td className="p-3">12 live virtual sessions</td>
                  <td className="p-3 font-mono font-bold text-[#CCFF00]">30 calendar days</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Unless a product page expressly states otherwise, Session Pack validity begins on the date of the first scheduled session. The first session should be scheduled within 7 calendar days after purchase. If a customer does not arrange the first session within that period despite reasonable opportunities to do so, BXStrength may treat validity as beginning on the seventh day after purchase or may agree another start date at its discretion.
          </p>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Unused sessions normally expire at the end of the stated validity period and do not automatically roll over, convert to cash or generate a refund merely because they were not used. After a Session Pack expires, the customer must purchase a new Session Pack to continue. BXStrength may consider a reasonable extension or alternative solution in exceptional circumstances, including a material service issue attributable to BXStrength.
          </p>
        </div>
      )
    },
    {
      id: 'sec-10',
      num: '10',
      title: 'Booking and Time Zones',
      icon: Clock,
      content: (
        <p>
          You are responsible for reviewing the date, time and time zone shown in your booking confirmation. Where the booking system automatically converts time zones, you should still verify the displayed local time before the session. If you believe a confirmation contains an error, contact BXStrength promptly.
        </p>
      )
    },
    {
      id: 'sec-11',
      num: '11',
      title: 'One-Time Session Rescheduling',
      icon: RefreshCw,
      content: (
        <div className="space-y-3">
          <p>
            If you purchase a single one-time session and cannot attend because of a genuine scheduling difficulty, BXStrength will normally offer <strong>one complimentary rescheduling opportunity</strong>, subject to coach availability. Please notify BXStrength as early as reasonably possible and, where practicable, at least 6 hours before the scheduled session.
          </p>
          <p className="text-xs text-zinc-400">
            If the rescheduled session is also missed, or if the customer repeatedly fails to attend without reasonable notice, BXStrength may treat the session as used. Genuine emergencies may be reviewed individually and reasonably.
          </p>
        </div>
      )
    },
    {
      id: 'sec-12',
      num: '12',
      title: 'Session Pack Booking Changes, Late Arrival and No-Shows',
      icon: Clock,
      content: (
        <p>
          A Session Pack booking may be moved where availability permits and where the customer provides reasonable notice. Repeated late cancellations or missed sessions may be treated as used. If you join late, the coach may deliver only the remaining scheduled time so that later customers are not affected. BXStrength will act reasonably when a genuine emergency or material technical issue is reported promptly.
        </p>
      )
    },
    {
      id: 'sec-13',
      num: '13',
      title: 'Coach Availability and Substitution',
      icon: UserCheck,
      content: (
        <p>
          BXStrength may substitute a coach where the originally scheduled coach becomes unavailable, provided the replacement is reasonably suitable for the booked service. If a suitable replacement or reasonable rescheduling cannot be provided, BXStrength will offer an appropriate remedy for the affected session.
        </p>
      )
    },
    {
      id: 'sec-14',
      num: '14',
      title: 'If BXStrength Cancels or Cannot Deliver a Confirmed Session',
      icon: AlertCircle,
      content: (
        <p>
          If BXStrength cancels a confirmed session or cannot provide the purchased session for reasons within its control, the customer will not lose that session. Depending on the circumstances, BXStrength may provide rescheduling, a replacement session, account credit or an appropriate refund for the affected service.
        </p>
      )
    },
    {
      id: 'sec-15',
      num: '15',
      title: 'UK Consumer Cancellation Rights',
      icon: ShieldCheck,
      content: (
        <div className="space-y-3">
          <p>
            If you are an eligible consumer in the United Kingdom purchasing a service online, applicable consumer law may provide a <strong>14-day cancellation period</strong> for a distance service contract. Mandatory rights available to you under applicable law are not removed by these Terms.
          </p>
          <p className="text-xs text-zinc-300 leading-relaxed">
            If you ask BXStrength to begin providing a service during an applicable cancellation period, BXStrength may request your express confirmation before the service begins. If you later cancel after service has started at your request, you may be required to pay a proportionate amount for service already supplied where the law permits. Where a service has been fully performed after the legally required request and acknowledgement, the cancellation right may end to the extent permitted by applicable law.
          </p>
        </div>
      )
    },
    {
      id: 'sec-16',
      num: '16',
      title: 'Customer Cancellation Outside Mandatory Rights',
      icon: HelpCircle,
      content: (
        <p>
          Outside any mandatory statutory cancellation or refund right, eligibility for cancellation, credit, rescheduling or a discretionary refund depends on the product purchased, whether service has begun, whether sessions have already been used, the reason for cancellation and the circumstances described in these Terms. We aim to resolve genuine customer issues fairly rather than applying an unnecessarily rigid process.
        </p>
      )
    },
    {
      id: 'sec-17',
      num: '17',
      title: 'Refund Requests',
      icon: Mail,
      content: (
        <div className="space-y-3">
          <p>
            Refund requests should be sent to <a href="mailto:support@bxstrength.com" className="text-[#CCFF00] font-bold underline">support@bxstrength.com</a> with sufficient information for BXStrength to identify the purchase, such as the customer email, booking reference or transaction reference and the reason for the request. We may request reasonable supporting information where necessary to review the request.
          </p>
          <p className="text-xs text-zinc-400">
            Where applicable law requires BXStrength to provide a full or specified refund, BXStrength will refund the amount legally due. Where BXStrength approves a discretionary or goodwill refund outside a mandatory statutory entitlement, any non-recoverable third-party payment-processing charges retained by a payment gateway, bank or other provider may be taken into account only where permitted by applicable law and where the relevant condition was disclosed to the customer.
          </p>
        </div>
      )
    },
    {
      id: 'sec-18',
      num: '18',
      title: 'Refund Method and Timing',
      icon: Clock,
      content: (
        <p>
          Approved refunds will normally be returned to the original payment method. BXStrength will not ordinarily redirect a refund to an unrelated bank account, card or third party. For a valid statutory cancellation where UK law sets a reimbursement deadline, BXStrength will make reimbursement without undue delay and within the legally required period. For other approved refunds, BXStrength will normally initiate the refund within <strong>5 business days</strong> after approval. Processing by banks commonly takes several business days.
        </p>
      )
    },
    {
      id: 'sec-19',
      num: '19',
      title: 'Service Quality Concerns',
      icon: Award,
      content: (
        <p>
          If you reasonably believe a BXStrength service was not provided as described or with appropriate care and skill, please contact us promptly. We will review the issue and, depending on the circumstances and applicable law, may offer re-performance, a replacement session, coach change, account credit, price reduction, partial refund or full refund. Nothing in these Terms limits a remedy that applicable consumer law requires us to provide.
        </p>
      )
    },
    {
      id: 'sec-20',
      num: '20',
      title: 'Customer Technology and Connectivity',
      icon: Globe,
      content: (
        <p>
          You are responsible for having a functioning device, internet connection and compatible video-call setup. If a session is materially disrupted by a BXStrength platform or coach-side issue, we will act reasonably to reschedule or provide another solution. If disruption arises solely from the customer’s device, internet connection or local environment, BXStrength may not be able to replace the full session, but we may consider reasonable assistance or rescheduling depending on the circumstances.
        </p>
      )
    },
    {
      id: 'sec-21',
      num: '21',
      title: 'Session Recording, Screenshots and Privacy During Classes',
      icon: Lock,
      content: (
        <div className="space-y-3">
          <p>
            BXStrength does not treat participation in a session as permission to publish or market a customer’s image, voice or personal story. If BXStrength wishes to record a session or use customer media for marketing, we will provide appropriate notice and obtain separate permission where required.
          </p>
          <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-800/60 p-3 rounded-lg">
            Customers must not record, livestream, rebroadcast or commercially distribute a private or group session, coach content or another participant’s image or voice without appropriate permission.
          </p>
        </div>
      )
    },
    {
      id: 'sec-22',
      num: '22',
      title: 'Testimonials and Before/After Content',
      icon: Award,
      content: (
        <p>
          BXStrength may publish genuine testimonials or before/after material only where appropriate permission has been obtained. Individual results are not guarantees of results for other customers. BXStrength may edit material for formatting, length, clarity or presentation but should not materially alter the underlying result or create a misleading impression.
        </p>
      )
    },
    {
      id: 'sec-23',
      num: '23',
      title: 'Intellectual Property',
      icon: ShieldCheck,
      content: (
        <p>
          BXStrength names, logos, training materials, class structures, website content, graphics, videos and other proprietary materials are owned by or licensed to BXStrength or the relevant rights holder. A purchase gives the customer a limited personal right to participate in the purchased service. It does not transfer intellectual-property ownership or permit resale, commercial copying, redistribution or unauthorised public use.
        </p>
      )
    },
    {
      id: 'sec-24',
      num: '24',
      title: 'Conduct',
      icon: UserCheck,
      content: (
        <p>
          Customers and coaches should communicate respectfully. BXStrength may pause or end participation where a person seriously harasses another participant or coach, deliberately disrupts a session, acts unlawfully, misuses the platform or creates a material safety risk. Any response will be proportionate to the circumstances.
        </p>
      )
    },
    {
      id: 'sec-25',
      num: '25',
      title: 'Third-Party Services',
      icon: Globe,
      content: (
        <p>
          BXStrength may use third-party providers for payments, booking, video conferencing, analytics, communications, hosting or related functions. Those providers may have their own terms and privacy practices. BXStrength remains responsible for its own obligations but cannot control every independent third-party system or outage.
        </p>
      )
    },
    {
      id: 'sec-26',
      num: '26',
      title: 'Suspension and Refusal of Service',
      icon: AlertTriangle,
      content: (
        <p>
          BXStrength may suspend or refuse future bookings where reasonably necessary for safety, fraud prevention, repeated non-payment, serious misuse, abusive conduct or material breach of these Terms. Where practical, we will explain the reason and deal fairly with any paid but undelivered service, subject to applicable law.
        </p>
      )
    },
    {
      id: 'sec-27',
      num: '27',
      title: 'Events Outside Reasonable Control',
      icon: Info,
      content: (
        <p>
          BXStrength will not be responsible for delay or failure caused by an event genuinely outside its reasonable control, such as widespread internet or cloud outages, major infrastructure failures, natural disasters, war, governmental restrictions or similar events. We will take reasonable steps to reduce disruption and, where appropriate, reschedule affected sessions.
        </p>
      )
    },
    {
      id: 'sec-28',
      num: '28',
      title: 'Liability',
      icon: Scale,
      content: (
        <div className="space-y-3">
          <p>
            Nothing in these Terms excludes or limits liability where doing so would be unlawful, including liability that cannot legally be excluded for death or personal injury caused by negligence or for fraud or fraudulent misrepresentation.
          </p>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Subject to applicable law, BXStrength is not responsible for loss arising solely from a customer’s failure to follow reasonable safety instructions, failure to disclose a known relevant restriction, use of unsafe equipment, unsafe participation space, unauthorised recording or misuse of the service. Any limitation will be interpreted only to the extent permitted by applicable law.
          </p>
        </div>
      )
    },
    {
      id: 'sec-29',
      num: '29',
      title: 'Consumer Rights',
      icon: ShieldCheck,
      content: (
        <p>
          These Terms are intended to operate alongside, not replace, mandatory consumer rights. If a provision of these Terms conflicts with a right that applicable consumer law does not allow a business to exclude or restrict, that mandatory right will prevail to the extent of the conflict.
        </p>
      )
    },
    {
      id: 'sec-30',
      num: '30',
      title: 'Complaints and Grievance Route',
      icon: Mail,
      content: (
        <div className="space-y-3">
          <p>
            We encourage customers to contact BXStrength directly so that issues can be reviewed promptly and fairly:
          </p>
          <div className="bg-[#18181c] border border-zinc-800 p-4 rounded-xl space-y-2 text-xs">
            <p className="flex items-center gap-2 text-zinc-300">
              <Mail className="w-4 h-4 text-[#CCFF00]" />
              <span>Customer Support Email:</span>
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
              <span className="text-white font-bold">Grievance Officer / Customer Resolution Team</span>
            </p>
            <p className="flex items-center gap-2 text-zinc-300">
              <Phone className="w-4 h-4 text-[#CCFF00]" />
              <span>Grievance Email:</span>
              <a href="mailto:Grievance@bxstrength.com" className="text-white font-mono font-bold">Grievance@bxstrength.com</a>
            </p>
          </div>
          <p className="text-xs text-zinc-400">
            Please include your booking or transaction reference where available. BXStrength will acknowledge and handle complaints within a reasonable timeframe.
          </p>
        </div>
      )
    },
    {
      id: 'sec-31',
      num: '31',
      title: 'Governing Law and International Consumers',
      icon: Globe,
      content: (
        <p>
          BXStrength is operated from India. These Terms are governed by the laws applicable to the BXStrength business in India, subject to any mandatory consumer protection that applies to a customer in another jurisdiction. If you are a consumer in the United Kingdom or another jurisdiction that grants non-excludable consumer rights, nothing in these Terms removes those rights.
        </p>
      )
    },
    {
      id: 'sec-32',
      num: '32',
      title: 'Changes to These Terms',
      icon: RefreshCw,
      content: (
        <p>
          BXStrength may update these Terms to reflect changes in services, law, payment arrangements or business operations. The updated version will show a revised effective date. Material changes will apply prospectively unless law requires otherwise. The terms accepted at the time of a purchase will remain relevant to that purchase, subject to mandatory law.
        </p>
      )
    },
    {
      id: 'sec-33',
      num: '33',
      title: 'Contact and Business Information',
      icon: Building,
      content: (
        <div className="bg-gradient-to-br from-[#141418] via-[#121215] to-[#0d0d10] border border-zinc-800 p-6 rounded-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-zinc-500 font-bold uppercase block text-[10px]">Official Brand Name</span>
              <span className="text-white font-black text-sm">BXStrength</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase block text-[10px]">Primary Regions</span>
              <span className="text-[#CCFF00] font-bold">United Kingdom &amp; India</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-zinc-500 font-bold uppercase block text-[10px]">Headquarters Address</span>
              <span className="text-white font-medium">185/A, Street No. 3, Zakir Nagar, Okhla, New Delhi - 110025, India</span>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase block text-[10px]">Customer Support Email</span>
              <a href="mailto:support@bxstrength.com" className="text-[#CCFF00] font-bold underline">support@bxstrength.com</a>
            </div>
            <div>
              <span className="text-zinc-500 font-bold uppercase block text-[10px]">Customer Support Phone</span>
              <a href="tel:+918423594482" className="text-white font-mono font-bold">+91-8423594482</a>
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
        sec.num.includes(searchQuery)
      );

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-sans">
      
      {/* 1. HEADER BANNER */}
      <div className="relative bg-gradient-to-b from-[#141418] via-[#0f0f12] to-[#0a0a0a] text-white py-16 sm:py-24 border-b border-zinc-800/80 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#CCFF00]/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-4">

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-tight">
            TERMS &amp; CONDITIONS
          </h1>

          <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
            These Terms &amp; Conditions ("Terms") govern access to and purchase of services offered under the BXStrength brand through BXStrength.com, associated booking systems, authorised payment links and related customer channels. Please read them before purchasing or participating in a BXStrength service.
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

      {/* 2. SEARCH & QUICK NAVIGATION BAR */}
      <div className="sticky top-16 z-30 bg-[#0d0d10]/95 backdrop-blur-md border-b border-zinc-800/90 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search 33 Clauses (e.g. Refund, Booking, UK Rights)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#CCFF00] transition-colors"
            />
          </div>

          <div className="text-xs text-zinc-400 font-medium">
            Showing <span className="text-[#CCFF00] font-bold">{filteredSections.length}</span> of 33 Sections
          </div>
        </div>
      </div>

      {/* 3. MAIN TERMS CONTENT */}
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

        {filteredSections.length === 0 && (
          <div className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
            <p className="text-sm font-bold text-white">No terms sections match "{searchQuery}"</p>
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
          Support Email: <a href="mailto:support@bxstrength.com" className="text-[#CCFF00] underline">support@bxstrength.com</a> | Phone: <a href="tel:+918423594482" className="text-white font-mono hover:text-[#CCFF00]">+91-8423594482</a> | Grievance Email: <a href="mailto:grievance@bxstrength.com" className="text-[#CCFF00] font-bold underline">grievance@bxstrength.com</a>
        </p>
      </footer>

    </div>
  );
};
