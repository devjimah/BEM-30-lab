# Task Tracker API

A simple, production-ready RESTful API for managing tasks using **Node.js**, **Express.js**, and in-memory data storage. This project demonstrates fundamental backend development concepts including CRUD operations, custom middleware, MVC architecture, environment-based configuration, and structured error handling.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Environment Variables](#environment-variables)
6. [Project Structure](#project-structure)
7. [API Documentation](#api-documentation)
   - [Get All Tasks](#1-get-all-tasks)
   - [Get Task by ID](#2-get-task-by-id)
   - [Create a Task](#3-create-a-task)
   - [Update a Task](#4-update-a-task)
   - [Delete a Task](#5-delete-a-task)
8. [Testing the API](#testing-the-api)
   - [cURL (macOS/Linux)](#curl-macoslinux)
   - [PowerShell (Windows)](#powershell-windows)
   - [Postman / Insomnia](#postman--insomnia)
9. [Error Handling](#error-handling)
10. [Middleware](#middleware)
11. [Response Format](#response-format)
12. [Evaluation Criteria Mapping](#evaluation-criteria-mapping)
13. [License](#license)

---

## Project Overview

The Task Tracker API is a backend system that allows users to manage tasks through a set of RESTful endpoints. Each task contains an auto-incremented ID, a title, and a completion status. All data is stored in memory (no database required for this module), making the project lightweight and easy to run locally.

---

## Features

- **Full CRUD Operations**: Create, Read, Update, and Delete tasks.
- **Input Validation**: Ensures required fields are present and correctly typed.
- **Structured Error Responses**: Consistent JSON error format with appropriate HTTP status codes.
- **Custom Middleware Stack**: Request logging, JSON body parsing, 404 handling, and global error catching.
- **MVC Architecture**: Clean separation of concerns across controllers, routes, and middleware.
- **Environment-Based Configuration**: Server port and future secrets managed via `.env`.

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- npm (comes bundled with Node.js)

---

## Installation & Setup

1. **Clone or navigate into the project directory**:
   ```bash
   cd task-tracker-api
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

   For development with auto-reload (Node.js v18+):
   ```bash
   npm run dev
   ```

4. **Verify the server is running**:
   Visit `http://localhost:3000/api/tasks` in your browser or use the test commands below.

---

## Environment Variables

Create a `.env` file in the project root (if not present):

```env
PORT=3000
```

| Variable | Description              | Default |
|----------|--------------------------|---------|
| `PORT`   | Port the Express server listens on | `3000`  |

The server loads `.env` automatically via `dotenv` at startup.

---

## Project Structure

```
task-tracker-api/
├── controllers/
│   └── taskController.js      # Business logic for task CRUD
├── middleware/
│   ├── logger.js                # Logs incoming requests
│   ├── errorHandler.js          # Global error responder
│   └── notFound.js              # 404 handler for undefined routes
├── routes/
│   └── taskRoutes.js            # Maps API endpoints to controllers
├── .env                         # Environment configuration
├── .gitignore                   # Ignores node_modules & local env files
├── package.json                 # Project metadata and dependencies
├── README.md                    # This file
└── server.js                    # Application entry point
```

---

## API Documentation

**Base URL:** `http://localhost:3000/api/tasks`

---

### 1. Get All Tasks

Retrieve a list of all tasks stored in memory.

- **Method:** `GET`
- **Endpoint:** `/api/tasks`
- **Success Response:**
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      { "id": 1, "title": "Buy groceries", "completed": false },
      { "id": 2, "title": "Walk the dog", "completed": true }
    ]
  }
  ```
- **Status Code:** `200 OK`

---

### 2. Get Task by ID

Retrieve a single task by its numeric ID.

- **Method:** `GET`
- **Endpoint:** `/api/tasks/:id`
- **Success Response:**
  ```json
  {
    "success": true,
    "data": { "id": 1, "title": "Buy groceries", "completed": false }
  }
  ```
- **Error Responses:**
  - `400 Bad Request` — ID is not a valid number.
  - `404 Not Found` — No task exists with the given ID.

---

### 3. Create a Task

Add a new task to the in-memory store.

- **Method:** `POST`
- **Endpoint:** `/api/tasks`
- **Request Body:**
  ```json
  {
    "title": "Learn Express.js",
    "completed": false
  }
  ```
- **Validation Rules:**
  - `title` is **required** and must be a non-empty string.
  - `completed` is optional; defaults to `false` if omitted.
- **Success Response:**
  ```json
  {
    "success": true,
    "message": "Task created successfully.",
    "data": { "id": 3, "title": "Learn Express.js", "completed": false }
  }
  ```
- **Status Code:** `201 Created`
- **Error Response:**
  - `400 Bad Request` — Missing or invalid title.

---

### 4. Update a Task

Modify the title and/or completion status of an existing task.

- **Method:** `PUT`
- **Endpoint:** `/api/tasks/:id`
- **Request Body:** (all fields optional)
  ```json
  {
    "title": "Learn Node.js & Express",
    "completed": true
  }
  ```
- **Success Response:**
  ```json
  {
    "success": true,
    "message": "Task updated successfully.",
    "data": { "id": 1, "title": "Learn Node.js & Express", "completed": true }
  }
  ```
- **Status Code:** `200 OK`
- **Error Responses:**
  - `400 Bad Request` — Invalid ID, or invalid title/completed type.
  - `404 Not Found` — Task ID does not exist.

---

### 5. Delete a Task

Remove a task from the store permanently.

- **Method:** `DELETE`
- **Endpoint:** `/api/tasks/:id`
- **Success Response:**
  ```json
  {
    "success": true,
    "message": "Task with ID 1 deleted successfully.",
    "data": { "id": 1, "title": "Learn Node.js & Express", "completed": true }
  }
  ```
- **Status Code:** `200 OK`
- **Error Responses:**
  - `400 Bad Request` — ID is not a valid number.
  - `404 Not Found` — Task ID does not exist.

---

## Testing the API

### cURL (macOS / Linux)

```bash
# 1. Get all tasks
curl http://localhost:3000/api/tasks

# 2. Get task by ID
curl http://localhost:3000/api/tasks/1

# 3. Create a new task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Learn Express", "completed": false}'

# 4. Update a task
curl -X PUT http://localhost:3000/api/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"title": "Master Express.js", "completed": true}'

# 5. Delete a task
curl -X DELETE http://localhost:3000/api/tasks/1

# 6. Trigger a 404 error
curl http://localhost:3000/api/unknown-route

# 7. Trigger a 400 error (missing title)
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"completed": false}'
```

### PowerShell (Windows)

```powershell
# 1. Get all tasks
Invoke-WebRequest -Uri http://localhost:3000/api/tasks -UseBasicParsing

# 2. Get task by ID
Invoke-WebRequest -Uri http://localhost:3000/api/tasks/1 -UseBasicParsing

# 3. Create a new task
Invoke-WebRequest -Uri http://localhost:3000/api/tasks -Method POST `
  -ContentType "application/json" `
  -Body '{"title":"Learn Express","completed":false}' -UseBasicParsing

# 4. Update a task
Invoke-WebRequest -Uri http://localhost:3000/api/tasks/1 -Method PUT `
  -ContentType "application/json" `
  -Body '{"title":"Master Express.js","completed":true}' -UseBasicParsing

# 5. Delete a task
Invoke-WebRequest -Uri http://localhost:3000/api/tasks/1 -Method DELETE -UseBasicParsing
```

### Postman / Insomnia

1. Import the base URL `http://localhost:3000/api/tasks`.
2. Set the request method (`GET`, `POST`, `PUT`, `DELETE`) accordingly.
3. For `POST` and `PUT`, add the header `Content-Type: application/json`.
4. In the **Body** tab, choose **raw** and enter your JSON payload.
5. Send the request and verify the response status codes and JSON body.

---

## Error Handling

The API handles errors gracefully and returns consistent JSON responses:

| Scenario                  | HTTP Status | Example Response |
|---------------------------|-------------|------------------|
| Undefined route           | `404`       | `{"success": false, "error": "Route not found: GET /api/unknown"}` |
| Invalid task ID           | `400`       | `{"success": false, "error": "Invalid task ID. ID must be a number."}` |
| Task not found            | `404`       | `{"success": false, "error": "Task with ID 99 not found."}` |
| Missing/invalid title     | `400`       | `{"success": false, "error": "Title is required and must be a non-empty string."}` |
| Invalid completed type    | `400`       | `{"success": false, "error": "Completed must be a boolean value."}` |
| Unexpected server error   | `500`       | `{"success": false, "error": "Internal Server Error"}` |

---

## Middleware

| Middleware       | File                        | Purpose |
|------------------|-----------------------------|---------|
| **JSON Parser**  | Built-in `express.json()`   | Parses incoming JSON request bodies. |
| **Logger**       | `middleware/logger.js`      | Logs every request with method, path, and ISO timestamp to the console. |
| **404 Handler**  | `middleware/notFound.js`    | Catches requests to undefined routes and forwards a 404 error. |
| **Error Handler**| `middleware/errorHandler.js`| Global catch-all that formats and returns JSON error responses. |

Middleware is applied in `server.js` in the following order:

```js
app.use(express.json());   // 1. Parse JSON body
app.use(logger);           // 2. Log request
app.use('/api/tasks', ...);// 3. Route handling
app.use(notFound);         // 4. Catch 404s
app.use(errorHandler);     // 5. Handle all errors
```

---

## Response Format

Every API response follows a unified JSON structure:

**Success:**
```json
{
  "success": true,
  "message": "...",   // Optional
  "data": { ... },    // or [] for lists
  "count": 3          // Included only for lists
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message"
}



