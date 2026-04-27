# API reference

**Base URL:** `http://<host>:<port>/api/v1`  
**Content-Type:** `application/json`  
**Authentication:** `Authorization: Bearer <token>`

---

## Authentication

### `POST /auth`

Login with email and password. Returns a JWT token and the current user object.

**Request body**

```json
{
  "email": "admin",
  "password": "admin123"
}
```

**Response `200`**

```json
{
  "token": "<jwt>",
  "user": {
    "id": "...",
    "email": "admin",
    "name": "John",
    "surname": "Doe",
    "avatar": null,
    "roleId": "...",
    "additionalPermissions": [],
    "isProvisioned": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "status": "AUTHENTICATED"
}
```

**Possible `status` values**

| Value | Meaning |
|---|---|
| `AUTHENTICATED` | Normal login — full access |
| `REQUIRES_SETUP` | New user, must call `/auth/setup` before proceeding |
| `REQUIRES_PASSWORD_RESET` | Admin triggered a reset — must call `/auth/reset` |

Token lifetime is **15 minutes** for users in setup/reset state and **1 day** for fully provisioned users.

---

### `POST /auth/setup`

Complete initial account setup for a newly invited user. Sets a real name and permanent password, marks the account as provisioned.

**Requires:** token with `requiresPasswordReset: false` (i.e. a `REQUIRES_SETUP` token)

**Request body**

```json
{
  "name": "John",
  "surname": "Doe",
  "password": "new-secure-password"
}
```

**Response `200`**

```json
{ "message": "Account setup completed." }
```

---

### `POST /auth/reset`

Set a new password when a reset has been forced by an administrator.

**Requires:** token with `requiresPasswordReset: true` (i.e. a `REQUIRES_PASSWORD_RESET` token)

**Request body**

```json
{
  "password": "new-secure-password"
}
```

**Response `200`**

```json
{ "message": "Password has been reset." }
```

---

### `GET /auth/me`

Return the current user's profile. If the user's role or permissions have changed since the token was issued, a refreshed token is returned automatically.

**Requires:** valid token

**Response `200`**

```json
{
  "user": { ... },
  "status": "AUTHENTICATED",
  "token": "<new-jwt-if-refreshed>",
  "refreshed": true
}
```

`refreshed` is `false` and `token` is omitted when no changes were detected.

---

## Users

All endpoints below require a valid token. Some additionally require specific permissions.

---

### `GET /users`

Return a list of all users (non-sensitive fields only).

**Response `200`**

```json
[
  {
    "id": "...",
    "email": "user@example.com",
    "name": "Jane",
    "surname": "Doe",
    "avatar": null,
    "roleId": "...",
    "isProvisioned": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### `GET /users/:id`

Return full details for a single user, including `additionalPermissions`.

**Required permissions (any one of):** `SEE_USERS_DETAILS`, `MANAGE_USERS`, `REMOVE_USERS`, `EDIT_USERS_DETAILS`

**Response `200`** — full user object including `additionalPermissions` and `tempPasswordExpires`.

---

### `GET /users/:id/created-by`

Return minimal info about the user who created the target account.

**Response `200`**

```json
{
  "id": "...",
  "email": "admin",
  "name": "John",
  "surname": "Doe",
  "avatar": null
}
```

---

### `POST /users`

Invite a new user. Generates a temporary password, creates the account, and sends an invitation email.

**Required permissions (any one of):** `CREATE_USERS`, `MANAGE_USERS`

**Request body**

```json
{
  "email": "newuser@example.com",
  "roleId": "optional-role-id",
  "duration": "1d"
}
```

`duration` sets how long the temporary password is valid (default `1d`). Accepts `Xd`, `Xh`, `Xm` formats.

**Response `201`** — created user object with `tempPasswordExpires`.

---

### `PATCH /users/:id`

Update a user's role or additional permissions.

**Required permissions (any one of):** `EDIT_USERS_DETAILS`, `MANAGE_USERS`

**Hierarchy rule:** the caller must have a higher role index than the target user.

**Request body** (all fields optional)

```json
{
  "roleId": "new-role-id",
  "additionalPermissions": ["server:lobby-1:read"]
}
```

**Response `200`**

```json
{
  "roleId": "new-role-id",
  "additionalPermissions": ["server:lobby-1:read"]
}
```

---

### `DELETE /users/:id`

Permanently delete a user.

**Required permissions (any one of):** `REMOVE_USERS`, `MANAGE_USERS`

**Hierarchy rule:** the caller must have a higher role index than the target user.

**Response `200`** — empty body.

---

### `POST /users/:id/reset-password`

Force a password reset for the target user. Generates a new temporary password and sends a reset email. The user will receive `REQUIRES_PASSWORD_RESET` status on their next login.

**Required permissions:** `MANAGE_USERS`

**Response `200`**

```json
{ "message": "Password reset email sent." }
```

---

### `PATCH /users/:id/avatar`

Update the user's avatar URL.

**Request body**

```json
{ "avatar": "https://example.com/avatar.png" }
```

**Response `200`** — empty body.

---

## Roles

All endpoints below require a valid token. Some additionally require specific permissions.

---

### `GET /roles`

Return all roles sorted by hierarchy index (highest rank first).

**Response `200`**

```json
[
  {
    "id": "...",
    "name": "System Administrator",
    "color": "#ff4444",
    "permissions": 8388607,
    "index": 0,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### `POST /roles`

Create a new role. It is appended at the lowest position in the hierarchy.

**Required permissions:** `CREATE_ROLES`

**Response `201`** — the created role object.

---

### `GET /roles/:id`

Return a single role by ID.

**Response `200`** — full role object.

---

### `PATCH /roles/:id`

Update role name, color, or permissions.

**Required permissions (any one of):** `EDIT_ROLES`, `CREATE_ROLES`

**Request body** (all fields optional)

```json
{
  "name": "Moderator",
  "color": "#3498db",
  "permissions": 524288
}
```

`index` cannot be modified directly — use the `/move` endpoint instead.

**Response `200`** — updated role object.

---

### `PATCH /roles/:id/move`

Change the position of a role in the hierarchy. All affected roles are re-indexed automatically.

**Required permissions (any one of):** `EDIT_ROLES`, `CREATE_ROLES`

**Request body**

```json
{ "newIndex": 2 }
```

**Response `200`** — updated role object with new index.

---

### `DELETE /roles/:id`

Delete a role. Remaining roles are re-indexed to maintain a gapless sequence.

**Required permissions:** `DELETE_ROLES`

**Response `200`** — the deleted role object.

---

## Permissions reference

Permissions are stored as a **bitwise integer** on each role. A user has access to a permission if the corresponding bit is set on their role, or if the permission is listed in their `additionalPermissions` array.

The `ADMIN` flag (bit 0, value `1`) bypasses all permission checks.

| Bit | Value | Constant | Description |
|---|---|---|---|
| 0 | `1` | `ADMIN` | Root access — bypasses all checks |
| 1 | `2` | `READ_SERVICES` | View service list and status |
| 2 | `4` | `EDIT_SERVICES_CONFIG` | Edit service configuration |
| 3 | `8` | `CREATE_SERVICES` | Create new services |
| 4 | `16` | `DELETE_SERVICES` | Delete services |
| 5 | `32` | `MANAGE_SERVICES_STATE` | Start / stop services |
| 6 | `64` | `UPDATE_SERVICES` | Deploy service updates |
| 7 | `128` | `READ_ALL_FILES` | Read any file in a service |
| 8 | `256` | `EDIT_ALL_FILES` | Edit any file in a service |
| 9 | `512` | `DELETE_ALL_FILES` | Delete any file in a service |
| 10 | `1024` | `READ_APP_CONFIG` | View application config |
| 11 | `2048` | `EDIT_APP_CONFIG` | Modify application config |
| 12 | `4096` | `READ_DATABASE` | Read database content |
| 13 | `8192` | `EDIT_DATABASE` | Modify database content |
| 14 | `16384` | `DELETE_DATABASE` | Delete database data |
| 15 | `32768` | `SEE_USERS_DETAILS` | View full user details |
| 16 | `65536` | `EDIT_USERS_DETAILS` | Edit user role and permissions |
| 17 | `131072` | `CREATE_USERS` | Invite new users |
| 18 | `262144` | `REMOVE_USERS` | Delete users |
| 19 | `524288` | `MANAGE_USERS` | Full user management (superset) |
| 20 | `1048576` | `EDIT_ROLES` | Edit existing roles |
| 21 | `2097152` | `CREATE_ROLES` | Create roles |
| 22 | `4194304` | `DELETE_ROLES` | Delete roles |

**Example:** a role with `permissions: 655360` has bits 15, 16, and 19 set → `SEE_USERS_DETAILS + EDIT_USERS_DETAILS + MANAGE_USERS`.

---

## Error responses

All errors follow this shape:

```json
{
  "error": "Human-readable message"
}
```

| Status | Cause |
|---|---|
| `400` | Invalid ID format or malformed request |
| `401` | Missing or invalid token |
| `403` | Valid token but insufficient permissions |
| `404` | Resource not found |
| `409` | Conflict (e.g. duplicate email) |
| `422` | Mongoose validation error |
| `500` | Unexpected server error |
