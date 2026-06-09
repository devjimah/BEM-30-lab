import { Request, Response, NextFunction } from 'express';

const logger = (req: Request, res: Response, next: NextFunction): void => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        console.log(
            `[${timestamp}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
        );
    });

    next();
};

export default logger;
