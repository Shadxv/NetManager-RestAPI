'use strict';

import { Request, Response, NextFunction } from 'express';
import { PermissionFlags } from '@/constants';
import { SecretNotSetError } from '@/constants/errors';

export function requirePermission(requiredPermission: PermissionFlags) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.user || req.user.permissions === undefined) {
                return res.status(403);
            }

            const userPermissions = req.user.permissions;

            if ((userPermissions & requiredPermission) !== 0) {
                next();
            } else {
                return res.status(403);
            }
        } catch (error) {
            if (error instanceof SecretNotSetError) {
                res.status(500).json({ message: error.message });
            }
        }
    };
}
