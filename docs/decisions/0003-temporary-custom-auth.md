# 0003 — Temporary custom email/password auth

**Status:** Accepted (temporary) · 2026-11-03

## Context
The product owner wants users to register and log in with email and password, but **without** Supabase Auth for now. The data should still be shaped so we can move to Supabase Auth later.

## Decision
- Table `users (id uuid, email unique, password_hash, created_at)`, which mirrors the `auth.users` columns we rely on.
- Passwords are hashed with **bcrypt** (`bcryptjs`, cost 10) and never stored or logged in plain text.
- The session is a **signed JWT in an httpOnly, SameSite=Lax cookie** (`jose`, HS256, secret `SESSION_SECRET`, 7-day expiry).
- All of this sits behind `AuthService` + `UserRepository` + `src/server/auth/session.ts`.
- Because we don't use Supabase Auth, **RLS can't use `auth.uid()`**. The server reaches Supabase with the **service-role key** (server-only), and **services enforce ownership** (`event.ownerId === session.userId`). Anonymous access is denied on every table.

## Migration path to Supabase Auth
1. Replace `UserRepository` and the session implementation with Supabase Auth calls.
2. Point `events.owner_id` at `auth.users(id)`, keeping the same uuids by migrating users.
3. Add RLS policies (`owner_id = auth.uid()`) and switch repositories to the user-scoped client.

## Consequences
- ➕ Simple, no email confirmation flow, works today.
- ➖ No password reset or email verification in v1.
- ➖ Security depends on server-side checks (there is no RLS safety net). Service tests must cover the ownership checks.
