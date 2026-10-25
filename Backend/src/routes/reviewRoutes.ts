import { Router } from 'express';
import { listReviews, createReview } from '../controllers/reviewController.ts';

const router = Router();

router.get('/', listReviews);
router.post('/', createReview);

export default router;
