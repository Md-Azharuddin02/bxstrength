import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate, authorizeRoles } from './authMiddleware.ts';


const STAFF = ['admin', 'headcoach', 'head_coach', 'coach', 'customer_support', 'support'];
const COACHES = ['admin', 'headcoach', 'head_coach', 'coach'];
const MANAGERS = ['admin', 'headcoach', 'head_coach'];

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

// Paid bookings, consultations and assessments: every record belongs to a client and may be assigned to a coach.
const ownClientRecordsOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const role = String(user.role || '').toLowerCase();
  if (MANAGERS.includes(role) || role === 'customer_support' || role === 'support') return next();
  if (role === 'coach' && req.query.coachId === user.id) return next();
  // Must be a plain string: the routes ignore any other shape, which would drop the filter and list every record
  if (typeof req.query.email === 'string' && sameText(req.query.email, user.email)) return next();
  return res.status(403).json({ error: 'Forbidden: You can only view your own records.' });
};

const ownPaidBookingBodyOnly = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  const { clientEmail, userId } = req.body || {};
  if (typeof clientEmail === 'string' && sameText(clientEmail.trim(), user.email) && (!userId || userId === user.id)) return next();
  return res.status(403).json({ error: 'Forbidden: You can only create bookings for yourself.' });
};

const guard = Router();

guard.use('/auth', open); // the auth router does its own checks
guard.use('/consultations', open);
guard.use('/assessments', open);
guard.use('/enquiries', open);
guard.use('/users', open);
guard.use('/paid-bookings', open);
guard.use('/booking-diet-plans', open);
guard.use('/booking-workout-plans', open);
guard.use('/tickets', open);
guard.get('/health', open);

guard.get(['/trainers', '/classes', '/reviews', '/announcements'], open);

guard.post(['/assessments', '/consultations', '/enquiries', '/reviews', '/tickets', '/send-email', '/create-order', '/create-razorpay-order', '/verify-payment', '/verify-razorpay-payment'], open);

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

guard.get('/enquiries', allow(STAFF));
guard.delete('/enquiries/:id', allow(['admin']));

guard.get('/paid-bookings', ownClientRecordsOnly);
guard.post('/paid-bookings', ownPaidBookingBodyOnly);
guard.patch(['/paid-bookings/:id/assign', '/paid-bookings/:id/session'], allow(STAFF));
guard.delete('/paid-bookings/:id', allow(MANAGERS));

guard.get(['/consultations', '/assessments'], ownClientRecordsOnly);
guard.patch(['/consultations/:id/assign', '/assessments/:id/assign'], allow(MANAGERS));
guard.patch(['/consultations/:id/status', '/assessments/:id/status'], allow(STAFF));
guard.delete(['/consultations/:id', '/assessments/:id'], allow(MANAGERS));

guard.post('/trainers', allow(COACHES));
guard.put('/trainers/:id', allow(COACHES));
guard.delete('/trainers/:id', allow(COACHES));

guard.post('/announcements', allow(MANAGERS));
guard.delete('/announcements/:id', allow(MANAGERS));

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
