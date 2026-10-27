export const canUseMockPayments = (
  isDevelopment: boolean,
  enabledFlag: string | undefined,
): boolean => isDevelopment && enabledFlag === 'true';
