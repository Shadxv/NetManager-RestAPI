'use strict';

import { Router, Request, Response } from 'express';
import { Users } from '@db/entities';
import { User, newUser } from '@/models';
import { authenticateToken } from '@/middleware/auth.middleware';

const router: Router = Router();

router.use(authenticateToken());

router.get('/', async (req: Request, res: Response) => {
    try {
        const allUsers: User[] = await Users.find({});
        return res.status(200).json(allUsers);
    } catch (error) {
        console.error('Error occured during fetching data:', error);
        return res.status(500).json({
            message: 'Error occured during fetching data.',
            error: (error as Error).message,
        });
    }
});

router.post('/', async (req: Request, res: Response) => {
    try {
        const { user, password } = newUser(req.body.email);
        await Users.insertOne(user);
        return res.status(201).json({ password: password });
    } catch (error) {
        console.error('Error occured during fetching data:', error);
        return res.status(500).json({
            message: 'Error occured during fetching data.',
            error: (error as Error).message,
        });
    }
});

export { router as UsersRouter };
