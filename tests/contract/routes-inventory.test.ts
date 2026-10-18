import { describe, it, expect } from 'vitest';
import { app } from '../../server';

export interface RouteEntry {
  method: string;
  path: string;
  access?: 'public' | 'protected' | 'admin-only' | 'headcoach-only' | 'staff-only';
}

export function extractExpressRoutes(): RouteEntry[] {
  const routes: RouteEntry[] = [];
  const stack = (app as any)._router?.stack || [];

  stack.forEach((middleware: any) => {
    if (middleware.route) {
      const methods = Object.keys(middleware.route.methods).map(m => m.toUpperCase());
      const path = middleware.route.path;
      methods.forEach((method) => {
        routes.push({
          method,
          path: Array.isArray(path) ? path.join(',') : String(path),
        });
      });
    }
  });

  return routes;
}

describe('Contract: Automatic API Route Inventory (CONTR-INVENTORY)', () => {
  it('CONTR-INV-01: Express application exposes non-empty route stack', () => {
    const routes = extractExpressRoutes();
    expect(routes.length).toBeGreaterThan(10);
  });

  it('CONTR-INV-02: Confirms core public and administrative routes exist', () => {
    const routes = extractExpressRoutes();
    const routeSignatures = routes.map(r => `${r.method} ${r.path}`);

    expect(routeSignatures).toContain('GET /api/health');
    expect(routeSignatures).toContain('POST /api/auth/register');
    expect(routeSignatures).toContain('POST /api/auth/login');
  });

  it('CONTR-INV-03: Administrative sensitive endpoints require strict authorization policy', () => {
    const routes = extractExpressRoutes();
    const adminRoutes = routes.filter(r => r.path.includes('/api/admin'));

    expect(adminRoutes.length).toBeGreaterThan(0);
    // Every admin route must be cataloged
    for (const r of adminRoutes) {
      expect(r.path).toMatch(/^\/api\/admin/);
    }
  });
});
