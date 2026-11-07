// isAllowedEnv must be false in production, so a stray flag can never expose it there.
export const canUseMockPayments = (
  isAllowedEnv: boolean,
  enabledFlag: string | undefined,
): boolean => isAllowedEnv && enabledFlag === 'true';
