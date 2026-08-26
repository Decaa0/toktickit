import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/prisma";

describe("POST /api/tickets (Create Ticket API)", () => {
  let activeRequesterId: number;
  let categoryId: number;
  let relatedSystemId: number;

  beforeEach(async () => {
    const requester = await prisma.requesterUser.findFirst({ where: { isActive: true } });
    const category = await prisma.category.findFirst({ where: { isActive: true } });
    const system = await prisma.relatedSystem.findFirst({ where: { isActive: true } });

    activeRequesterId = requester!.id;
    categoryId = category!.id;
    relatedSystemId = system!.id;
  });

  it("should create a valid ticket and return 201 with unique ticketNumber", async () => {
    const payload = {
      categoryId,
      relatedSystemId,
      requestedPriority: "HIGH",
      summary: "Cannot connect to VPN from home",
      description: "Getting timeout error code 800 when connecting to corporate VPN network.",
    };

    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", String(activeRequesterId))
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.summary).toBe(payload.summary);
    expect(res.body.currentStatus).toBe("New");
    expect(res.body.requestedPriority).toBe("HIGH");
  });

  it("should reject creation with 400 if summary or description is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .set("x-requester-id", String(activeRequesterId))
      .send({ categoryId, relatedSystemId });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should reject creation with 400 if requester header is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({
        categoryId,
        relatedSystemId,
        summary: "No requester header",
        description: "Testing missing requester context",
      });

    expect(res.status).toBe(400);
  });
});