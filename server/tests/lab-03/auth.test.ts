import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../../src/app";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

describe("Auth API Endpoints (Issue 3.2)", () => {
  const testEmail = "authtest@toktickit.local";
  const testPassword = "Password123!";

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(testPassword, 10);
    await prisma.user.upsert({
      where: { email: testEmail },
      update: { passwordHash, isActive: true },
      create: {
        email: testEmail,
        passwordHash,
        fullName: "Test User",
        role: "REQUESTER",
        isActive: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it("POST /api/auth/login succeeds with valid credentials", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user.email).toBe(testEmail);
  });

  it("POST /api/auth/login rejects incorrect password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: "WrongPassword" });

    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me rejects unauthenticated requests", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("GET /api/auth/me returns current user profile when token is provided", async () => {
    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: testEmail, password: testPassword });

    const token = loginRes.body.token;

    const meRes = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.user.email).toBe(testEmail);
  });
});
