import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

const VALID_TRANSITIONS: Record<string, string[]> = {
  New: ["InProgress"],
  InProgress: ["Resolved"],
  Resolved: ["Closed", "InProgress"],
  Closed: [],
};

export async function getStaffTicketQueue(req: AuthRequest, res: Response) {
  try {
    const { status, priority, assignedTo, categoryId, search } = req.query;

    const whereClause: any = {};

    if (status) {
      whereClause.currentStatus = String(status);
    }

    if (priority) {
      whereClause.OR = [
        { itPriority: String(priority) },
        { requestedPriority: String(priority) },
      ];
    }

    if (assignedTo) {
      whereClause.assignedStaffId = String(assignedTo);
    }

    if (categoryId) {
      whereClause.categoryId = Number(categoryId);
    }

    if (search) {
      const q = String(search);
      whereClause.OR = [
        { summary: { contains: q } },
        { description: { contains: q } },
        { ticketNumber: { contains: q } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        category: true,
        requester: true,
        assignedStaff: {
          select: { id: true, email: true, fullName: true, role: true },
        },
        attachments: {
          where: { isRemoved: false },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ items: tickets, total: tickets.length });
  } catch (error) {
    console.error("Error fetching staff queue:", error);
    return res.status(500).json({ error: "Failed to fetch staff queue" });
  }
}

export async function assignTicket(req: AuthRequest, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    const { staffId } = req.body;

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const targetStaffId = staffId || req.user?.id;
    if (!targetStaffId) {
      return res.status(400).json({ error: "Staff ID is required" });
    }

    const staffUser = await prisma.user.findUnique({
      where: { id: targetStaffId },
    });

    if (!staffUser || (staffUser.role !== "IT_STAFF" && staffUser.role !== "ADMINISTRATOR")) {
      return res.status(400).json({ error: "Target user is not a valid IT staff member" });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const updateData: any = { assignedStaffId: targetStaffId };
    if (ticket.currentStatus === "New") {
      updateData.currentStatus = "InProgress";
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        assignedStaff: {
          select: { id: true, email: true, fullName: true, role: true },
        },
      },
    });

    return res.status(200).json({ ticket: updated });
  } catch (error) {
    console.error("Error assigning ticket:", error);
    return res.status(500).json({ error: "Failed to assign ticket" });
  }
}

export async function updateTicketStatus(req: AuthRequest, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    const { status, itPriority } = req.body;

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    if (!status) {
      return res.status(400).json({ error: "New status is required" });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const allowedNext = VALID_TRANSITIONS[ticket.currentStatus] || [];
    if (!allowedNext.includes(status)) {
      return res.status(400).json({
        error: `Invalid status transition from ${ticket.currentStatus} to ${status}`,
        allowedTransitions: allowedNext,
      });
    }

    const updateData: any = { currentStatus: status };

    if (itPriority) {
      updateData.itPriority = itPriority;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    return res.status(200).json({ ticket: updated });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return res.status(500).json({ error: "Failed to update ticket status" });
  }
}
