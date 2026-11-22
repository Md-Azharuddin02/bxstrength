import { Router } from 'express';
import { listTrainers, createTrainer, updateTrainer, deleteTrainer } from '../controllers/trainerController.ts';
import { authenticate as authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.ts';

const router = Router();

router.get('/trainers', listTrainers);

router.post('/trainers', authenticateToken, createTrainer);

router.put('/trainers/:id', authenticateToken, updateTrainer);

router.delete('/trainers/:id', authenticateToken, authorizeRoles('admin', 'coach'), deleteTrainer);

export default router;
