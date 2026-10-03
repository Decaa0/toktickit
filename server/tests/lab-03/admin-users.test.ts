import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import { generateToken } from "../../src/middleware/auth";

const prisma = new PrismaClient();

describe("Admin User Management & Roles (Issue 3.4)", () => {
  let adminToken: string;
  let staffToken: string;
  let requesterToken: string;
  let adminUser: any;
  let staffUser: any;
  let requesterUser: any;
  let createdUserId: string;

  beforeAll(async () => {
    adminUser = await prisma.user.upsert({
      where: { email: "admin-test34@toktickit.local" },
      update: {},
      create: {
        email: "admin-test34@toktickit.local",
        fullName: "Test Admin 34",
        passwordHash: "hash123",
        role: "ADMINISTRATOR",
        isActive: true,
      },
    });

    staffUser = await prisma.user.upsert({
      where: { email: "staff-test34@toktickit.local" },
      update: {},
      create: {
        email: "staff-test34@toktickit.local",
        fullName: "Test Staff 34",
        passwordHash: "hash123",
        role: "IT_STAFF",
        isActive: true,
      },
    });

    requesterUser = await prisma.user.upsert({
      where: { email: "requester-test34@toktickit.local" },
      update: {},
      create: {
        email: "requester-test34@toktickit.local",
        fullName: "Test Requester 34",
        passwordHash: "hash123",
        role: "REQUESTER",
        isActive: true,
      },
    });

    adminToken = generateToken(adminUser);
    staffToken = generateToken(staffUser);
    requesterToken = generateToken(requesterUser);
  });

  afterAll(async () => {
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } });
    }
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            "admin-test34@toktickit.local",
            "staff-test34@toktickit.local",
            "requester-test34@toktickit.local",
            "newuser-34@toktickit.local",
          ],
        },
      },
    });
    await prisma.$disconnect();
  });

  it("GET /api/admin/users rejects non-admin users with 403 Forbidden", async () => {
    const resStaff = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${staffToken}`);
    expect(resStaff.status).toBe(403);

    const resReq = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${requesterToken}`);
    expect(resReq.status).toBe(403);
  });

  it("GET /api/admin/users returns list of users for administrator", async () => {
    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("users");
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body.users.length).toBeGreaterThanOrEqual(1);
  });

  it("POST /api/admin/users creates a user with mustChangePassword: true", async () => {
    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        email: "newuser-34@toktickit.local",
        fullName: "New Team Member",
        role: "IT_STAFF",
        temporaryPassword: "TempPassword123!",
      });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty("id");
    expect(res.body.user.email).toBe("newuser-34@toktickit.local");
    expect(res.body.user.role).toBe("IT_STAFF");
    expect(res.body.user.mustChangePassword).toBe(true);

    createdUserId = res.body.user.id;
  });

  it("PATCH /api/admin/users/:id updates user details and toggles status", async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${createdUserId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        fullName: "Updated Name",
        isActive: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.user.fullName).toBe("Updated Name");
    expect(res.body.user.isActive).toBe(false);
  });

  it("POST /api/admin/users/:id/reset-password resets user password", async () => {
    const res = await request(app)
      .post(`/api/admin/users/${createdUserId}/reset-password`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        temporaryPassword: "NewTempPassword456!",
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");

    const updated = await prisma.user.findUnique({ where: { id: createdUserId } });
    expect(updated?.mustChangePassword).toBe(true);
  });
});
