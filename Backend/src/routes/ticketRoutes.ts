import { Router } from 'express';
import { listTickets, createTicket, updateTicket, deleteTicket } from '../controllers/ticketController.ts';
import { enquiryLimiter } from '../middlewares/limiters.ts';

const router = Router();

router.get('/tickets', listTickets);

router.post('/tickets', enquiryLimiter, createTicket);

router.patch('/tickets/:id', updateTicket);

router.delete('/tickets/:id', deleteTicket);

export default router;
