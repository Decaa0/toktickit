import { Router } from "express";
import { authenticateToken, requireRole } from "../middleware/auth";
import {
  getStaffTicketQueue,
  assignTicket,
  updateTicketStatus,
} from "../controllers/staff.controller";

const router = Router();

router.use(authenticateToken);
router.use(requireRole("IT_STAFF", "ADMINISTRATOR"));

router.get("/tickets", getStaffTicketQueue);
router.patch("/tickets/:id/assign", assignTicket);
router.patch("/tickets/:id/status", updateTicketStatus);

export default router;
