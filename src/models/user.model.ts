'use strict';

import { Document } from 'mongoose';
import { durationToMilliseconds, generateRandomPassword } from '@/utils';
import bcrypt from 'bcrypt';

export interface User extends Document {
    id: string;
    email: string;
    roleId?: string;
    name?: string;
    surname?: string;
    avatar?: string;
    additionalPermissions: string[];
    isProvisioned: boolean;
    password: string;
    tempPasswordExpires?: Date;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface BaseUser {
    id: string;
    email: string;
    roleId?: string;
    name?: string;
    surname?: string;
    avatar?: string;
    isProvisioned: boolean;
    tempPasswordExpires?: Date;
    createdBy: string;
    createdAt: Date;
}

export async function newUser(
    email: string,
    roleId?: string,
    tempPasswordDuration: string = '1d',
    createdBy: string = 'System',
    tempPassword?: string,
): Promise<{
    user: {
        email: string;
        roleId?: string;
        password: string;
        tempPasswordExpires: Date;
        createdBy: string;
    };
    password: string;
}> {
    const password = tempPassword || generateRandomPassword();

    const durationMs = durationToMilliseconds(tempPasswordDuration);
    const expiresAt = new Date(Date.now() + durationMs);

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    return {
        user: {
            email: email,
            roleId: roleId,
            password: hash,
            tempPasswordExpires: expiresAt,
            createdBy: createdBy,
        },
        password: password,
    };
}
