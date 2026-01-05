'use strict';

import { Document } from 'mongoose';

export interface Role extends Document {
    id: string;
    name: string;
    color: string;
    permissions: number;
    index: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface BaseRole {
    id: string;
    name: string;
    color: string;
    index: number;
}
