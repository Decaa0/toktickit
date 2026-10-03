# AI Tooling & Reflection — Lab 3

**Student:** Yoswat Amornvitkijvecha (Decaa0)  
**Tools Used:** Gemini 2.5 Flash / Pro, Claude 3.5 Sonnet  

---

## 1. Key Engineering Prompts & Verifications

| # | Prompt Intent | Engineering Application & Verification |
|---|---------------|----------------------------------------|
| **1** | Resolve build-time TypeScript compiler mismatches where Node `global` types conflicted with Vite DOM types during `npm run build`. | Updated `client/tsconfig.json` to exclude `tests/` from client production bundle. Verified with zero error exit code (`npm run build`). |
| **2** | Structure frontend authentication state with session token persistence and forced password reset redirection. | Implemented token storage routines in `client/src/api.ts` and view guards in `App.tsx`. Verified with `client/tests/lab-03/auth.test.tsx`. |
| **3** | Implement IT staff queue with dual-priority tracking and permitted state machine transitions. | Engineered backend transition validator returning 400 on invalid jumps; added role-guarded controls. Verified via `server/tests/lab-03/staff-workflow.test.ts`. |
| **4** | Guard against Administrator self-deactivation and sole-admin deactivation. | Enforced safeguards in `PATCH /api/admin/users/:id` returning 400 Bad Request on violation. Verified via automated tests in `server/tests/lab-03/admin-users.test.ts`. |

---

## 2. Engineering Reflection
AI agents were used as specification, coding, and debugging assistants across Lab 3. Every AI-assisted solution was reviewed directly against the course specification before committing. Crucially, running automated Vitest suites and end-to-end tests after each feature prevented regressions, confirming that all 15 acceptance criteria were satisfied cleanly.
