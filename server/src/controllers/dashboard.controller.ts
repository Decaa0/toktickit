import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

const OPEN_STATUSES = ["New", "Open", "In Progress", "Waiting for Requester", "Reopened"];
const TERMINAL_STATUSES = ["Resolved", "Closed", "Cancelled"];

function ticketSummary(t: any) {
  return {
    id: t.id,
    ticketNumber: t.ticketNumber,
    summary: t.summary,
    currentStatus: t.currentStatus,
    itPriority: t.itPriority,
    requestedPriority: t.requestedPriority,
    updatedAt: t.updatedAt,
  };
}

// GET /api/dashboard/requester — metrics scoped to the authenticated requester's owned tickets.
export async function getRequesterDashboard(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const baseWhere = { requesterUserId: userId };

    const [totalOpen, waitingForRequester, recentlyUpdated, recentlyResolved] = await Promise.all([
      prisma.ticket.count({ where: { ...baseWhere, currentStatus: { in: OPEN_STATUSES } } }),
      prisma.ticket.count({ where: { ...baseWhere, currentStatus: "Waiting for Requester" } }),
      prisma.ticket.findMany({
        where: {
          ...baseWhere,
          updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
      prisma.ticket.findMany({
        where: { ...baseWhere, currentStatus: { in: ["Resolved", "Closed"] } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    return res.status(200).json({
      totalOpen,
      waitingForRequester,
      recentlyUpdated: { count: recentlyUpdated.length, items: recentlyUpdated.map(ticketSummary) },
      recentlyResolved: { count: recentlyResolved.length, items: recentlyResolved.map(ticketSummary) },
    });
  } catch (error) {
    console.error("Error fetching requester dashboard:", error);
    return res.status(500).json({ error: "Failed to fetch requester dashboard" });
  }
}

// GET /api/dashboard/staff — operational metrics for IT Staff/Administrator.
export async function getStaffDashboard(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    const [unassigned, ownedByMe, byStatus, recentlyUpdated] = await Promise.all([
      prisma.ticket.count({
        where: { assignedStaffId: null, currentStatus: { notIn: TERMINAL_STATUSES } },
      }),
      prisma.ticket.count({ where: { assignedStaffId: userId } }),
      prisma.ticket.groupBy({
        by: ["currentStatus"],
        _count: { _all: true },
      }),
      prisma.ticket.findMany({
        where: { currentStatus: { notIn: TERMINAL_STATUSES } },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);

    const byStatusMap = byStatus.reduce((acc: Record<string, number>, row: any) => {
      acc[row.currentStatus] = row._count._all;
      return acc;
    }, {});

    // byPriority: group by itPriority with fallback to requestedPriority.
    const allTickets = await prisma.ticket.findMany({
      where: { currentStatus: { notIn: TERMINAL_STATUSES } },
      select: { itPriority: true, requestedPriority: true },
    });
    const byPriorityMap: Record<string, number> = {};
    for (const t of allTickets) {
      const p = t.itPriority || t.requestedPriority || "Unassigned";
      byPriorityMap[p] = (byPriorityMap[p] || 0) + 1;
    }

    return res.status(200).json({
      unassigned,
      ownedByMe,
      byStatus: byStatusMap,
      byPriority: byPriorityMap,
      recentlyUpdated: { count: recentlyUpdated.length, items: recentlyUpdated.map(ticketSummary) },
    });
  } catch (error) {
    console.error("Error fetching staff dashboard:", error);
    return res.status(500).json({ error: "Failed to fetch staff dashboard" });
  }
}
