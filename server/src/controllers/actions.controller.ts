import { Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

type ActionInput = {
  actionDateTime?: string;
  description?: string;
  result?: string;
  followUpRequired?: boolean;
  followUpNote?: string;
  attachmentNotes?: string;
};

function toActionPayload(action: any) {
  const { performedBy, ...rest } = action;
  return {
    ...rest,
    performedByName: performedBy ? performedBy.fullName : null,
  };
}

async function findTicket(ticketId: number) {
  return prisma.ticket.findUnique({ where: { id: ticketId } });
}

// GET /api/tickets/:id/actions
export async function listActions(req: AuthRequest, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const ticket = await findTicket(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Requesters may only read actions on tickets they own.
    if (req.user?.role === "REQUESTER" && ticket.requesterUserId !== req.user.id) {
      return res.status(403).json({ error: "Forbidden: you do not own this ticket" });
    }

    const actions = await prisma.actionTaken.findMany({
      where: { ticketId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: { performedBy: { select: { id: true, fullName: true, email: true } } },
    });

    return res.status(200).json({ items: actions.map(toActionPayload) });
  } catch (error) {
    console.error("Error listing actions:", error);
    return res.status(500).json({ error: "Failed to fetch actions taken" });
  }
}

// POST /api/tickets/:id/actions
export async function createAction(req: AuthRequest, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const body: ActionInput = req.body || {};

    if (!body.description || !String(body.description).trim()) {
      return res.status(400).json({ error: "Action description is required" });
    }
    if (body.followUpRequired && (!body.followUpNote || !String(body.followUpNote).trim())) {
      return res.status(400).json({ error: "Follow-up note is required when follow-up is required" });
    }

    const ticket = await findTicket(ticketId);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const action = await prisma.actionTaken.create({
      data: {
        ticketId,
        actionDateTime: body.actionDateTime ? new Date(body.actionDateTime) : new Date(),
        description: String(body.description).trim(),
        result: body.result ? String(body.result).trim() : null,
        performedByUserId: req.user!.id,
        followUpRequired: Boolean(body.followUpRequired),
        followUpNote: body.followUpNote ? String(body.followUpNote).trim() : null,
        attachmentNotes: body.attachmentNotes ? String(body.attachmentNotes).trim() : null,
      },
      include: { performedBy: { select: { id: true, fullName: true, email: true } } },
    });

    return res.status(201).json(toActionPayload(action));
  } catch (error) {
    console.error("Error creating action:", error);
    return res.status(500).json({ error: "Failed to create action taken" });
  }
}

// PATCH /api/tickets/:id/actions/:actionId
export async function updateAction(req: AuthRequest, res: Response) {
  try {
    const ticketId = Number(req.params.id);
    const actionId = Number(req.params.actionId);
    if (isNaN(ticketId) || isNaN(actionId)) {
      return res.status(400).json({ error: "Invalid ticket or action ID" });
    }

    const existing = await prisma.actionTaken.findFirst({
      where: { id: actionId, ticketId },
    });
    if (!existing) {
      return res.status(404).json({ error: "Action taken not found" });
    }

    const body: ActionInput = req.body || {};

    // Validate follow-up note rule against the merged (post-update) state.
    const nextFollowUpRequired =
      body.followUpRequired !== undefined ? Boolean(body.followUpRequired) : existing.followUpRequired;
    const nextFollowUpNote =
      body.followUpNote !== undefined ? String(body.followUpNote).trim() : existing.followUpNote || "";

    if (nextFollowUpRequired && !nextFollowUpNote) {
      return res.status(400).json({ error: "Follow-up note is required when follow-up is required" });
    }
    if (body.description !== undefined && !String(body.description).trim()) {
      return res.status(400).json({ error: "Action description is required" });
    }

    const updateData: any = {};
    if (body.actionDateTime !== undefined) updateData.actionDateTime = new Date(body.actionDateTime);
    if (body.description !== undefined) updateData.description = String(body.description).trim();
    if (body.result !== undefined) updateData.result = body.result ? String(body.result).trim() : null;
    if (body.followUpRequired !== undefined) updateData.followUpRequired = Boolean(body.followUpRequired);
    if (body.followUpNote !== undefined) updateData.followUpNote = body.followUpNote ? String(body.followUpNote).trim() : null;
    if (body.attachmentNotes !== undefined) updateData.attachmentNotes = body.attachmentNotes ? String(body.attachmentNotes).trim() : null;

    const action = await prisma.actionTaken.update({
      where: { id: actionId },
      data: updateData,
      include: { performedBy: { select: { id: true, fullName: true, email: true } } },
    });

    return res.status(200).json(toActionPayload(action));
  } catch (error) {
    console.error("Error updating action:", error);
    return res.status(500).json({ error: "Failed to update action taken" });
  }
}
