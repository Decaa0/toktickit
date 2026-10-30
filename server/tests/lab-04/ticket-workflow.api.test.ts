import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../../src/middleware/auth";

const prisma = new PrismaClient();

describe("Ticket Workflow & Resolution Gate (Issue 4.4)", () => {
  let staffToken: string;
  let requesterToken: string;
  let staffUser: any;
  let requesterUser: any;
  let category: any;
  const createdTicketIds: number[] = [];

  async function makeTicket(status: string) {
    const t = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-WF-${status.replace(/\s+/g, "")}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        summary: `WF ticket (${status})`,
        description: "Workflow test ticket",
        requestedPriority: "Medium",
        currentStatus: status,
        categoryId: category.id,
        requesterUserId: requesterUser.id,
      },
    });
    createdTicketIds.push(t.id);
    return t;
  }

  beforeAll(async () => {
    staffUser = await prisma.user.upsert({
      where: { email: "wf-staff@toktickit.local" },
      update: {},
      create: { email: "wf-staff@toktickit.local", fullName: "WF Staff", passwordHash: "h", role: "IT_STAFF", isActive: true },
    });
    requesterUser = await prisma.user.upsert({
      where: { email: "wf-requester@toktickit.local" },
      update: {},
      create: { email: "wf-requester@toktickit.local", fullName: "WF Requester", passwordHash: "h", role: "REQUESTER", isActive: true },
    });
    category = await prisma.category.findFirst();
    staffToken = generateToken(staffUser);
    requesterToken = generateToken(requesterUser);
  });

  afterAll(async () => {
    await prisma.actionTaken.deleteMany({ where: { ticketId: { in: createdTicketIds } } });
    await prisma.ticket.deleteMany({ where: { id: { in: createdTicketIds } } });
    await prisma.user.deleteMany({
      where: { email: { in: ["wf-staff@toktickit.local", "wf-requester@toktickit.local"] } },
    });
    await prisma.$disconnect();
  });

  it("AC-05: Requester 'appears resolved' does NOT change status to Resolved", async () => {
    const ticket = await makeTicket("Open");
    const res = await request(app)
      .patch(`/api/tickets/${ticket.id}/appears-resolved`)
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ resolutionSummary: "Seems fixed now" });

    expect(res.status).toBe(200);
    expect(res.body.ticket.requesterResolved).toBe(true);
    expect(res.body.ticket.currentStatus).toBe("Open"); // status unchanged
  });

  it("AC-05: Requester cannot call staff status endpoint (403)", async () => {
    const ticket = await makeTicket("Open");
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Authorization", `Bearer ${requesterToken}`)
      .send({ status: "Resolved" });

    expect(res.status).toBe(403);
  });

  it("AC-07: illegal transition (Closed -> In Progress) returns 400", async () => {
    const ticket = await makeTicket("Closed");
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "In Progress" });

    expect(res.status).toBe(400);
  });

  it("AC-07: permitted transition (Closed -> Reopened) returns 200", async () => {
    const ticket = await makeTicket("Closed");
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "Reopened" });

    expect(res.status).toBe(200);
    expect(res.body.ticket.currentStatus).toBe("Reopened");
  });

  it("AC-06: stale expectedUpdatedAt returns 409 and does not write", async () => {
    const ticket = await makeTicket("Open");
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "In Progress", expectedUpdatedAt: "2000-01-01T00:00:00.000Z" });

    expect(res.status).toBe(409);

    const after = await prisma.ticket.findUnique({ where: { id: ticket.id } });
    expect(after!.currentStatus).toBe("Open"); // unchanged
  });

  it("WF-04: full transition matrix — legal transitions are accepted", async () => {
    const cases: Array<[string, string]> = [
      ["New", "Open"],
      ["New", "Cancelled"],
      ["Open", "In Progress"],
      ["Open", "Waiting for Requester"],
      ["In Progress", "Waiting for Requester"],
      ["Waiting for Requester", "In Progress"],
      ["Waiting for Requester", "Resolved"],
      ["Resolved", "Closed"],
      ["Resolved", "Reopened"],
      ["Reopened", "In Progress"],
    ];

    for (const [from, to] of cases) {
      const ticket = await makeTicket(from);
      const res = await request(app)
        .patch(`/api/staff/tickets/${ticket.id}/status`)
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ status: to });
      expect(res.status, `${from} -> ${to} should be allowed`).toBe(200);
      expect(res.body.ticket.currentStatus).toBe(to);
    }
  });

  it("WF-04: Cancelled is terminal (no transitions)", async () => {
    const ticket = await makeTicket("Cancelled");
    const res = await request(app)
      .patch(`/api/staff/tickets/${ticket.id}/status`)
      .set("Authorization", `Bearer ${staffToken}`)
      .send({ status: "Open" });

    expect(res.status).toBe(400);
  });
});
