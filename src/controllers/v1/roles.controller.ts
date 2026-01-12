'use strict';

import { Request, Response, Router } from 'express';
import { asyncQuery } from '@db/mongodb';
import { BaseRole, Role } from '@/models';
import { Roles } from '@db/entities';
import { authenticateToken } from '@/middleware/auth.middleware';
import { authorize } from '@/middleware';
import { PermissionFlags } from '@/constants';

const router: Router = Router();

router.use(authenticateToken());

router.get(
    '/',
    asyncQuery(async (req: Request, res: Response) => {
        const allRoles: Role[] = await Roles.find({}).sort({ index: 1 });
        const baseRoles: BaseRole[] = allRoles.map(({ id, name, color, index }) => ({
            id,
            name,
            color,
            index,
        }));
        return res.status(200).json(baseRoles);
    }),
);

router.post(
    '/',
    authorize(PermissionFlags.CREATE_ROLES),
    asyncQuery(async (req: Request, res: Response) => {
        const lastRole = await Roles.findOne({}, { index: 1 }).sort({ index: -1 }).lean();
        const nextIndex = lastRole ? lastRole.index + 1 : 0;

        const newRole = await Roles.create({ index: nextIndex });
        return res.status(201).json({
            id: newRole.id,
            name: newRole.name,
            color: newRole.color,
            index: newRole.index,
        });
    }),
);

router.get(
    '/:id',
    asyncQuery(async (req: Request, res: Response) => {
        const role = await Roles.findById(req.params.id);
        if (!role) return res.status(404).send();
        return res.status(200).json(role);
    }),
);

router.delete(
    '/:id',
    authorize(PermissionFlags.DELETE_ROLES),
    asyncQuery(async (req: Request, res: Response) => {
        const role = await Roles.findById(req.params.id);
        if (!role) return res.status(404).send();

        if (!validateRoleAction(req, res, role.index)) return;

        await Roles.findByIdAndDelete(req.params.id);
        const deletedIndex = role.index;
        await Roles.updateMany({ index: { $gt: deletedIndex } }, { $inc: { index: -1 } });

        return res.status(200).json(role);
    }),
);

router.patch(
    '/:id/move',
    authorize([PermissionFlags.EDIT_ROLES, PermissionFlags.CREATE_ROLES]),
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { newIndex } = req.body;
        const currentUserRoleIndex = req.user?.roleIndex ?? 999;

        const roleToMove = await Roles.findById(id);
        if (!roleToMove) return res.status(404).send();

        if (!validateRoleAction(req, res, roleToMove.index)) return;

        if (newIndex <= currentUserRoleIndex) {
            return res.status(403).json({ message: 'Cannot move role above your own rank.' });
        }

        const oldIndex = roleToMove.index;
        if (oldIndex === newIndex) return res.status(200).json(roleToMove);

        if (newIndex > oldIndex) {
            await Roles.updateMany(
                { index: { $gt: oldIndex, $lte: newIndex } },
                { $inc: { index: -1 } },
            );
        } else {
            await Roles.updateMany(
                { index: { $lt: oldIndex, $gte: newIndex } },
                { $inc: { index: 1 } },
            );
        }

        roleToMove.index = newIndex;
        await roleToMove.save();

        return res.status(200).json(roleToMove);
    }),
);

router.patch(
    '/:id',
    authorize([PermissionFlags.EDIT_ROLES, PermissionFlags.CREATE_ROLES]),
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;
        const updates = req.body;

        delete updates.index;

        const roleToEdit = await Roles.findById(id);
        if (!roleToEdit) return res.status(404).json({ message: 'Role not found' });

        if (
            !validateRoleAction(
                req,
                res,
                roleToEdit.index,
                roleToEdit.permissions,
                updates.permissions,
            )
        )
            return;

        const updatedRole = await Roles.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true },
        );

        return res.status(200).json(updatedRole);
    }),
);

const validateRoleAction = (
    req: Request,
    res: Response,
    targetRoleIndex: number,
    oldPermissions?: number,
    newPermissions?: number,
): boolean => {
    const currentUser = req.user;
    if (!currentUser) {
        res.status(403).json({ message: 'Token payload not found' });
        return false;
    }

    const currentUserRoleIndex = currentUser.roleIndex ?? 999;
    const currentUserPerms = currentUser.rolePermissions ?? 0;
    const isRoot = (currentUserPerms & 1) === 1;

    if (targetRoleIndex <= currentUserRoleIndex) {
        res.status(403).json({ message: 'Access denied: Target role has higher or equal rank.' });
        return false;
    }

    if (!isRoot && newPermissions && oldPermissions) {
        const addedPermissions = newPermissions & ~oldPermissions;

        const forbiddenBits = addedPermissions & ~currentUserPerms;

        if (forbiddenBits !== 0) {
            res.status(403).json({
                message: 'Access denied: You cannot grant permissions that you do not possess.',
            });
            return false;
        }
    }

    return true;
};

export { router as RoleRouter };
