// Mongoose User model — defines the schema, password hashing hook, and comparison method.
// Removing this file breaks all authentication; no user can register, log in, or be authorised.

import { Schema, model, Model, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

// TypeScript interface describing the raw User document fields
export interface IUser {
    name: string;
    email: string;
    password: string;
    role: 'user' | 'admin';
    createdAt: Date;
}

// Instance method signature for comparing plain-text passwords against the stored hash
export interface IUserMethods {
    // Instance method used at login to verify a supplied password without exposing the hash
    comparePassword(candidatePassword: string): Promise<boolean>;
}

// Blends the Mongoose document interface with custom instance methods
export type UserDocument = HydratedDocument<IUser, IUserMethods>;

// Full model type combining Mongoose Model statics with the custom instance methods
type UserModel = Model<IUser, object, IUserMethods>;

// Mongoose schema — defines validation rules, defaults, and the pre-save hook
const userSchema = new Schema<IUser, UserModel, IUserMethods>(
    {
        name: {
            type: String,
            required: [true, 'Name is required.'],
            trim: true,
            minlength: [2, 'Name must be at least 2 characters.'],
            maxlength: [100, 'Name cannot exceed 100 characters.']
        },
        email: {
            type: String,
            required: [true, 'Email is required.'],
            unique: true,
            lowercase: true,
            trim: true,
            // Simple RFC-5322-ish regex; catches most invalid emails at the DB layer
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address.']
        },
        password: {
            type: String,
            required: [true, 'Password is required.'],
            minlength: [6, 'Password must be at least 6 characters.'],
            // Exclude the password hash from query results by default for security
            select: false
        },
        role: {
            type: String,
            enum: {
                values: ['user', 'admin'],
                message: 'Role must be either "user" or "admin".'
            },
            default: 'user'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { versionKey: false }
);

// Pre-save hook — hashes the password before persisting to the database.
// Removing this hook stores passwords in plain text, a critical security vulnerability.
userSchema.pre<UserDocument>('save', async function () {
    // Only re-hash when the password field has actually changed (prevents double-hashing on other updates)
    if (!this.isModified('password')) return;

    const SALT_ROUNDS = 12;
    this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

// Instance method — compares a plain-text candidate against the stored bcrypt hash.
// Removing this method breaks the login flow; password verification would fail entirely.
userSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

// Registered Mongoose model — removing this breaks all DB operations on the users collection
export default model<IUser, UserModel>('User', userSchema);
