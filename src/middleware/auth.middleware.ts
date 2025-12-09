'use strict';

import { Request, Response, NextFunction } from 'express';
import { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import { validateToken } from '@/utils';
import { TokenPayload } from '@/models';

export function authenticateToken(allowTempUser: boolean = false) {
    return (req: Request, res: Response, next: NextFunction) => {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(403);
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(403);
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
            if (error instanceof TokenExpiredError) {
                return res.status(401);
            }

            if (error instanceof JsonWebTokenError) {
                return res.status(403);
            }

            console.error('Unhandled token validation error:', error);
            return res
                .status(500)
                .json({ message: 'Authentication process failed due to server error.' });
        }
    };
}
