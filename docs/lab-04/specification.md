# Sprint 4 Engineering Contract — TokTickIT Lab 4

## 1. Sprint Goal

Complete the TokTickIT service-desk workflow by adding **Actions Taken** under each Ticket (a
parent–child work structure), enforcing the final **Ticket status-transition matrix** with an IT
Staff resolution gate, and delivering **role-appropriate dashboards** for Requesters and IT Staff —
while preserving every Lab 1–3 feature (authentication, RBAC, Requester context, staff queue,
attachments, user administration) and hardening the whole application to be responsive, accessible,
and regression-safe under the Zen Green design language.

## 2. Stakeholder Request (interpreted)

The service desk currently receives Tickets and lets IT Staff talk to Requesters, but it cannot
*record the actual work*. Add **Actions Taken** under each Ticket (Action Date/Time, Description,
Result, Performed-by auto, Follow-Up Required?, Follow-up Note when needed, Attachment Notes). The
Ticket Owner coordinates the Ticket, but any IT Staff member may record an Action Taken. Requesters
may *indicate* a problem appears resolved, but only IT Staff may formally move the Ticket to
Resolved. Add concise dashboards for Requesters and IT Staff that link into the detailed screens.
Polish and harden everything under the Zen Green design language.

## 3. Scope

### Included
- `ActionTaken` model, migration, idempotent seed, REST API, and UI (create/update, read-only for Requesters).
- Final Ticket status-transition matrix + backend-enforced resolution gate.
- Requester dashboard and IT Staff dashboard (backend-computed metrics with drill-down).
- Responsive, accessible, regression-safe hardening (the existing fixed-width layouts must adapt to
  tablet and mobile).
- Spec/Test DD, GitHub Issues, feature branches, PRs, and a 9-part final report.

### Explicitly excluded
- SLA clocks, escalation engines, on-call scheduling, breach notifications.
- Email/SMS/LINE/push notifications.
- Inventory, spare-parts, purchasing, cost accounting.
- Timesheet billing / labor-cost calculation.
- Multi-level approvals / e-signatures.
- BI tools, report builders, export warehouses.
- Multi-tenant orgs / production-scale cloud ops.
- New features not in this contract.

## 4. Functional Requirements

- **FR-01** An IT Staff or Administrator can create an Action Taken on an accessible Ticket.
- **FR-02** An IT Staff or Administrator can update an existing Action Taken (own or any on an accessible Ticket).
- **FR-03** An Action Taken records: Action Date/Time, Action Description, Result, Performed By
  (auto = authenticated user), Follow-Up Required?, Follow-up Note (required when follow-up is
  required), and Attachment Notes.
- **FR-04** Requesters can view all Action Taken items on Tickets they own, read-only. Requesters
  cannot create or modify Action Taken.
- **FR-05** A Ticket has one primary Ticket Owner (assignedStaffId); an Action Taken may be
  performed by a different IT Staff member.
- **FR-06** The Requester dashboard shows only metrics and recent Tickets owned by the authenticated
  Requester.
- **FR-07** The IT Staff dashboard shows operational metrics (unassigned, owned-by-me, by
  status/priority, recently updated) with drill-down to filtered lists.
- **FR-08** Status controls expose only permitted transitions; the backend rejects any other transition.
- **FR-09** A Requester's "appears resolved" indication is advisory and never sets the Ticket to
  Resolved; IT Staff must review and formally resolve.
- **FR-10** All Lab 1–3 behavior (auth, RBAC, requester context, staff queue, attachments, admin
  user management) continues to work; the app is responsive on desktop/tablet/mobile.

## 5. Business Rules

- **BR-01** An Action Taken belongs to exactly one Ticket (mandatory FK, cascade delete).
- **BR-02** The Ticket Owner coordinates the Ticket, but an Action Taken may be performed by a
  different IT Staff member (performedByUserId is independent of assignedStaffId).
- **BR-03** Performed By is always the authenticated user; clients may not spoof it.
- **BR-04** Follow-up Note is required if and only if Follow-Up Required is true (validated backend).
- **BR-05** Action Taken create/update requires IT_STAFF or ADMINISTRATOR; read requires ownership
  (Requester) or staff access.
- **BR-06** Action Taken rows are append-only by default; updates modify existing rows and preserve
  `createdAt` while bumping `updatedAt`. Ordering is stable (createdAt asc, then id asc).
- **BR-07** Ticket statuses: `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`,
  `Closed`, `Reopened`, `Cancelled`.
- **BR-08** Resolution gate: only an IT Staff/Administrator may set a Ticket to `Resolved` or
  `Closed`. A Requester "appears resolved" action is stored as advisory data only.
- **BR-09** Permitted transitions (source → targets):
  - New → Open, Cancelled
  - Open → In Progress, Waiting for Requester, Resolved, Cancelled
  - In Progress → Waiting for Requester, Resolved, Cancelled
  - Waiting for Requester → In Progress, Resolved, Cancelled
  - Resolved → Closed, Reopened
  - Reopened → In Progress, Waiting for Requester, Resolved, Cancelled
  - Closed → Reopened
  - Cancelled → (terminal; no transitions)
- **BR-10** Dashboard metrics are computed by the backend from authoritative data; no metric is
  derived client-side. Each metric has a defined query, empty state (0 / empty list), and drill-down.
- **BR-11** Stale-update protection: Ticket status updates carry an `updatedAt` precondition
  (optimistic concurrency); a mismatched version returns 409 Conflict.
- **BR-12** Authorization is enforced on the backend for every write; hiding a UI control is not
  authorization.

## 6. UI Specification Summary

See `ui-spec.md` for full screen structure. Summary: dashboards become role-aware home views; the
Ticket Detail gains an Actions Taken section (list + create/edit modes); status controls render only
permitted transitions; every table is replaced with a responsive card/table pair (desktop table,
≤768px stacked cards) to fix the current fixed-width overflow on iPad/iPhone.

## 7. Data Changes

- New model `ActionTaken`:
  - `id Int @id @default(autoincrement())`
  - `ticketId Int` (FK → Ticket, cascade delete)
  - `actionDateTime DateTime @default(now())`
  - `description String`
  - `result String?`
  - `performedByUserId String` (FK → User)
  - `followUpRequired Boolean @default(false)`
  - `followUpNote String?`
  - `attachmentNotes String?`
  - `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`
  - relations: `ticket Ticket @relation(fields:[ticketId])`, `performedBy User @relation(fields:[performedByUserId])`
  - `Ticket` gains `actions ActionTaken[]`.
- Migration: additive only — `CREATE TABLE "ActionTaken"` + indexes on `ticketId` and
  `performedByUserId`. No data loss; legacy Tickets without Action Taken simply have an empty list.
- **Design decision 1 (single table, boolean follow-up):** follow-up is a boolean + optional note
  rather than a separate child table — keeps the query surface small and satisfies the "required when
  needed" rule with a simple backend check (BR-04).
- **Design decision 2 (`performedByUserId` separate from `assignedStaffId`):** records who actually
  did the work independently of who coordinates, per BR-02, and is auto-filled from the JWT (BR-03).
- Seed: idempotent `upsert`s; tickets covering all 8 statuses, assigned + unassigned ownership, and
  0/1/many Action Taken per ticket; data that yields both zero and non-zero dashboard metrics.
- Known gap (flagged): `Comment` and `Note` tables exist in the Lab 3 migration but are not present
  in `schema.prisma`, so no comment/note feature is reachable through Prisma today. This contract
  does not re-introduce them; they remain out of scope and are noted for the grader.

## 8. API Contract

See `api-spec.md` for endpoint shapes. New endpoints: `GET/POST /api/tickets/:id/actions`,
`PATCH /api/tickets/:id/actions/:actionId`, `GET /api/dashboard/requester`,
`GET /api/dashboard/staff`. Status updates gain an `expectedUpdatedAt` precondition (409 on mismatch).

## 9. Acceptance Criteria

- **AC-01** Given a permitted IT Staff user and valid data, when an Action Taken is created, it is
  saved under the correct Ticket with the authenticated creator.
- **AC-02** Given an authenticated Requester, when dashboard data is retrieved, only metrics and
  recent Tickets owned by that Requester are returned.
- **AC-03** Given a Requester, when they try to create/update an Action Taken, the backend returns 403.
- **AC-04** Given followUpRequired=true, when followUpNote is empty, creation returns 400.
- **AC-05** Given a Requester "appears resolved" action, the Ticket status does not change to Resolved.
- **AC-06** Given an IT Staff user, when they update a Ticket with a stale `expectedUpdatedAt`, the
  backend returns 409 and no data is overwritten.
- **AC-07** Given a status change request outside the permitted matrix, the backend returns 400/403.
- **AC-08** Given dashboard requests, every metric matches a documented backend query and empty states
  are rendered without error.
- **AC-09** All Lab 1–3 test suites still pass after migration (regression).
- **AC-10** On viewport widths ≤768px and ≤1024px, no horizontal scroll, clipped content, or
  overlapping controls appear on the major screens.

## 10. Definition of Done

- [ ] `ActionTaken` model + migration + seed committed; existing data intact.
- [ ] Action Taken API (create/update) with role + validation + concurrency enforcement, tested.
- [ ] Action Taken UI (list/create/edit) working and responsive; Requesters read-only.
- [ ] Status-transition matrix + resolution gate enforced backend; UI shows only permitted transitions.
- [ ] Requester + IT Staff dashboards with backend metrics and drill-down, tested.
- [ ] Responsive/accessibility hardening applied across all major screens; no horizontal scroll at ≤768px.
- [ ] Full Lab 1–3 regression green (unit, API, UI, E2E).
- [ ] `docs/lab-04/*` complete; reviewer + ai-use filled; README instructions current.
- [ ] Issues #44–#49 closed via PRs; `lab4-staging` → `main` merged.

## 11. Assumptions and Decisions

- Local datastore remains SQLite (as in Labs 1–3) despite the handout's PostgreSQL wording; Prisma
  keeps the provider abstraction so a PG swap is a config change.
- `Comment`/`Note` are not re-introduced (see §7); regression focuses on features actually present.
- Timezone: dashboard "recent" windows and date boundaries use server local time (UTC+07:00).
- "Recently updated/resolved" windows = last 7 days; "recent" lists = 5 items, with drill-down links
  to the full filtered queue.
