'use strict';

import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Roles, Users } from '@db/entities';
import { generateRefreshedToken, generateToken } from '@/utils';
import { asyncQuery } from '@db/mongodb';
import { authenticateToken } from '@/middleware/auth.middleware';
import { Role } from '@/models';

const router = Router();

router.post(
    '/',
    asyncQuery(async (req: Request, res: Response) => {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Missing credentials' });
        }

        const user = await Users.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const role = user.roleId ? await Roles.findOne({ roleId: user.roleId }) : undefined;

        if (
            !user.isProvisioned &&
            user.tempPasswordExpires &&
            user.tempPasswordExpires.getTime() < Date.now()
        ) {
            return res.status(410).json({ message: 'Temporary password expired' });
        }

        const token = generateToken(user, role as Role);

        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            surname: user.surname,
            avatar: user.avatar,
            roleId: user.roleId,
            roleIndex: role?.index || 100,
            permissions: role?.permissions || 0,
            additionalPermissions: user.additionalPermissions || [],
        };

        if (!user.isProvisioned) {
            const status =
                !user.name || !user.surname ? 'REQUIRES_SETUP' : 'REQUIRES_PASSWORD_RESET';
            return res.status(200).json({
                token,
                user: userData,
                status,
            });
        }

        return res.status(200).json({
            token,
            user: userData,
            status: 'AUTHENTICATED',
        });
    }),
);

router.post(
    '/setup',
    authenticateToken(true),
    asyncQuery(async (req: Request, res: Response) => {
        const { name, surname, password } = req.body;
        const userId = req.user?.sub;

        const user = await Users.findById(userId);

        if (!user || user.isProvisioned) {
            return res.status(403).json({ message: 'Account already provisioned' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await Users.findByIdAndUpdate(userId, {
            name,
            surname,
            password: hashedPassword,
            isProvisioned: true,
            tempPasswordExpires: null,
        });

        return res.status(200).json({ message: 'Setup complete' });
    }),
);

router.post(
    '/reset',
    authenticateToken(true),
    asyncQuery(async (req: Request, res: Response) => {
        const { password } = req.body;
        const userId = req.user?.sub;

        const user = await Users.findById(userId);
        if (!user) return res.status(404).send();

        if (!req.user?.requiresPasswordReset) {
            return res.status(403).json({ message: 'Password reset not required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await Users.findByIdAndUpdate(userId, {
            password: hashedPassword,
            isProvisioned: true,
            tempPasswordExpires: null,
        });

        return res.status(200).json({ message: 'Password updated' });
    }),
);

router.get(
    '/me',
    authenticateToken(false),
    asyncQuery(async (req: Request, res: Response) => {
        if (!req.user || !req.user.sub) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        try {
            const user = await Users.findById(req.user.sub);
            if (!user) return res.status(401).json({ message: 'User not found' });

            const role = user.roleId ? await Roles.findById(user.roleId) : undefined;

            let currentStatus: 'AUTHENTICATED' | 'REQUIRES_SETUP' | 'REQUIRES_PASSWORD_RESET' =
                'AUTHENTICATED';
            if (!user.isProvisioned) {
                currentStatus =
                    !user.name || !user.surname ? 'REQUIRES_SETUP' : 'REQUIRES_PASSWORD_RESET';
            }

            const userData = {
                id: user.id,
                email: user.email,
                name: user.name,
                surname: user.surname,
                avatar: user.avatar,
                roleId: role?.id || '',
                roleIndex: role?.index ?? 100,
                permissions: role?.permissions ?? 0,
                additionalPermissions: user.additionalPermissions || [],
            };

            const oldRoleId = req.user.roleId || '';
            const oldAdditionalPerms = Array.isArray(req.user.additionalPermissions)
                ? [...req.user.additionalPermissions].sort()
                : [];

            const currentPerms = Array.isArray(user.additionalPermissions)
                ? [...user.additionalPermissions].sort()
                : [];

            const hasRoleChanged = (role?.id || '') !== oldRoleId;
            const hasPermissionsChanged =
                JSON.stringify(currentPerms) !== JSON.stringify(oldAdditionalPerms);
            const hasProvisioningChanged =
                !user.isProvisioned !== (req.user.requiresPasswordReset === false);

            if (
                hasRoleChanged ||
                hasPermissionsChanged ||
                hasProvisioningChanged ||
                !req.user.exp
            ) {
                const targetExp = req.user.exp || Math.floor(Date.now() / 1000) + 86400;

                const newToken = generateRefreshedToken(user, role, targetExp);

                return res.status(200).json({
                    user: userData,
                    status: currentStatus,
                    token: newToken,
                    refreshed: true,
                });
            }

            return res.status(200).json({
                user: userData,
                status: currentStatus,
                refreshed: false,
            });
        } catch (error) {
            return res.status(500).json({ message: 'Internal server error' });
        }
    }),
);

export { router as AuthRouter };
