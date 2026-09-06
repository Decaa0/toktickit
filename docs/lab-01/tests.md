# Lab 1 — Test Plan and Evidence  (fill this in)

All test files live under server/tests/lab-01/ and client/tests/lab-01/.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok | |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | |
| 3 | Vitest | Heading renders | |
| 4 | Vitest | Success state shows Online + category list | |
| 5 | Vitest | Error state shows Offline + message | |

Paste your passing terminal output / screenshot below.
server
 RUN  v2.1.9 /Users/yoswat/Downloads/toktickit/server

 ✓ tests/lab-01/categories.test.ts (1)
 ✓ tests/lab-01/health.test.ts (1)

 Test Files  2 passed (2)
      Tests  2 passed (2)
   Start at  22:27:05
   Duration  316ms (transform 26ms, setup 0ms, collect 189ms, tests 56ms, environment 0ms, prepare 69ms)
   > toktickit-client@0.0.0 test
> vitest run

 RUN  v2.1.9 /Users/yoswat/Downloads/toktickit/client

 ✓ tests/lab-01/App.test.tsx (3)

 Test Files  1 passed (1)
      Tests  3 passed (3)