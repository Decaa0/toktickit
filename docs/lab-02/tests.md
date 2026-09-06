# Lab 2 Test Plan and Traceability[cite: 2]

## 1. Planned Tests Table[cite: 2]

| Test ID | AC | Type | Description | Automated Test File | Result |
|---|---|---|---|---|---|
| API-01 | AC-01 | API | Create ticket with valid data & unique number | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-02 | AC-01 | API | Validation failure on empty summary/description | `server/tests/lab-02/create-ticket.api.test.ts` | Pass |
| API-03 | AC-03 | API | Tenant isolation on ticket list endpoint | `server/tests/lab-02/my-tickets.api.test.ts` | Pass |
| API-04 | AC-03 | API | Block unauthorized access to unowned ticket | `server/tests/lab-02/ticket-detail.api.test.ts` | Pass |
| API-05 | AC-04 | API | Reject soft removal when reason is omitted | `server/tests/lab-02/attachments.api.test.ts` | Pass |
| API-06 | AC-05 | API | Reject attachment upload exceeding 5MB or invalid type | `server/tests/lab-02/attachments.api.test.ts` | Pass |

## 2. Test Execution Output[cite: 2]

Executed from `server/`: