# Sprint 3 Engineering Specification: TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens

## 1. Sprint Goal
Deliver an enterprise-grade identity, ticketing, and administration increment for TokTickIT by replacing simulated development requester selection with real authentication and role-based access control (Requester, IT Staff, Administrator), providing an operational IT Staff Ticket Queue and Detail workflow with Public Comments and Internal Notes, and establishing minimalist Administrator user management under the Zen Green design system.

## 2. Stakeholder Request Summary
Upgrade the system from a simulated requester selector into a production-like multi-role platform. Users authenticate using email and password, with mandatory password change upon first login. Requesters maintain ownership-protected access to their tickets and attachments without the manual selector. IT Staff require a shared queue to claim, assign, prioritize, comment on, and manage ticket status transitions. Administrators require a clean interface to manage user accounts, assign roles, reset initial passwords, and maintain system safety guards without self-lockouts.

## 3. Scope

### Included Scope
- Authentication via email and bcrypt-hashed password.
- Mandatory first-login password change for accounts flagged with `mustChangePassword: true`.
- Server-side role-based authorization for `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.
- Application shell displaying current user name, role badge, and logout action.
- Requester regression: full preservation of ticket creation, personal ticket listing, and attachment management derived from authenticated session.
- IT Staff Ticket Queue with search, status/priority filtering, sorting, and pagination.
- IT Staff Ticket Detail: claim ownership, reassign ticket, update IT priority, and execute permitted status transitions.
- Append-only Public Comments (Requester, IT Staff, Admin) and Internal Notes (IT Staff and Admin only).
- Requester-facing "Problem Appears Resolved" indication flag.
- Administrator User Management: user listing, name/email search, role filter, create user with initial password, edit basic information, toggle active state, and reset initial password.
- Safety rules preventing administrator self-deactivation and the deactivation/role change of the last active administrator.

### Explicitly Excluded Scope
- Email delivery of initial passwords or reset links.
- Self-registration / public signup.
- Multi-factor authentication, social login, and single sign-on.
- Actions Taken log and formal SLA calculation engines (deferred to Lab 4).
- User deletion, bulk user operations, import/export, and multiple roles per user.

## 4. Functional Requirements
- **FR-01:** System shall authenticate users via valid email and password credentials.
- **FR-02:** System shall force users flagged with `mustChangePassword` to submit a compliant new password before allowing access to application screens.
- **FR-03:** System shall provide authenticated user context (`/api/auth/me`) and clear session tokens on logout.
- **FR-04:** System shall restrict access to endpoints and views strictly based on verified server-side role permissions and entity ownership.
- **FR-05:** System shall allow Requesters to view, search, and manage only tickets created by their authenticated account.
- **FR-06:** System shall provide IT Staff with a paginated queue of all tickets supporting search, status/priority filters, and ownership filters.
- **FR-07:** System shall allow IT Staff and Admins to claim or reassign primary ticket ownership.
- **FR-08:** System shall allow IT Staff and Admins to set or update `itPriority`.
- **FR-09:** System shall allow IT Staff and Admins to transition ticket status across permitted states: `NEW`, `OPEN`, `IN_PROGRESS`, `WAITING_FOR_REQUESTER`, `RESOLVED`, `CLOSED`, `REOPENED`, `CANCELLED`.
- **FR-10:** System shall allow Requesters, IT Staff, and Admins to view and append Public Comments.
- **FR-11:** System shall allow only IT Staff and Admins to view and append private Internal Notes.
- **FR-12:** System shall allow Requesters to toggle a "Problem Appears Resolved" flag on their tickets.
- **FR-13:** System shall allow Administrators to list all users, search by name/email, and filter by role.
- **FR-14:** System shall allow Administrators to create new user accounts with one role and an initial password.
- **FR-15:** System shall allow Administrators to edit user details, toggle activation state, and reset initial passwords.

## 5. Business Rules
- **BR-01 (Active Account Authentication):** Only active accounts (`isActive: true`) with valid credentials may authenticate.
- **BR-02 (Mandatory Password Change Gate):** Users with `mustChangePassword: true` cannot access protected application endpoints until a valid new password is saved.
- **BR-03 (Password Complexity Rule):** Passwords must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.
- **BR-04 (Identity Ownership Binding):** Requester ticket operations derive identity strictly from the verified session/token, never from client-supplied `requesterId` parameters.
- **BR-05 (Internal Note Confidentiality):** Internal Notes are append-only and strictly invisible to Requesters via API and UI.
- **BR-06 (Formal Ticket Resolution Authority):** Requesters can only flag that a problem appears resolved; only IT Staff or Administrators can formally transition status to `RESOLVED` or `CLOSED`.
- **BR-07 (Initial IT Priority Inheritance):** `itPriority` is initially assigned the value of `requestedPriority` upon ticket creation and can subsequently only be modified by IT Staff or Administrators.
- **BR-08 (Unique Account Email):** Email addresses across all user accounts must remain globally unique and case-insensitive.
- **BR-09 (Admin Self-Deactivation Block):** An Administrator cannot deactivate their own active account.
- **BR-10 (Last Active Admin Protection):** The system must reject any deactivation or role modification that leaves zero active Administrators in the database[cite: 1].
- **BR-11 (Immutable Comments and Notes):** Comments and notes cannot be edited or deleted once posted[cite: 1].

## 6. Authorization Matrix

| Action / Resource | Requester | IT Staff | Administrator |
| :--- | :---: | :---: | :---: |
| Login / Logout / Change Password | Yes | Yes | Yes |
| Create Ticket | Yes | No | No |
| View Owned Tickets & Attachments | Yes | Yes (if owned) | Yes (if owned) |
| View IT Staff Ticket Queue | No | Yes | Yes |
| Claim / Reassign Ticket | No | Yes | Yes |
| Update IT Priority | No | Yes | Yes |
| Update Ticket Status (Formal) | No | Yes | Yes |
| Mark "Problem Appears Resolved" | Yes (owned only) | No | No |
| View / Add Public Comments | Yes (owned only) | Yes (all) | Yes (all) |
| View / Add Internal Notes | No | Yes | Yes |
| View / Search User List | No | No | Yes |
| Create / Edit User / Reset Password | No | No | Yes |

## 7. Acceptance Criteria
- **AC-01:** Given an active user with valid credentials, when submitting the login form, then the system establishes an authenticated session and returns user profile and role details[cite: 1].
- **AC-02:** Given a user with `mustChangePassword: true`, when logging in, then normal application views remain blocked and redirect to the password change screen until a valid new password is saved[cite: 1].
- **AC-03:** Given an authenticated Requester, when querying tickets, then the backend returns only tickets authored by that user, rejecting any client-supplied ID overrides[cite: 1].
- **AC-04:** Given an authenticated Requester, when requesting Internal Notes, then the server responds with `403 Forbidden` and exposes no note content[cite: 1].
- **AC-05:** Given an authenticated IT Staff member, when viewing the queue, then they can search tickets by ticket number or summary and filter by status and priority[cite: 1].
- **AC-06:** Given an authenticated IT Staff member viewing Ticket Detail, then they can claim the ticket, modify IT Priority, update permitted status, and add an internal note[cite: 1].
- **AC-07:** Given an authenticated Administrator, when viewing User Management, then they can create a user, search users, toggle active state, and are blocked from self-deactivation or removing the last active administrator[cite: 1].

## 8. Definition of Done
- Prisma schema migration applies cleanly with existing Lab 2 records preserved[cite: 1].
- Seed script is idempotent and populates active/inactive accounts across all 3 roles[cite: 1].
- Backend routes enforce token/session verification and role-based authorization with standard HTTP status codes (`401`, `403`, `404`, `400`)[cite: 1].
- Frontend follows Zen Green design tokens across Desktop, Tablet, and Mobile[cite: 1].
- All unit, integration, and Playwright multi-viewport end-to-end test suites pass with 100% success rate[cite: 1].