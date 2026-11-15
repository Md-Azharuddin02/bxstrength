export type FilterTab = 'all' | 'pending' | 'headcoach' | 'coaches' | 'completed';

export interface ConsultationStats {
  total: number;
  pending: number;
  takenByHeadCoach: number;
  assignedToCoaches: number;
  completed: number;
}

export interface SpecialistCoach {
  id: string;
  name: string;
  position: string;
  email: string;
}
