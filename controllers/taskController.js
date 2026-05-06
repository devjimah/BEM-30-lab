let tasks = [];
let nextId = 1;

const parseTaskId = (rawId) => {
    const id = parseInt(rawId, 10);
    if (isNaN(id)) {
        const error = new Error('Invalid task ID. ID must be a number.');
        error.statusCode = 400;
        throw error;
    }
    return id;
};

const findTaskIndex = (id) => {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) {
        const error = new Error(`Task with ID ${id} not found.`);
        error.statusCode = 404;
        throw error;
    }
    return index;
};

const getAllTasks = (req, res) => {
    res.status(200).json({
        success: true,
        count: tasks.length,
        data: tasks
    });
};

const getTaskById = (req, res) => {
    const id = parseTaskId(req.params.id);
    const task = tasks.find(t => t.id === id);

    if (!task) {
        const error = new Error(`Task with ID ${id} not found.`);
        error.statusCode = 404;
        throw error;
    }

    res.status(200).json({
        success: true,
        data: task
    });
};

const createTask = (req, res) => {
    const { title, completed } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
        const error = new Error('Title is required and must be a non-empty string.');
        error.statusCode = 400;
        throw error;
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
};

const updateTask = (req, res) => {
    const id = parseTaskId(req.params.id);
    const taskIndex = findTaskIndex(id);
    const { title, completed } = req.body;

    if (title !== undefined) {
        if (typeof title !== 'string' || title.trim() === '') {
            const error = new Error('Title must be a non-empty string.');
            error.statusCode = 400;
            throw error;
        }
        tasks[taskIndex].title = title.trim();
    }

    if (completed !== undefined) {
        if (typeof completed !== 'boolean') {
            const error = new Error('Completed must be a boolean value.');
            error.statusCode = 400;
            throw error;
        }
        tasks[taskIndex].completed = completed;
    }

    res.status(200).json({
        success: true,
        message: 'Task updated successfully.',
        data: tasks[taskIndex]
    });
};

const deleteTask = (req, res) => {
    const id = parseTaskId(req.params.id);
    const taskIndex = findTaskIndex(id);
    const deletedTask = tasks[taskIndex];
    tasks.splice(taskIndex, 1);

    res.status(200).json({
        success: true,
        message: `Task with ID ${id} deleted successfully.`,
        data: deletedTask
    });
};

module.exports = {
    getAllTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask
};
