// Auth controller — handles user registration and login; issues JWTs on success.
// Removing this file breaks all authentication endpoints; no user can register or log in.

import { Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserDocument } from '../models/User';
import asyncHandler from '../middleware/asyncHandler';
import { createAppError } from '../types/errors';
import { AuthenticatedRequest, RegisterBody, LoginBody } from '../types/auth';

// Helper — generates a signed JWT for the authenticated user.
// Removing this helper requires duplicating JWT signing logic in register and login separately.
const signToken = (id: string, role: 'user' | 'admin'): string => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '1h';

    if (!secret) {
        throw new Error('Server misconfiguration: JWT_SECRET is not defined.');
    }

    // Cast is necessary because jwt.sign's overloads don't narrow based on secret type
    return jwt.sign({ id, role }, secret, { expiresIn } as jwt.SignOptions);
};

// Helper — builds a sanitised user object safe to include in API responses.
// Removing this helper risks accidentally including the password hash in responses.
const sanitiseUser = (user: UserDocument) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
});

// Handler — POST /auth/register — creates a new user account with a hashed password.
// Removing this handler disables user self-registration entirely.
const register = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { name, email, password, role } = (req.body ?? {}) as RegisterBody;

    // Validate presence and types before touching the database
    if (!name || typeof name !== 'string' || name.trim() === '') {
        throw createAppError('Name is required and must be a non-empty string.', 400);
    }
    if (!email || typeof email !== 'string' || email.trim() === '') {
        throw createAppError('Email is required and must be a non-empty string.', 400);
    }
    if (!password || typeof password !== 'string' || password.trim().length < 6) {
        throw createAppError('Password is required and must be at least 6 characters.', 400);
    }
    // Prevent clients from self-assigning the admin role
    if (role !== undefined && role !== 'user') {
        throw createAppError('Role assignment is restricted. Only "user" is allowed during registration.', 403);
    }

    // The User model's pre-save hook hashes the password before storing
    const user = await User.create({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password
    });

    const token = signToken(user._id.toString(), user.role);

    res.status(201).json({
        status: 'success',
        message: 'Account created successfully.',
        token,
        data: { user: sanitiseUser(user) }
    });
});

// Handler — POST /auth/login — authenticates credentials and returns a JWT.
// Removing this handler prevents any existing user from logging in.
const login = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { email, password } = (req.body ?? {}) as LoginBody;

    if (!email || typeof email !== 'string') {
        throw createAppError('Email is required.', 400);
    }
    if (!password || typeof password !== 'string') {
        throw createAppError('Password is required.', 400);
    }

    // Explicitly include password because the schema marks it as select: false
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password') as UserDocument | null;

    // Use a generic error message to prevent user-enumeration attacks
    if (!user) {
        throw createAppError('Invalid email or password.', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw createAppError('Invalid email or password.', 401);
    }

    const token = signToken(user._id.toString(), user.role);

    res.status(200).json({
        status: 'success',
        message: 'Logged in successfully.',
        token,
        data: { user: sanitiseUser(user) }
    });
});

export { register, login };
