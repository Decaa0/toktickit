# Sprint 4 — UI Specification

## Design Language
Zen Green (primary `#0B7A46`), inherited from Labs 2–3. Reuse existing badge/button/table/card/form
conventions. Status and priority always carry a non-color cue (text label + icon), never color alone.

## Global Responsive Strategy (fixes the current defect)
The app currently uses fixed-width inline-styled `<table>`s that overflow on iPad/iPhone. Every list
view is replaced with a **responsive pair**:

- `@media (min-width: 769px)` → table (`display: block; overflow-x: auto`).
- `@media (max-width: 768px)` → stacked cards (one per row), no horizontal scroll.

Forms switch from fixed multi-column grids to a single column under 768px. The top navigation wraps
or collapses to a simple stacked/scrollable bar. Focus, keyboard operation, and semantic labels are
preserved at every breakpoint.

## Role-Aware Navigation
- Requester sees: Dashboard, My Tickets, Create Ticket.
- IT Staff sees: Dashboard, Ticket Queue, (My Tickets if applicable).
- Administrator sees: Dashboard, Ticket Queue, User Administration.
- Active page is visually indicated (filled Zen Green pill).

## Requester Dashboard
Concise metric cards: **Total Open**, **Waiting for Me**, **Recently Updated**, **Recently
Resolved**. Each card shows a value; "recent" cards list up to 5 ticket summaries, each a link into
Ticket Detail. Empty state: "Nothing here yet" text. Cards wrap 4→2→1 across breakpoints.

## IT Staff Dashboard
Metric cards: **Unassigned**, **Owned by Me**, **By Status** (mini breakdown), **By Priority** (mini
breakdown), **Recently Updated** (5 items). Each drill-down links to the Ticket Queue pre-filtered by
the relevant query parameter. Empty states rendered without error.

## Actions Taken on Ticket Detail
- Section header "Actions Taken" with an "Add Action" button (IT Staff/Admin only).
- **List mode**: table (desktop) / stacked cards (mobile) of existing actions, oldest first, showing
  Date/Time, Description, Result, Performed By, Follow-Up badge, Note (when present).
- **Create/Edit mode**: form with Action Date/Time (default now), Description (required), Result,
  Follow-Up Required? (checkbox), Follow-up Note (shown+required iff checkbox checked), Attachment
  Notes (help text: "what file to look for, e.g. image name").
- Requesters see the same list but read-only (no Add/Edit controls).
- Validation is shown inline next to the offending field; backend remains authoritative.

## Ticket Workflow / Resolution
- Status control renders only the transitions permitted by BR-09 for the current user.
- IT Staff "Resolve" action requires a Result summary; "appears resolved" from a Requester is
  advisory and labeled as such.
- After a successful change, the Ticket summary status refreshes immediately; 409 conflict shows a
  non-destructive "Ticket was updated by someone else — refresh" notice that preserves entered data.

## Feedback & States
- Loading skeletons/spinners; success toasts; inline validation errors; empty/no-results states;
  forbidden (403) and not-found (404) states; safe-failure banners that do not clear the form.
- Duplicate submit prevention: buttons disabled while a request is in flight.

## Responsive & Accessibility Checklist
- [ ] No horizontal page scroll at 360/768/1024/1440px.
- [ ] Tables → stacked cards ≤768px.
- [ ] Visible focus ring; full keyboard operation; labels on all inputs.
- [ ] Non-color status cues on every status/priority badge.
- [ ] No clipped content, overlapping controls, or inaccessible modals.
- [ ] Removed duplicate/obsolete/placeholder UI elements from earlier labs.
