'use strict';

import { Schema, model, models } from 'mongoose';
import { User } from '@/models';

const UserSchema: Schema = new Schema<User>(
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
        additionalPermissions: {
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
        avatar: {
            type: String,
            required: false,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        tempPasswordExpires: {
            type: Date,
            required: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            versionKey: false,
            transform: (_, ret) => {
                ret.id = ret._id.toString();
            },
        },
        toObject: { virtuals: true },
    },
);

export const Users = models.User || model<User>('User', UserSchema, 'users');
