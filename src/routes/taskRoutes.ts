// Task routes — protected CRUD endpoints; authentication and ownership are enforced per-route.
// Removing this file disables the entire task API surface.

import { Router } from 'express';
import {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
} from '../controllers/taskController';
import { protect } from '../middleware/authMiddleware';
import { asHandler } from '../utils/routeAdapter';

const router = Router();

// Apply the protect middleware to all task routes — removing this makes all tasks publicly accessible
router.use(asHandler(protect));

// GET /api/tasks?page=1&limit=10 — paginated; admins see all tasks, users see only their own
router.get('/', asHandler(getAllTasks));

// GET /api/tasks/:id — ownership check enforced inside controller
router.get('/:id', asHandler(getTaskById));

// POST /api/tasks — creates a task owned by the authenticated user
router.post('/', asHandler(createTask));

// PUT /api/tasks/:id — ownership check enforced inside controller
router.put('/:id', asHandler(updateTask));

// DELETE /api/tasks/:id — owner or admin may delete; enforced inside controller
router.delete('/:id', asHandler(deleteTask));

export default router;
