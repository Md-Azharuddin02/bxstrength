import { CoachPermissions } from "../../types";

export const DEFAULT_COACH_PERMISSIONS: CoachPermissions = {
  allowFinancials: false,
  allowLeadPipeline: true,
  allowClientRoster: true,
  allowClassSchedules: true,
  allowWorkoutPrograms: true,
  allowNutritionPlans: true,
  allowSupportTickets: true,
  allowDirectMessaging: true,

  showUserNutritionTracker: true,
  showUserWorkoutLogger: true,
  showUserBillingHistory: true,
  showUserLiveVideoCalls: true,
  showUserSelfAssessment: true,
  showUserCommunityFeed: true,
};
