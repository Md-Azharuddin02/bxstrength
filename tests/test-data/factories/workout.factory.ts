let workoutCounter = 1;

export function createWorkoutPlan(overrides: Partial<{
  id: string;
  clientId: string;
  coachId: string;
  title: string;
  description: string;
  status: 'draft' | 'pending_approval' | 'approved' | 'published';
  isApproved: boolean;
  isPublished: boolean;
  exercises: any[];
}> = {}) {
  const id = workoutCounter++;
  return {
    id: overrides.id || `workout_plan_${Date.now()}_${id}`,
    clientId: overrides.clientId || `client_${id}`,
    coachId: overrides.coachId || `coach_${id}`,
    title: overrides.title || `Custom Hypertrophy Block ${id}`,
    description: overrides.description || '4-week progressive overload protocol.',
    status: overrides.status || 'draft',
    isApproved: overrides.isApproved ?? false,
    isPublished: overrides.isPublished ?? false,
    exercises: overrides.exercises || [
      { name: 'Barbell Back Squat', sets: 4, reps: '6-8', rpe: 8 },
      { name: 'Romanian Deadlift', sets: 3, reps: '8-10', rpe: 7.5 },
      { name: 'Bench Press', sets: 4, reps: '6-8', rpe: 8 }
    ],
    createdAt: new Date().toISOString(),
  };
}
