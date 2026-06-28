// Global error handler middleware — centralises all error formatting and HTTP status code assignment.
// Removing this file causes Express to use its default error handler, which leaks stack traces in production.

import { Request, Response, NextFunction } from 'express';
import { Error as MongooseError } from 'mongoose';
import { AppError } from '../types/errors';

// Interface extending the standard Error to capture MongoDB duplicate-key codes
interface MongoServerError extends AppError {
    code?: number;
    keyValue?: Record<string, unknown>;
}

// Express 4-argument error middleware — must keep all four params or Express won't treat it as an error handler.
// Removing this causes unhandled async errors to crash the process or return empty responses.
const errorHandler = (
    err: MongoServerError,
    _req: Request,
    res: Response,
    next: NextFunction
): void => {
    let statusCode = err.statusCode ?? 500;
    let message = err.message || 'Internal Server Error';
    const isProduction = process.env.NODE_ENV === 'production';

    // Mongoose field-level validation failure — map to 400
    if (err instanceof MongooseError.ValidationError) {
        statusCode = 400;
        message = Object.values(err.errors).map((e) => e.message).join(', ');
    }

    // Mongoose invalid ObjectId cast — map to 400 with a clean message
    if (err instanceof MongooseError.CastError) {
        statusCode = 400;
        message = 'Invalid ID format.';
    }

    // MongoDB duplicate key error (e.g. registering with an existing email)
    if (err.code === 11000 && err.keyValue) {
        statusCode = 409;
        const field = Object.keys(err.keyValue)[0];
        message = `A user with that ${field} already exists.`;
    }

    // Mask server-side details in production to prevent information leakage
    if (statusCode === 500 && isProduction) {
        message = 'Internal Server Error';
    }

    console.error(`[ERROR ${statusCode}] ${err.message}`);
    if (!isProduction && err.stack) {
        console.error(err.stack);
    }

    // Guard against writing headers twice (e.g. when a stream has already started responding)
    if (res.headersSent) {
        next(err);
        return;
    }

    // Consistent error response format used across all endpoints
    res.status(statusCode).json({
        status: 'error',
        message
    });
};

export default errorHandler;
