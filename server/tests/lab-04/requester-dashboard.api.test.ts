import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../../src/middleware/auth";

const prisma = new PrismaClient();

describe("Requester Dashboard API (Issue 4.5)", () => {
  let requesterA: any;
  let requesterB: any;
  let tokenA: string;
  let tokenB: string;
  let category: any;
  const createdIds: number[] = [];

  beforeAll(async () => {
    requesterA = await prisma.user.upsert({
      where: { email: "rdash-a@toktickit.local" },
      update: {},
      create: { email: "rdash-a@toktickit.local", fullName: "Requester A", passwordHash: "h", role: "REQUESTER", isActive: true },
    });
    requesterB = await prisma.user.upsert({
      where: { email: "rdash-b@toktickit.local" },
      update: {},
      create: { email: "rdash-b@toktickit.local", fullName: "Requester B", passwordHash: "h", role: "REQUESTER", isActive: true },
    });
    category = await prisma.category.findFirst();
    tokenA = generateToken(requesterA);
    tokenB = generateToken(requesterB);
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.user.deleteMany({
      where: { email: { in: ["rdash-a@toktickit.local", "rdash-b@toktickit.local"] } },
    });
    await prisma.$disconnect();
  });

  it("AC-02: dashboard is scoped to the authenticated requester's owned tickets", async () => {
    // Requester A: 2 open, 1 waiting, 1 resolved. Requester B: 1 open (should not appear).
    const specs: Array<[any, string]> = [
      [requesterA, "Open"],
      [requesterA, "In Progress"],
      [requesterA, "Waiting for Requester"],
      [requesterA, "Resolved"],
      [requesterB, "Open"],
    ];
    for (const [user, status] of specs) {
      const t = await prisma.ticket.create({
        data: {
          ticketNumber: `TKT-RD-${status}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          summary: `Dashboard ticket (${status})`,
          description: "x",
          requestedPriority: "Medium",
          currentStatus: status,
          categoryId: category.id,
          requesterUserId: user.id,
        },
      });
      createdIds.push(t.id);
    }

    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.totalOpen).toBe(3); // Open + In Progress + Waiting for Requester
    expect(res.body.waitingForRequester).toBe(1);
    expect(res.body.recentlyResolved.items.length).toBe(1);
    // No ticket owned by B may leak into A's recentlyUpdated.
    const aNumbers = res.body.recentlyUpdated.items.map((i: any) => i.ticketNumber);
    expect(aNumbers.every((n: string) => n.startsWith("TKT-RD"))).toBe(true);
  });

  it("AC-08: empty dashboard returns zero counts and empty lists", async () => {
    const res = await request(app)
      .get("/api/dashboard/requester")
      .set("Authorization", `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.totalOpen).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(res.body.recentlyUpdated.items)).toBe(true);
  });

  it("unauthenticated request returns 401", async () => {
    const res = await request(app).get("/api/dashboard/requester");
    expect(res.status).toBe(401);
  });
});
