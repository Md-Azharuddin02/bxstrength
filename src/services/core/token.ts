// Access tokens stay in memory. The refresh token is held in an HttpOnly cookie.
let accessToken = '';

export const getToken = (): string => {
  return accessToken;
};

export const setToken = (token: string): void => {
  accessToken = token;
};
