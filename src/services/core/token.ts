// Access tokens stay in memory and tab-scoped sessionStorage. The refresh token is held in an HttpOnly cookie.
let accessToken = '';

export const getToken = (): string => {
  if (accessToken) return accessToken;
  try {
    const stored = sessionStorage.getItem('bx_access_token');
    if (stored) {
      accessToken = stored;
      return stored;
    }
  } catch {}
  return '';
};

export const setToken = (token: string): void => {
  accessToken = token;
  try {
    if (token) {
      sessionStorage.setItem('bx_access_token', token);
    } else {
      sessionStorage.removeItem('bx_access_token');
    }
  } catch {}
};
