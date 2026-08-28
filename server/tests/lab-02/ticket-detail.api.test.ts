import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('GET /api/tickets/:id (Ticket Detail & Security)', () => {
  let userAId: number;
  let userBId: number;
  let userATicketId: number;

  beforeAll(async () => {
    let users = await prisma.requesterUser.findMany({ where: { isActive: true }, take: 2 });
    if (users.length < 2) {
      const u1 = await prisma.requesterUser.create({
        data: { name: 'User A Detail', email: `user-a-det-${Date.now()}@kmutt.ac.th`, isActive: true },
      });
      const u2 = await prisma.requesterUser.create({
        data: { name: 'User B Detail', email: `user-b-det-${Date.now()}@kmutt.ac.th`, isActive: true },
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
        summary: 'Secret ticket for User A',
        description: 'Confidential details',
        requesterId: userAId,
        categoryId: cat.id,
        relatedSystemId: sys.id,
        currentStatus: 'New',
      },
    });
    userATicketId = ticket.id;
  });

  it('should allow User A to retrieve their own ticket detail', async () => {
    const res = await request(app)
      .get(`/api/tickets/${userATicketId}`)
      .set('x-requester-id', String(userAId));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(userATicketId);
  });

  it('should reject User B from viewing User A ticket with 403 or 404', async () => {
    const res = await request(app)
      .get(`/api/tickets/${userATicketId}`)
      .set('x-requester-id', String(userBId));

    expect([403, 404]).toContain(res.status);
  });
});