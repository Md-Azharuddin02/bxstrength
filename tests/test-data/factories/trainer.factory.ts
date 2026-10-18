let trainerCounter = 1;

export function createTrainer(overrides: Partial<{
  id: string;
  name: string;
  specialty: string;
  bio: string;
  email: string;
  status: string;
}> = {}) {
  const id = trainerCounter++;
  return {
    id: overrides.id || `trainer_${Date.now()}_${id}`,
    name: overrides.name || `Coach Alex ${id}`,
    specialty: overrides.specialty || 'Hypertrophy & Strength Conditioning',
    bio: overrides.bio || 'Certified UK Strength & Conditioning Specialist with 8+ years coaching.',
    email: overrides.email || `coach${id}_${Date.now()}@bxstrength.com`,
    status: overrides.status || 'active',
  };
}
