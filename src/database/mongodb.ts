'use strict';

import mongoose from 'mongoose';
import { NextFunction } from 'express';
import { Router, Request, Response } from 'express';

const URI = process.env.MONGODB_URI;

export async function connect() {
    if (!URI) {
        throw new Error('mongodb URI not found in environment variables');
    }

    await mongoose.connect(URI);
    console.log('Connected to database.');
}

export const asyncQuery = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            let status = error.status || error.code || 500;
            let message = error.message || 'Error occurred during fetching data.';

            if (error.name === 'CastError') {
                status = 400;
                message = 'Invalid ID format.';
            }

            if (error.name === 'ValidationError') {
                status = 422;
                message = 'Validation failed.';
            }

            return res.status(status).json({
                message: message,
            });
        });
    };
};
