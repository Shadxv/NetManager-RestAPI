'use strict';

import { Schema, model, models } from 'mongoose';
import { Role } from '@/models';

const RoleSchema = new Schema<Role>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            default: 'untitled',
        },
        color: {
            type: String,
            required: true,
            default: '#808080',
        },
        permissions: {
            type: Number,
            required: true,
            default: 0,
        },
        index: {
            type: Number,
            required: true,
            index: true,
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

export const Roles = models.Role || model<Role>('Role', RoleSchema, 'roles');
