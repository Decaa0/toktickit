import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../../src/middleware/auth";

const prisma = new PrismaClient();

describe("IT Staff Ticket Queue & Workflow (Issue 3.3)", () => {
  let staffToken: string;
  let requesterToken: string;
  let staffUser: any;
  let requesterUser: any;
  let testTicket: any;
  let testCategory: any;

  beforeAll(async () => {
    staffUser = await prisma.user.upsert({
      where: { email: "staff-test@toktickit.local" },
      update: {},
      create: {
        email: "staff-test@toktickit.local",
        fullName: "Test Staff Member",
        passwordHash: "hash123",
        role: "IT_STAFF",
        isActive: true,
      },
    });

    requesterUser = await prisma.user.upsert({
      where: { email: "requester-test@toktickit.local" },
      update: {},
      create: {
        email: "requester-test@toktickit.local",
        fullName: "Test Requester Member",
        passwordHash: "hash123",
        role: "REQUESTER",
        isActive: true,
      },
    });

    testCategory = await prisma.category.findFirst();

    testTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-STAFF-${Date.now()}`,
        summary: "Queue Workflow Summary Issue",
        description: "Staff Workflow Description for testing",
        requestedPriority: "High",
        currentStatus: "New",
        categoryId: testCategory.id,
      },
    });

    staffToken = generateToken(staffUser);
    requesterToken = generateToken(requesterUser);
  });

  afterAll(async () => {
    if (testTicket) {
      await prisma.ticket.deleteMany({ where: { id: testTicket.id } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: ["staff-test@toktickit.local", "requester-test@toktickit.local"] } },
    });
    await prisma.$disconnect();
  });

  it("GET /api/staff/tickets rejects unauthorized requester (403 Forbidden)", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${requesterToken}`);

    expect(res.status).toBe(403);
  });

  it("GET /api/staff/tickets returns queue for IT Staff", async () => {
    const res = await request(app)
      .get("/api/staff/tickets")
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("items");
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it("PATCH /api/staff/tickets/:id/assign claims and transitions New -> InProgress", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicket.id}/assign`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ staffId: staffUser.id });

    expect(res.status).toBe(200);
    expect(res.body.ticket.assignedStaffId).toBe(staffUser.id);
    expect(res.body.ticket.currentStatus).toBe("InProgress");
  });

  it("PATCH /api/staff/tickets/:id/status updates status to Resolved", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicket.id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "Resolved", itPriority: "High" });

    expect(res.status).toBe(200);
    expect(res.body.ticket.currentStatus).toBe("Resolved");
    expect(res.body.ticket.itPriority).toBe("High");
  });

  it("PATCH /api/staff/tickets/:id/status rejects invalid transitions (e.g. Resolved -> New)", async () => {
    const res = await request(app)
      .patch(`/api/staff/tickets/${testTicket.id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "New" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
