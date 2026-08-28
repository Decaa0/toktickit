import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('GET /api/tickets (My Tickets API & Isolation)', () => {
  let userAId: number;
  let userBId: number;

  beforeAll(async () => {
    let users = await prisma.requesterUser.findMany({ where: { isActive: true }, take: 2 });
    if (users.length < 2) {
      const u1 = await prisma.requesterUser.create({
        data: { name: 'User A', email: `user-a-${Date.now()}@kmutt.ac.th`, isActive: true },
      });
      const u2 = await prisma.requesterUser.create({
        data: { name: 'User B', email: `user-b-${Date.now()}@kmutt.ac.th`, isActive: true },
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

    await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        summary: 'User A Network issue',
        description: 'Network disconnects',
        requesterId: userAId,
        categoryId: cat.id,
        relatedSystemId: sys.id,
        currentStatus: 'New',
      },
    });
  });

  it('should return tickets belonging only to the authenticated requester', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('x-requester-id', String(userAId));

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
    res.body.items.forEach((ticket: any) => {
      expect(ticket.requesterId).toBe(userAId);
    });
  });

  it('should return empty list when User B has no tickets', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .set('x-requester-id', String(userBId));

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  it('should support search query filtering', async () => {
    const res = await request(app)
      .get('/api/tickets?search=Network')
      .set('x-requester-id', String(userAId));

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });
});