import { Router } from 'express';
import { listNutritionPlans, createNutritionPlan, deleteNutritionPlan } from '../controllers/nutritionPlanController.ts';

const router = Router();

router.get('/', listNutritionPlans);
router.post('/', createNutritionPlan);
router.delete('/:id', deleteNutritionPlan);

export default router;
