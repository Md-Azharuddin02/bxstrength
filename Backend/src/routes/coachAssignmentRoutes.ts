import { Router } from 'express';
import { listCoachAssignments, createCoachAssignment, updateCoachAssignment, deleteCoachAssignment } from '../controllers/coachAssignmentController.ts';
const router = Router();

router.get('/coach-assignments', listCoachAssignments);

router.post('/coach-assignments', createCoachAssignment);

router.put('/coach-assignments/:id', updateCoachAssignment);

router.delete('/coach-assignments/:id', deleteCoachAssignment);

export default router;
