import request from 'supertest';
import { app } from '../../../server';

export { app };

export const testApp = request(app);

export function getTestApp() {
  return request(app);
}
