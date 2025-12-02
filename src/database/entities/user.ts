'use strict';

import { Schema, model } from 'mongoose';
import { User } from '@/models';

const UserSchema: Schema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        isProvisioned: {
            type: Boolean,
            required: true,
            default: false,
        },
        createdBy: {
            type: String,
            required: true,
        },
        aditionalPermissions: {
            type: [String],
            required: true,
            default: [],
        },
        roleId: {
            type: String,
            required: false,
            index: true,
        },
        name: {
            type: String,
            required: false,
            trim: true,
        },
        surname: {
            type: String,
            required: false,
            trim: true,
        },
        tempPasswordHash: {
            type: String,
            required: false,
        },
        tempPasswordExpires: {
            type: Date,
            required: false,
        },
        publicKey: {
            type: String,
            required: false,
            unique: true,
            sparse: true,
        },
    },
    {
        timestamps: true,
    },
);

export const Users = model<User>('User', UserSchema, 'users');
