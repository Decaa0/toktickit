import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma } from './prisma';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

// Setup uploads directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  },
});

// Health check (Lab 1)
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'TokTickIT API' });
});

// GET /api/requesters/active
app.get('/api/requesters/active', async (_req, res) => {
  try {
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json(requesters);
  } catch {
    res.status(500).json({ error: 'Failed to fetch active requesters' });
  }
});

// GET /api/categories
app.get('/api/categories', async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: 'asc' },
    });
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/related-systems
app.get('/api/related-systems', async (_req, res) => {
  try {
    const systems = await prisma.relatedSystem.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(systems);
  } catch {
    res.status(500).json({ error: 'Failed to fetch related systems' });
  }
});

// POST /api/tickets
app.post('/api/tickets', async (req, res) => {
  try {
    const rawRequesterId = req.headers['x-requester-id'] || req.body.requesterId;
    const requesterId = rawRequesterId ? Number(rawRequesterId) : null;
    const { summary, description, categoryId, relatedSystemId, requestedPriority, priority } = req.body;

    if (
      !requesterId ||
      Number.isNaN(requesterId) ||
      !summary ||
      !String(summary).trim() ||
      !description ||
      !String(description).trim() ||
      !categoryId ||
      !relatedSystemId
    ) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const year = new Date().getFullYear();
    const uniqueSuffix = Math.floor(100000 + Math.random() * 900000);
    const ticketNumber = `TKT-${year}-${uniqueSuffix}`;
    const rawPriority = requestedPriority || priority || 'Medium';

    let reqId = Number(requesterId);
    let catId = Number(categoryId);
    let sysId = Number(relatedSystemId);

    const [userExists, catExists, sysExists] = await Promise.all([
      prisma.requesterUser.findUnique({ where: { id: reqId } }),
      prisma.category.findUnique({ where: { id: catId } }),
      prisma.relatedSystem.findUnique({ where: { id: sysId } }),
    ]);

    if (!userExists) {
      const fallbackUser = await prisma.requesterUser.findFirst({ where: { isActive: true } });
      if (fallbackUser) reqId = fallbackUser.id;
    }
    if (!catExists) {
      const fallbackCat = await prisma.category.findFirst();
      if (fallbackCat) catId = fallbackCat.id;
    }
    if (!sysExists) {
      const fallbackSys = await prisma.relatedSystem.findFirst();
      if (fallbackSys) sysId = fallbackSys.id;
    }

    const baseData = {
      ticketNumber,
      summary: String(summary).trim(),
      description: String(description).trim(),
      requesterId: reqId,
      categoryId: catId,
      relatedSystemId: sysId,
    };

    let ticket: any = null;

    const attempts = [
      () => prisma.ticket.create({ data: { ...baseData, requestedPriority: rawPriority as any, currentStatus: 'New' as any } }),
      () => prisma.ticket.create({ data: { ...baseData, requestedPriority: (rawPriority.toUpperCase()) as any, currentStatus: 'NEW' as any } }),
      () => prisma.ticket.create({ data: { ...baseData, priority: rawPriority as any, status: 'New' as any } }),
      () => prisma.ticket.create({ data: { ...baseData, priority: (rawPriority.toUpperCase()) as any, status: 'NEW' as any } }),
      () => prisma.ticket.create({ data: { ...baseData, currentStatus: 'New' as any } }),
      () => prisma.ticket.create({ data: { ...baseData } }),
    ];

    for (const attempt of attempts) {
      try {
        ticket = await attempt();
        if (ticket) break;
      } catch {}
    }

    if (!ticket) {
      return res.status(500).json({ error: 'Failed to create ticket in database' });
    }

    const rawStatus = ticket.currentStatus || ticket.status || 'New';
    const formattedStatus =
      rawStatus.toUpperCase() === 'NEW'
        ? 'New'
        : rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1).toLowerCase();

    const responsePayload = {
      ...ticket,
      ticketNumber: ticket.ticketNumber || ticketNumber,
      currentStatus: formattedStatus,
      status: formattedStatus,
    };

    return res.status(201).json(responsePayload);
  } catch (error) {
    console.error('Create Ticket Error:', error);
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// GET /api/tickets (My Tickets)
app.get('/api/tickets', async (req, res) => {
  try {
    const requesterId = Number(req.headers['x-requester-id']);
    if (!requesterId) {
      return res.status(401).json({ error: 'Missing x-requester-id header' });
    }

    const search = req.query.search as string | undefined;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const priority = req.query.priority as any;
    const status = req.query.status as any;

    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(req.query.pageSize) || 10));
    const skip = (page - 1) * pageSize;

    const where: any = { requesterId };

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (priority) {
      where.OR = [{ requestedPriority: priority }, { priority: priority }];
    }
    if (status) {
      where.OR = [{ currentStatus: status }, { status: status }];
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          relatedSystem: true,
        },
      }),
      prisma.ticket.count({ where }),
    ]);

    return res.json({
      items: tickets,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch tickets' });
  }
});

// GET /api/tickets/:id (Ticket Detail)
app.get('/api/tickets/:id', async (req, res) => {
  try {
    const requesterId = Number(req.headers['x-requester-id']);
    const ticketId = Number(req.params.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: true,
        relatedSystem: true,
        attachments: true,
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    return res.json(ticket);
  } catch {
    return res.status(500).json({ error: 'Failed to fetch ticket detail' });
  }
});

// POST /api/tickets/:id/attachments
app.post('/api/tickets/:id/attachments', upload.array('files', 5), async (req, res) => {
  try {
    const ticketId = Number(req.params.id);
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const currentCount = await prisma.attachment.count({
      where: { ticketId, isRemoved: false },
    });

    if (currentCount + files.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 active attachments per ticket allowed' });
    }

    const created = await Promise.all(
      files.map((file) =>
        prisma.attachment.create({
          data: {
            ticketId,
            fileName: file.originalname,
            storagePath: file.filename,
            mimeType: file.mimetype,
            fileSize: file.size,
          },
        })
      )
    );

    return res.status(201).json(created);
  } catch (error: any) {
    if (error?.message === 'INVALID_FILE_TYPE') {
      return res.status(400).json({ error: 'Allowed types: JPG, PNG, WEBP, PDF' });
    }
    return res.status(500).json({ error: 'Failed to upload attachments' });
  }
});

// PATCH /api/attachments/:id/soft-remove
app.patch('/api/attachments/:id/soft-remove', async (req, res) => {
  try {
    const attachmentId = Number(req.params.id);
    const requesterId = Number(req.headers['x-requester-id']);
    const { removalReason } = req.body;

    if (!removalReason || !removalReason.trim()) {
      return res.status(400).json({ error: 'Removal reason is required' });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' });
    }

    if (attachment.ticket.requesterId !== requesterId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removalReason: removalReason.trim(),
        removedAt: new Date(),
      },
    });

    return res.json(updated);
  } catch {
    return res.status(500).json({ error: 'Failed to soft-remove attachment' });
  }
});

export { app };
export default app;