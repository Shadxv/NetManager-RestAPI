'use strict';

export interface Role extends Document {
    roleId: string;
    name: string;
    color: string;
    permissions: number;
    index: number;
    createdAt: Date;
    updatedAt: Date;
}
