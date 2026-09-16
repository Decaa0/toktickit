cat << 'EOF' > docs/lab-03/tests.md
# Sprint 3 Test-Driven Development Plan & Traceability Matrix

## Planned Tests & Traceability Matrix

| Test ID | Type | Req / AC | What It Tests | Expected Result | Automated Test File Path | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| API-01 | API | AC-01 | Authenticate with valid credentials | 200 OK, returns JWT token and user profile | `server/tests/lab-03/auth.api.test.ts` | Planned |
| API-02 | API | AC-01 | Authenticate with invalid password | 401 Unauthorized, generic error message | `server/tests/lab-03/auth.api.test.ts` | Planned |
| API-03 | API | AC-01 | Authenticate inactive user account | 401 Unauthorized, inactive notice | `server/tests/lab-03/auth.api.test.ts` | Planned |
| API-04 | API | AC-02 | Password change enforcement flow | 200 OK after saving compliant password | `server/tests/lab-03/auth.api.test.ts` | Planned |
| API-05 | API | AC-03 | Requester ticket isolation | Returns only tickets where requesterId matches token | `server/tests/lab-03/authorization.api.test.ts` | Planned |
| API-06 | API | AC-04 | Requester blocked from Internal Notes | 403 Forbidden with empty body | `server/tests/lab-03/comments-notes.api.test.ts` | Planned |
| API-07 | API | AC-05 | Staff Queue retrieval with search/filters | 200 OK with filtered paginated ticket list | `server/tests/lab-03/staff-queue.api.test.ts` | Planned |
| API-08 | API | AC-06 | Staff claim ticket and set IT Priority | 200 OK, ownerId set to current user, priority updated | `server/tests/lab-03/staff-ticket-detail.api.test.ts` | Planned |
| API-09 | API | AC-07 | Admin self-deactivation protection | 400 Bad Request when admin deactivates own ID | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| API-10 | API | AC-07 | Last active admin protection | 400 Bad Request when last admin deactivated | `server/tests/lab-03/users-admin.api.test.ts` | Planned |
| UI-01 | Unit | AC-01 | Login form validation and busy state | Submit button disabled during pending request | `client/tests/lab-03/Login.test.tsx` | Planned |
| UI-02 | Unit | AC-02 | Password requirement indicators | Checklist checks update as user types password | `client/tests/lab-03/ChangePassword.test.tsx` | Planned |
| UI-03 | Unit | AC-05 | Staff Queue table rendering & badges | Correct color badges for status and priority | `client/tests/lab-03/StaffTicketQueue.test.tsx` | Planned |
| UI-04 | Unit | AC-07 | Admin user list search filtering | Rows filter instantly as search term changes | `client/tests/lab-03/UserManagement.test.tsx` | Planned |
| E2E-01 | E2E | AC-01, AC-02 | Login, forced password change, app entry | End-to-end journey across Desktop and Mobile | `e2e/lab-03/authentication.spec.ts` | Planned |
| E2E-02 | E2E | AC-05, AC-06 | Staff claim, priority update, internal note | End-to-end IT ticketing workflow | `e2e/lab-03/staff-ticket-flow.spec.ts` | Planned |
| E2E-03 | E2E | AC-07 | Admin user creation and safety guard check | Creates user and verifies self-deactivation block | `e2e/lab-03/user-administration.spec.ts` | Planned |
EOF