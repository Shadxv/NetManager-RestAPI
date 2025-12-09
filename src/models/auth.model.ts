import { JwtPayload } from 'jsonwebtoken';

export interface TokenPayload extends JwtPayload {
    rolePermissions: number;
    aditionalPermissions: string[];
    requiresPasswordReset?: boolean;
}
