import type { Request, Response, NextFunction } from 'express';

// The api guard checks roles but can't see the booking, so a coach's access to a specific one is checked here.
export const requireCoachOwnsBooking = (findAssignedCoachId: (bookingId: string) => Promise<string | null | undefined>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (String(user?.role || '').toLowerCase() !== 'coach') return next();

    try {
      if ((await findAssignedCoachId(String(req.params.id))) === user.id) return next();
      return res.status(403).json({ error: 'Forbidden: This booking is not assigned to you.' });
    } catch (err: any) {
      console.error('Paid booking access check error:', err?.message);
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again.' });
    }
  };
