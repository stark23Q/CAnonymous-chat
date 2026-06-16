# API Reference

The NoTrace backend provides both a REST API and a Real-time WebSocket API.

Base URL (Local): `http://localhost:4000/api`
Base URL (Prod): `https://your-api-domain.com/api`

## Authentication

Authentication is handled via HTTP-only cookies containing JWTs (JSON Web Tokens).

### `POST /api/auth/anonymous-session`
Creates a new anonymous session.
- **Response:** `200 OK` (Sets `access_token` and `refresh_token` cookies)

### `POST /api/auth/refresh`
Refreshes an expired access token using the refresh token cookie.

---

## Groups & Identity

### `POST /api/groups`
Creates a new anonymous group.
- **Body:** `{ name: "Group Name", isPrivate: true }`
- **Response:** `{ id: "group_id", inviteCode: "12345" }`

### `POST /api/groups/:inviteCode/join`
Joins a group using an invite code. The server will randomly generate a pseudonymous identity (e.g., "Neon Fox") for the user specifically for this group.
- **Response:** `{ groupId: "group_id", persona: { name: "Neon Fox", avatarId: "fox" } }`

### `GET /api/groups`
Retrieves all groups the current user is a member of.

---

## Messages

*Note: In production, sending messages is primarily handled via Socket.IO for lower latency, but REST fallbacks exist.*

### `GET /api/messages/:groupId`
Retrieves message history for a group.
- **Query Params:** `cursor` (for pagination), `limit`
- **Response:** `[ { id: "msg_1", content: "Hello", persona: { name: "Neon Fox" }, createdAt: "..." } ]`

---

## Real-time API (Socket.IO)

Clients connect to the Socket.IO server at the base URL. Authentication is passed via the `auth` payload during connection.

### Client-to-Server Events

- `join_group`: `{ groupId: string }`
  - Subscribes the client to events for a specific group.
- `send_message`: `{ groupId: string, content: string, type: "text" | "confession" | "poll" }`
  - Dispatches a new message to the group.
- `typing_start`: `{ groupId: string }`
- `typing_stop`: `{ groupId: string }`

### Server-to-Client Events

- `new_message`: `{ id, content, persona, type, createdAt }`
  - Broadcast to all users in a group when a message is sent.
- `user_typing`: `{ personaName: string }`
  - Broadcast when someone is typing.
- `message_deleted`: `{ messageId: string }`
  - Broadcast when an admin deletes a message or an ephemeral message expires.
