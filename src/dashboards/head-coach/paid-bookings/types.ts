import { User } from '../../../types';

export type FilterTab = 'all' | 'active' | 'scheduled' | 'completed' | 'custom';

export interface PaidBookingMetrics {
  total: number;
  active: number;
  completed: number;
  totalRevenue: number;
  totalSessions: number;
  completedSessions: number;
}

export interface AvailableCoach {
  id: string;
  name: string;
  position: string;
  email: string;
}

export interface UserMaps {
  byId: Map<string, User>;
  byEmail: Map<string, User>;
}
