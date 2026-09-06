# Lab 2 Specification: TokTickIT Requester Portal

## 1. What We Are Building
An MVP ticketing portal where users (requesters) can create IT support tickets with attachments, view a list of only their own tickets, and manage their ticket details using a Zen Green theme (#006B3C).

## 2. Scope
- **Included**: Selecting a test requester, creating tickets, uploading attachments, viewing "My Tickets" with filters/search, viewing ticket details, and soft-removing attachments with a reason.
- **Excluded**: Real password login (coming in Lab 3), admin/IT staff views, commenting, and changing ticket statuses.

## 3. The Rules (Business Rules)
- **BR-01 (Ticket Number)**: The backend generates a unique ticket number (`TKT-YYYY-XXXXXX`) for each new ticket.
- **BR-02 (Initial Status)**: Every new ticket starts in the 'New' status.
- **BR-03 (Tenant Isolation)**: Users can only see and access their own tickets.
- **BR-04 (File Limits)**: Up to 5 files per ticket, max 5 MB per file, only JPG, PNG, WEBP, and PDF formats.
- **BR-05 (Soft Delete)**: Removing a file does not erase it completely; it marks it as removed, requires a reason, and disables downloading.

## 4. How We Test It (Acceptance Criteria)
- **AC-01**: Submitting a valid form creates a ticket and shows the new ticket number.
- **AC-02**: Submitting an empty summary or description shows clear error messages.
- **AC-03**: Trying to view someone else's ticket returns a 403 Forbidden error.
- **AC-04**: Trying to remove a file without entering a reason is blocked.
- **AC-05**: Uploading a file larger than 5 MB or an unapproved file type shows an error.

## 5. Definition of Done
- All backend test suites pass.
- The UI is fully functional and responsive on Desktop, Tablet, and Mobile.
- All documents in `docs/lab-02/` are filled out.