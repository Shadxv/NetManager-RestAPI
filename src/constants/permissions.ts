'use strict';

export enum PermissionFlags {
    CAN_READ_LOGS = 1 << 0,
    CAN_MANAGE_USERS = 1 << 1,
    CAN_TRIGGER_ROLLOUT = 1 << 2,
}
