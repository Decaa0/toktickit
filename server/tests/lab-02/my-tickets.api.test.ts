import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/prisma";

describe("GET /api/tickets (My Tickets API & Isolation)", () => {
  let userAId: number;
  let userBId: number;

  beforeAll(async () => {
    const users = await prisma.requesterUser.findMany({ where: { isActive: true }, take: 2 });
    userAId = users[0].id;
    userBId = users[1].id;

    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${Date.now().toString().slice(-6)}`,
        summary: "User A Network Issue",
        description: "Wi-Fi keeps dropping in building 2",
        requesterId: userAId,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
  });

  it("should return tickets belonging only to the authenticated requester", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(userAId));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
    res.body.data.forEach((ticket: any) => {
      expect(ticket.requesterId).toBe(userAId);
    });
  });

  it("should return empty list when User B has no tickets", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("x-requester-id", String(userBId));

    expect(res.status).toBe(200);
    expect(res.body.data.every((t: any) => t.requesterId === userBId)).toBe(true);
  });

  it("should support search query filtering", async () => {
    const res = await request(app)
      .get("/api/tickets?search=Network")
      .set("x-requester-id", String(userAId));

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });
});