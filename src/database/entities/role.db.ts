'use strict';

import { Schema, model } from 'mongoose';
import { Role } from '@/models';

const RoleSchema: Schema = new Schema(
    {
        roleId: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
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
            default: 100,
        },
    },
    {
        timestamps: true,
    },
);

export const Roles = model<Role>('Role', RoleSchema, 'roles');
