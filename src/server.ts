// Application entry point — bootstraps Express, connects to MongoDB, and registers all routes.
// Removing this file stops the server from starting entirely.

import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import connectDB from "./config/db";
import logger from "./middleware/logger";
import errorHandler from "./middleware/errorHandler";
import notFound from "./middleware/notFound";
import taskRoutes from "./routes/taskRoutes";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser — enables JSON request bodies; removing this causes req.body to always be undefined
app.use(express.json());

// Request logger — logs method, path, and status for every request; safe to remove without functional impact
app.use(logger);

// Health-check endpoint — lets load balancers verify the service is alive
app.get("/", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "task-tracker-api",
        version: "2.0.0",
        description: "Task Tracker API with JWT Authentication and RBAC"
    });
});

// Public auth routes — registration and login; no JWT required to access these
app.use("/auth", authRoutes);

// Protected task routes — require a valid JWT; ownership and RBAC enforced per-handler
app.use("/api/tasks", taskRoutes);

// Admin-only user management routes — require JWT + admin role
app.use("/api/users", userRoutes);

// 404 handler — catches requests to undefined routes; removing this returns Express default HTML errors
app.use(notFound);

// Global error handler — must be last; removing this causes unhandled errors to crash the process
app.use(errorHandler);

// Async startup function — connects to DB before accepting requests; prevents half-initialised state
const startServer = async (): Promise<void> => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
            console.log(`Auth routes:  POST /auth/register | POST /auth/login`);
            console.log(`Task routes:  /api/tasks  (JWT required)`);
            console.log(`User routes:  /api/users  (admin JWT required)`);
        });

        // Graceful shutdown handler — closes DB connections cleanly before process exit.
        // Removing this risks data corruption when the container is stopped mid-write.
        const gracefulShutdown = (signal: string): void => {
            console.log(`\nReceived ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                try {
                    await mongoose.connection.close();
                    console.log("Database connection closed.");
                } catch (closeErr) {
                    const message =
                        closeErr instanceof Error ? closeErr.message : "Unknown error";
                    console.error("Error closing database connection:", message);
                }
                console.log("Server closed. Exiting.");
                process.exit(0);
            });
        };

        // Termination signal for containers (e.g. Docker stop / Kubernetes pod eviction)
        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

        // Keyboard shutdown (Ctrl+C) signal
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("Failed to start server:", message);
        process.exit(1);
    }
};

startServer();
