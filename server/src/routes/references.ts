import { Router } from "express";
import { prisma } from "../prisma";

const router = Router();

// GET /api/categories
router.get("/categories", async (_req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" }, // Sorted by id ascending to satisfy Lab 1 & 2 tests
    });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// GET /api/related-systems
router.get("/related-systems", async (_req, res) => {
  try {
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });
    res.json(systems);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch related systems" });
  }
});

export default router;