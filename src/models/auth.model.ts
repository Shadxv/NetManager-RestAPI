import { JwtPayload } from 'jsonwebtoken';

export interface TokenPayload extends JwtPayload {
    rolePermissions: number;
    additionalPermissions: string[];
    requiresPasswordReset?: boolean;
}
