import { Request, Response, NextFunction } from 'express';
import { createAppError } from '../types/errors';

const notFound = (req: Request, _res: Response, next: NextFunction): void => {
    next(createAppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

export default notFound;
