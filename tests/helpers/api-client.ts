import request from 'supertest';
import { app } from '../../server';
import { createAuthHeader, TestUserPayload } from './auth-helpers';

export const apiClient = request(app);

export function authenticatedRequest(user: TestUserPayload) {
  const authHeader = createAuthHeader(user);
  return {
    get: (url: string) => request(app).get(url).set(authHeader),
    post: (url: string) => request(app).post(url).set(authHeader),
    put: (url: string) => request(app).put(url).set(authHeader),
    patch: (url: string) => request(app).patch(url).set(authHeader),
    delete: (url: string) => request(app).delete(url).set(authHeader),
  };
}
