// Task controller — CRUD handlers for tasks with ownership enforcement and RBAC.
// Removing this file disables all task operations; the API would have no task endpoints.

import { Response } from 'express';
import mongoose from 'mongoose';
import Task, { ITask, TaskDocument } from '../models/Task';
import asyncHandler from '../middleware/asyncHandler';
import { createAppError } from '../types/errors';
import { AuthenticatedRequest } from '../types/auth';
import { CreateTaskBody, TaskResponse, UpdateTaskBody } from '../types/task';

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

// Handler — GET /api/tasks — returns all tasks owned by the current user; admins see all tasks.
// Removing this handler leaves users with no way to list their tasks.
const getAllTasks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    // Admins receive all tasks; regular users only receive their own
    const filter = user.role === 'admin' ? {} : { owner: user.id };
    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
        status: 'success',
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

    const task = await Task.findById(id);
    if (!task) {
        throw createAppError(`Task with ID ${id} not found.`, 404);
    }

    const user = req.user!;
    // Prevent users from modifying tasks they do not own
    if (user.role !== 'admin' && task.owner.toString() !== user.id) {
        throw createAppError('You are not authorised to update this task.', 403);
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

    const updated = await Task.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });

    res.status(200).json({
        status: 'success',
        message: 'Task updated successfully.',
        data: formatTask(updated!)
    });
});

// Handler — DELETE /api/tasks/:id — deletes a task; only the owner or an admin may delete.
// Removing this handler prevents any task from ever being removed.
const deleteTask = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const id = parseTaskId(req.params.id as string);
    const task = await Task.findById(id);

    if (!task) {
        throw createAppError(`Task with ID ${id} not found.`, 404);
    }

    const user = req.user!;
    // Admins can delete any task; users can only delete their own
    if (user.role !== 'admin' && task.owner.toString() !== user.id) {
        throw createAppError('You are not authorised to delete this task.', 403);
    }

    await task.deleteOne();

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
