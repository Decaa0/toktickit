import { Router } from "express";
import { prisma } from "../prisma";
import fs from "fs";

const router = Router();

// GET /api/attachments/:id/download
router.get("/:id/download", async (req, res) => {
  const requesterHeader = req.headers["x-requester-id"];
  if (!requesterHeader) {
    return res.status(400).json({ error: "Missing x-requester-id header" });
  }

  const requesterId = Number(requesterHeader);
  const attachmentId = Number(req.params.id);

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || attachment.ticket.requesterId !== requesterId) {
      return res.status(404).json({ error: "Attachment not found or access denied" });
    }

    if (attachment.isRemoved) {
      return res.status(404).json({ error: "Attachment has been soft-removed" });
    }

    if (!fs.existsSync(attachment.storagePath)) {
      return res.status(404).json({ error: "File not found on disk" });
    }

    res.download(attachment.storagePath, attachment.fileName);
  } catch (err) {
    res.status(500).json({ error: "Failed to download attachment" });
  }
});

// PATCH /api/attachments/:id/soft-remove
router.patch("/:id/soft-remove", async (req, res) => {
  const requesterHeader = req.headers["x-requester-id"];
  if (!requesterHeader) {
    return res.status(400).json({ error: "Missing x-requester-id header" });
  }

  const requesterId = Number(requesterHeader);
  const attachmentId = Number(req.params.id);
  const { reason } = req.body;

  if (!reason || !reason.trim()) {
    return res.status(400).json({ error: "A removal reason is required" });
  }

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment || attachment.ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: "Forbidden: Cannot remove attachment from unowned ticket" });
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removalReason: reason.trim(),
        removedAt: new Date(),
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to remove attachment" });
  }
});

export default router;