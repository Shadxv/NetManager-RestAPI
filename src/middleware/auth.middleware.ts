'use strict';

import { Request, Response, NextFunction } from 'express';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { TokenPayload } from '@/models';
import { validateToken } from '@/utils';

export function authenticateToken(allowTempUser: boolean = false) {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const token = authHeader.split(' ')[1];

        try {
            const decodedPayload: TokenPayload = validateToken(token);

            if (decodedPayload.requiresPasswordReset && !allowTempUser) {
                return res.status(401).json({ status: 'REQUIRES_PASSWORD_SETUP' });
            }

            req.user = decodedPayload;
            next();
        } catch (error) {
            if (error instanceof TokenExpiredError) return res.status(401).send();
            if (error instanceof JsonWebTokenError) return res.status(403).send();

            return res.status(500).json({ message: 'Internal server error' });
        }
    };
}
