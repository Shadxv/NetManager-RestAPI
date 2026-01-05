'use strict';

export enum PermissionFlags {
    // SYSTEM
    ADMIN = 1 << 0,

    // SERVICES
    READ_SERVICES = 1 << 1,
    EDIT_SERVICES_CONFIGS = 1 << 2,
    CREATE_NEW_SERVICES = 1 << 3,
    DELETE_SERVICES = 1 << 4,
    MANAGE_SERVICES_STATE = 1 << 5,
    UPDATE_SERVICES = 1 << 6,

    // FILES
    READ_ALL_FILES = 1 << 7,
    EDIT_ALL_FILES = 1 << 8,
    DELETE_ALL_FILES = 1 << 9,

    // SETTINGS
    READ_APP_CONFIG = 1 << 10,
    EDIT_APP_CONFIG = 1 << 11,

    // DATABASE
    READ_ALL_DATABASES = 1 << 12,
    UPDATE_ALL_DATABASES = 1 << 13,
    DELETE_ALL_DATABASES = 1 << 14,

    // USERS
    SEE_USERS_DETAILS = 1 << 15,
    EDIT_USERS_DETAILS = 1 << 16,
    CREATE_USERS = 1 << 17,
    REMOVE_USERS = 1 << 18,
    MANAGE_USERS = 1 << 19,

    // ROLES
    EDIT_ROLES = 1 << 20,
    CREATE_ROLES = 1 << 21,
    DELETE_ROLES = 1 << 22,
    APPLY_ROLES = 1 << 23,
}
