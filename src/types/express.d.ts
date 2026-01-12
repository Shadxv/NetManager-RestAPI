'use strict';

import * as express from 'express';
import { TokenPayload } from '@/models';

declare module 'express' {
    export interface Request {
        user?: TokenPayload;
        userId?: string;
    }
}
