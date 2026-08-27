import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { prisma } from "../../src/prisma";

describe("Attachments API Lifecycle", () => {
  let requesterId: number;
  let ticketId: number;

  beforeAll(async () => {
    const user = await prisma.requesterUser.findFirst({ where: { isActive: true } });
    requesterId = user!.id;
    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();

    const t = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-2026-${(Date.now() + 2).toString().slice(-6)}`,
        summary: "Attachment Test Ticket",
        description: "Testing attachments lifecycle",
        requesterId,
        categoryId: cat!.id,
        relatedSystemId: sys!.id,
      },
    });
    ticketId = t.id;
  });

  it("should upload a valid text/image attachment", async () => {
    const res = await request(app)
      .post(`/api/tickets/${ticketId}/attachments`)
      .set("x-requester-id", String(requesterId))
      .attach("file", Buffer.from("Sample test content"), "sample.pdf");

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.fileName).toBe("sample.pdf");
    expect(res.body.isRemoved).toBe(false);
  });

  it("should soft-remove an attachment when a reason is provided", async () => {
    const att = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: "error_log.png",
        fileSize: 1024,
        mimeType: "image/png",
        storagePath: "uploads/fake.png",
      },
    });

    const res = await request(app)
      .patch(`/api/attachments/${att.id}/soft-remove`)
      .set("x-requester-id", String(requesterId))
      .send({ reason: "Uploaded wrong screenshot" });

    expect(res.status).toBe(200);
    expect(res.body.isRemoved).toBe(true);
    expect(res.body.removalReason).toBe("Uploaded wrong screenshot");
  });

  it("should block download of a soft-removed attachment", async () => {
    const att = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: "deleted_doc.pdf",
        fileSize: 500,
        mimeType: "application/pdf",
        storagePath: "uploads/deleted.pdf",
        isRemoved: true,
        removalReason: "Confidential",
      },
    });

    const res = await request(app)
      .get(`/api/attachments/${att.id}/download`)
      .set("x-requester-id", String(requesterId));

    expect([404, 403]).toContain(res.status);
  });
});