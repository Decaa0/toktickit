import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { prisma } from '../../src/prisma';

describe('POST /api/tickets API Tests', () => {
  let requesterId: number;
  let categoryId: number;
  let relatedSystemId: number;

  beforeAll(async () => {
    const reqUser = await prisma.requesterUser.findFirst({ where: { isActive: true } });
    const cat = await prisma.category.findFirst();
    const sys = await prisma.relatedSystem.findFirst();
    requesterId = reqUser!.id;
    categoryId = cat!.id;
    relatedSystemId = sys!.id;
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