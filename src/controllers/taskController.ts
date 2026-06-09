import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Task, { ITask, TaskDocument } from '../models/Task';
import asyncHandler from '../middleware/asyncHandler';
import { createAppError } from '../types/errors';
import { CreateTaskBody, TaskResponse, UpdateTaskBody } from '../types/task';

const formatTask = (task: TaskDocument): TaskResponse => ({
    id: task._id.toString(),
    title: task.title,
    completed: task.completed,
    createdAt: task.createdAt
});

const parseTaskId = (rawId: string): string => {
    if (!mongoose.Types.ObjectId.isValid(rawId)) {
        throw createAppError('Invalid task ID.', 400);
    }
    return rawId;
};

const getAllTasks = asyncHandler(async (_req: Request, res: Response) => {
    const tasks = await Task.find().sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks.map(formatTask)
    });
});

const getTaskById = asyncHandler(async (req: Request, res: Response) => {
    const id = parseTaskId(req.params.id as string);
    const task = await Task.findById(id);

    if (!task) {
        throw createAppError(`Task with ID ${id} not found.`, 404);
    }

    res.status(200).json({
        success: true,
        data: formatTask(task)
    });
});

const createTask = asyncHandler(async (req: Request, res: Response) => {
    const { title, completed } = (req.body ?? {}) as CreateTaskBody;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        throw createAppError('Title is required and must be a non-empty string.', 400);
    }

    const task = await Task.create({
        title: title.trim(),
        completed: typeof completed === 'boolean' ? completed : false
    });

    res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: formatTask(task)
    });
});

const updateTask = asyncHandler(async (req: Request, res: Response) => {
    const id = parseTaskId(req.params.id as string);
    const { title, completed } = (req.body ?? {}) as UpdateTaskBody;
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

    const task = await Task.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
    });

    if (!task) {
        throw createAppError(`Task with ID ${id} not found.`, 404);
    }

    res.status(200).json({
        success: true,
        message: 'Task updated successfully.',
        data: formatTask(task)
    });
});

const deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const id = parseTaskId(req.params.id as string);
    const task = await Task.findByIdAndDelete(id);

    if (!task) {
        throw createAppError(`Task with ID ${id} not found.`, 404);
    }

    res.status(200).json({
        success: true,
        message: `Task with ID ${id} deleted successfully.`,
        data: formatTask(task)
    });
});

export {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
