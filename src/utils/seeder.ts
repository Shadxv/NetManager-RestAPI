'use strict';

import { newUser, Role } from '@/models';
import { Roles, Users } from '@db/entities';
import { PermissionFlags } from '@/constants';

const DEFAULT_EMAIL = 'admin';
const DEFAULT_TEMP_PASSWORD = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';

async function createSystemRole(): Promise<Role> {
    const systemRole = {
        name: 'System Administrator',
        permissions: PermissionFlags.ADMIN,
        index: 0,
    };

    const role = await Roles.insertOne(systemRole);
    console.log(`[SEEDER] Role ${systemRole.name} has been created.`);
    return role;
}

async function createSystemUser(role: Role) {
    const createdUser: {
        user: {
            email: string;
            roleId?: string;
            password: string;
            tempPasswordExpires: Date;
            createdBy: string;
        };
    } = await newUser(DEFAULT_EMAIL, role.id, undefined, undefined, DEFAULT_TEMP_PASSWORD);

    await Users.insertOne(createdUser.user);
    console.log('[SEEDER] Created default user.');
}

export async function initializeSystemUserAndRole(): Promise<void> {
    try {
        const existingRole = await Roles.countDocuments();
        let role: Role | null;

        if (!existingRole) {
            role = await createSystemRole();
        } else {
            role = await Roles.findOne({ index: 0 });
        }

        if (!role) throw new Error('system role not created nor found');

        const existingAdmin = await Users.findOne({ email: DEFAULT_EMAIL });

        if (!existingAdmin) {
            await createSystemUser(role);
        }
    } catch (error) {
        console.error('[SEEDER] Init error:', error);
    }
}
