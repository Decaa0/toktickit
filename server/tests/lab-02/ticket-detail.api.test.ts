import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/prisma";

describe("GET /api/tickets/:id (Ticket Detail & Security)", () => {
  let userAId: number;
  let userBId: number;
  let userATicketId: number;

  beforeAll(async () => {
    const users = await prisma.requesterUser.findMany({ where: { isActive: true }, take: 2 });
    userAId = users[0].id;
    userBId = users[1].id;

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    const t = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${(Date.now() + 1).toString().slice(-6)}`,
        summary: "User A Private Ticket",
        description: "Confidential hardware issue",
        requesterId: userAId,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    userATicketId = t.id;
  });

  it("should allow User A to retrieve their own ticket detail", async () => {
    const res = await request(app)
      .get(`/api/tickets/${userATicketId}`)
      .set("x-requester-id", String(userAId));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userATicketId);
    expect(res.body.summary).toBe("User A Private Ticket");
    expect(res.body).toHaveProperty("attachments");
  });

  it("should reject User B from viewing User A's ticket with 403 or 404", async () => {
    const res = await request(app)
      .get(`/api/tickets/${userATicketId}`)
      .set("x-requester-id", String(userBId));

    expect([403, 404]).toContain(res.status);
  });
});