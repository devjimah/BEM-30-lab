// Shared route-adapter utility — bridges AuthenticatedRequest handlers with Express's generic handler type.
// Removing this file requires duplicating the asHandler cast in every route file that uses AuthenticatedRequest.

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';

// Type alias for route handlers that require an authenticated user on the request
export type AuthHandler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;

// Adapter — casts Express's generic Request to AuthenticatedRequest so typed handlers compile cleanly.
// Removing this causes TypeScript type errors wherever AuthenticatedRequest handlers are registered on a Router.
export const asHandler =
    (fn: AuthHandler) =>
    (req: Request, res: Response, next: NextFunction): void =>
        fn(req as AuthenticatedRequest, res, next);
