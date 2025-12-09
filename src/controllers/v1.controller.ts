'use strict';

import { Router } from 'express';
import { AuthRouter, UsersRouter } from '@/controllers/v1';

export function v1Router(): Router {
    const router = Router();

    router.use('/users', UsersRouter);
    router.use('/auth', AuthRouter);

    return router;
}
