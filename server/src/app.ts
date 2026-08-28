import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from './prisma';

const app = express();
app.use(express.json());

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  },
});

// GET /api/categories
app.get('/api/categories', async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { id: 'asc' } });
  res.json(categories);
});

// GET /api/related-systems
app.get('/api/related-systems', async (req, res) => {
  const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
  const systems = await prisma.relatedSystem.findMany({
    where: categoryId ? { categoryId } : {},
    orderBy: { name: 'asc' },
  });
  res.json(systems);
});

// POST /api/tickets
app.post('/api/tickets', async (req, res) => {
  try {
    const requesterId = Number(req.headers['x-requester-id'] || req.body.requesterId);
    const { summary, description, categoryId, relatedSystemId, requestedPriority } = req.body;

    if (!requesterId || !summary || !description || !categoryId || !relatedSystemId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const year = new Date().getFullYear();
    const count = await prisma.ticket.count();
    const ticketNumber = `TKT-${year}-${String(count + 1).padStart(6, '0')}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority: requestedPriority || 'Medium',
        requesterId,
        categoryId: Number(categoryId),
        relatedSystemId: Number(relatedSystemId),
        currentStatus: 'New',
      },
      include: {
        category: true,
        relatedSystem: true,
      },
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create ticket' });
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
            originalName: file.originalname,
            storedPath: file.filename,
            mimeType: file.mimetype,
            sizeBytes: file.size,
          },
        })
      )
    );

    res.status(201).json(created);
  } catch (error: any) {
    if (error.message === 'INVALID_FILE_TYPE') {
      return res.status(400).json({ error: 'Allowed types: JPG, PNG, WEBP, PDF' });
    }
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
});