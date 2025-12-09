import jwt, { SignOptions } from 'jsonwebtoken';
import { Role, TokenPayload, User } from '@/models';
import { SecretNotSetError } from '@/constants/errors';

const JWT_SECRET = process.env.JWT_SECRET;

export function generateToken(user: User, role?: Role): string {
    const payload: TokenPayload = {
        sub: user._id.toString(),
        rolePermissions: role?.permissions || 0,
        aditionalPermissions: user.aditionalPermissions,
        requiresPasswordReset: !user.isProvisioned,
    };

    return constructToken(payload, user.isProvisioned ? '1d' : '15m');
}

export function validateToken(token: string): TokenPayload {
    if (!JWT_SECRET) throw new SecretNotSetError();
    return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
}

function constructToken(payload: TokenPayload, expiresIn: SignOptions['expiresIn']): string {
    if (!JWT_SECRET) throw new SecretNotSetError();

    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn });
}
