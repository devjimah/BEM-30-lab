// User management routes — admin-only endpoints for viewing and managing user accounts.
// Removing this file removes all admin user-management capabilities.

import { Router } from 'express';
import { getAllUsers, getUserById, deleteUser } from '../controllers/userController';
import { protect } from '../middleware/authMiddleware';
import { restrictTo } from '../middleware/roleMiddleware';
import { asHandler } from '../utils/routeAdapter';

const router = Router();

// Require authentication then restrict all user-management routes to admins only
router.use(asHandler(protect));
router.use(asHandler(restrictTo('admin')));

// GET /api/users — list all registered users
router.get('/', asHandler(getAllUsers));

// GET /api/users/:id — fetch a single user by ID
router.get('/:id', asHandler(getUserById));

// DELETE /api/users/:id — delete a user and cascade-remove their tasks
router.delete('/:id', asHandler(deleteUser));

export default router;
