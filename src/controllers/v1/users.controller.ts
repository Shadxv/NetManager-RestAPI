'use strict';

import { Router, Request, Response } from 'express';
import { Users } from '@db/entities';
import { User, newUser } from '@/models';
import { authenticateToken } from '@/middleware/auth.middleware';
import { asyncQuery } from '@db/mongodb';

const router: Router = Router();

router.use(authenticateToken());

router.get(
    '/',
    asyncQuery(async (req: Request, res: Response) => {
        const allUsers: User[] = await Users.find({});
        return res.status(200).json(allUsers);
    }),
);

router.get(
    '/:id',
    asyncQuery(async (req: Request, res: Response) => {
        const user = await Users.findOne({ _id: req.params.id });

        if (!user) {
            return res.status(404).end();
        }

        return res.status(200).json(user);
    }),
);

router.delete(
    '/:id',
    asyncQuery(async (req: Request, res: Response) => {
        const result = await Users.deleteOne({ _id: req.params.id });

        if (result.deletedCount == 0) {
            return res.status(404).end();
        }

        return res.status(200).end();
    }),
);

router.post(
    '/',
    asyncQuery(async (req: Request, res: Response) => {
        try {
            const { user, password } = newUser(req.body.email);
            await Users.insertOne(user);
            return res.status(201).json({ password: password });
        } catch (error: any) {
            if (error.code && error.code == 11000) {
                return res.status(409).end();
            }
            throw error;
        }
    }),
);

router.patch(
    '/:id',
    asyncQuery(async (req: Request, res: Response) => {}),
);

export { router as UsersRouter };
