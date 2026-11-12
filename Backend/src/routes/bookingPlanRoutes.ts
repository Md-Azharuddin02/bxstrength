import { Router } from 'express';
import { listDietPlans, createDietPlan, updateDietPlan, deleteDietPlan, listWorkoutPlans, createWorkoutPlan, updateWorkoutPlan, deleteWorkoutPlan } from '../controllers/bookingPlanController.ts';
const router = Router();

router.get('/booking-diet-plans', listDietPlans);

router.post('/booking-diet-plans', createDietPlan);

router.put('/booking-diet-plans/:id', updateDietPlan);

router.delete('/booking-diet-plans/:id', deleteDietPlan);

router.get('/booking-workout-plans', listWorkoutPlans);

router.post('/booking-workout-plans', createWorkoutPlan);

router.put('/booking-workout-plans/:id', updateWorkoutPlan);

router.delete('/booking-workout-plans/:id', deleteWorkoutPlan);

export default router;
