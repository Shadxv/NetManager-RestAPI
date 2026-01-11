'use strict';

import { Request, Response, Router } from 'express';
import { asyncQuery } from '@db/mongodb';
import { BaseRole, Role } from '@/models';
import { Roles } from '@db/entities';

const router: Router = Router();

router.get(
    '/',
    asyncQuery(async (req: Request, res: Response) => {
        const allRoles: Role[] = await Roles.find({});
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
        const id = req.params.id;

        const role = await Roles.findById(id);

        if (!role) return res.status(404).send();
        return res.status(200).json(role);
    }),
);

router.delete(
    '/:id',
    asyncQuery(async (req: Request, res: Response) => {
        const id = req.params.id;

        const roleToDelete = await Roles.findByIdAndDelete(id);
        if (!roleToDelete) return res.status(404).send();

        const deletedIndex = roleToDelete.index;

        await Roles.updateMany({ index: { $gt: deletedIndex } }, { $inc: { index: -1 } });

        return res.status(200).json(roleToDelete);
    }),
);

router.patch(
    '/:id/move',
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;
        const { newIndex } = req.body;

        const roleToMove = await Roles.findById(id);
        if (!roleToMove) return res.status(404).send();

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
    asyncQuery(async (req: Request, res: Response) => {
        const { id } = req.params;
        const updates = req.body;

        const role = await Roles.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true },
        );

        if (!role) return res.status(404).json({ message: 'Role not found' });

        return res.status(200).json(role);
    }),
);

export { router as RoleRouter };
