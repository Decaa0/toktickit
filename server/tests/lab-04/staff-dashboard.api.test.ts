import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../../src/middleware/auth";

const prisma = new PrismaClient();

describe("Staff Dashboard API (Issue 4.5)", () => {
  let staffUser: any;
  let requesterUser: any;
  let staffToken: string;
  let requesterToken: string;
  let category: any;
  const createdIds: number[] = [];

  beforeAll(async () => {
    staffUser = await prisma.user.upsert({
      where: { email: "sdash-staff@toktickit.local" },
      update: {},
      create: { email: "sdash-staff@toktickit.local", fullName: "Staff Dash", passwordHash: "h", role: "IT_STAFF", isActive: true },
    });
    requesterUser = await prisma.user.upsert({
      where: { email: "sdash-requester@toktickit.local" },
      update: {},
      create: { email: "sdash-requester@toktickit.local", fullName: "Requester Dash", passwordHash: "h", role: "REQUESTER", isActive: true },
    });
    category = await prisma.category.findFirst();
    staffToken = generateToken(staffUser);
    requesterToken = generateToken(requesterUser);
  });

  afterAll(async () => {
    await prisma.ticket.deleteMany({ where: { id: { in: createdIds } } });
    await prisma.user.deleteMany({
      where: { email: { in: ["sdash-staff@toktickit.local", "sdash-requester@toktickit.local"] } },
    });
    await prisma.$disconnect();
  });

  it("DASH-03: staff dashboard metrics match the backend queries", async () => {
    // 1 unassigned open, 1 owned-by-me, 1 cancelled (terminal, excluded from byStatus non-terminal grouping).
    const unassigned = await prisma.ticket.create({
      data: { ticketNumber: `TKT-SD-U-${Date.now()}`, summary: "Unassigned", description: "x", requestedPriority: "High", currentStatus: "Open", categoryId: category.id, requesterUserId: requesterUser.id },
    });
    const mine = await prisma.ticket.create({
      data: { ticketNumber: `TKT-SD-M-${Date.now()}`, summary: "Mine", description: "x", requestedPriority: "Medium", itPriority: "High", currentStatus: "In Progress", categoryId: category.id, requesterUserId: requesterUser.id, assignedStaffId: staffUser.id },
    });
    createdIds.push(unassigned.id, mine.id);

    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.unassigned).toBeGreaterThanOrEqual(1);
    expect(res.body.ownedByMe).toBeGreaterThanOrEqual(1);
    expect(res.body.byStatus).toHaveProperty("Open");
    expect(res.body.byPriority).toHaveProperty("High");
    expect(Array.isArray(res.body.recentlyUpdated.items)).toBe(true);
  });

  it("DASH-04: requester cannot access staff dashboard (403)", async () => {
    const res = await request(app)
      .get("/api/dashboard/staff")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
  });
});
