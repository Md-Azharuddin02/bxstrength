import { Router } from 'express';
import { listWorkoutPrograms, createWorkoutProgram, deleteWorkoutProgram } from '../controllers/workoutProgramController.ts';

const router = Router();

router.get('/', listWorkoutPrograms);
router.post('/', createWorkoutProgram);
router.delete('/:id', deleteWorkoutProgram);

export default router;
