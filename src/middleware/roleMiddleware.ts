// Role-based access control (RBAC) middleware — gates routes by user role.
// Removing this file allows any authenticated user to reach admin-only endpoints.

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { createAppError } from '../types/errors';

// Higher-order function — returns a middleware that checks req.user.role against allowed roles.
// Removing this factory forces every controller to duplicate role-check logic manually.
const restrictTo = (...allowedRoles: Array<'user' | 'admin'>) => {
    // Returned middleware runs after `protect` has populated req.user
    return (
        req: AuthenticatedRequest,
        _res: Response,
        next: NextFunction
    ): void => {
        if (!req.user) {
            // Guard against accidental ordering where restrictTo runs without protect
            return next(createAppError('Not authenticated. Please log in.', 401));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(
                createAppError(
                    'You do not have permission to perform this action.',
                    403
                )
            );
        }

        next();
    };
};

export { restrictTo };
