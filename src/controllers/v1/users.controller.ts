'use strict';

import { Router, Request, Response } from 'express';
import { Users } from '@db/entities';
import { User, newUser, BaseUser } from '@/models';
import { authenticateToken } from '@/middleware/auth.middleware';
import { asyncQuery } from '@db/mongodb';
import {
    generateInviteEmail,
    generateRandomPassword,
    generateResetPasswordEmail,
    sendEmail,
} from '@/utils';
import bcrypt from 'bcrypt';

const router: Router = Router();

//router.use(authenticateToken());

router.get(
    '/',
    asyncQuery(async (req: Request, res: Response) => {
        const allUsers: User[] = await Users.find({});
        const baseUsers: BaseUser[] = allUsers.map(
            ({
                id,
                email,
                roleId,
                name,
                surname,
                avatar,
                isProvisioned,
                tempPasswordExpires,
                createdBy,
                createdAt,
            }) => ({
                id,
                email,
                roleId,
                name,
                surname,
                avatar,
                isProvisioned,
                tempPasswordExpires,
                createdBy,
                createdAt,
            }),
        );
        return res.status(200).json(baseUsers);
    }),
);

router.get(
    '/:id',
    asyncQuery(async (req: Request, res: Response) => {
        const user: User | null = await Users.findById(req.params.id);
        if (!user) return res.status(404);

        const {
            id,
            email,
            roleId,
            name,
            surname,
            avatar,
            additionalPermissions,
            isProvisioned,
            tempPasswordExpires,
            createdBy,
            createdAt,
            updatedAt,
        } = user;

        return res.status(200).json({
            id,
            email,
            roleId,
            name,
            surname,
            avatar,
            additionalPermissions,
            isProvisioned,
            tempPasswordExpires,
            createdBy,
            createdAt,
            updatedAt,
        });
    }),
);

router.patch(
    '/:id',
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = ['roleId', 'additionalPermissions'];
        const keys = Object.keys(updates);
        const isInvalid = keys.length === 0 || keys.some((key) => !allowedFields.includes(key));

        if (isInvalid) return res.status(400).send();

        const updatedUser = await Users.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true },
        );

        if (!updatedUser) return res.status(404).send();

        const { roleId, additionalPermissions } = updatedUser;

        return res.status(200).json({
            roleId: roleId || null,
            additionalPermissions,
        });
    }),
);

router.post(
    '/',
    asyncQuery(async (req: Request, res: Response) => {
        const { email, roleId, duration = '1d' } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const existingUser = await Users.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        const { user: userData, password: rawPassword } = await newUser(
            email,
            roleId,
            duration,
            req.user?.id,
        );

        const savedUser = await Users.create(userData);

        const emailHtml = generateInviteEmail({
            tempPass: rawPassword,
            expiryDate: savedUser.tempPasswordExpires.toLocaleString('pl-PL'),
            panelUrl: 'https://panel.dreammc.pl/login',
        });

        await sendEmail({
            to: email,
            subject: 'You have been invited',
            text: `Welcome! Your temporary password: ${rawPassword}`,
            html: emailHtml,
        });

        const {
            id,
            email: userEmail,
            roleId: userRoleId,
            name,
            surname,
            avatar,
            isProvisioned,
            tempPasswordExpires,
            createdBy,
            createdAt,
        } = savedUser;

        return res.status(201).json({
            id,
            email: userEmail,
            roleId: userRoleId,
            name,
            surname,
            avatar,
            isProvisioned,
            tempPasswordExpires,
            createdBy,
            createdAt,
        });
    }),
);

router.delete(
    '/:id',
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const user = await Users.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).send();
    }),
);

router.post(
    '/:id/reset-password',
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;

        const user = await Users.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const now = new Date();
        if (!user.isProvisioned && user.tempPasswordExpires && user.tempPasswordExpires > now) {
            return res
                .status(400)
                .json({ message: 'Reset not allowed: temporary password still active' });
        }

        const rawPassword = generateRandomPassword();
        console.log(rawPassword);
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 24);

        await Users.findByIdAndUpdate(id, {
            password: hashedPassword,
            isProvisioned: false,
            tempPasswordExpires: expiryDate,
        });

        const emailHtml = generateResetPasswordEmail({
            tempPass: rawPassword,
            expiryDate: expiryDate.toLocaleString('pl-PL'),
            panelUrl: 'https://localhost:3000/login',
        });

        await sendEmail({
            to: user.email,
            subject: 'Password Reset',
            text: `Your password has been reset! New temporary password: ${rawPassword}`,
            html: emailHtml,
        });

        return res.status(200).json({ message: 'Reset email sent' });
    }),
);

// TEMP
router.patch(
    '/:id/avatar',
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;

        const updatedUser = await Users.findByIdAndUpdate(
            id,
            { $set: { avatar: req.body.avatar } },
            { new: true, runValidators: true },
        );

        if (!updatedUser) return res.status(404).send();

        return res.status(200).send();
    }),
);

export { router as UsersRouter };
