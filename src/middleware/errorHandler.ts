import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../types/errors';

const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = err.statusCode ?? 500;
    let message = err.message || 'Internal Server Error';
    const isProduction = process.env.NODE_ENV === 'production';

    if (err instanceof MongooseError.ValidationError) {
        statusCode = 400;
        message = Object.values(err.errors).map((e) => e.message).join(', ');
    } else if (err instanceof MongooseError.CastError) {
        statusCode = 400;
        message = 'Invalid task ID.';
    }

    if (statusCode === 500 && isProduction) {
        message = 'Internal Server Error';
    }

    console.error(`[ERROR ${statusCode}] ${err.message}`);
    if (!isProduction && err.stack) {
        console.error(err.stack);
    }

    if (res.headersSent) {
        next(err);
        return;
    }

    res.status(statusCode).json({
        success: false,
        error: message
    });
};

export default errorHandler;
