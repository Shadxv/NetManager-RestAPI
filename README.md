# NetManager — REST API

> **Note:** This repository is a public mirror of the original private repository maintained by the DreamMC Network organization. It is published for portfolio and reference purposes.

A TypeScript/Express REST API that serves as the backend for the **NetManager management panel**. It handles user authentication, role-based access control, and permission management for the DreamMC network infrastructure.

---

## Part of the NetManager ecosystem

This API is a required component of the NetManager application. Without it the panel cannot authenticate users or enforce permissions.

| Component | Repository | Description |
|---|---|---|
| **REST API** | *(this repo)* | Authentication, users, roles — backend for the panel |
| **NetManager** | [NetManager](https://github.com/Shadxv/NetManager) | Kubernetes orchestration CLI for DreamMC services |
| **Panel** | [NetManager-Panel](https://github.com/Shadxv/NetManager-Panel) | Web-based management UI |

---

## Overview

The API exposes three resource groups under `/api/v1`:

- **`/auth`** — login, account setup, password reset, session refresh
- **`/users`** — invite, manage, and remove panel users
- **`/roles`** — create and manage hierarchical roles with bitwise permissions

Authentication is JWT-based. Every protected endpoint validates a Bearer token and checks the caller's permission flags before executing. Role hierarchy is enforced throughout — users cannot manage accounts or roles ranked at or above their own level.

---

## Technology stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript 5.9 |
| Framework | Express 5.2 |
| Database | MongoDB via Mongoose 9 |
| Auth | JWT (`jsonwebtoken`) + bcrypt |
| Email | Nodemailer (Gmail SMTP) |
| Testing | Jest 30 |

---

## Requirements

- Node.js 20+
- MongoDB 6+
- Gmail account (for invitation/reset emails)

---

## Getting started

```bash
npm install
```

Copy the environment variable reference below into a `.env` file, then:

```bash
# Development (auto-reload)
npm run dev

# Production build
npm run build
npm start
```

The server starts on port `8080` by default (override with `PORT`).

On first startup, a **System Administrator** account and role are seeded automatically:

| Field | Default value |
|---|---|
| Email | `admin` |
| Password | value of `ADMIN_DEFAULT_PASSWORD` env var, or `admin123` |

Change this password immediately after the first login.

---

## Configuration

See [docs/configuration.md](docs/configuration.md) for the full reference.

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign JWT tokens |
| `GMAIL_MAIL` | Yes | Gmail address for sending emails |
| `GMAIL_PASS` | Yes | Gmail app password |
| `ADMIN_DEFAULT_PASSWORD` | No | Overrides the seeded admin password |
| `PORT` | No | HTTP port (default `8080`) |
| `ENVIRONMENT` | No | Any non-empty value enables HTTP request logging |

---

## API reference

See [docs/api-reference.md](docs/api-reference.md) for the complete endpoint documentation.

### Quick overview

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth` | — | Login |
| `POST` | `/api/v1/auth/setup` | Token | Complete initial account setup |
| `POST` | `/api/v1/auth/reset` | Token | Reset password |
| `GET` | `/api/v1/auth/me` | Token | Get current session / refresh token |
| `GET` | `/api/v1/users` | Token | List all users |
| `GET` | `/api/v1/users/:id` | Token + permission | Get user details |
| `POST` | `/api/v1/users` | Token + permission | Invite new user |
| `PATCH` | `/api/v1/users/:id` | Token + permission | Update user role / permissions |
| `DELETE` | `/api/v1/users/:id` | Token + permission | Delete user |
| `POST` | `/api/v1/users/:id/reset-password` | Token + permission | Send password reset email |
| `GET` | `/api/v1/roles` | Token | List all roles |
| `POST` | `/api/v1/roles` | Token + permission | Create role |
| `GET` | `/api/v1/roles/:id` | Token | Get role |
| `PATCH` | `/api/v1/roles/:id` | Token + permission | Edit role |
| `PATCH` | `/api/v1/roles/:id/move` | Token + permission | Reorder role in hierarchy |
| `DELETE` | `/api/v1/roles/:id` | Token + permission | Delete role |

---

## Project structure

```
src/
├── server.ts                   # Express app bootstrap
├── controllers/
│   ├── v1.controller.ts        # Route registration
│   └── v1/
│       ├── auth.controller.ts
│       ├── users.controller.ts
│       └── roles.controller.ts
├── middleware/
│   ├── auth.middleware.ts       # JWT validation
│   └── permission.middleware.ts # Permission gate
├── models/                      # TypeScript interfaces
├── database/
│   ├── mongodb.ts               # Connection + error mapping
│   └── entities/                # Mongoose schemas
├── utils/
│   ├── auth.util.ts             # Token generation/validation
│   ├── password.util.ts         # Temporary password generation
│   ├── smtp.util.ts             # Email templates + sending
│   └── seeder.ts                # Initial admin/role seed
└── constants/
    ├── permissions.ts           # Permission flag enum (23 flags)
    └── errors.ts                # Custom error classes
```

---

## About

This project was created as part of the **DreamMC Network** infrastructure. The source code in this repository represents the public mirror of the internal development repository and may not reflect the latest internal state.
