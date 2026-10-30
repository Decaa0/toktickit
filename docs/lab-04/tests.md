# Sprint 4 — Test Plan & Traceability

Tests are written before/alongside implementation (Test DD + TDD). Every Acceptance Criterion (AC)
maps to at least one test. Final status is updated as suites pass.

## Traceability Matrix

| Test ID | Type | AC / Req | What It Tests | Expected Result | Automated File | Final |
|---|---|---|---|---|---|---|
| API-01 | API | AC-01 / BR-03 | Create a valid Action Taken | Created under correct Ticket with authenticated creator | server/tests/lab-04/actions-taken.api.test.ts | |
| API-02 | API | AC-03 | Requester creates an Action Taken | 403 Forbidden | server/tests/lab-04/actions-taken.api.test.ts | |
| API-03 | API | AC-04 / BR-04 | followUpRequired with empty note | 400 validation | server/tests/lab-04/actions-taken.api.test.ts | |
| API-04 | API | BR-05 | Staff updates an Action Taken | 200 with updated fields | server/tests/lab-04/actions-taken.api.test.ts | |
| API-05 | API | BR-06 | Action ordering stable (createdAt asc) | Deterministic order | server/tests/lab-04/actions-taken.api.test.ts | |
| WF-01 | API | AC-05 / BR-08 | Requester "appears resolved" does not set Resolved | status unchanged | server/tests/lab-04/ticket-workflow.api.test.ts | |
| WF-02 | API | AC-07 / BR-09 | Illegal transition (Closed → In Progress) | 400 rejected | server/tests/lab-04/ticket-workflow.api.test.ts | |
| WF-03 | API | AC-06 / BR-11 | Stale `expectedUpdatedAt` status update | 409 conflict, no write | server/tests/lab-04/ticket-workflow.api.test.ts | |
| WF-04 | API | BR-09 | Full permitted transition matrix | each legal transition accepted | server/tests/lab-04/ticket-workflow.api.test.ts | |
| DASH-01 | API | AC-02 / BR-10 | Requester dashboard scoped to owner | only owned-ticket metrics | server/tests/lab-04/requester-dashboard.api.test.ts | |
| DASH-02 | API | AC-08 | Requester dashboard empty state | counts 0, items [] | server/tests/lab-04/requester-dashboard.api.test.ts | |
| DASH-03 | API | BR-10 | Staff dashboard metrics match queries | unassigned/owned/byStatus/byPriority correct | server/tests/lab-04/staff-dashboard.api.test.ts | |
| DASH-04 | API | AC-08 | Staff dashboard empty state | zero metrics, no error | server/tests/lab-04/staff-dashboard.api.test.ts | |
| UI-01 | UI | AC-01 | Action Taken create form renders + submits | fields present, payload correct | client/src/__tests__/lab-04/ActionsTaken.test.tsx | |
| UI-02 | UI | AC-04 | Follow-up note field required on checkbox | field shown + validation | client/src/__tests__/lab-04/ActionsTaken.test.tsx | |
| UI-03 | UI | FR-04 | Requester sees read-only Actions Taken | no Add/Edit controls | client/src/__tests__/lab-04/ActionsTaken.test.tsx | |
| UI-04 | UI | FR-06 | Requester dashboard metrics render | correct cards + links | client/src/__tests__/lab-04/RequesterDashboard.test.tsx | |
| UI-05 | UI | FR-07 | Staff dashboard metrics + drill-down | cards link to filtered queue | client/src/__tests__/lab-04/StaffDashboard.test.tsx | |
| UI-06 | UI | AC-05 | Status control shows only permitted transitions | illegal options hidden | client/src/__tests__/lab-04/TicketWorkflow.test.tsx | |
| UI-07 | UI | BR-11 | 409 conflict preserves entered form data | notice shown, form retained | client/src/__tests__/lab-04/TicketWorkflow.test.tsx | |
| RESP-01 | UI/Responsive | AC-10 | No horizontal scroll ≤768px on staff queue | card layout, no overflow | client/src/__tests__/lab-04/Responsive.test.tsx | |
| RESP-02 | UI/Responsive | AC-10 | No horizontal scroll ≤768px on ticket detail/forms | single-column, no overflow | client/src/__tests__/lab-04/Responsive.test.tsx | |
| E2E-01 | E2E | AC-01/AC-05 | Staff creates Action Taken, requester "appears resolved" does not resolve | full flow | e2e/lab-04/actions-taken-flow.spec.ts | |
| E2E-02 | E2E | AC-05 | Ticket resolution gate end-to-end | IT Staff resolves; requester cannot | e2e/lab-04/ticket-resolution.spec.ts | |
| E2E-03 | E2E | AC-02/AC-08 | Dashboards render correct metrics + drill-down | requester + staff | e2e/lab-04/dashboards.spec.ts | |
| REG-01 | Regression | AC-09 | Lab 1–3 unit/API/UI suites still pass | all green | (existing suites) | |
| REG-02 | Migration | AC-09 | Migration preserves existing Tickets/Attachments/Users | data intact after migrate | server/tests/lab-04/migration.test.ts | |
| PERF-01 | Smoke | AC-09 | Dashboard + ticket list return within budget | < ~1s for seed-sized data | server/tests/lab-04/performance-smoke.test.ts | |

## Test Types Covered
- **Unit**: validation + transition helpers (BR-04, BR-09).
- **API/Integration**: actions-taken, ticket-workflow, requester-dashboard, staff-dashboard.
- **UI component**: ActionsTaken, RequesterDashboard, StaffDashboard, TicketWorkflow.
- **UI style / responsive**: breakpoint behavior, no overflow (RESP-01/02).
- **Authorization**: role enforcement on every write (API-02, WF-*).
- **Workflow**: full transition matrix + resolution gate + concurrency.
- **Migration/regression**: data preservation + all prior suites.
- **Performance-smoke**: seed-sized data within budget.
- **E2E**: actions-taken flow, resolution, dashboards.

## Run Commands
- Server tests: `cd server && npm test`
- Client tests: `cd client && npm test`
- E2E: `npx cypress run` (see README)
