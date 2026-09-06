# Lab 1 — Peer Review Record

**Author:** Yoswat Amornvitkijvecha — <student id> — GitHub: @Decaa0
**Peer reviewer:** Praewa Thuwatharanimitkul — 67070503432 — GitHub: @MeldyRose

## Pull Requests I authored (reviewed by my partner)
| PR | Branch | Reviewer verdict |
|---|---|---|
| #9 | feature/1-project-foundation | Changes requested, then Approved |
| #11 | feature/2-health-check | Approved |
| #12 | feature/3-category-seed | Approved |
| #13 | feature/4-category-list | Approved |

### Review details for each issue:

#### Issue 1 (#9 - feature/1-project-foundation)
* **Reviewer comment I received:** "I've reviewed your PR for Issue 1. Overall, the foundation setup is working! Almost every criteria are met but there still need a change for README.md. Now README.md only contains TokTickIT, please add setup instruction covering Project Overview, Setup Instructions, Database Commands, Running Dev Servers, and Testing Commands."
* **How I responded:** "I have updated the 'README.md' with TokTickIT is, full setup instruction, prerequisites, database commands, dev server commands, and test scripts as requested."

#### Issue 2 (#11 - feature/2-health-check)
* **Reviewer comment I received:** "Looks good to me! I tested your PR: GET /api/health route returns 200 with the expected JSON payload. Supertest and frontend tests both pass cleanly. UI properly reflects Online state for success and Offline state when server's down. So approved!"
* **How I responded:** Merged PR #11 into `lab1-staging` after receiving approval.

#### Issue 3 (#12 - feature/3-category-seed)
* **Reviewer comment I received:** "Approved! I've checked your PR and it passed along the issue 3 criteria. It can complies without Typescript errors, has valid Prisma migrations and safely seeds the required initial category data."
* **How I responded:** Merged PR #12 into `lab1-staging` after receiving approval.

#### Issue 4 (#13 - feature/4-category-list)
* **Reviewer comment I received:** "All tests met the requirement. For Backend Tests in server, it results as passed 2/2 tests and for Frontend Tests, it also does passed all the tests. The API does return each category id and name in predictable order. Therefore, I approved. In addition, don't forget to fill in markdown files at the docs\lab-01 and remove the REVIEWER.md."
* **How I responded:** Updated peer review and documentation records in `docs/lab-01/` and merged PR #13 into `lab1-staging`.

---

## Pull Requests I reviewed for my partner
* **PR reviewed:** <Partner PR #> (`<branch-name>`)
* **My comment:** "Checked implementation and verified that all test suites pass without errors. Code adheres to project structure and requirements. Approved!"
* **Partner's response:** "Thank you for the review. Merged into staging."