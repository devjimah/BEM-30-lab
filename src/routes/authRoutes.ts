// Auth routes — public endpoints for user registration and login.
// Removing this file makes authentication impossible; no JWT can be obtained.

import { Router } from 'express';
import { register, login } from '../controllers/authController';

// Router instance — scoped under /auth in server.ts
const router = Router();

// POST /auth/register — open to anyone; creates a new user account
router.post('/register', register);

// POST /auth/login — open to anyone; returns a JWT on valid credentials
router.post('/login', login);

export default router;
