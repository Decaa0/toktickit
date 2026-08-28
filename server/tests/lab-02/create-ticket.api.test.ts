import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('POST /api/tickets API Tests', () => {
  let requesterId: number;
  let categoryId: number;
  let relatedSystemId: number;

  beforeAll(async () => {
    let reqUser = await prisma.requesterUser.findFirst({ where: { isActive: true } });
    if (!reqUser) {
      reqUser = await prisma.requesterUser.create({
        data: { name: 'Active Req', email: `active-${Date.now()}@kmutt.ac.th`, isActive: true },
      });
    }

    let cat = await prisma.category.findFirst();
    if (!cat) {
      cat = await prisma.category.create({ data: { name: `Cat-${Date.now()}` } });
    }

    let sys = await prisma.relatedSystem.findFirst();
    if (!sys) {
      sys = await prisma.relatedSystem.create({ data: { name: `Sys-${Date.now()}` } });
    }

    requesterId = reqUser.id;
    categoryId = cat.id;
    relatedSystemId = sys.id;
  });

  it('creates ticket successfully with unique ticketNumber', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('x-requester-id', String(requesterId))
      .send({
        summary: 'Laptop screen flickering',
        description: 'Screen flickers when connected to external monitor',
        categoryId,
        relatedSystemId,
        requestedPriority: 'High',
      });

    expect(res.status).toBe(201);
    expect(res.body.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.currentStatus).toBe('New');
  });

  it('rejects creation when required summary is missing', async () => {
    const res = await request(app)
      .post('/api/tickets')
      .set('x-requester-id', String(requesterId))
      .send({
        description: 'Missing summary test',
        categoryId,
        relatedSystemId,
      });

    expect(res.status).toBe(400);
  });
});