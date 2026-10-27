import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate, authorizeRoles } from './authMiddleware.ts';


const STAFF = ['admin', 'headcoach', 'coach', 'customer_support', 'support'];
const COACHES = ['admin', 'headcoach', 'coach'];
const MANAGERS = ['admin', 'headcoach'];

const isStaff = (req: Request) => STAFF.includes(String((req as any).user?.role || '').toLowerCase());
const sameText = (a: unknown, b: unknown) => String(a || '').toLowerCase() === String(b || '').toLowerCase();

const open = (req: Request, _res: Response, next: NextFunction) => {
  (req as any).isPublicRoute = true;
  next();
};

const ownTicketsOnly = (req: Request, res: Response, next: NextFunction) => {
  if (isStaff(req)) return next();

  const user = (req as any).user;
  const { userId, userEmail } = req.query;
  const asksForOwn = (userId || userEmail) && (!userId || userId === user.id) && (!userEmail || sameText(userEmail, user.email));
  if (!asksForOwn) {
    return res.status(403).json({ error: 'Forbidden: You can only view your own tickets.' });
  }
  next();
};

const ownNotificationsOnly = (req: Request, res: Response, next: NextFunction) => {
  if (isStaff(req) || sameText(req.query.email, (req as any).user.email)) return next();
  return res.status(403).json({ error: 'Forbidden: You can only view your own notifications.' });
};

const guard = Router();

guard.use('/auth', open); // the auth router does its own checks
guard.get('/health', open);

guard.get(['/trainers', '/classes', '/reviews', '/announcements'], open);

guard.post(['/assessments', '/consultations', '/enquiries', '/reviews', '/tickets', '/send-email'], open);

guard.post(['/webhooks/razorpay', '/webhooks/cashfree', '/payments/cashfree-webhook'], open);

guard.use((req: Request, res: Response, next: NextFunction) => {
  if ((req as any).isPublicRoute) return next();
  return authenticate(req, res, next);
});

const allow = (roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).isPublicRoute) return next();
  return authorizeRoles(...roles)(req, res, next);
};

guard.use('/admin', allow(STAFF));
guard.get('/admin/purge-reviews', allow(['admin']));
guard.use('/email', allow(['admin']));

guard.get('/users', allow(STAFF));
guard.post('/users', allow(MANAGERS));
guard.delete('/users/:id', allow(['admin']));

guard.get(['/consultations', '/enquiries'], allow(STAFF));
guard.delete('/enquiries/:id', allow(['admin']));

guard.post('/trainers', allow(COACHES));
guard.put('/trainers/:id', allow(COACHES));
guard.delete('/trainers/:id', allow(COACHES));

guard.post('/announcements', allow(MANAGERS));
guard.delete('/announcements/:id', allow(MANAGERS));

guard.get('/tickets', ownTicketsOnly);
guard.patch('/tickets/:id', allow(STAFF));
guard.delete('/tickets/:id', allow(['admin']));

guard.post(['/workout-programs', '/nutrition-plans', '/coach-assignments', '/classes'], allow(COACHES));
guard.put('/coach-assignments/:id', allow(COACHES));
guard.delete(['/workout-programs/:id', '/nutrition-plans/:id', '/coach-assignments/:id', '/classes/:id'], allow(COACHES));

guard.get('/notifications', ownNotificationsOnly);
guard.post('/notifications', allow(STAFF));
guard.post('/email-notifications/send', allow(STAFF));

guard.delete('/subscriptions/:id', allow(MANAGERS));

guard.get('/audit-logs', allow(MANAGERS));
guard.post('/audit-logs', allow(STAFF));
guard.delete('/audit-logs', allow(['admin']));

export default guard;
