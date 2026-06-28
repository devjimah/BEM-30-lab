// Admin-only user management controller — lets admins list and delete user accounts.
// Removing this file disables all admin user-management endpoints.

import { Response } from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Task from '../models/Task';
import asyncHandler from '../middleware/asyncHandler';
import { createAppError } from '../types/errors';
import { AuthenticatedRequest } from '../types/auth';

// Helper — validates that a raw string is a valid MongoDB ObjectId before it reaches the database.
// Removing this causes Mongoose to throw a CastError on malformed IDs instead of a controlled 400.
const parseUserId = (rawId: string): string => {
    if (!mongoose.Types.ObjectId.isValid(rawId)) {
        throw createAppError('Invalid user ID.', 400);
    }
    return rawId;
};

// Helper — formats a user document into a safe, consistent response shape.
// Removing this causes duplicate formatting logic across all user handler functions.
const formatUser = (u: { _id: object; name: string; email: string; role: string; createdAt: Date }) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt
});

// Handler — GET /api/users — returns all registered users (admin only).
// Removing this handler prevents admins from seeing who is registered.
const getAllUsers = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    // Password is excluded by schema default (select: false); no explicit omission needed here
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        count: users.length,
        data: users.map(formatUser)
    });
});

// Handler — GET /api/users/:id — returns a single user by ID (admin only).
// Removing this handler prevents admins from inspecting individual user accounts.
const getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // BUG FIX: Validate the ID format before querying — previously a bad ID caused an unhandled CastError
    const id = parseUserId(req.params.id as string);
    const user = await User.findById(id);

    if (!user) {
        throw createAppError(`User with ID ${id} not found.`, 404);
    }

    res.status(200).json({
        status: 'success',
        data: formatUser(user)
    });
});

// Handler — DELETE /api/users/:id — deletes a user and all their tasks (admin only).
// Removing this handler prevents admins from removing user accounts.
const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    // BUG FIX: Validate the ID format before querying — previously a bad ID caused an unhandled CastError
    const id = parseUserId(req.params.id as string);
    const user = await User.findById(id);

    if (!user) {
        throw createAppError(`User with ID ${id} not found.`, 404);
    }

    // Cascade-delete all tasks belonging to the removed user to keep data consistent
    await Task.deleteMany({ owner: user._id });
    await user.deleteOne();

    res.status(200).json({
        status: 'success',
        message: `User ${user.email} and all their tasks have been deleted.`
    });
});

export { getAllUsers, getUserById, deleteUser };
