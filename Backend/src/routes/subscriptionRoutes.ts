import { Router } from 'express';
import { listSubscriptions, createSubscription, deleteSubscription } from '../controllers/subscriptionController.ts';

const router = Router();

router.get('/', listSubscriptions);
router.post('/', createSubscription);
router.delete('/:id', deleteSubscription);

export default router;
