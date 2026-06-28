// Task controller — CRUD handlers for tasks with ownership enforcement, RBAC, and pagination.
// Removing this file disables all task operations; the API would have no task endpoints.

import { Response } from 'express';
import mongoose from 'mongoose';
import Task, { ITask, TaskDocument } from '../models/Task';
import asyncHandler from '../middleware/asyncHandler';
import { createAppError } from '../types/errors';
import { AuthenticatedRequest } from '../types/auth';
import { CreateTaskBody, PaginationMeta, TaskResponse, UpdateTaskBody } from '../types/task';

// Formatter — converts a Mongoose TaskDocument to a plain API-safe response object.
// Removing this helper causes inconsistent response shapes across all task endpoints.
const formatTask = (task: TaskDocument): TaskResponse => ({
    id: task._id.toString(),
    title: task.title,
    completed: task.completed,
    owner: task.owner.toString(),
    createdAt: task.createdAt
});

// Validator — checks that a raw ID string is a valid MongoDB ObjectId.
// Removing this causes Mongoose to throw a CastError instead of a clean 400 response.
const parseTaskId = (rawId: string): string => {
    if (!mongoose.Types.ObjectId.isValid(rawId)) {
        throw createAppError('Invalid task ID.', 400);
    }
    return rawId;
};

// Helper — parses and clamps pagination query parameters from the request.
// Removing this helper duplicates page/limit parsing logic across every paginated endpoint.
const parsePagination = (query: Record<string, unknown>): { page: number; limit: number; skip: number } => {
    const DEFAULT_LIMIT = 10;
    const MAX_LIMIT = 100;

    const rawPage = Number(query.page);
    const rawLimit = Number(query.limit);

    // Default to page 1 if missing or non-positive
    const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
    // Default to DEFAULT_LIMIT; cap at MAX_LIMIT to prevent runaway queries
    const limit = Number.isInteger(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    return { page, limit, skip: (page - 1) * limit };
};

// Handler — GET /api/tasks — returns a paginated list of tasks for the current user; admins see all.
// Removing this handler leaves users with no way to list their tasks.
const getAllTasks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    // Admins receive all tasks; regular users only receive their own
    const filter = user.role === 'admin' ? {} : { owner: user.id };

    const { page, limit, skip } = parsePagination(req.query as Record<string, unknown>);

    // Run count and find in parallel — avoids sequential round-trips to the database
    const [total, tasks] = await Promise.all([
        Task.countDocuments(filter),
        Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit)
    ]);

    const totalPages = Math.ceil(total / limit);

    const pagination: PaginationMeta = {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
    };

    res.status(200).json({
        status: 'success',
        pagination,
        count: tasks.length,
        data: tasks.map(formatTask)
    });
});

// Handler — GET /api/tasks/:id — returns a single task if the requester owns it or is an admin.
// Removing this handler prevents retrieval of individual task details.
const getTaskById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = parseTaskId(req.params.id as string);
    const task = await Task.findById(id);

    if (!task) {
        throw createAppError(`Task with ID ${id} not found.`, 404);
    }

    const user = req.user!;
    // Ownership check — non-admins cannot read another user's task
    if (user.role !== 'admin' && task.owner.toString() !== user.id) {
        throw createAppError('You are not authorised to access this task.', 403);
    }

    res.status(200).json({
        status: 'success',
        data: formatTask(task)
    });
});

// Handler — POST /api/tasks — creates a new task owned by the authenticated user.
// Removing this handler disables task creation entirely.
const createTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, completed } = (req.body ?? {}) as CreateTaskBody;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw createAppError('Title is required and must be a non-empty string.', 400);
    }

    const task = await Task.create({
        title: title.trim(),
        completed: typeof completed === 'boolean' ? completed : false,
        // Link the new task to the authenticated user so ownership checks work
        owner: req.user!.id
    });

    res.status(201).json({
        status: 'success',
        message: 'Task created successfully.',
        data: formatTask(task)
    });
});

// Handler — PUT /api/tasks/:id — updates a task; only the owner or an admin may update.
// Removing this handler leaves tasks immutable after creation.
const updateTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = parseTaskId(req.params.id as string);
    const { title, completed } = (req.body ?? {}) as UpdateTaskBody;

    // BUG FIX: Reject empty update bodies early — previously returned 200 with no changes
    if (title === undefined && completed === undefined) {
        throw createAppError('No update fields provided. Supply at least "title" or "completed".', 400);
    }

    const updateData: Partial<Pick<ITask, 'title' | 'completed'>> = {};

    if (title !== undefined) {
        if (typeof title !== 'string' || title.trim() === '') {
            throw createAppError('Title must be a non-empty string.', 400);
        }
        updateData.title = title.trim();
    }

    if (completed !== undefined) {
        if (typeof completed !== 'boolean') {
            throw createAppError('Completed must be a boolean value.', 400);
        }
        updateData.completed = completed;
    }

    // BUG FIX: Replaced the previous findById → findByIdAndUpdate two-query pattern.
    // The old approach had a TOCTOU race: the task could be deleted between the two queries,
    // causing findByIdAndUpdate to return null while the non-null assertion (!updated) would throw.
    // Using findOneAndUpdate with the ownership condition atomically fetches and updates in one round-trip.
    const user = req.user!;
    const ownershipFilter = user.role === 'admin'
        ? { _id: id }
        : { _id: id, owner: user.id };

    const updated = await Task.findOneAndUpdate(ownershipFilter, updateData, {
        new: true,
        runValidators: true
    });

    // If null: either the task doesn't exist OR this user doesn't own it
    if (!updated) {
        // Check whether the task exists at all to return the right error code
        const exists = await Task.exists({ _id: id });
        if (!exists) {
            throw createAppError(`Task with ID ${id} not found.`, 404);
        }
        // Task exists but ownership check failed
        throw createAppError('You are not authorised to update this task.', 403);
    }

    res.status(200).json({
        status: 'success',
        message: 'Task updated successfully.',
        data: formatTask(updated)
    });
});

// Handler — DELETE /api/tasks/:id — deletes a task; only the owner or an admin may delete.
// Removing this handler prevents any task from ever being removed.
const deleteTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = parseTaskId(req.params.id as string);

    const user = req.user!;
    // BUG FIX: Replaced the previous findById → deleteOne two-query pattern with a single atomic
    // findOneAndDelete so the ownership check and deletion happen in one round-trip, eliminating the
    // TOCTOU race where the task could be deleted by another request between the two queries.
    const ownershipFilter = user.role === 'admin'
        ? { _id: id }
        : { _id: id, owner: user.id };

    const task = await Task.findOneAndDelete(ownershipFilter);

    if (!task) {
        const exists = await Task.exists({ _id: id });
        if (!exists) {
            throw createAppError(`Task with ID ${id} not found.`, 404);
        }
        throw createAppError('You are not authorised to delete this task.', 403);
    }

    res.status(200).json({
        status: 'success',
        message: `Task with ID ${id} deleted successfully.`
    });
});

export {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
