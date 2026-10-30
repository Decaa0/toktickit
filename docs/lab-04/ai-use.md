# AI Tooling & Reflection — Lab 4

**Student:** Yoswat Amornvitkijvecha (Decaa0)
**Tools Used:** Gemini 2.5 Flash / Pro, Claude 3.5 Sonnet

---

## 1. Key Engineering Prompts & Verifications

| # | Prompt Intent | Engineering Application & Verification |
|---|---------------|----------------------------------------|
| **1** | Transform the Lab 4 handout into a Sprint 4 engineering contract with numbered requirements. | Authored `docs/lab-04/specification.md` with FR-01+, BR-01+, AC-01+, the full Ticket status-transition matrix, and dashboard calculation rules. Cross-checked every AC maps to a planned test in `tests.md`. |
| **2** | Model a parent–child Actions Taken structure under Ticket in Prisma. | Added the `ActionTaken` model (one Ticket → many actions, `performedBy` FK). Verified with `npx prisma db push` and `server/tests/lab-04/actions-taken.api.test.ts`. |
| **3** | Enforce Actions Taken authorization and the follow-up-note rule on the backend. | IT_STAFF/ADMIN may write, Requester reads only owned tickets; follow-up note required when follow-up is flagged. Verified by 403/400 assertions in the API tests. |
| **4** | Implement the complete Ticket status matrix with an IT-Staff resolution gate. | Backend transition validator rejects illegal jumps (400); a Requester "appears resolved" signal is advisory and never sets Resolved. Verified in `ticket-workflow.api.test.ts`. |
| **5** | Add optimistic-concurrency handling so stale updates do not overwrite recent changes. | `expectedUpdatedAt` precondition returns 409 on mismatch with no write. Verified by a stale-update test. |
| **6** | Build Requester and IT-Staff dashboard metrics computed on the backend. | `dashboard.controller.ts` returns owner-scoped counts + recent lists with drill-down. Verified in `requester-dashboard`/`staff-dashboard` API tests. |
| **7** | Create the Actions Taken UI (list, create, edit) with role gating on the Ticket Detail screen. | `ActionsTaken.tsx`; Add/Edit shown only to staff, read-only for requesters. Verified in `client/tests/lab-04/ActionsTaken.test.tsx`. |
| **8** | Make the layout responsive for tablet and mobile and fix horizontal overflow. | Added `index.css` breakpoints (≤768px / ≤1024px), table wrappers, full-width inputs. Verified with `npm run build` and manual viewport checks. |

---

## 2. My Reflection

I used the AI tools as specification and coding assistants, not as a replacement for understanding the work. For each feature I reviewed the generated code against the Sprint 4 contract before committing, and I re-ran the Vitest suites after every change so a passing test — not the AI's confidence — decided whether a feature was done. Verified results: server 46/46 and client 14/14 tests passing, with `tsc --noEmit` and the production build clean. The AI was most helpful for turning the handout into numbered requirements quickly and for writing repetitive test scaffolding; the engineering judgment about transition rules, authorization, and what to actually test stayed with me.
