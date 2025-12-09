'use strict';

import * as express from 'express';
import { TokenPayload } from '@/interfaces/auth.interface';

declare module 'express' {
    export interface Request {
        user?: TokenPayload;
    }
}
