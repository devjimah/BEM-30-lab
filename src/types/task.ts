export interface TaskResponse {
    id: string;
    title: string;
    completed: boolean;
    createdAt: Date;
}

export interface CreateTaskBody {
    title?: unknown;
    completed?: unknown;
}

export interface UpdateTaskBody {
    title?: unknown;
    completed?: unknown;
}
