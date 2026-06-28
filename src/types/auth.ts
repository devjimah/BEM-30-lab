// Type definitions for auth-related request bodies and JWT payload shapes.
// Removing this file would break all auth controller and middleware type safety.

import { Request } from 'express';

// Shape of the decoded JWT payload attached to authenticated requests
export interface JwtPayload {
    id: string;
    role: 'user' | 'admin';
    iat?: number;
    exp?: number;
}

// Extends Express Request so controllers can access the authenticated user
export interface AuthenticatedRequest extends Request {
    user?: JwtPayload;
}

// Body shape expected by POST /auth/register
export interface RegisterBody {
    name?: unknown;
    email?: unknown;
    password?: unknown;
    role?: unknown;
}

// Body shape expected by POST /auth/login
export interface LoginBody {
    email?: unknown;
    password?: unknown;
}
