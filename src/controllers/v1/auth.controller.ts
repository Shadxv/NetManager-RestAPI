'use strict';

import { Router, Request, Response } from 'express';
import { Roles, Users } from '@db/entities';
import { Role, User } from '@/models';
import * as crypto from 'node:crypto';
import { generateToken } from '@/utils';

const router: Router = Router();

router.post('/', async (req: Request, res: Response) => {
    if (!req.body || !req.body.email || !req.body.password) return res.status(400);
    const { email, password } = req.body;

    try {
        const user: User | null | undefined = await Users.findOne({ email: email });
        if (!user) return res.status(401);

        const hash = crypto.hash('sha256', password);
        if (hash !== user.password) {
            return res.status(401);
        }

        const roleSearch: Role | null | undefined = !user.roleId
            ? undefined
            : await Roles.findOne({ roleId: user.roleId });

        const role: Role | undefined = roleSearch ?? undefined;

        if (user.isProvisioned) {
            return await handleAuth(user, role, res);
        } else {
            return await handleTempAuth(user, role, res);
        }
    } catch (error) {
        return res.status(500).send();
    }
});

async function handleTempAuth(
    user: User,
    role: Role | undefined,
    res: Response,
): Promise<Response<any, Record<string, any>>> {
    if (user.tempPasswordExpires && user.tempPasswordExpires.getTime() < Date.now()) {
        return res.status(410).send();
    }

    return res
        .status(200)
        .json({ token: generateToken(user, role), status: 'REQUIRES_PASSWORD_SETUP' });
}

async function handleAuth(
    user: User,
    role: Role | undefined,
    res: Response,
): Promise<Response<any, Record<string, any>>> {
    return res.status(200).json({ token: generateToken(user, role) });
}

export { router as AuthRouter };
