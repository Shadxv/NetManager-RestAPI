'use strict';

import { Document } from 'mongoose';
import { calculateExpirationDate, generateRandomPassword } from '@/utils';
import * as crypto from 'node:crypto';

export interface User extends Document {
    email: string;
    roleId?: string;
    name?: string;
    surname?: string;
    aditionalPermissions: string[];
    isProvisioned: boolean;
    password: string;
    tempPasswordExpires?: Date;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export function newUser(
    email: string,
    roleId?: string,
    tempPasswordDuration?: string,
    createdBy?: string,
    tempPassword?: string,
): {
    user: {
        email: string;
        roleId?: string;
        password: string;
        tempPasswordExpires: Date;
        createdBy: string;
    };
    password: string;
} {
    const password = tempPassword || generateRandomPassword();
    const hash = crypto.hash('sha256', password);
    return {
        user: {
            email: email,
            roleId: roleId,
            password: hash,
            tempPasswordExpires: calculateExpirationDate(tempPasswordDuration),
            createdBy: createdBy ? createdBy : 'System',
        },
        password: password,
    };
}
