export interface UserFactoryOptions {
  id?: string;
  name?: string;
  email?: string;
  role?: 'admin' | 'headcoach' | 'coach' | 'support' | 'client';
  phone?: string;
  isVerified?: boolean;
  status?: string;
}

let counter = 1;

export function createUser(overrides: UserFactoryOptions = {}) {
  const currentId = counter++;
  return {
    id: overrides.id || `user_${Date.now()}_${currentId}`,
    name: overrides.name || `Test User ${currentId}`,
    email: overrides.email || `user${currentId}_${Date.now()}@example.com`,
    role: overrides.role || 'client',
    phone: overrides.phone || '+447911123456',
    isVerified: overrides.isVerified !== undefined ? overrides.isVerified : true,
    status: overrides.status || 'active',
    createdAt: new Date().toISOString(),
  };
}

export function createAdmin(overrides: UserFactoryOptions = {}) {
  return createUser({ ...overrides, role: 'admin' });
}

export function createHeadCoach(overrides: UserFactoryOptions = {}) {
  return createUser({ ...overrides, role: 'headcoach' });
}

export function createCoach(overrides: UserFactoryOptions = {}) {
  return createUser({ ...overrides, role: 'coach' });
}

export function createSupport(overrides: UserFactoryOptions = {}) {
  return createUser({ ...overrides, role: 'support' });
}

export function createClient(overrides: UserFactoryOptions = {}) {
  return createUser({ ...overrides, role: 'client' });
}
