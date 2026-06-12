# NoTrace Security Hardening Checklist

## Identity And Metadata

- Do not add email, phone, real name, profile photo, IP address, or device fingerprint columns without a privacy review.
- Keep invite, join, magic-link, and refresh tokens hashed at rest.
- Keep member aliases group-scoped.
- Keep privacy mode enabled by default.
- Disable last-seen and online status in user-facing UI.

## Authentication

- Use strong JWT secrets and rotate them through a managed secret store.
- Keep access tokens short-lived.
- Store refresh sessions server-side and revoke them on logout.
- Require CSRF tokens for cookie-authenticated writes.
- Use HTTPS-only cookies in production.

## Application Security

- Keep Helmet, CORS allow-listing, HPP protection, rate limiting, and input sanitization enabled.
- Validate every request body with Zod.
- Never render untrusted HTML.
- Restrict media uploads to JPG, PNG, GIF, WEBP, MP4, and PDF.
- Enforce upload size limits at Nginx, API, and object storage policy levels.
- Add a production moderation provider before public rollout.

## Realtime Security

- Authenticate Socket.IO handshakes.
- Check approved membership before joining group/channel rooms.
- Keep typing indicators ephemeral.
- Keep read receipts opt-in per group.
- Use Redis adapter for multi-instance deployments.

## Infrastructure

- Terminate TLS before traffic reaches the app.
- Strip or avoid forwarding IP address headers if operators should not see member IPs in app logs.
- Redact cookies, bearer tokens, and authorization headers from logs.
- Encrypt database and object storage at rest.
- Use private networking between app, Postgres, and Redis.
- Run Prisma migrations through CI/CD or an explicit deployment step.

## Known Limitations

- Browser screenshot detection is best-effort only and cannot be guaranteed on the open web.
- E2EE is represented as a roadmap flag until device keys and encrypted payloads are implemented.
- Admins can moderate anonymous content but should not gain real-world identity signals from the app.
