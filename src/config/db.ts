import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
    // Prefer the Atlas connection when configured, otherwise fall back to the local URI.
    const uri = process.env.MONGODB_ATLAS_URI || process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('No MongoDB connection string defined. Set MONGODB_ATLAS_URI or MONGODB_URI in environment variables.');
    }

    await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB connected: ${mongoose.connection.name}`);
};

export default connectDB;
