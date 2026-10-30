import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  getRequesterDashboard,
  getStaffDashboard,
} from "../controllers/dashboard.controller";

const router = Router();

router.get("/dashboard/requester", authenticateToken, getRequesterDashboard);
router.get(
  "/dashboard/staff",
  authenticateToken,
  requireRole("IT_STAFF", "ADMINISTRATOR"),
  getStaffDashboard
);

export default router;
