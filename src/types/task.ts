// Task-related TypeScript types — defines response shapes, request body contracts, and pagination metadata.
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

// Pagination envelope included in list responses — lets clients navigate large result sets
export interface PaginationMeta {
    // Total number of documents matching the current filter
    total: number;
    // The current page number (1-indexed)
    page: number;
    // Number of items returned per page
    limit: number;
    // Total number of pages given the current limit
    totalPages: number;
    // True when there is a page after the current one
    hasNextPage: boolean;
    // True when there is a page before the current one
    hasPrevPage: boolean;
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
