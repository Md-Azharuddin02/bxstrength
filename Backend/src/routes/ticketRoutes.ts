import { Router } from 'express';
import { listTickets, createTicket, updateTicket, deleteTicket } from '../controllers/ticketController.ts';
import { listTicketMessages, createTicketMessage } from '../controllers/ticketMessageController.ts';
import { enquiryLimiter } from '../middlewares/limiters.ts';

const router = Router();

router.get('/tickets', listTickets);

router.post('/tickets', enquiryLimiter, createTicket);

router.patch('/tickets/:id', updateTicket);

router.get('/tickets/:id/messages', listTicketMessages);

router.post('/tickets/:id/messages', createTicketMessage);

router.delete('/tickets/:id', deleteTicket);

export default router;
