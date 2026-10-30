# Sprint 4 — REST API Contract

Base: `/api`. Auth via `Authorization: Bearer <JWT>` (8h). Legacy requester ticket routes use
`x-requester-id`. Role constants: `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.

## Actions Taken

### GET /api/tickets/:id/actions
List Action Taken for a Ticket, ordered `createdAt asc, id asc`.

- Roles: Requester (must own the Ticket), IT_STAFF, ADMINISTRATOR.
- 200 → `{ items: ActionTaken[] }` where each `ActionTaken` = `{ id, ticketId, actionDateTime,
  description, result, performedByUserId, performedByName, followUpRequired, followUpNote,
  attachmentNotes, createdAt, updatedAt }`.
- 403 → `{ error }` if Requester does not own the Ticket.
- 404 → `{ error }` if Ticket missing.

### POST /api/tickets/:id/actions
Create an Action Taken.

- Roles: IT_STAFF, ADMINISTRATOR (403 otherwise).
- Body: `{ actionDateTime?, description, result?, followUpRequired?, followUpNote?, attachmentNotes? }`.
- Validation: `description` required (non-empty); `followUpNote` required iff `followUpRequired`
  is true (else 400).
- `performedByUserId` is set from the authenticated JWT (never from the body).
- 201 → created `ActionTaken`. 404 → Ticket missing. 400 → validation.

### PATCH /api/tickets/:id/actions/:actionId
Update an Action Taken.

- Roles: IT_STAFF, ADMINISTRATOR (403 otherwise).
- Body: any subset of the editable fields above; same follow-up validation.
- 200 → updated `ActionTaken`. 404 → Ticket or action missing / action not under this ticket.

## Dashboards

Both endpoints return concise, pre-computed metrics (never full Ticket collections).

### GET /api/dashboard/requester
- Roles: REQUESTER (and staff/admin for convenience). Metrics scoped to the authenticated
  Requester's owned Tickets.
- 200 → `{ totalOpen, waitingForRequester, recentlyUpdated: {count, items}, recentlyResolved:
  {count, items} }`.
  - `totalOpen` = count of owned tickets with status in {New, Open, In Progress, Waiting for Requester, Reopened}.
  - `waitingForRequester` = count where status = Waiting for Requester.
  - `recentlyUpdated` = owned tickets with `updatedAt` within 7 days, 5 most recent.
  - `recentlyResolved` = owned tickets with status Resolved/Closed, 5 most recent by `updatedAt`.
  - `items` are summary objects `{ id, ticketNumber, summary, currentStatus, updatedAt }` (drill-down link).
- Empty states: counts are `0`, `items` are `[]`.

### GET /api/dashboard/staff
- Roles: IT_STAFF, ADMINISTRATOR.
- 200 → `{ unassigned, ownedByMe, byStatus: {status: count}, byPriority: {priority: count},
  recentlyUpdated: {count, items} }`.
  - `unassigned` = tickets with `assignedStaffId = null` and status not terminal.
  - `ownedByMe` = tickets with `assignedStaffId = current user`.
  - `byStatus` = group-by `currentStatus` counts (non-terminal statuses at minimum).
  - `byPriority` = group-by `itPriority` (fallback `requestedPriority`).
  - `recentlyUpdated` = 5 most recent non-terminal tickets by `updatedAt`.
- Empty states as above.

## Ticket Status & Resolution (extended)

### PATCH /api/staff/tickets/:id/status (existing, hardened)
- Roles: IT_STAFF, ADMINISTRATOR.
- Body: `{ status, expectedUpdatedAt? }`.
- Rejects transitions outside BR-09 (400). Rejects `Resolved`/`Closed` unless caller is staff (403).
- If `expectedUpdatedAt` provided and ≠ current `updatedAt`, 409 `{ error: "Conflict: ticket was
  modified" }` and no write occurs.

### Requester "appears resolved" (advisory)
- Requester cannot change `currentStatus` to `Resolved`. Any advisory signal is stored separately and
  never mutates Ticket status (BR-08).

## Status Codes

| Code | Meaning |
|---|---|
| 200/201 | success |
| 400 | validation / illegal transition |
| 401 | missing/invalid token |
| 403 | authenticated but not permitted / not owner |
| 404 | resource not found |
| 409 | stale update conflict |

## Safe Errors & Duplicate Prevention

- All endpoints return JSON `{ error: string }` on failure; no stack traces.
- Idempotency: repeated identical POST is discouraged via disabled submit buttons + client-side
  in-flight guard; the server treats each request as a new Action Taken (append-only by design), so a
  retry is a visible new row rather than a silent overwrite.
