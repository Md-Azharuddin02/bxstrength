import { Router } from 'express';
import { listAnnouncements, createAnnouncement, deleteAnnouncement } from '../controllers/announcementController.ts';

const router = Router();

router.get('/', listAnnouncements);
router.post('/', createAnnouncement);
router.delete('/:id', deleteAnnouncement);

export default router;
