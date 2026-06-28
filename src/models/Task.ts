// Mongoose Task model — defines schema with an owner reference for per-user task isolation.
// Removing this file destroys all task CRUD functionality and the user-task ownership link.

import { Schema, model, HydratedDocument, Types } from 'mongoose';

// TypeScript interface for the raw Task document fields
export interface ITask {
    title: string;
    completed: boolean;
    // Reference to the User who owns this task — used for ownership checks in controllers
    owner: Types.ObjectId;
    createdAt: Date;
}

// Blends the Mongoose document interface with full document capabilities
export type TaskDocument = HydratedDocument<ITask>;

// Mongoose schema — defines validation rules, defaults, and the owner reference
const taskSchema = new Schema<ITask>({
    title: {
        type: String,
        required: [true, 'Title is required and must be a non-empty string.'],
        trim: true,
        minlength: [1, 'Title is required and must be a non-empty string.']
    },
    completed: {
        type: Boolean,
        default: false
    },
    // Foreign key — links each task to its creator; removing this breaks RBAC ownership checks
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Task must belong to a user.']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Registered Mongoose model — removing this breaks all DB operations on the tasks collection
export default model<ITask>('Task', taskSchema);
