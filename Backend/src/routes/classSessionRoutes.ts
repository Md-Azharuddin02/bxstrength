import { Router } from 'express';
import { listClasses, createClass, deleteClass } from '../controllers/classSessionController.ts';
const router = Router();

router.get('/classes', listClasses);

router.post('/classes', createClass);

router.delete('/classes/:id', deleteClass);

export default router;
