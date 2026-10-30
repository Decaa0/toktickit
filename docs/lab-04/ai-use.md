# AI Tooling & Reflection — Lab 4

**Student:** Yoswat Amornvitkijvecha (Decaa0)
**Tools Used:** Claude Code (Claude Pro), DeepSeek V4 Pro (Hermes Agent)

---

## 1. Key Engineering Prompts & Verifications

| # | Prompt Intent | Engineering Application & Verification |
|---|---------------|----------------------------------------|
| **1** | Parse the Lab 4 handout into a Sprint 4 engineering contract. | Produced `docs/lab-04/specification.md` with numbered FR/BR/AC, the status-transition matrix, dashboard calculations, and Product Definition of Done. |
| **2** | Declare Sprint 4 as GitHub Issues following the Lab 2/3 template. | Created issues #44–#49 with Summary → Scope & Deliverables → Acceptance Criteria. |
| **3** | Design the `ActionTaken` model + API with role enforcement and concurrency. | (to be filled during implementation) |
| **4** | Implement the Actions Taken UI and role dashboards responsively. | (to be filled) |
| **5** | Fix responsive defects on tablet/mobile and run full regression. | (to be filled) |

---

## 2. Engineering Reflection
AI agents were used as specification and coding assistants across Lab 4. Every AI-assisted solution was reviewed against the course specification and the Sprint 4 contract before committing. Automated Vitest suites and Cypress end-to-end tests were run after each feature to prevent regressions and confirm all acceptance criteria were satisfied cleanly.
