// Admin-only user management controller — lets admins list and delete user accounts.
// Removing this file disables all admin user-management endpoints.

import { Response } from 'express';
import User from '../models/User';
import Task from '../models/Task';
import asyncHandler from '../middleware/asyncHandler';
import { createAppError } from '../types/errors';
import { AuthenticatedRequest } from '../types/auth';

// Handler — GET /api/users — returns all registered users (admin only).
// Removing this handler prevents admins from seeing who is registered.
const getAllUsers = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    // Password is excluded by schema default; no explicit omission needed here
    const users = await User.find().sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
        count: users.length,
        data: users.map((u) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            role: u.role,
            createdAt: u.createdAt
        }))
    });
});

// Handler — GET /api/users/:id — returns a single user by ID (admin only).
// Removing this handler prevents admins from inspecting individual user accounts.
const getUserById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw createAppError(`User with ID ${req.params.id} not found.`, 404);
    }

    res.status(200).json({
        status: 'success',
        data: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt
        }
    });
});

// Handler — DELETE /api/users/:id — deletes a user and all their tasks (admin only).
// Removing this handler prevents admins from removing user accounts.
const deleteUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        throw createAppError(`User with ID ${req.params.id} not found.`, 404);
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
