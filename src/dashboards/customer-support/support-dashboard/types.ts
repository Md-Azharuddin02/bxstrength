import type { useAuth } from '../../../context/AuthContext';

export type RoleView = 'customer_support' | 'headcoach' | 'coach' | 'admin';
export type SortBy = 'newest' | 'oldest' | 'priority';
export type AuthUser = ReturnType<typeof useAuth>['user'];
