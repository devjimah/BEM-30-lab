import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import connectDB from './config/db';
import logger from './middleware/logger';
import errorHandler from './middleware/errorHandler';
import notFound from './middleware/notFound';
import taskRoutes from './routes/taskRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(logger);

app.get('/', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        service: 'task-tracker-api'
    });
});

app.use('/api/tasks', taskRoutes);

app.use(notFound);
app.use(errorHandler);

const startServer = async (): Promise<void> => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });

        const gracefulShutdown = (signal: string): void => {
            console.log(`\nReceived ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                try {
                    await mongoose.connection.close();
                    console.log('Database connection closed.');
                } catch (closeErr) {
                    const message = closeErr instanceof Error ? closeErr.message : 'Unknown error';
                    console.error('Error closing database connection:', message);
                }
                console.log('Server closed. Exiting.');
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Failed to start server:', message);
        process.exit(1);
    }
};

startServer();
