import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";

// Issue 4 — Category list Supertest integration test
describe("GET /api/categories", () => {
  it("returns the four seeded categories in id order", async () => {
    const response = await request(app)
      .get("/api/categories")
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(4);

    const expectedNames = [
      "Account and Access",
      "Hardware",
      "Software",
      "Network",
    ];

    const actualNames = response.body.map((cat: { id: number; name: string }) => cat.name);
    expect(actualNames).toEqual(expectedNames);

    // Verify IDs are sorted in ascending order
    const ids = response.body.map((cat: { id: number; name: string }) => cat.id);
    const sortedIds = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sortedIds);
  });
});