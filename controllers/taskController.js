let tasks = [];
let nextId = 1;

const getAllTasks = (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            count: tasks.length,
            data: tasks
        });
    } catch (error) {
        next(error);
    }
};

const getTaskById = (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            const error = new Error('Invalid task ID. ID must be a number.');
            error.statusCode = 400;
            return next(error);
        }

        const task = tasks.find(t => t.id === id);

        if (!task) {
            const error = new Error(`Task with ID ${id} not found.`);
            error.statusCode = 404;
            return next(error);
        }

        res.status(200).json({
            success: true,
            data: task
        });
    } catch (error) {
        next(error);
    }
};

const createTask = (req, res, next) => {
    try {
        const { title, completed } = req.body;

        if (!title || typeof title !== 'string' || title.trim() === '') {
            const error = new Error('Title is required and must be a non-empty string.');
            error.statusCode = 400;
            return next(error);
        }

        const task = {
            id: nextId++,
            title: title.trim(),
            completed: typeof completed === 'boolean' ? completed : false
        };

        tasks.push(task);

        res.status(201).json({
            success: true,
            message: 'Task created successfully.',
            data: task
        });
    } catch (error) {
        next(error);
    }
};

const updateTask = (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            const error = new Error('Invalid task ID. ID must be a number.');
            error.statusCode = 400;
            return next(error);
        }

        const taskIndex = tasks.findIndex(t => t.id === id);

        if (taskIndex === -1) {
            const error = new Error(`Task with ID ${id} not found.`);
            error.statusCode = 404;
            return next(error);
        }

        const { title, completed } = req.body;

        if (title !== undefined) {
            if (typeof title !== 'string' || title.trim() === '') {
                const error = new Error('Title must be a non-empty string.');
                error.statusCode = 400;
                return next(error);
            }
            tasks[taskIndex].title = title.trim();
        }

        if (completed !== undefined) {
            if (typeof completed !== 'boolean') {
                const error = new Error('Completed must be a boolean value.');
                error.statusCode = 400;
                return next(error);
            }
            tasks[taskIndex].completed = completed;
        }

        res.status(200).json({
            success: true,
            message: 'Task updated successfully.',
            data: tasks[taskIndex]
        });
    } catch (error) {
        next(error);
    }
};

const deleteTask = (req, res, next) => {
    try {
        const id = parseInt(req.params.id, 10);

        if (isNaN(id)) {
            const error = new Error('Invalid task ID. ID must be a number.');
            error.statusCode = 400;
            return next(error);
        }

        const taskIndex = tasks.findIndex(t => t.id === id);

        if (taskIndex === -1) {
            const error = new Error(`Task with ID ${id} not found.`);
            error.statusCode = 404;
            return next(error);
        }

        const deletedTask = tasks[taskIndex];
        tasks.splice(taskIndex, 1);

        res.status(200).json({
            success: true,
            message: `Task with ID ${id} deleted successfully.`,
            data: deletedTask
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
