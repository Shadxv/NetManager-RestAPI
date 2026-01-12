'use strict';

import { Request, Response, NextFunction } from 'express';
import { PermissionFlags } from '@/constants';

type AccessLevel = 'read' | 'edit' | 'delete' | 'manage';

const hasAnyBit = (userPerms: number, bits: PermissionFlags | PermissionFlags[]) => {
    const bitArray = Array.isArray(bits) ? bits : [bits];
    return bitArray.some((bit) => (userPerms & bit) === bit);
};

export const authorize = (
    requiredBits?: PermissionFlags | PermissionFlags[],
    prefixes?: string | string[],
    requiredLevel: AccessLevel = 'read',
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;
        if (!user) return res.status(401).json({ message: 'Unauthorized' });

        const userPerms = user.rolePermissions || 0;
        const addPerms = (user.additionalPermissions as string[]) || [];

        if ((userPerms & 1) === 1) return next();

        if (requiredBits && hasAnyBit(userPerms, requiredBits)) return next();

        if (prefixes) {
            const resourceId =
                req.params.id || (req.query.path as string) || (req.body.path as string);
            const prefixArray = Array.isArray(prefixes) ? prefixes : [prefixes];

            if (resourceId) {
                const hasDetailedAccess = addPerms.some((perm) => {
                    const matchingPrefix = prefixArray.find((p) => perm.startsWith(`${p}:`));
                    if (!matchingPrefix) return false;

                    const parts = perm.split(':');
                    const permId = parts[1];
                    const permLevel = parts[2];

                    const isCorrectResource =
                        resourceId === permId ||
                        resourceId.startsWith(`${permId}/`) ||
                        permId.startsWith(resourceId);

                    if (isCorrectResource) {
                        if (!permLevel) return true;

                        if (permLevel === 'manage') return true;
                        if (
                            requiredLevel === 'read' &&
                            (permLevel === 'edit' ||
                                permLevel === 'create' ||
                                permLevel === 'delete')
                        )
                            return true;

                        return permLevel === requiredLevel;
                    }
                    return false;
                });

                if (hasDetailedAccess) return next();
            }
        }

        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    };
};
