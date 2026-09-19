import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

const VALID_ROLES = ["REQUESTER", "IT_STAFF", "ADMINISTRATOR"];

export async function listUsers(req: AuthRequest, res: Response) {
  try {
    const { role, isActive, search } = req.query;
    const where: any = {};

    if (role && VALID_ROLES.includes(String(role))) {
      where.role = String(role);
    }

    if (typeof isActive !== "undefined") {
      where.isActive = isActive === "true";
    }

    if (search) {
      const q = String(search);
      where.OR = [
        { email: { contains: q } },
        { fullName: { contains: q } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ users, total: users.length });
  } catch (error) {
    console.error("Error listing users:", error);
    return res.status(500).json({ error: "Failed to list users" });
  }
}

export async function createUser(req: AuthRequest, res: Response) {
  try {
    const { email, fullName, role, temporaryPassword } = req.body;

    if (!email || !fullName || !temporaryPassword) {
      return res.status(400).json({ error: "Missing required fields: email, fullName, temporaryPassword" });
    }

    const assignedRole = role || "REQUESTER";
    if (!VALID_ROLES.includes(assignedRole)) {
      return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        email,
        fullName,
        role: assignedRole,
        passwordHash,
        isActive: true,
        mustChangePassword: true,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        createdAt: true,
      },
    });

    return res.status(201).json({ user: newUser });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ error: "Failed to create user" });
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { fullName, role, isActive } = req.body;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const updateData: any = {};

    if (typeof fullName === "string" && fullName.trim().length > 0) {
      updateData.fullName = fullName.trim();
    }

    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` });
      }
      updateData.role = role;
    }

    if (typeof isActive === "boolean") {
      updateData.isActive = isActive;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({ user: updated });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ error: "Failed to update user" });
  }
}

export async function resetUserPassword(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const { temporaryPassword } = req.body;

    if (!temporaryPassword || String(temporaryPassword).length < 6) {
      return res.status(400).json({ error: "A temporary password with at least 6 characters is required" });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, 10);

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash,
        mustChangePassword: true,
      },
    });

    return res.status(200).json({ message: "Password reset successfully. User must change password upon next login." });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res.status(500).json({ error: "Failed to reset password" });
  }
}
