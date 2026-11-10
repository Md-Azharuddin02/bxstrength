import { FitnessClass, Trainer, ServiceItem, Testimonial, BlogPost, ScheduleSlot, MembershipPlan } from '../types';

export const CLASSES_DATA: FitnessClass[] = [
  {
    id: 'boxing-power',
    title: 'BOXING POWER & TECHNIQUE',
    category: 'boxing',
    image: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?auto=format&fit=crop&q=80&w=800',
    description: 'Heavy bag drills, footwork, speed combinations and intense cardiovascular conditioning.',
    durationMinutes: 50,
    intensity: 'Advanced',
    trainerName: 'Head Coach Shaban Faridi',
    caloriesBurned: '700-900 kcal',
    scheduleDays: ['Monday', 'Wednesday', 'Friday']
  },
  {
    id: 'tone-muscle',
    title: 'STRENGTH & HYPERTROPHY',
    category: 'strength',
    image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=800',
    description: 'Progressive overload, periodized compound lifting, and functional muscle building.',
    durationMinutes: 60,
    intensity: 'Advanced',
    trainerName: 'Sadeem',
    caloriesBurned: '600-800 kcal',
    scheduleDays: ['Tuesday', 'Thursday', 'Saturday']
  },
  {
    id: 'tactical-cardio',
    title: 'TACTICAL METABOLIC BLAST',
    category: 'cardio',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800',
    description: 'High-intensity interval training designed to push your endurance and build functional stamina.',
    durationMinutes: 45,
    intensity: 'Intermediate',
    trainerName: 'Moheeb Khan',
    caloriesBurned: '550-750 kcal',
    scheduleDays: ['Wednesday', 'Saturday', 'Sunday']
  }
];

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'personal-training',
    title: 'PERSONAL TRAINING',
    category: 'STRENGTH',
    servicePlan: '1-on-1 Bespoke Strength',
    duration: '60Min / session',
    price: 50,
    priceGbp: 50,
    sessionType: '1-on-1 Personal Session',
    goalPrimaryOutcome: 'Maximized strength power, anatomical leverage optimization, and muscle hypertrophy.',
    whatYouGet: 'One-on-one custom workout plan, dedicated nutritional guidance, bi-weekly body composition analysis.',
    keyDifference: 'Precision progressive overload programming with individual bone leverage adjustments.',
    totalSessions: '1 Session',
    discount: '15% OFF',
    validity: '30 Days',
    complimentary: 'Free Biomechanics Assessment',
    description: 'Bespoke one-on-one strength training tailored to individual anatomy and goals.',
    iconName: 'personal',
    benefits: ['One-on-one custom workout plan', 'Dedicated nutritional guidance', 'Bi-weekly body composition analysis', 'Flexible scheduling']
  },
  {
    id: 'boxing-training',
    title: 'BOXING TRAINING',
    category: 'BOXING',
    servicePlan: 'Pro Combat Technique',
    duration: '45Min / session',
    price: 48,
    priceGbp: 48,
    sessionType: '1-on-1 Pro Coaching',
    goalPrimaryOutcome: 'Authentic boxing mechanics, explosive stamina, and sharp reflex development.',
    whatYouGet: 'Professional ring technique, stamina & core conditioning, stress relief & reflexes.',
    keyDifference: 'Fight-tested mittwork and stance drills adapted safely for all skill levels.',
    totalSessions: '1 Session',
    discount: '20% OFF',
    validity: '30 Days',
    complimentary: 'Hand Wrap Tech Guide & Video Breakdown',
    description: 'Pro boxing drills focusing on stance, weight distribution, punch combinations, and defense.',
    iconName: 'boxing',
    benefits: ['Professional ring technique', 'Stamina & core conditioning', 'Stress relief & reflexes', 'Sparring option for advanced']
  },
  {
    id: 'fitness-training',
    title: 'FITNESS TRAINING',
    category: 'FITNESS',
    servicePlan: 'Fitness Boxing Express',
    duration: '20Min / session',
    price: 30,
    priceGbp: 30,
    sessionType: '1-on-1 Personal Session',
    goalPrimaryOutcome: 'High-yield metabolic conditioning, rapid fat loss, and peak daily energy.',
    whatYouGet: 'Full-body functional movement, modern cardio & machine zone, progress benchmarks.',
    keyDifference: 'High-yield EPOC protocol engineered specifically for busy executive schedules.',
    totalSessions: '1 Session',
    discount: '25% OFF',
    validity: '30 Days',
    complimentary: 'Free Posture Assessment',
    description: 'Full-body functional movement and metabolic conditioning for maximum calorie burn.',
    iconName: 'fitness',
    benefits: ['Full-body functional movement', 'Modern cardio & machine zone', 'Group motivation environment', 'Progress measurement benchmarks']
  }
];

export interface BxTrainer extends Trainer {
  languages: string[];
  availability: string;
  certification: string;
  coachPosition?: string;
  headline?: string;
  secondaryBio?: string;
  clientsServed?: number;
  internationalReach?: string[];
  qualifications?: string[];
  coreExpertise?: string[];
  specialPopulations?: string[];
  professionalExperience?: string[];
  virtualCoachingSkills?: string[];
  imagePosition?: string;
}

export const TRAINERS_DATA: BxTrainer[] = [
  {
    id: 'head-coach',
    name: 'Shaban Faridi',
    role: 'Head Coach | Boxing Instructor | Physiotherapy Professional',
    coachPosition: 'HEADCOACH',
    headline: 'HEAD COACH | BOXING INSTRUCTOR | PHYSIOTHERAPY PROFESSIONAL',
    image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789568682/ChatGPT_Image_Sep_16_2026_07_51_52_PM.png?auto=format&fit=crop&q=80&w=800',
    imagePosition: 'object-[center_top]',
    bio: 'Head Coach and expert team with over 10 years of industry experience combining boxing instruction, strength & conditioning, and physiotherapy-based rehabilitation. Trained at IG Stadium to master boxing technique and athlete development. Brings 6+ years of entrepreneurial experience as a gym owner/operator, delivering personalised transformations to over 1,000 clients worldwide.',
    secondaryBio: 'Our training combines boxing fundamentals, strength work, and rehab-led movement to help you build real, functional fitness. Every session is tailored to your body, goals, and pace.',
    specialties: ['Boxing Instruction', 'Physiotherapy & Rehab', 'Strength & Conditioning', 'Chronic Back Pain Rehab', 'Post-Knee Surgery Recovery', 'Athletic Performance'],
    experienceYears: 10,
    clientsServed: 1000,
    rating: 5.0,
    languages: ['English', 'Hindi'],
    internationalReach: ['Canada', 'UK', 'Australia', 'Saudi Arabia', 'UAE'],
    availability: 'Mon - Sat (Morning & Evening Sessions)',
    certification: 'Diploma in Physiotherapy (Singhania University) & IG Stadium Boxing Master',
    qualifications: [
      'Diploma in Physiotherapy – Singhania University (Rajasthan, India)',
      'Boxing Techniques & Coaching Methods – IG Stadium'
    ],
    certifications: [
      'Diploma in Physiotherapy – Singhania University (Rajasthan, India)',
      'Boxing Techniques & Coaching Methods – IG Stadium',
    ],
    coreExpertise: [
      'Boxing technique: From fundamentals to advanced athlete conditioning.',
      'Rehab & Corrective Exercise: Physiotherapy-focused recovery and mobility training.',
      'Fitness & Conditioning: Strength & conditioning, weight loss, and athletic performance enhancement.'
    ],
    specialPopulations: [
      'Chronic back pain management',
      'Post-knee replacement rehabilitation',
      'Injury recovery & severe mobility limitations',
      'Mental health and wellness support via structured exercise & boxing'
    ],
    professionalExperience: [
      'Gym Owner & Head Coach | Self-Owned Gym (6+ Years)',
      'Business Developer & Fitness Trainer | WOW Gym (Sept 2017 – Oct 2018)'
    ],
    achievements: [
      '1,000+ Global Athlete Transformations (Canada, UK, Australia, Saudi Arabia, UAE)',
      '6+ Years Gym Owner & Operator Experience',
      'IG Stadium Master Boxing Instructor',
      'Former Business Developer & Fitness Trainer at WOW Gym'
    ],
    galleryPhotos: [
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173781/WhatsApp_Image_2026-09-23_at_7.50.17_PM.jpg?auto=format&fit=crop&q=80&w=600',
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173783/WhatsApp_Image_2026-09-23_at_7.50.19_PM_2.jpg?auto=format&fit=crop&q=80&w=600',
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173784/WhatsApp_Image_2026-09-23_at_7.50.19_PM.jpg?auto=format&fit=crop&q=80&w=600',
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173786/WhatsApp_Image_2026-09-23_at_7.50.51_PM.jpg?auto=format&fit=crop&q=80&w=600',
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173781/WhatsApp_Image_2026-09-23_at_7.50.19_PM_1.jpg?auto=format&fit=crop&q=80&w=600',
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173790/WhatsApp_Image_2026-09-23_at_7.50.52_PM.jpg?auto=format&fit=crop&q=80&w=600',
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1790173787/WhatsApp_Image_2026-09-23_at_7.50.52_PM_1.jpg?auto=format&fit=crop&q=80&w=600',
    ],
    galleryVideos: [],
    socials: { instagram: 'https://instagram.com/bxstrength', linkedin: 'https://linkedin.com/' }
  },
  {
    id: 'sadeem',
    name: 'Trainer Sadeem',
    role: 'Fitness Trainer | Strength & Conditioning Coach | Virtual Fitness Coach',
    coachPosition: 'SENIOR STRENGTH & CONDITIONING COACH',
    headline: 'FITNESS TRAINER | STRENGTH & CONDITIONING COACH | VIRTUAL FITNESS COACH',
    image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789571525/sadeem.png?auto=format&fit=crop&q=80&w=800',
    bio: 'Focuses on functional strength, movement mechanics, and injury-free lifting. Sadeem builds tailored training routines around your home or gym setup, guiding every rep with precise form feedback.',
    specialties: ['Strength & Resistance Training', 'Functional Fitness & Muscle Building', 'Fat Loss & Cardio Conditioning', 'Exercise Technique & Form Correction', 'Personalised & Virtual Coaching'],
    experienceYears: 6,
    clientsServed: 750,
    rating: 4.9,
    languages: ['English', 'Hindi'],
    availability: 'Tue - Sun (In-Person & Virtual Coaching)',
    certification: 'Certified Fitness Trainer & Strength Specialist',
    certifications: [
      'Certified Strength & Functional Conditioning Specialist',
      'Exercise Technique & Biomechanics Certified',
      'Virtual & Remote Personal Coaching Master'
    ],
    coreExpertise: [
      'Strength & Functional Training: Strength & Resistance Training, Functional Fitness, Core Strengthening, Muscle Building',
      'Conditioning & Weight Management: Fat Loss Training, Weight Management, Cardiovascular Conditioning',
      'Form & Mobility: Exercise Technique & Form Correction, Mobility & Flexibility Training',
      'Client Care: Beginner & Intermediate Client Training, Personalised Workout Programming, Online/Virtual Coaching, Progress Tracking'
    ],
    professionalExperience: [
      'Private Strength & Conditioning Trainer'
    ],
    virtualCoachingSkills: [
      'Live 1-on-1 virtual training sessions with clear video exercise demonstrations',
      'Form observation and real-time movement corrections online',
      'Custom workout plans adapted to available home or gym equipment',
      'Consistent communication and accountability tracking for online clients'
    ],
    achievements: [
      'Conduct personalised fitness training sessions for clients across varying fitness levels',
      '750+ In-Person & Remote Client Successes',
      'Specialist in Tailored Home & Gym Equipment Adaptations'
    ],
    galleryPhotos: [
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789448786/WhatsApp_Image_2026-08-29_at_4.59.56_AM.jpg?auto=format&fit=crop&q=80&w=800'
    ],
    galleryVideos: [],
    socials: { instagram: 'https://instagram.com/', linkedin: 'https://linkedin.com/' }
  },
  {
    id: 'moheeb-khan',
    name: 'Trainer Moheeb Khan',
    role: 'Fitness Trainer | Strength & Conditioning Coach | Virtual Fitness Coach',
    coachPosition: 'ENDURANCE & METABOLIC SPECIALIST',
    headline: 'FITNESS TRAINER | STRENGTH & CONDITIONING COACH | VIRTUAL FITNESS COACH',
    image: 'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789571578/Muheeb.png?auto=format&fit=crop&q=80&w=800',
    bio: 'Specialises in strength, endurance, and everyday mobility. Moheeb works 1-on-1 with you to fix form in real-time, build sustainable workout habits, and keep you progressing each week.',
    specialties: ['Strength & Muscle Building', 'Fat Loss & Weight Management', 'Cardiovascular Conditioning', 'Exercise Technique & Form', 'Online Personal Training'],
    experienceYears: 5,
    clientsServed: 600,
    rating: 4.9,
    languages: ['English', 'Hindi'],
    availability: 'Mon - Sat (On-Site & Virtual Sessions)',
    certification: 'Certified Personal Trainer & Remote Coaching Specialist',
    certifications: [
      'Certified Fitness Trainer & Functional Fitness Specialist',
      'Cardiovascular & High-Intensity Conditioning Coach',
      'Online Personal Training & Remote Motivation Certified'
    ],
    coreExpertise: [
      'Strength & Hypertrophy: Progressive resistance and core stability.',
      'Fat Loss & Conditioning: Functional intervals and cardiovascular health.',
      'Coaching & Programming: Exercise Technique & Form Correction, Workout Programming, Beginner Fitness Training',
      'Virtual Support: Online Personal Training, Client Motivation & Accountability'
    ],
    professionalExperience: [
      'Fitness Trainer | Box & Strength / Private Training'
    ],
    virtualCoachingSkills: [
      '1-on-1 live online coaching sessions with real-time video demonstrations',
      'Remote technique evaluation and movement guidance',
      'Tailored home and gym workout planning with progress monitoring',
      'Remote motivation and ongoing client accountability'
    ],
    achievements: [
      'Conduct individual and group training sessions aimed at strength, conditioning, and weight management goals',
      '600+ In-Person & Virtual Transformations',
      'Interactive Live Remote Form Evaluation & Progress Monitoring'
    ],
    galleryPhotos: [
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789572640/Moheeb_1.png?auto=format&fit=crop&q=80&w=800',
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789572641/Moheeb_2.png?auto=format&fit=crop&q=80&w=800',
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789573309/Moheeb_3.png?auto=format&fit=crop&q=80&w=800',
      'https://res.cloudinary.com/yuyxn5b0/image/upload/v1789573806/Moheeb_4.png?auto=format&fit=crop&q=80&w=800',
    ],
    galleryVideos: [],
    socials: { instagram: 'https://instagram.com/', linkedin: 'https://linkedin.com/' }
  }
];

export const SCHEDULE_DATA: ScheduleSlot[] = [
  { id: '1', day: 'Monday', time: '07:00 AM - 08:00 AM', className: 'Boxing Power & Technique', trainer: 'Head Coach Shaban Faridi', room: 'Ring Arena B', spotsLeft: 4 },
  { id: '2', day: 'Monday', time: '10:00 AM - 11:30 AM', className: 'Strength & Hypertrophy', trainer: 'Sadeem', room: 'Strength Zone 2', spotsLeft: 2 },
  { id: '3', day: 'Monday', time: '05:00 PM - 06:00 PM', className: 'Tactical Metabolic Blast', trainer: 'Moheeb Khan', room: 'Main Turf', spotsLeft: 8 },
  { id: '4', day: 'Tuesday', time: '08:00 AM - 09:15 AM', className: 'Boxing Power & Technique', trainer: 'Head Coach Shaban Faridi', room: 'Ring Arena B', spotsLeft: 5 },
  { id: '5', day: 'Tuesday', time: '04:00 PM - 05:00 PM', className: 'Strength & Hypertrophy', trainer: 'Sadeem', room: 'Strength Zone 1', spotsLeft: 3 },
  { id: '6', day: 'Wednesday', time: '07:00 AM - 08:00 AM', className: 'Tactical Metabolic Blast', trainer: 'Moheeb Khan', room: 'Main Turf', spotsLeft: 6 },
  { id: '7', day: 'Wednesday', time: '06:00 PM - 07:00 PM', className: 'Boxing Power & Technique', trainer: 'Head Coach Shaban Faridi', room: 'Ring Arena B', spotsLeft: 1 },
  { id: '8', day: 'Thursday', time: '09:00 AM - 10:00 AM', className: 'Strength & Hypertrophy', trainer: 'Sadeem', room: 'Strength Zone 2', spotsLeft: 10 },
  { id: '9', day: 'Thursday', time: '05:30 PM - 06:45 PM', className: 'Tactical Metabolic Blast', trainer: 'Moheeb Khan', room: 'Main Turf', spotsLeft: 4 },
  { id: '10', day: 'Friday', time: '07:00 AM - 08:00 AM', className: 'Boxing Power & Technique', trainer: 'Head Coach Shaban Faridi', room: 'Ring Arena B', spotsLeft: 3 },
  { id: '11', day: 'Friday', time: '05:00 PM - 06:00 PM', className: 'Strength & Hypertrophy', trainer: 'Sadeem', room: 'Strength Zone 1', spotsLeft: 2 },
  { id: '12', day: 'Saturday', time: '09:00 AM - 10:30 AM', className: 'Tactical Metabolic Blast', trainer: 'Moheeb Khan', room: 'Main Turf', spotsLeft: 7 },
  { id: '13', day: 'Saturday', time: '11:00 AM - 12:00 PM', className: 'Boxing Power & Technique', trainer: 'Head Coach Shaban Faridi', room: 'Ring Arena B', spotsLeft: 5 },
  { id: '14', day: 'Sunday', time: '10:00 AM - 11:30 AM', className: 'Strength & Hypertrophy', trainer: 'Sadeem', room: 'Strength Zone 2', spotsLeft: 12 }
];

export const TESTIMONIALS_DATA: Testimonial[] = [];

export const BLOG_POSTS_DATA: BlogPost[] = [
  {
    id: '1',
    title: '10 Essential Hydration & Recovery Tips For Combat Conditioning',
    excerpt: 'Proper hydration starts 24 hours before your fight session. Discover how electrolytes boost muscular power and stamina.',
    content: `Combat conditioning demands a unique level of resilience. Whether you are throwing rotational punch combinations, moving through plyometric footwork drills, powering through dumbbell complexes, or doing a basic workout, your nervous and muscular systems are under relentless demand.

    Yet, most training plateaus do not stem from what happens during the workout itself—they happen because of poor recovery in the hours between them.

    When fluid levels drop and muscles stay locked in chronic tension, reaction time slows, punches lose snap, and joint vulnerability climbs. At BxStrength, we treat recovery not as an afterthought, but as an active component of your conditioning programme.

    Here are ten practical, science-backed hydration and recovery strategies designed to keep you performing at your peak.

    1. Front-Load Your Hydration 24 Hours in Advance

    Waiting until you lace up your trainers to start chugging water is a recipe for a sluggish session. Intracellular hydration takes hours to balance. If you begin a combat conditioning session mildly dehydrated, your stroke volume decreases, your core body temperature spikes faster, and your rate of perceived exertion (RPE) skyrockets within the first three rounds.

    Drink consistently throughout the day leading up to your session rather than attempting to catch up twenty minutes before you start.

    Performance tip: Aim for 500 ml of water with a pinch of quality unrefined sea salt upon waking to replenish fluid lost via respiration overnight and prime cellular uptake.

    2. Prioritise Sodium Over Plain Tap Water

    Water alone does not fully hydrate working muscles under high cardiac output.

    When you sweat heavily through high-intensity shadowboxing or conditioning intervals, you lose essential minerals, primarily sodium, alongside potassium, magnesium, and calcium. Drinking ample amounts of plain water without replenishing sodium dilutes blood plasma, leading to hyponatraemia, brain fog, and painful cramping.

    Electrolytes regulate fluid pressure across cell membranes and facilitate strong, rapid muscular contractions.

    Performance tip: Add a balanced, zero-sugar electrolyte blend or 500–700 mg of sodium to your pre-workout bottle, particularly on warm days or before intense round-based sessions.

    3. Hydrate According to Sweat Rate, Not Thirst

    Thirst is a lagging biological indicator. By the time your mouth feels dry, you have likely already lost 1.5% to 2% of your body mass in water—a threshold where explosive rotational power and cognitive decision-making measurably drop.

    Combat training requires rapid visual processing and motor recruitment. Even minor dehydration blunts your peripheral awareness and delays defensive reactions. Keep a bottle close during recovery intervals between rounds and take small, steady sips rather than gulping down large amounts that will sit heavy in your stomach.

    Performance tip: Weigh yourself before and after a hard conditioning session. For every kilogram of body weight lost through sweat, replace it with 1.25 to 1.5 litres of electrolyte-rich fluid over the next two hours.

    4. Decompress the Thoracic Spine Post-Session

    Combat conditioning places heavy demands on the upper body. Punching mechanics, guard maintenance, and dumbbell presses naturally pull the shoulders forward, while hours spent at an office desk compound thoracic stiffness.

    If you finish a session and immediately sit back down at your desk or collapse onto the sofa, your pectoral muscles, lats, and anterior deltoids will cool down in a shortened, internally rotated position.

    Spending five minutes decompressing your ribcage, neck, and mid-back restores joint mechanics and prevents persistent postural strain.

    Performance tip: Conclude your session with a 2-minute foam roller thoracic extension followed by 90 seconds per side in a half-kneeling open-book rotation to free up rotational mobility.

    5. Refuel the Glycogen Tank Within 45 Minutes

    Boxing rounds and high-intensity interval conditioning rely heavily on the anaerobic glycolytic pathway. Your fast-twitch muscle fibres burn through intramuscular glycogen stores at a rapid pace.

    Post-workout nutrition is about halting muscle protein breakdown and kick-starting glycogen resynthesis. Pairing lean, easily digestible protein with fast-acting carbohydrates ensures amino acids are delivered promptly to repairing muscle tissues. Skipping this window leaves your central nervous system fatigued, extending soreness deep into the following day.

    Performance tip: Aim for 25–35 grams of high-quality protein alongside 40–50 grams of clean carbohydrates (such as a banana with whey or plant protein, or a bowl of oats with berries) within 45 minutes of wrapping up.

    6. Utilise Down-Regulation Breathing to Shift Nervous Systems

    During an intense fight-conditioning block, your sympathetic nervous system ("fight or flight") is fully activated. Cortisol and adrenaline surge, heart rate variability (HRV) drops, and blood flow is directed away from digestion and into the extremities.

    Recovery cannot formally begin until your body shifts into a parasympathetic ("rest and digest") state.

    Instead of jumping straight into a hot shower and immediately opening work emails, spend three to four minutes deliberately lowering your heart rate through structured breathwork.

    Performance tip: Lie on your back with your legs elevated on a chair or bench. Inhale through your nose for 4 seconds, hold for 2 seconds, and perform a slow, unforced exhale through your mouth for 6 to 8 seconds. Repeat for 10 cycles.

    7. Mobilise Rotator Cuffs and Serratus Anterior

    The shoulder girdle is the kinetic conduit through which power transfers from your hips to your hands. Every straight jab, hook, and overhead press requires healthy scapular glide and strong rotator cuff stabilisers.

    Overuse without active care leads to subacromial impingement and anterior shoulder tightness. Taking care of the serratus anterior—the fan-shaped muscle running along your ribs often called the "boxer's muscle"—ensures the shoulder blade wraps cleanly around the ribcage during movement.

    Performance tip: Use a lacrosse ball to gently release trigger points along the rear deltoid, pec minor, and upper lats, followed by 15 repetitions of controlled wall slides to reactivate scapular upward rotation.

    8. Prioritise Slow-Wave Sleep for Tissue Repair

    There is no supplement, cold plunge, or massage gun on earth that can out-compensate for chronic sleep deprivation.

    Deep slow-wave sleep (stages 3 and 4) is when the human body releases up to 70% of its daily human growth hormone (HGH). It is during these hours that cellular micro-tears in muscle fibres mend, joint inflammation cools down, and neuromuscular coordination patterns are consolidated in the motor cortex.

    Consistently cutting your sleep short diminishes punch velocity, increases injury probability, and elevates systemic cortisol.

    Performance tip: Keep your bedroom temperature between 16–18°C and cut screen use 45 minutes before sleep to protect natural melatonin production and maximise deep sleep latency.

    9. Keep Rest Days Truly Active (Zone 1 Flush)

    Complete bed-rest days often leave your joints feeling more locked up and stiff than moderate movement does.

    Low-intensity Zone 1 movement, where your heart rate remains comfortably below 60% of your maximum (you can effortlessly hold a full conversation), acts as an active circulatory pump. It flushes metabolic by-products, promotes blood flow through dense fascial tissue, and supplies recovering tendons with oxygen-rich nutrients without creating further muscular fatigue. A steady 30-minute walk in fresh air, a light cycle, or an easy mobility sequence will accelerate your readiness far better than sitting completely still.

    Performance tip: Schedule one or two dedicated active recovery days per week focused solely on low-impact walking, light hip opener sequences, and ankle/wrist mobility.

    10. Audit Your Biometrics and Avoid Overtraining

    True strength conditioning is not measured solely by how exhausted you feel at the end of an hour; it is measured by how effectively your body adapts and progresses week over week.

    If your resting heart rate is consistently elevated by 5 to 7 beats per minute, your grip strength feels weak, or your motivation feels completely drained before a routine workout, your central nervous system is likely carrying residual systemic fatigue.

    Listening to your body's recovery markers allows you to adjust session intensity strategically rather than pushing blindly into an overtraining slump.

    Performance tip: Take note of your morning resting heart rate and overall energy levels. If two or more markers are unusually depressed, scale back a heavy sparring or conditioning day to a technical form and mobility session.

    Build Unshakeable Conditioning with BxStrength

    High-level physical conditioning is built on two pillars: precise, demanding effort during the session, and intelligent, disciplined recovery outside of it.

    By taking control of your hydration strategy, nervous system regulation, and tissue care, you protect your joints, recover quicker, and ensure that every round you fight is backed by sustained, explosive power.

    At BxStrength, our live 1-on-1 virtual sessions combine technical boxing footwork, compound strength, and bespoke postural restoration, guided in real time by an expert coach who monitors every single rep. Train with purpose. Recover with precision. Lead with strength.

    Book Your Private 1-on-1 Strategy Session with BxStrength BxStrength — Discover Your Strength.`,
        category: 'Nutrition',
        author: 'Head Coach & Team',
        date: 'JULY 18, 2026',
        image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
        readTime: '8 min read'
      },
  {
    id: '2',
    title: 'How Progressive Hypertrophy Training Accelerates Metabolism',
    excerpt: 'Building lean muscular tissue increases your resting metabolic rate even while sleeping. Here is the science behind it.',
    content: `Most conversations around fat loss and metabolism focus on doing more cardio. People spend hours jogging on treadmills, spinning on exercise bikes, or sweating through intense circuits to burn as many calories as possible in an hour.

    While moving more is always helpful, cardio only burns energy while you are actively doing it. The moment you stop running, your calorie burn drops straight back to baseline.

    Building lean muscle through progressive hypertrophy training works differently. Instead of just burning calories during your workout, muscle tissue fundamentally changes how much energy your body requires all day and night—even while resting or sleeping.

    At BxStrength, our training sessions combine explosive combat conditioning with smart dumbbell hypertrophy. Here is the simple science behind how building lean muscle transforms your metabolism.

    1. Muscle Is Living, Active Tissue

    Your body burns a specific number of calories each day just to keep your heart beating, lungs breathing, brain functioning, and organs running. This is called your Resting Metabolic Rate (RMR). Different tissues in the body require different amounts of energy to survive:

    ● Fat tissue is largely inert storage. It burns very few calories just sitting there.

    ● Muscle tissue is metabolically active. It constantly breaks down, repairs, and demands fuel around the clock.

    The more lean muscle you carry, the higher your daily baseline calorie burn becomes, regardless of what you do during the day.

    Simple takeaway: Adding muscle turns your body into an engine that naturally requires more daily fuel just to maintain itself.

    2. The Afterburn Effect: EPOC Explained

    Have you ever noticed your body radiating heat hours after a hard resistance session? That is excess post-exercise oxygen consumption (EPOC), often called the afterburn effect.

    When you lift weights with progressive effort, you create microscopic tears in the muscle fibres and deplete stored energy.

    After your session ends, your body must work overtime to:

    ● Clear metabolic waste and lactic acid.

    ● Replenish glycogen (stored carbohydrates) in the muscles.

    ● Repair damaged muscle fibres and lay down new tissue.

    ● Return your heart rate, core temperature, and hormone levels to baseline.

    This complex recovery process requires oxygen and energy for 24 to 48 hours after your session finishes.

    Simple takeaway: Steady cardio stops burning calories the minute you step off the machine. Resistance training keeps your metabolism elevated long after you have finished your shower.

    3. What "Progressive Overload" Actually Means

    You cannot simply pick up the same light dumbbells for months on end and expect your metabolism to change. The human body is remarkably efficient; it only adapts when given a clear reason to do so.

    Progressive hypertrophy training relies on progressive overload, gradually challenging your muscles over time so they are forced to grow stronger.

    You do not need an entire commercial gym to do this. You can progress by:

    ● Adding a small amount of weight to your dumbbells.

    ● Performing one or two extra, controlled repetitions.

    ● Slowing down the lowering phase of the lift (increasing time under tension).

    ● Improving your technique and range of motion.

    Consistently asking slightly more from your muscles encourages them to repair themselves thicker and denser.

    Simple takeaway: Track your weights and reps. A slight improvement each week ensures your muscles keep adapting and your metabolism stays active.

    4. Improving Insulin Sensitivity and Nutrient Partitioning

    When you eat carbohydrates, your body breaks them down into glucose (blood sugar) and releases insulin to move that sugar into cells for energy.

    If you sit at a desk all day without much muscle mass, your cells become less sensitive to insulin. Extra calories have nowhere useful to go and end up stored as body fat.

    Progressive hypertrophy training completely changes how your body handles food:

    ● Contracted muscles draw in glucose from your bloodstream without needing as much insulin.

    ● Muscle tissue acts as a hungry sponge for carbohydrates, storing them as usable glycogen rather than fat.

    ● Your body becomes significantly better at directing food toward recovery and performance.

    Simple takeaway: Building lean muscle allows you to eat more wholesome food without unwanted weight gain, because your body uses that food to repair tissue instead of storing it.

    5. Preventing the Metabolic Slowdown of Dieting

    Whenever you cut calories to lose weight without lifting weights, your body tries to conserve energy. It often sheds both fat and valuable muscle tissue.

    Losing muscle drops your resting metabolic rate. This is why people on crash diets frequently hit stubborn plateaus and quickly regain weight the moment they return to normal eating.

    Hypertrophy training signals to your body that your muscle tissue is essential. Even in a calorie deficit, lifting weights forces your body to hold onto its muscle and pull energy almost exclusively from stored fat.

    Simple takeaway: Lifting weights protects your metabolism while shedding fat, ensuring your weight loss is sustainable over the long term.

    6. Strength Training Supports Healthy Hormones

    Sitting still for long hours while managing high work stress raises cortisol, your primary stress hormone. Chronic high cortisol promotes fat storage around your midsection and breaks down muscle.

    Structured resistance training stimulates positive hormonal responses:

    ● It supports growth hormone release, which assists in tissue repair and fat breakdown.

    ● It helps balance blood sugar and improves testosterone-to-cortisol ratios.

    ● It improves sleep quality, which is when your body releases the majority of its natural recovery hormones.

    A balanced endocrine system makes it much easier to stay lean, energetic, and focused throughout demanding workdays.

    Simple takeaway: Lifting weights helps regulate your internal chemistry, taking you out of chronic stress mode and into an active, healthy rhythm.

    7. How BxStrength Combines Boxing with Hypertrophy

    You do not have to choose between athletic boxing conditioning and building lean muscle. Combining them delivers the best of both worlds.

    At BxStrength, our live 1-on-1 virtual sessions integrate:

    ● Dynamic combat rounds to challenge your cardiovascular system, burn immediate energy, and train rotational core power.

    ● Targeted dumbbell hypertrophy to strengthen your back, shoulders, and glutes, build lean tissue, and keep your metabolic engine running high all day.

    This hybrid approach gives you the speed, agility, and stamina of a fighter alongside the functional strength and high metabolism of a well-conditioned athlete.

    Build an Athletic, High-Performing Body with BxStrength

    Boosting your metabolism is not about exhausting yourself on a treadmill or living on tiny salads. It is about giving your body the right stimulus to build resilient, functional muscle that works for you 24 hours a day.

    With BxStrength, you train live with an expert coach who ensures every repetition is performed with strict form, correct weights, and purposeful intensity, all from the comfort of your home.

    Train smarter. Build lean muscle. Fire up your metabolism.

    Book Your Private 1-on-1 Strategy Session with BxStrength BxStrength — Discover Your Strength.`,
        category: 'Workouts',
        author: 'Sadeem',
        date: 'JULY 12, 2026',
        image: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=800',
        readTime: '7 min read'
      },
    {
      id: '3',
      title: 'Mindful Breathwork: Decreasing Cortisol After Heavy Fight Sessions',
      excerpt: 'Integrating 10 minutes of parasympathetic breathwork lowers systemic inflammation and speeds up recovery times.',
      content: `When you step out of a hard training session, your heart is pounding, your palms are warm, and your muscles are buzzing with adrenaline.

      For the last 45 minutes, your body was convinced it was in a real fight. You threw rapid combinations, ducked under imaginary hooks, and pushed your heart rate well into the red zone. That sharp, wired feeling keeps you sharp in the moment, but staying stuck in that state long after your workout does more harm than good.

      If you jump straight off the training mat, grab your phone, and head straight back into work emails or a busy commute, your body stays locked in high alert. Cortisol levels remain elevated, your nervous system cannot rest, and real recovery never actually gets started.

      At BxStrength, we treat the minutes right after your session as an essential part of the training itself. Taking just ten minutes to slow your breath down tells your brain that the fight is over, bringing your body back into balance so you can heal, sleep better, and come back stronger.

      Here is how simple, mindful breathwork protects your body after intense combat sessions.

      1. Tell Your Brain the Fight Is Finished

      During intense sparring or interval rounds, your sympathetic nervous system is in "fight or flight" mode.

      Adrenaline surges, blood vessels constrict around your digestive tract, and cortisol floods your bloodstream to keep energy immediately available. This response is completely normal and necessary for high output. The problem begins when you do not shut it down.

      When you finish an intense session and immediately rush into your everyday tasks, your brain never gets the signal that danger has passed. Cortisol stays high, keeping your muscles tense and delaying tissue repair.

      Taking a few minutes of quiet, deliberate breathing acts like an emergency brake for your nervous system, nudging you back into "rest and digest" mode.

      Recovery tip: As soon as your last round finishes, do not rush off. Sit or lie down quietly on your mat, close your eyes, and place one hand on your stomach before you touch your phone or drink your shake.

      2. Shift from Chest Breathing to Belly Breathing

      Notice how you breathe when you are exhausted: short, shallow gasps high up in your chest.

      Chest breathing relies on your neck, collarbone, and upper chest muscles. It sends panic signals right back up to the brain, reinforcing stress and keeping your pulse unnecessarily high.

      Breathing deeply into your diaphragm (belly breathing) does the exact opposite.

      As your diaphragm moves down, it creates gentle pressure in your abdomen and stimulates the vagus nerve. This nerve acts as your body's natural internal pacemaker, instantly telling your heart to slow down and your blood vessels to relax.

      Recovery tip: Inhale gently through your nose and let your belly rise against your hand. Try to keep your chest and shoulders completely still as you breathe.

      3. Make Your Exhale Longer Than Your Inhale

      The real secret to calming your heart rate is in how you exhale. When you breathe in, your heart rate naturally picks up slightly. When you breathe out slowly and smoothly, your heart rate slows down.

      If you want to flush cortisol out of your system quickly, make your exhale roughly twice as long as your inhale. This simple change triggers an immediate physical relaxation response throughout your whole body, easing the tension in your jaw, neck, and shoulders.

      Recovery tip: Try the 4-7-8 pattern. Breathe in quietly through your nose for 4 seconds, hold gently for 7 seconds, and release a slow, smooth exhale through your mouth for 8 seconds. Repeat this for four rounds.

      4. Cool Down Systemic Inflammation

      High-intensity combat conditioning naturally causes microscopic muscle tears and mild, temporary inflammation.

      Under normal circumstances, your body repairs this damage quickly, making your muscles stronger. But if cortisol stays high for hours afterwards, it interferes with your immune response, keeping inflammation lingering far longer than it should. This is usually why you wake up feeling completely battered and stiff the next morning.

      Ten minutes of mindful breathwork helps clear metabolic waste, improves cellular oxygen delivery, and dampens excessive inflammatory signals.

      Recovery tip: Pair your breathwork with comfortable legs-up-the-wall positioning. Propping your feet up on a wall or bench while you breathe helps drain pooled blood and fluid from your legs back towards your heart.

      5. Use the "Physiological Sigh" for Instant Relief

      Sometimes you finish a brutal workout and your chest feels tight, your thoughts are racing, and you simply cannot settle down into slow breathing.

      When that happens, use what neuroscientists call the physiological sigh. It is the body's natural way of rebalancing oxygen and carbon dioxide levels in the lungs. You see animals do it when they lie down to rest, and babies do it when crying themselves to sleep.

      Taking two quick inhales through the nose pops open collapsed air sacs (alveoli) in your lungs, and a long, gentle sigh out through the mouth dumps carbon dioxide, bringing your pulse down within seconds.

      Recovery tip: Take a deep breath in through your nose, pause for a split second, sniff in a tiny bit more air at the very top, and then let out a long, effortless sigh through your mouth. Repeat this three to four times until your breathing settles.

      6. Protect Your Evening Sleep Quality

      Working out late in the afternoon or evening can sometimes make it surprisingly hard to fall asleep at night.

      Even though your muscles are physically exhausted, your nervous system remains overstimulated. You lie in bed feeling tired but wired, tossing and turning while your mind runs through your to-do list.

      By dedicating ten minutes to breathwork straight after your session, you lower core stress hormones before they can disrupt your natural evening melatonin production. You step into the shower relaxed rather than wound up, setting yourself up for deep, uninterrupted sleep.

      Recovery tip: If you train after 5:00 PM, make breathwork non-negotiable. Spend five minutes doing slow nasal breathing straight after your workout, and repeat it for five minutes right before you climb into bed.

      7. Build Mental Resilience and Focus

      Breathwork is not just about muscle recovery; it is also mental training. During a hard boxing session, you are forced to stay completely present. You cannot worry about tomorrow's meetings while timing your footwork or slipping a punch. Breathwork gives you the same kind of mental clarity in a quiet, grounded way.

      Learning to sit with your breath when you are hot, tired, and sweaty teaches your mind patience. It bridges the gap between the controlled aggression of your session and the calm, focused composure you need for the rest of your day.

      Recovery tip: Use your breathwork time to mentally file away your workout. Notice how your body feels, acknowledge the hard work you just put in, and let go of any frustration about a missed combination or tired round.

      Rebuild and Recover with BxStrength

      Pushing yourself hard in a workout is only half the battle. How you bring your body back down afterwards determines how much muscle you build, how quickly your joints recover, and how much energy you bring to the next day.

      At BxStrength, our live 1-on-1 virtual sessions do not leave you hanging when the timer stops. We guide you through purposeful warm-ups, athletic combat rounds, and dedicated recovery cool-downs so you finish every session feeling energized and clear-headed rather than broken down.

      Train hard. Breathe deeply. Recover properly.

      Book Your Private 1-on-1 Strategy Session with BxStrength BxStrength — Discover Your Strength.`,
          category: 'Mind & Body',
          author: 'Moheeb Khan',
          date: 'JUNE 28, 2026',
          image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800',
          readTime: '7 min read'
        },
    ];

export const MEMBERSHIP_PLANS: MembershipPlan[] = [
  {
    id: 'basic',
    name: 'BASIC PASS',
    price: 39,
    priceGbp: 39,
    period: 'month',
    features: [
      'Access to Gym Floor & Cardio Zone',
      'Locker & Shower Facility',
      'Free Initial Fitness Assessment',
      'Standard Workout App Access',
      '1 Guest Pass per month'
    ]
  },
  {
    id: 'standard',
    name: 'FITNESS PRO',
    price: 79,
    priceGbp: 79,
    period: 'month',
    popular: true,
    features: [
      'Unlimited Gym & Studio Access',
      'All Group Classes Included',
      '2 Personal Training Sessions / Mo',
      'Sauna & Recovery Lounge Access',
      'Customized Nutrition Plan',
      '4 Guest Passes per month'
    ]
  },
  {
    id: 'vip',
    name: 'VIP UNLIMITED',
    price: 129,
    priceGbp: 129,
    period: 'month',
    features: [
      '24/7 VIP Gym Access',
      'Unlimited Personal Training',
      'Priority Class Reservation',
      'Free Towel & Protein Shake Bar',
      'Quarterly Body Composition Scan',
      'Unlimited Guest Passes'
    ]
  }
];
