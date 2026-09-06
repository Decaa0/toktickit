import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

router.get("/active", async (_req, res) => {
  try {
    const activeRequesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
    res.json(activeRequesters);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch active requesters" });
  }
});

export default router;