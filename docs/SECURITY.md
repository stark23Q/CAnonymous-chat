# Security & Privacy Model

NoTrace is designed around the concept of **"Honesty without Identity."** This document outlines the security measures and privacy guarantees implemented in the system.

## 1. Absolute Anonymity

Unlike standard chat apps, NoTrace does not have a traditional user registration system.

- **No PII:** We do not collect names, emails, phone numbers, or passwords.
- **Group-Scoped Personas:** When a user joins a group, they are assigned a random persona (e.g., "Shadow Wolf"). This persona is permanently tied to their session for *that specific group only*.
- **Cross-Group Isolation:** If a user is in Group A as "Shadow Wolf", they might be "Neon Fox" in Group B. It is impossible to correlate a user's identity across different groups.

## 2. Authentication (JWT)

We use JSON Web Tokens (JWT) stored in strict HTTP-only cookies to manage sessions securely without requiring logins.

- **Access Tokens:** Short-lived tokens used for API authorization.
- **Refresh Tokens:** Long-lived tokens used to silently request new access tokens.
- **HTTP-Only Cookies:** Tokens cannot be accessed via JavaScript (`document.cookie`), completely preventing XSS (Cross-Site Scripting) token theft.
- **CSRF Protection:** Configured via strict CORS policies and `SameSite=Strict` cookie attributes.

## 3. Data Retention & Ephemeral Messages

- **Ephemeral Mode:** Groups can be configured or specific messages can be sent with a self-destruct timer (e.g., 24 hours).
- Once expired, ephemeral messages are permanently `DELETE`d from the PostgreSQL database. They are not soft-deleted; they are wiped.
- If an admin deletes a group, the cascade rule automatically deletes all associated messages and personas permanently.

## 4. Moderation & Trust

Anonymity can lead to abuse. NoTrace balances privacy with safety via group admins.

- **Admin Privileges:** The creator of a group is the admin.
- **Blind Deletion:** Admins can delete any message in their group. However, the admin *does not know* who sent the message. They only see the pseudonymous persona.
- **Banning:** Admins can ban a persona from a group. This blocks the underlying session token from re-joining the group, without revealing the user's real-world identity.

## 5. Infrastructure Security

- **Database:** Prisma generates parameterized SQL queries automatically, preventing SQL Injection.
- **Rate Limiting:** Express rate limiters and Redis are used to prevent brute-force API spam and DDoS attempts.
- **HTTPS Only:** The application requires TLS/SSL. Cookies are marked `Secure` and will only be transmitted over HTTPS in production.
