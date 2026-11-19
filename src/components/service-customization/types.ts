import type { useAuth } from '../../context/AuthContext';
import type { getServicePlanType } from '../../services/servicePricing';

export type AuthUser = ReturnType<typeof useAuth>['user'];
export type PlanType = NonNullable<ReturnType<typeof getServicePlanType>>;

export interface ServiceInfo {
  title: string;
  category?: string;
  price?: number | string;
  priceGbp?: number | string;
  priceInr?: number | string;
  discountedPrice?: number;
  originalPrice?: number;
  priceUnit?: string;
  duration?: string;
  description?: string;
}
