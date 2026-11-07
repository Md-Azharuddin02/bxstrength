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
    content: 'Full guide on electrolyte balance, intra-workout mineral intake, and recovery post-boxing session...',
    category: 'Nutrition',
    author: 'Head Coach & Team',
    date: 'JULY 18, 2026',
    image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=800',
    readTime: '5 min read'
  },
  {
    id: '2',
    title: 'How Progressive Hypertrophy Training Accelerates Metabolism',
    excerpt: 'Building lean muscular tissue increases your resting metabolic rate even while sleeping. Here is the science behind it.',
    content: 'Detailed breakdown of progressive overload, rep ranges, time under tension, and protein synthesis recovery windows...',
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
    content: 'Guided box breathing techniques, post-workout heart rate variability recovery, and sleep quality improvements...',
    category: 'Mind & Body',
    author: 'Moheeb Khan',
    date: 'JUNE 28, 2026',
    image: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&q=80&w=800',
    readTime: '4 min read'
  }
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
