import { Router } from "express";
import { prisma } from "../prisma";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = Router();

const uploadDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: JPG, PNG, WEBP, PDF"));
    }
  },
});

// POST /api/tickets
router.post("/", async (req, res) => {
  const requesterHeader = req.headers["x-requester-id"];
  if (!requesterHeader) {
    return res.status(400).json({ error: "Missing x-requester-id header" });
  }

  const requesterId = Number(requesterHeader);
  const { categoryId, relatedSystemId, requestedPriority, summary, description } = req.body;

  if (!summary || !description || !categoryId || !relatedSystemId) {
    return res.status(400).json({ error: "Summary, description, category, and related system are required" });
  }

  try {
    const year = new Date().getFullYear();
    const count = await prisma.ticket.count();
    const sequence = String(count + 1).padStart(6, "0");
    const ticketNumber = `TKT-${year}-${sequence}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority: requestedPriority || "MEDIUM",
        itPriority: requestedPriority || "MEDIUM",
        currentStatus: "New",
        requesterId,
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
      },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
      },
    });

    res.status(201).json(ticket);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create ticket" });
  }
});

// GET /api/tickets
router.get("/", async (req, res) => {
  const requesterHeader = req.headers["x-requester-id"];
  if (!requesterHeader) {
    return res.status(400).json({ error: "Missing x-requester-id header" });
  }

  const requesterId = Number(requesterHeader);
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));
  const skip = (page - 1) * limit;

  const { search, category, status, priority, sortField = "createdAt", sortOrder = "desc" } = req.query;

  const whereClause: any = {
    requesterId,
  };

  if (search) {
    whereClause.OR = [
      { ticketNumber: { contains: String(search), mode: "insensitive" } },
      { summary: { contains: String(search), mode: "insensitive" } },
    ];
  }

  if (category) {
    whereClause.categoryId = Number(category);
  }

  if (status) {
    whereClause.currentStatus = String(status);
  }

  if (priority) {
    whereClause.requestedPriority = String(priority);
  }

  try {
    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { [String(sortField)]: sortOrder === "asc" ? "asc" : "desc" },
        include: {
          category: true,
          relatedSystem: true,
        },
      }),
      prisma.ticket.count({ where: whereClause }),
    ]);

    res.json({
      data: tickets,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// GET /api/tickets/:id
router.get("/:id", async (req, res) => {
  const requesterHeader = req.headers["x-requester-id"];
  if (!requesterHeader) {
    return res.status(400).json({ error: "Missing x-requester-id header" });
  }

  const requesterId = Number(requesterHeader);
  const ticketId = Number(req.params.id);

  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        requester: { select: { id: true, name: true, email: true } },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: "Forbidden: You do not own this ticket" });
    }

    res.json(ticket);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve ticket" });
  }
});

// POST /api/tickets/:id/attachments
router.post("/:id/attachments", upload.single("file"), async (req, res) => {
  const requesterHeader = req.headers["x-requester-id"];
  if (!requesterHeader) {
    return res.status(400).json({ error: "Missing x-requester-id header" });
  }

  const requesterId = Number(requesterHeader);
  const ticketId = Number(req.params.id);

  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: "Forbidden: Cannot attach file to unowned ticket" });
    }

    const activeCount = await prisma.attachment.count({
      where: { ticketId, isRemoved: false },
    });

    if (activeCount >= 5) {
      return res.status(400).json({ error: "Maximum of 5 active attachments allowed per ticket" });
    }

    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        storagePath: req.file.path,
        isRemoved: false,
      },
    });

    res.status(201).json(attachment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload attachment" });
  }
});

export default router;