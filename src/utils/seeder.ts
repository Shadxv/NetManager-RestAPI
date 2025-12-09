'use strict';

import { newUser } from '@/models';
import { Roles, Users } from '@db/entities';
import { PermissionFlags } from '@/constants';

const DEFAULT_EMAIL = 'admin';
const DEFAULT_TEMP_PASSWORD = 'admin';
const SYSTEM_ROLE_ID = 'system';

async function createSystemRole() {
    const systemRole = {
        roleId: SYSTEM_ROLE_ID,
        name: 'System Administrator',
        permissions: PermissionFlags.ROOT,
        index: 0,
    };

    await Roles.insertOne(systemRole);
    console.log(`[SEEDER] Role ${systemRole.name} has been created.`);
}

async function createSystemUser() {
    const createdUser: {
        user: {
            email: string;
            roleId?: string;
            password: string;
            tempPasswordExpires: Date;
            createdBy: string;
        };
    } = newUser(DEFAULT_EMAIL, SYSTEM_ROLE_ID, DEFAULT_TEMP_PASSWORD);

    await Users.insertOne(createdUser.user);
    console.log('[SEEDER] Created default user.');
}

export async function initializeSystemUserAndRole(): Promise<void> {
    try {
        const existingRole = await Roles.findOne({ roleId: SYSTEM_ROLE_ID });

        if (!existingRole) {
            await createSystemRole();
        }

        const existingAdmin = await Users.findOne({ email: DEFAULT_EMAIL });

        if (!existingAdmin) {
            await createSystemUser();
        }
    } catch (error) {
        console.error('[SEEDER] Init error:', error);
    }
}
