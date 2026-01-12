import { JwtPayload } from 'jsonwebtoken';

export interface TokenPayload extends JwtPayload {
    sub: string;
    roleIndex?: number;
    rolePermissions: number;
    additionalPermissions: string[];
    requiresPasswordReset?: boolean;
}
