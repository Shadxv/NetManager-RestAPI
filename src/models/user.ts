'use strict';

export interface User extends Document {
    email: string;
    roleId?: string;
    name?: string;
    surname?: string;
    aditionalPermissions: string[];
    isProvisioned: boolean;
    tempPasswordHash?: string;
    tempPasswordExpires?: Date;
    publicKey?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
