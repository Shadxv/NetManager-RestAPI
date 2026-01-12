'use strict';

import { Request, Response, Router } from 'express';
import { Roles, Users } from '@db/entities';
import { BaseUser, newUser, User } from '@/models';
import { authenticateToken } from '@/middleware/auth.middleware';
import { asyncQuery } from '@db/mongodb';
import {
    generateInviteEmail,
    generateRandomPassword,
    generateResetPasswordEmail,
    sendEmail,
} from '@/utils';
import bcrypt from 'bcrypt';
import { authorize } from '@/middleware';
import { PermissionFlags } from '@/constants';

const router: Router = Router();

router.use(authenticateToken());

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
    authorize([
        PermissionFlags.SEE_USERS_DETAILS,
        PermissionFlags.MANAGE_USERS,
        PermissionFlags.REMOVE_USERS,
        PermissionFlags.EDIT_USERS_DETAILS,
    ]),
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

router.get(
    '/:id/created-by',
    asyncQuery(async (req: Request, res: Response) => {
        const user: User | null = await Users.findById(req.params.id);
        if (!user) return res.status(404);

        const { id, email, name, surname, avatar } = user;

        return res.status(200).json({
            id,
            email,
            name,
            surname,
            avatar,
        });
    }),
);

router.patch(
    '/:id',
    authorize([PermissionFlags.EDIT_USERS_DETAILS, PermissionFlags.MANAGE_USERS]),
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = await validateUserHierarchy(req, res, id);

        if (!user) {
            return;
        }

        const updates = req.body;

        const allowedFields = ['roleId', 'additionalPermissions'];
        const keys = Object.keys(updates);
        const isInvalid = keys.length === 0 || keys.some((key) => !allowedFields.includes(key));

        if (isInvalid) return res.status(400).send();

        const roleValidation = await validateRoleAssignment(req, res, updates.roleId);
        if (!roleValidation) {
            return;
        }

        const updatedUser = await Users.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true },
        );

        const { roleId, additionalPermissions } = updatedUser;

        return res.status(200).json({
            roleId: roleId || null,
            additionalPermissions,
        });
    }),
);

router.post(
    '/',
    authorize([PermissionFlags.CREATE_USERS, PermissionFlags.MANAGE_USERS]),
    asyncQuery(async (req: Request, res: Response) => {
        const { email, roleId, duration = '1d' } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        const existingUser = await Users.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ message: 'User with this email already exists' });
        }

        const roleValidation = await validateRoleAssignment(req, res, roleId);

        if (!roleValidation) {
            return;
        }

        const { user: userData, password: rawPassword } = await newUser(
            email,
            roleId,
            duration,
            req.user?.sub,
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
    authorize([PermissionFlags.REMOVE_USERS, PermissionFlags.MANAGE_USERS]),
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = await validateUserHierarchy(req, res, id);

        if (!user) {
            return;
        }

        await Users.findByIdAndDelete(id);

        return res.status(200).send();
    }),
);

router.post(
    '/:id/reset-password',
    authorize([PermissionFlags.MANAGE_USERS, PermissionFlags.MANAGE_USERS]),
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;

        const user = await validateUserHierarchy(req, res, id);
        if (!user) {
            return;
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

export const validateUserHierarchy = async (req: Request, res: Response, targetUserId: string) => {
    const currentUser = req.user;

    if (!currentUser) {
        res.status(403).json({ message: 'Token payload not found' });
        return null;
    }

    if (targetUserId === currentUser.sub) {
        res.status(403).json({ message: 'You cannot perform this action on yourself' });
        return null;
    }

    const isRoot = (currentUser.rolePermissions & 1) === 1;

    const targetUser = await Users.findById(targetUserId);
    if (!targetUser) {
        res.status(404).json({ message: 'User not found' });
        return null;
    }

    if (!isRoot) {
        const targetRole = await Roles.findById(targetUser.roleId);
        const targetRoleIndex = targetRole?.index ?? 1000;
        const currentUserRoleIndex = currentUser.roleIndex ?? 999;

        if (targetRoleIndex <= currentUserRoleIndex) {
            res.status(403).json({
                message: 'You cannot perform actions on users with a higher or equal role rank',
            });
            return null;
        }
    }

    return targetUser;
};

export const validateRoleAssignment = async (req: any, res: Response, newRoleId: string) => {
    const currentUser = req.user;

    if (!currentUser) {
        res.status(403).json({ message: 'Token payload not found' });
        return false;
    }

    const newRole = await Roles.findById(newRoleId);
    if (!newRole) {
        res.status(404).json({ message: 'Target role not found' });
        return false;
    }

    const currentUserRoleIndex = currentUser.roleIndex ?? 999;
    const targetRoleIndex = newRole.index ?? 1000;

    if (targetRoleIndex <= currentUserRoleIndex) {
        res.status(403).json({
            message: 'You cannot assign a role with a rank higher or equal to your own',
        });
        return false;
    }

    return true;
};

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
