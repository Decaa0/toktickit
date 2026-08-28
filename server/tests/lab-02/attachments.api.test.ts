import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('Attachment Lifecycle & Soft-removal API', () => {
  let userAId: number;
  let userBId: number;
  let ticketId: number;
  let attachmentId: number;

  beforeAll(async () => {
    let users = await prisma.requesterUser.findMany({ where: { isActive: true }, take: 2 });
    if (users.length < 2) {
      const u1 = await prisma.requesterUser.create({
        data: { name: 'User A Att', email: `user-a-att-${Date.now()}@kmutt.ac.th`, isActive: true },
      });
      const u2 = await prisma.requesterUser.create({
        data: { name: 'User B Att', email: `user-b-att-${Date.now()}@kmutt.ac.th`, isActive: true },
      });
      users = [u1, u2];
    }
    userAId = users[0].id;
    userBId = users[1].id;

    let cat = await prisma.category.findFirst();
    if (!cat) {
      cat = await prisma.category.create({ data: { name: `Cat-${Date.now()}` } });
    }

    let sys = await prisma.relatedSystem.findFirst();
    if (!sys) {
      sys = await prisma.relatedSystem.create({ data: { name: `Sys-${Date.now()}` } });
    }

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        summary: 'Attachment test ticket',
        description: 'Test description',
        requesterId: userAId,
        categoryId: cat.id,
        relatedSystemId: sys.id,
        currentStatus: 'New',
      },
    });
    ticketId = ticket.id;

    const att = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: 'test.png',
        storagePath: 'uploads/test.png',
        mimeType: 'image/png',
        fileSize: 1024,
      },
    });
    attachmentId = att.id;
  });

  it('requires a mandatory removal reason when soft-removing', async () => {
    const res = await request(app)
      .patch(`/api/attachments/${attachmentId}/soft-remove`)
      .set('x-requester-id', String(userAId))
      .send({ removalReason: '' });

    expect(res.status).toBe(400);
  });

  it('prevents User B from soft-removing User A attachment', async () => {
    const res = await request(app)
      .patch(`/api/attachments/${attachmentId}/soft-remove`)
      .set('x-requester-id', String(userBId))
      .send({ removalReason: 'Wrong user trying to remove' });

    expect([403, 404]).toContain(res.status);
  });

  it('allows User A to successfully soft-remove their attachment', async () => {
    const res = await request(app)
      .patch(`/api/attachments/${attachmentId}/soft-remove`)
      .set('x-requester-id', String(userAId))
      .send({ removalReason: 'Uploaded wrong document version' });

    expect(res.status).toBe(200);
    expect(res.body.isRemoved).toBe(true);
    expect(res.body.removalReason).toBe('Uploaded wrong document version');
  });
});