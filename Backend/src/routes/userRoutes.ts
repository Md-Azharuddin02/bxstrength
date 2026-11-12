import { Router } from 'express';
import { listUsers, createUser, updateUser, setUserRole, setUserStatus, setUserPassword, verifyUser, deleteUser } from '../controllers/userController.ts';
import { authenticate as authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.ts';

const router = Router();

router.get('/users', listUsers);

router.post('/users', authenticateToken, createUser);

router.patch('/users/:id', authenticateToken, updateUser);

router.put('/admin/users/:id/role', authenticateToken, authorizeRoles('admin', 'headcoach'), setUserRole);

router.put('/admin/users/:id/status', authenticateToken, authorizeRoles('admin', 'headcoach'), setUserStatus);

router.put('/admin/users/:id/password', authenticateToken, authorizeRoles('admin'), setUserPassword);

router.put('/admin/users/:id/verify', authenticateToken, authorizeRoles('admin', 'headcoach'), verifyUser);

router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), deleteUser);

export default router;
