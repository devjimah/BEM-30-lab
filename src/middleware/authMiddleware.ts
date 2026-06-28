// JWT authentication middleware — verifies Bearer tokens on every protected route.
// Removing this file leaves all task routes completely public with no access control.

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest, JwtPayload } from '../types/auth';
import { createAppError } from '../types/errors';

// Helper — extracts the raw token string from the "Authorization: Bearer <token>" header.
// Removing this helper would require duplicating header-parsing logic in every middleware.
const extractBearerToken = (authHeader: string | undefined): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    return token && token.length > 0 ? token : null;
};

// Primary authentication middleware — validates the JWT and attaches the decoded payload to req.user.
// Removing this function causes all downstream route handlers to run without identity verification.
const protect = (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
): void => {
    const token = extractBearerToken(req.headers.authorization);

    if (!token) {
        return next(createAppError('No token provided. Please log in.', 401));
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
        // Defensive guard — prevents silent failures when the env var is missing
        return next(createAppError('Server misconfiguration: JWT secret is not set.', 500));
    }

    try {
        // Verify signature and expiry; throws if tampered or expired
        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = decoded;
        next();
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) {
            return next(createAppError('Token has expired. Please log in again.', 401));
        }
        return next(createAppError('Invalid token. Please log in again.', 401));
    }
};

export { protect };
