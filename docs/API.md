# NoTrace API

Base URL: `http://localhost:4000`

## Authentication

- `GET /api/auth/csrf` issues a CSRF token.
- `POST /api/auth/join/request` submits an invite-code-based join request.
- `POST /api/auth/join/claim` exchanges an approved one-time join token for an anonymous account.
- `POST /api/auth/refresh` rotates/refreshes access cookies.
- `POST /api/auth/logout` revokes the current session.
- `GET /api/auth/me` returns the current anonymous user and approved memberships.
- `POST /api/auth/magic-links` creates a magic link for the current user.
- `POST /api/auth/magic-login` signs in with a one-time magic token.

JWT access tokens are short-lived. Refresh sessions are stored server-side with hashed refresh tokens.

## Admin

- `POST /api/admin/groups` creates a community with default channels.
- `PATCH /api/admin/groups/:groupId/settings` updates privacy, retention, read receipts, typing, and E2EE flags.
- `POST /api/admin/groups/:groupId/invitations` creates an invite code.
- `GET /api/admin/join-requests` lists join requests.
- `POST /api/admin/join-requests/:requestId/approve` creates a one-time claim token.
- `POST /api/admin/join-requests/:requestId/reject` rejects a request.
- `GET /api/admin/groups/:groupId/members` lists anonymous members.
- `POST /api/admin/memberships/:membershipId/ban` bans a member.
- `POST /api/admin/memberships/:membershipId/remove` removes a member.
- `GET /api/admin/reports` lists reported content.
- `PATCH /api/admin/reports/:reportId` reviews, dismisses, or actions a report.

## Groups And Messages

- `GET /api/groups` lists visible communities.
- `GET /api/groups/:groupId` returns one community and channels.
- `GET /api/groups/:groupId/channels/:channelId/messages` returns message history.
- `POST /api/messages` creates a text or media message.
- `DELETE /api/messages/:messageId` deletes a member's own message or an admin-moderated message.
- `POST /api/messages/:messageId/reactions` toggles a reaction.
- `POST /api/messages/:messageId/reports` reports abusive content.
- `POST /api/messages/media/presign` creates a presigned media upload URL.

## Extras

- `POST /api/groups/:groupId/channels/:channelId/polls` creates an anonymous poll.
- `GET /api/groups/:groupId/polls` lists polls.
- `POST /api/groups/polls/:pollId/votes` votes anonymously.
- `POST /api/groups/:groupId/confessions` creates a confession.
- `GET /api/groups/:groupId/confessions` lists confessions.
- `POST /api/groups/:groupId/questions` creates an anonymous question.
- `GET /api/groups/:groupId/questions` lists Q&A items.

## Socket.IO Events

Client emits:

- `group:join`
- `channel:join`
- `message:send`
- `message:delete`
- `reaction:toggle`
- `typing:start`
- `typing:stop`
- `message:read`

Server emits:

- `message:new`
- `message:deleted`
- `reaction:updated`
- `typing:update`
- `message:receipt`

Read receipts are ignored when the group setting disables them.
