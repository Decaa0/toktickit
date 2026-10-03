# Sprint 3 UI Specification: Zen Green Design System Extensions

## 1. Design Tokens & Visual Language
- **Theme Base:** Zen Green palette.
  - Primary Green: `#1b4332`
  - Deep Forest (Navbar): `#081c15`
  - Accent / Hover Green: `#2d6a4f`
  - Background Neutral: `#f8fafc`
  - Card Neutral: `#ffffff`
  - Border Neutral: `#e2e8f0`
- **Badge Styling:**
  - Status `NEW` / `OPEN`: Blue (`bg-sky-100 text-sky-800`)
  - Status `IN_PROGRESS`: Amber (`bg-amber-100 text-amber-800`)
  - Status `WAITING_FOR_REQUESTER`: Purple (`bg-purple-100 text-purple-800`)
  - Status `RESOLVED` / `CLOSED`: Green (`bg-emerald-100 text-emerald-800`)
  - Priority `URGENT`: Red (`bg-rose-100 text-rose-800`)
  - Role Badges: Gray (`REQUESTER`), Blue (`IT_STAFF`), Indigo (`ADMINISTRATOR`)

## 2. Screen Specifications

### 2.1 Login Screen (`/login`)
- Centered card (max width 420px).
- Fields: Email address, password with show/hide eye toggle, Sign In button.
- States: Normal, Busy/Submitting, Error Alert ("Invalid email or password" / "Account is inactive").

### 2.2 Change Password Screen / Modal (`/change-password`)
- Displayed immediately upon login if `mustChangePassword === true`.
- Real-time password requirement checklist:
  - At least 8 characters
  - Uppercase and lowercase letters
  - Number and special character
- Confirm password matching validation and Continue button.

### 2.3 Role-Aware Navigation Bar
- Replaces simulated requester selector with authenticated user identity display.
- Left: TokTickIT logo with Zen Green accent.
- Center Links (role-gated):
  - `REQUESTER`: My Tickets, Create Ticket
  - `IT_STAFF`: My Queue, Create Ticket
  - `ADMINISTRATOR`: Admin (User Management)
- Right: User Full Name, Role Badge, and **Logout** button.

### 2.4 IT Staff Ticket Queue Screen
- Search input matching ticket number or summary keyword.
- Filter dropdowns: Category, Status, Priority, Assigned Owner.
- Responsive table: columns for Ticket No, Created Date, Summary, Category, Req. Priority, IT Priority, Status, Owner, and Open Detail action.
- Responsive view: folds gracefully into a card list on tablet and mobile viewports.

### 2.5 IT Staff Ticket Detail Screen
- Grouped layout: Ticket Details, Requester info, editable operational fields (Claim / Reassign, IT Priority, Status).
- Attachment continuity: lists active attachments with download links and soft-removal badges.
- Communication tabs:
  - **Public Comments:** Green accent border, author name, timestamp, and message body.
  - **Internal Notes:** Distinct amber card with lock icon and "Staff & Admin Only" banner to prevent accidental public posting.

### 2.6 Administrator User Management Screen
- User table: Name, Email, Role badge, Status badge (Active/Inactive), and Edit action.
- Search input by name or email, optional role filter dropdown.
- "+ Create User" modal/drawer with initial password setup.
- Edit User drawer with Active toggle, basic info editing, and "Reset Initial Password" action.