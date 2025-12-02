'use strict';

import mongoose from 'mongoose';

const URI = process.env.MONGODB_URI;

export async function connect() {
    if (!URI) {
        throw new Error('mongodb URI not found in environment variables');
    }

    await mongoose.connect(URI);
    console.log('Connected to database.');
}
