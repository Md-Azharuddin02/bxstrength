export type ViewPage = 'home' | 'about' | 'services' | 'pricing' | 'schedule' | 'trainers' | 'blog' | 'contact' | 'dashboard' | 'admin' | 'terms' | 'privacy' | 'onboarding_terms' | 'support_dashboard';

export type MarketCountry = 'GB' | 'IN'; 
export type CurrencyCode = 'GBP' | 'INR';
export type CurrencySymbol = '£' | '₹';

export interface MarketConfig {
  country: MarketCountry;
  countryName: string;
  currency: CurrencyCode;
  symbol: CurrencySymbol;
  flagEmoji: string;
}

export type UserRole = 'admin' | 'headcoach' | 'coach' | 'customer_support' | 'client';

export type CoachPosition = 'Head Coach' | 'Super Senior Coach' | 'Senior Coach' | 'Junior Coach' | 'Lead Specialist';

export interface CoachPermissions {
  allowFinancials: boolean;        // Client Payments & Subscriptions tab
  allowLeadPipeline: boolean;      // CRM Overview tab
  allowClientRoster: boolean;      // Client Directory tab
  allowClassSchedules: boolean;    // Class Schedule tab
  allowWorkoutPrograms: boolean;   // Workout Program Builder tab
  allowNutritionPlans: boolean;    // Diet Plans tab
  allowSupportTickets: boolean;    // Support Ticket Desk tab
  allowDirectMessaging?: boolean;  // Direct 1-on-1 Client Chat

  // User / Client Dashboard Feature Toggles (Admin-Controlled Visibility)
  showUserNutritionTracker?: boolean;    // Calorie & Macro Meal Tracker
  showUserWorkoutLogger?: boolean;       // Workout Routine & Exercise Logger
  showUserBillingHistory?: boolean;      // Invoices & Subscription Billing
  showUserLiveVideoCalls?: boolean;      // Virtual Consultation Video Link
  showUserSelfAssessment?: boolean;      // 60-Sec Performance Self Assessment
  showUserCommunityFeed?: boolean;       // Athlete Community Board
}

export type SubscriptionTier = 'Normal User' | 'Premium User' | 'Premium Elite User';

export interface BillingStatement {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  date: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  description: string;
  receiptFileUrl?: string;
  fileName?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  password_or_hash?: string;
  password_hash?: string;
  coachPosition?: CoachPosition | string;
  avatarUrl?: string;
  phone?: string;
  age?: number;
  heightCm?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  emergencyContact?: string;
  fitnessGoals?: string;
  subscriptionTier?: SubscriptionTier;
  billingStatements?: BillingStatement[];
  signupMethod?: 'Google SSO' | 'Email / Password' | string;
  isVerified: boolean;
  status: 'active' | 'inactive' | 'pending_verification' | 'deactivated';
  assignedCoach?: string;
  assignedHeadCoach?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface BodyStat {
  id: string;
  userId: string;
  date: string;
  weightKg: number;
  heightCm: number;
  bmi: number;
  bmiCategory: 'Underweight' | 'Normal' | 'Overweight' | 'Obese';
  bodyFatPercentage?: number;
  chestCm?: number;
  waistCm?: number;
  bicepsCm?: number;
  thighsCm?: number;
}

export interface ExerciseItem {
  id: string;
  name: string;
  sets: number;
  reps: string;
  targetMuscle: string;
  notes?: string;
  isCompleted?: boolean;
}

export type AssignmentStatus =
  | 'assigned'
  | 'coach_accepted'
  | 'coach_rejected'
  | 'rejected'
  | 'change_requested'
  | 'in_progress'
  | 'submitted_for_approval'
  | 'headcoach_review'
  | 'approved'
  | 'published_to_client'
  | 'completed';

export interface ApprovalLogEntry {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: 'ASSIGN' | 'COACH_ACCEPT' | 'COACH_REJECT' | 'REQUEST_CHANGE' | 'SUBMIT_FOR_APPROVAL' | 'HEADCOACH_APPROVE' | 'HEADCOACH_REJECT' | 'PUBLISH_TO_CLIENT' | string;
  notes?: string;
}

export interface InAppNotification {
  id: string;
  userId?: string;
  userEmail: string;
  title: string;
  message: string;
  contentType: 'workout' | 'nutrition' | 'class' | 'consultation' | 'ticket' | 'general' | string;
  coachName: string;
  linkTab?: string;
  isRead: boolean;
  createdAt: string;
  timestamp?: string;
}

export interface EmailNotificationLog {
  id: string;
  toEmail: string;
  toName: string;
  subject: string;
  contentType: string;
  coachName: string;
  publicationDate: string;
  viewLink: string;
  status: 'Sent' | 'Delivered' | string;
  sentAt: string;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  durationWeeks: number;
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedCoachName?: string;
  assignedBy?: string;
  assignedByRole?: string;
  assignedAt?: string;
  status?: AssignmentStatus;
  coachApprovalStatus?: 'pending' | 'accepted' | 'rejected' | 'change_requested';
  coachApprovalNotes?: string;
  headCoachApprovalStatus?: 'pending' | 'approved' | 'rejected' | 'change_requested';
  headCoachApprovalNotes?: string;
  version?: number;
  approvalLogs?: ApprovalLogEntry[];
  isPublishedToClient?: boolean;
  publishedToClientAt?: string;
  createdBy: string;
  createdAt: string;
  exercises: ExerciseItem[];
}

export interface MealItem {
  id: string;
  mealName: string;
  timeSlot: string;
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface NutritionPlan {
  id: string;
  title: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedCoachName?: string;
  assignedBy?: string;
  assignedByRole?: string;
  assignedAt?: string;
  status?: AssignmentStatus;
  coachApprovalStatus?: 'pending' | 'accepted' | 'rejected' | 'change_requested';
  coachApprovalNotes?: string;
  headCoachApprovalStatus?: 'pending' | 'approved' | 'rejected' | 'change_requested';
  headCoachApprovalNotes?: string;
  version?: number;
  approvalLogs?: ApprovalLogEntry[];
  isPublishedToClient?: boolean;
  publishedToClientAt?: string;
  dailyCalories: number;
  targetProteinG: number;
  targetCarbsG: number;
  targetFatG: number;
  meals: MealItem[];
  createdBy: string;
  updatedAt: string;
}

export type CoachAssignmentType = 'workout_program' | 'class_schedule' | 'nutrition_plan' | 'consultation' | 'task' | 'other';
export type CoachAssignmentPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CoachAssignment {
  id: string;
  assignmentType: CoachAssignmentType;
  referenceId?: string;
  title: string;
  description?: string;
  instructions?: string;
  
  // Coach linkage
  assignedCoachId?: string;
  assignedCoachName: string;

  // Client linkage
  clientId?: string;
  clientName?: string;
  clientEmail?: string;

  // Service / Package linkage
  serviceId?: string;
  serviceName?: string;

  // Head Coach / Assigner linkage
  assignedById?: string;
  assignedByName: string;
  assignedByRole: string;
  assignedAt: string;

  // Dates & Status
  dueDate?: string;
  scheduleTime?: string;
  priority: CoachAssignmentPriority;
  status: AssignmentStatus;

  // Versioning & Publishing
  isPublishedToClient?: boolean;
  publishedToClientAt?: string;
  version?: number;
  approvalLogs?: ApprovalLogEntry[];
  
  details?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ClassSchedule {
  id: string;
  title: string;
  category: 'cycling' | 'strength' | 'mindbody' | 'boxing' | 'cardio';
  trainerId?: string;
  trainerName: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  assignedBy?: string;
  assignedByRole?: string;
  assignedAt?: string;
  isPublishedToClient?: boolean;
  publishedToClientAt?: string;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  room: string;
  maxCapacity: number;
  bookedCount: number;
  price: number;
  instructions?: string;
  status?: AssignmentStatus;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  classId: string;
  className: string;
  trainerName: string;
  date: string;
  timeSlot: string;
  status: 'Confirmed' | 'Cancelled' | 'Attended';
  bookingCode: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  className: string;
  date: string;
  status: 'Attended' | 'Absent' | 'Excused';
  markedBy: string;
}

export interface Subscription {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  planName: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly' | 'annual';
  price: number;
  startDate: string;
  nextBillingDate: string;
  expiryDate?: string;
  status: 'active' | 'past_due' | 'cancelled';
  autoRenew: boolean;
  serviceType?: 'individual' | 'custom';
  customExercises?: string[];
}

export interface EnquiryActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: string;
  action: string;
  notes?: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  preferredContactMethod?: 'whatsapp' | 'email' | 'call';
  subject: string;
  message: string;
  category?: string;
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  weightage?: string;
  createdAt: string;
  status: 'new' | 'transferred_to_headcoach' | 'assigned_to_coach' | 'in_progress' | 'resolved';
  assignedNotes?: string;
  assignedCoach?: string;
  transferredToHeadCoach?: boolean;
  transferredBy?: string;
  transferredAt?: string;
  activityLog?: EnquiryActivityLog[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  targetUserId?: string;
  targetName?: string;
  prevValue?: string;
  newValue?: string;
  entityId?: string;
  ipAddress: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  targetRole: 'all' | 'client' | 'coach' | 'staff';
  priority: 'low' | 'medium' | 'high';
  authorName: string;
}

export interface FitnessClass {
  id: string;
  title: string;
  category: 'cycling' | 'strength' | 'mindbody' | 'boxing' | 'cardio';
  image: string;
  description: string;
  durationMinutes: number;
  intensity: 'Beginner' | 'Intermediate' | 'Advanced';
  trainerName: string;
  caloriesBurned: string;
  scheduleDays: string[];
}

export interface Trainer {
  id: string;
  name: string;
  role: string;
  image: string;
  bio: string;
  specialties: string[];
  experienceYears: number;
  clientsServed?: number;
  rating: number;
  certifications?: string[];
  achievements?: string[];
  galleryPhotos?: string[];
  galleryVideos?: string[];
  socials: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface ServiceItem {
  id?: string;
  title: string;
  category?: string;
  servicePlan?: string;           // Service/plan
  duration?: string;              // duration
  price?: number | string;        // price (fallback)
  priceGbp?: number;              // UK price in GBP (£)
  priceInr?: number;              // India price in INR (₹)
  sessionType?: string;           // session type
  goalPrimaryOutcome?: string;    // goal/primary outcome
  whatYouGet?: string | string[]; // what you get
  keyDifference?: string;         // key difference
  totalSessions?: number | string;// total session
  discount?: string | number;     // discount
  validity?: string;              // validity
  complimentary?: string;         // complimentary
  // Display & Compatibility Helper Fields
  icon?: any;
  iconName?: 'personal' | 'boxing' | 'fitness' | 'nutrition' | 'crossfit';
  description?: string;
  problem?: string;
  solution?: string;
  result?: string;
  discountTag?: string;
  originalPrice?: number;
  discountedPrice?: number;
  priceUnit?: string;
  benefits?: string[];
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  comment: string;
  rating: number;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  date: string;
  image: string;
  readTime: string;
}

export interface ScheduleSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  time: string;
  className: string;
  trainer: string;
  room: string;
  spotsLeft: number;
}

export interface BookingDetails {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  className: string;
  trainerName: string;
  date: string;
  timeSlot: string;
  status: 'Confirmed' | 'Pending';
  code: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  priceGbp?: number;
  priceInr?: number;
  period: 'month' | 'year';
  popular?: boolean;
  features: string[];
}

export type LeadPipelineStage = 
  | 'Lead'
  | 'Assessment'
  | 'Consultation'
  | 'Recommendation'
  | 'Payment'
  | 'Coach Assigned'
  | 'Active Client'
  | 'Review'
  | 'Renewal'
  | 'Referral';

export interface SelfAssessmentData {
  goal: string;
  fitnessLevel?: string;
  trainingDays?: string;
  trainingLocation?: string;
  equipment?: string;
  trainingInterest?: string;
  hasInjury?: string;
  obstacle?: string;
  experience?: string;
  commitment?: string;
  name: string;
  email: string;
  phone: string;
  preferredContactMethod: 'whatsapp' | 'email' | 'call' | '';
  submittedAt: string;
}

export interface ConsultationBooking {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  goal: string;
  coachPreference: string;
  date: string;
  timeSlot: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Rescheduled' | 'Missed';
  notes?: string;
  remindersSent?: {
    h24?: boolean;
    h2?: boolean;
    m30?: boolean;
  };
  createdAt: string;
}

export interface CoachVerification {
  id: string;
  coachName: string;
  email: string;
  step: 'Application' | 'Document Review' | 'Interview' | 'Approval' | 'Published';
  status: 'Pending' | 'Verified' | 'Rejected';
  documents: string[];
  submittedAt: string;
}

export type TicketPriority = 'low' | 'normal' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'new' | 'assigned' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed' | 'open';
export type TicketCategory = 'Training' | 'Nutrition' | 'Billing' | 'Schedule' | 'General' | 'Booking' | 'Payment' | 'Technical' | 'Chatbot' | 'Callback' | 'Custom Coaching';
export type TicketSource = 'Website Contact Form' | 'Chatbot' | 'Booking' | 'Payment' | 'WhatsApp' | 'Callback Request' | 'Service Enquiry' | 'General';

export interface InternalNote {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  senderName: string;
  senderRole: 'customer' | 'agent' | 'system';
  channel: 'email' | 'chat' | 'whatsapp' | 'internal_note' | 'callback';
  text: string;
  createdAt: string;
}

export interface EscalationRecord {
  id: string;
  escalatedBy: string;
  escalatedTo: string;
  reason: string;
  priorityAtEscalation: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userCountry?: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  description: string;
  status: TicketStatus;
  source?: TicketSource;
  serviceOrProduct?: string;
  assignedAgent?: string;
  assignedAgentRole?: 'customer_support' | 'headcoach' | 'coach' | 'admin';
  relatedBookingId?: string;
  relatedTransactionId?: string;
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
  internalNotes?: InternalNote[];
  conversationHistory?: TicketMessage[];
  escalationHistory?: EscalationRecord[];
  chatContext?: {
    botConversationSnippet?: string;
    escalatedAt?: string;
  };
}


