import jwt, { SignOptions } from 'jsonwebtoken';
import { Role, TokenPayload, User } from '@/models';
import { SecretNotSetError } from '@/constants/errors';

const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(user: User, role?: Role): string {
    const payload: TokenPayload = {
        sub: user.id,
        roleId: role?.id,
        rolePermissions: role?.permissions || 0,
        additionalPermissions: user.additionalPermissions,
        requiresPasswordReset: !user.isProvisioned,
    };

    return constructToken(payload, user.isProvisioned ? '1d' : '15m');
}

export function validateToken(token: string): TokenPayload {
    if (!JWT_SECRET) throw new Error('JWT_SECRET_NOT_SET');

    return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
}

export function generateRefreshedToken(user: any, role: any, originalExp: number): string {
    if (!JWT_SECRET) throw new Error('JWT_SECRET_NOT_SET');

    const payload: TokenPayload = {
        sub: user.id,
        roleId: role?.id,
        rolePermissions: role?.permissions ?? 0,
        additionalPermissions: Array.isArray(user.additionalPermissions)
            ? user.additionalPermissions
            : [],
        requiresPasswordReset: !user.isProvisioned,
    };

    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: originalExp - Math.floor(Date.now() / 1000) || 60,
    });
}

function constructToken(payload: TokenPayload, expiresIn: SignOptions['expiresIn']): string {
    if (!JWT_SECRET) throw new SecretNotSetError();
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
