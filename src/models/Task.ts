import { Schema, model, HydratedDocument } from 'mongoose';

export interface ITask {
    title: string;
    completed: boolean;
    createdAt: Date;
}

export type TaskDocument = HydratedDocument<ITask>;

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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default model<ITask>('Task', taskSchema);
