# Configuration reference

All configuration is provided through environment variables. Copy the block below into a `.env` file in the project root for local development.

```env
# ── Required ────────────────────────────────────────────────────────────────

# MongoDB connection string
MONGODB_URI=mongodb://user:password@localhost:27017/netmanager

# Secret used to sign and verify JWT tokens.
# Use a long, random string (32+ characters recommended).
JWT_SECRET=change-me-to-a-random-secret

# Gmail credentials for sending invitation and password-reset emails.
GMAIL_MAIL=your-account@gmail.com
GMAIL_PASS=your-gmail-app-password

# ── Optional ─────────────────────────────────────────────────────────────────

# HTTP port. Defaults to 8080 if not set.
PORT=8080

# Default password for the seeded admin account.
# Defaults to 'admin123' if not set.
# Change this before the first run in any non-local environment.
ADMIN_DEFAULT_PASSWORD=admin123

# Set to any non-empty value to enable HTTP request logging (Morgan).
ENVIRONMENT=development
```

---

## Gmail app password

`GMAIL_PASS` must be a **Google App Password**, not your regular Gmail password.

1. Enable 2-Step Verification on your Google account.
2. Go to **Google Account → Security → App passwords**.
3. Generate a password for "Mail" / "Other (custom name)".
4. Use the generated 16-character code as `GMAIL_PASS`.

---

## Database seeding

On every startup the API checks whether a **System Administrator** role and an `admin` user exist. If either is missing, they are created automatically:

| Field | Default |
|---|---|
| Email | `admin` |
| Password | `ADMIN_DEFAULT_PASSWORD` or `admin123` |
| Role | System Administrator (all permissions, index `0`) |

The seeded password should be changed immediately after the first login via the panel.

---

## JWT tokens

| Scenario | Token lifetime |
|---|---|
| Fully provisioned user | 1 day |
| New user (requires setup) | 15 minutes |
| User requiring password reset | 15 minutes |

Tokens are signed with `HS256` using the value of `JWT_SECRET`. Rotating the secret invalidates all existing sessions.

---

## CORS

The API currently allows requests from any origin (`*`). Restrict this in production by updating the CORS configuration in `src/server.ts` to match your panel's domain.
