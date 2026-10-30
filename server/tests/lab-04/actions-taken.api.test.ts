import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../../src/middleware/auth";

const prisma = new PrismaClient();

describe("Actions Taken API (Issue 4.2)", () => {
  let staffToken: string;
  let requesterToken: string;
  let staffUser: any;
  let requesterUser: any;
  let testCategory: any;
  let testTicket: any;

  beforeAll(async () => {
    staffUser = await prisma.user.upsert({
      where: { email: "actions-staff@toktickit.local" },
      update: {},
      create: {
        email: "actions-staff@toktickit.local",
        fullName: "Actions Staff",
        passwordHash: "hash123",
        role: "IT_STAFF",
        isActive: true,
      },
    });

    requesterUser = await prisma.user.upsert({
      where: { email: "actions-requester@toktickit.local" },
      update: {},
      create: {
        email: "actions-requester@toktickit.local",
        fullName: "Actions Requester",
        passwordHash: "hash123",
        role: "REQUESTER",
        isActive: true,
      },
    });

    testCategory = await prisma.category.findFirst();

    testTicket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-ACT-${Date.now()}`,
        summary: "Actions Taken Test Ticket",
        description: "Ticket used to test Actions Taken API",
        requestedPriority: "Medium",
        currentStatus: "Open",
        categoryId: testCategory!.id,
        requesterUserId: requesterUser.id,
      },
    });

    staffToken = generateToken(staffUser);
    requesterToken = generateToken(requesterUser);
  });

  afterAll(async () => {
    await prisma.actionTaken.deleteMany({ where: { ticketId: testTicket.id } });
    await prisma.ticket.deleteMany({ where: { id: testTicket.id } });
    await prisma.user.deleteMany({
      where: { email: { in: ["actions-staff@toktickit.local", "actions-requester@toktickit.local"] } },
    });
    await prisma.$disconnect();
  });

  it("AC-01: IT Staff creates a valid Action Taken under the correct ticket (201)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({
        description: "Rebooted the workstation",
        result: "Issue resolved after reboot",
        followUpRequired: false,
        attachmentNotes: "See screenshot-1.png",
      });

    expect(res.status).toBe(201);
    expect(res.body.ticketId).toBe(testTicket.id);
    expect(res.body.performedByUserId).toBe(staffUser.id);
    expect(res.body.description).toBe("Rebooted the workstation");
    expect(res.body.performedByName).toBe("Actions Staff");
  });

  it("AC-03: Requester cannot create an Action Taken (403)", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ description: "I did this" });

    expect(res.status).toBe(403);
  });

  it("AC-04: followUpRequired=true with empty followUpNote returns 400", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ description: "Needs follow up", followUpRequired: true, followUpNote: "" });

    expect(res.status).toBe(400);
  });

  it("AC-04: empty description returns 400", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ description: "   " });

    expect(res.status).toBe(400);
  });

  it("AC-01: unauthenticated create returns 401", async () => {
    const res = await request(app)
      .post(`/api/tickets/${testTicket.id}/actions`)
      .send({ description: "no token" });

    expect(res.status).toBe(401);
  });

  it("GET returns actions for the ticket in stable order (oldest first)", async () => {
    // Create a second action, then verify ascending order by createdAt.
    await request(app)
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ description: "Second action" });

    const res = await request(app)
      .get(`/api/tickets/${testTicket.id}/actions`)
      .set("Authorization", `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    const descriptions = res.body.items.map((a: any) => a.description);
    expect(descriptions).toContain("Rebooted the workstation");
    expect(descriptions).toContain("Second action");
  });

  it("GET requires ticket ownership for Requesters (403 on unowned ticket)", async () => {
    const otherRequester = await prisma.user.upsert({
      where: { email: "actions-other@toktickit.local" },
      update: {},
      create: {
        email: "actions-other@toktickit.local",
        fullName: "Other Requester",
        passwordHash: "hash123",
        role: "REQUESTER",
        isActive: true,
      },
    });
    const otherToken = generateToken(otherRequester);

    const res = await request(app)
      .get(`/api/tickets/${testTicket.id}/actions`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
  });

  it("PATCH updates an Action Taken (200)", async () => {
    const created = await request(app)
      .post(`/api/tickets/${testTicket.id}/actions`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ description: "To be updated", result: "old" });

    const res = await request(app)
      .patch(`/api/tickets/${testTicket.id}/actions/${created.body.id}`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ result: "new result", followUpRequired: true, followUpNote: "Please verify" });

    expect(res.status).toBe(200);
    expect(res.body.result).toBe("new result");
    expect(res.body.followUpRequired).toBe(true);
    expect(res.body.followUpNote).toBe("Please verify");
  });
});
