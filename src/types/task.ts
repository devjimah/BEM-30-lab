// Task-related TypeScript types — defines response shapes and request body contracts.
// Removing this file breaks type safety across the task controller and any consuming code.

// Shape of task data returned in every API response
export interface TaskResponse {
    id: string;
    title: string;
    completed: boolean;
    // Owner field included so clients know which user the task belongs to
    owner: string;
    createdAt: Date;
}

// Body shape expected by POST /api/tasks — unknown types prevent injection of unvalidated data
export interface CreateTaskBody {
    title?: unknown;
    completed?: unknown;
}

// Body shape expected by PUT /api/tasks/:id — all fields are optional (partial update)
export interface UpdateTaskBody {
    title?: unknown;
    completed?: unknown;
}
