const TOKEN_KEY = 'bx_access_token';

let accessToken = typeof window !== 'undefined' ? (localStorage.getItem(TOKEN_KEY) || '') : '';

export const getToken = (): string => {
  if (!accessToken && typeof window !== 'undefined') {
    accessToken = localStorage.getItem(TOKEN_KEY) || '';
  }
  return accessToken;
};

export const setToken = (token: string): void => {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  }
};
